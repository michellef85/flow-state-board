import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBoard } from '@/hooks/useBoard';
import { AuthPage } from '@/components/AuthPage';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AppSidebar, type AppView } from '@/components/AppSidebar';
import { DashboardView } from '@/components/DashboardView';
import { CalendarView } from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { boardData, loading: boardLoading, addTask, updateTask, deleteTask, moveTask, addColumn, deleteColumn } = useBoard(user?.id);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('board');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const viewTitles: Record<AppView, string> = {
    board: boardData?.board.title || 'My Board',
    dashboard: 'Dashboard',
    calendar: 'Calendar',
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} onSignOut={signOut} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">{viewTitles[currentView]}</h1>
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
          <div className="flex-1 overflow-auto">
            {boardLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : boardData ? (
              <>
                {currentView === 'board' && (
                  <div className="p-6 h-full">
                    <KanbanBoard
                      boardData={boardData}
                      onMoveTask={moveTask}
                      onAddTask={addTask}
                      onUpdateTask={updateTask}
                      onDeleteTask={deleteTask}
                      onAddColumn={addColumn}
                      onDeleteColumn={deleteColumn}
                    />
                  </div>
                )}
                {currentView === 'dashboard' && <DashboardView boardData={boardData} />}
                {currentView === 'calendar' && <CalendarView boardData={boardData} />}
              </>
            ) : null}
          </div>

          <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} boardData={boardData} onAddTask={addTask} onMoveTask={moveTask} />
        </div>
      </div>
    </div>
  );
};

export default Index;
