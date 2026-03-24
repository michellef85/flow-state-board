import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, X, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { BoardData, Priority } from '@/types/kanban';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BoardAction {
  action: string;
  column?: string;
  title?: string;
  priority?: Priority;
  description?: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  boardData: BoardData | null;
  onAddTask?: (columnId: string, task: { title: string; description?: string; priority: Priority; category?: string; due_date?: string; progress?: number }) => void;
  onMoveTask?: (taskId: string, newColumnId: string, newPosition: number) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kanban-chat`;

function parseActions(content: string): { cleanContent: string; actions: BoardAction[] } {
  const actionsRegex = /```actions\s*\n([\s\S]*?)```/;
  const match = content.match(actionsRegex);
  if (!match) return { cleanContent: content, actions: [] };
  
  try {
    const actions = JSON.parse(match[1]) as BoardAction[];
    const cleanContent = content.replace(actionsRegex, '').trim();
    return { cleanContent, actions };
  } catch {
    return { cleanContent: content, actions: [] };
  }
}

export function ChatPanel({ open, onClose, boardData, onAddTask, onMoveTask }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "👋 Hi! I'm your AI assistant. I can help you **manage your board**, **suggest tasks**, **summarize progress**, or **break down complex tasks**. What would you like help with?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const actionsExecutedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const executeActions = (actions: BoardAction[]) => {
    if (!onAddTask || !boardData) return;
    
    let tasksCreated = 0;
    for (const action of actions) {
      if (action.action === 'add_task' && action.title && action.column) {
        const column = boardData.columns.find(c => c.title.toLowerCase() === action.column!.toLowerCase());
        if (column) {
          onAddTask(column.id, {
            title: action.title,
            description: action.description,
            priority: action.priority || 'medium',
          });
          tasksCreated++;
        }
      }
    }
    if (tasksCreated > 0) {
      toast.success(`${tasksCreated} task${tasksCreated > 1 ? 's' : ''} created by AI!`);
    }
  };

  const buildBoardContext = () => {
    if (!boardData) return 'No board data available.';
    const cols = boardData.columns.map(col =>
      `**${col.title}** (${col.tasks.length} tasks):\n${col.tasks.map(t =>
        `  - "${t.title}" [${t.priority}]${t.progress > 0 ? ` ${t.progress}%` : ''}${t.due_date ? ` due ${t.due_date}` : ''}`
      ).join('\n') || '  (empty)'}`
    ).join('\n\n');
    return `Board: "${boardData.board.title}"\n\n${cols}`;
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const messageKey = Date.now().toString();
    
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > newMessages.length) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev.slice(0, newMessages.length), { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          boardContext: buildBoardContext(),
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // After streaming is done, parse and execute actions
      const { cleanContent, actions } = parseActions(assistantSoFar);
      if (actions.length > 0) {
        // Update the message to show clean content without the actions block
        setMessages(prev => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.role === 'assistant') {
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: cleanContent };
          }
          return updated;
        });
        
        if (!actionsExecutedRef.current.has(messageKey)) {
          actionsExecutedRef.current.add(messageKey);
          executeActions(actions);
        }
      }
    } catch (e: any) {
      upsertAssistant(`Sorry, something went wrong: ${e.message}`);
    }

    setIsLoading(false);
  };

  if (!open) return null;

  return (
    <div className="w-96 h-full border-l bg-card flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">AI Assistant</h3>
            <p className="text-[11px] text-muted-foreground">Powered by Lovable AI</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {msg.role === 'assistant' ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">Thinking...</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={isLoading}
          />
          <Button size="icon" onClick={send} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {['Summarize board', 'Suggest tasks', 'Break down a task'].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
