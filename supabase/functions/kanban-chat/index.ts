import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, boardContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a helpful AI assistant for a Kanban board application. You help users manage their tasks, suggest new ones, summarize board status, and break down complex tasks into subtasks.

Current board state:
${boardContext || "No board data available."}

IMPORTANT: When the user asks you to create, add, or suggest tasks, you MUST include a JSON actions block at the END of your response so the tasks are actually created on the board. Format it exactly like this:

\`\`\`actions
[
  {"action": "add_task", "column": "To Do", "title": "Task title", "priority": "medium", "description": "optional description"},
  {"action": "move_task", "column": "In Progress", "title": "Existing task title"}
]
\`\`\`

Valid columns are the ones shown in the board state above (e.g. "To Do", "In Progress", "Completed").
Valid priorities: "low", "medium", "high".
Valid actions: "add_task" (to create a new task), "move_task" (to move an existing task to a different column — use the exact task title from the board state).
The actions block must be valid JSON inside the code fence. Always include it when the user wants tasks created, moved, or reorganized.

Keep responses concise, friendly, and actionable. Use markdown formatting for the text portion.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
