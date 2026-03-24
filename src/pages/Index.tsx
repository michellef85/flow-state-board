import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBoard } from '@/hooks/useBoard';
import { AuthPage } from '@/components/AuthPage';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';
import { Kanban, MessageSquare, LogOut, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { boardData, loading: boardLoading, addTask, updateTask, deleteTask, moveTask, addColumn, deleteColumn } = useBoard();
  const [chatOpen, setChatOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-16 bg-sidebar flex flex-col items-center py-6 gap-6 border-r border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <Kanban className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">
              {boardData?.board.title || 'My Board'}
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant={chatOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            AI Assistant
          </Button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            {boardLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : boardData ? (
              <KanbanBoard
                boardData={boardData}
                onMoveTask={moveTask}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onAddColumn={addColumn}
                onDeleteColumn={deleteColumn}
              />
            ) : null}
          </div>

          <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} boardData={boardData} />
        </div>
      </div>
    </div>
  );
};

export default Index;
