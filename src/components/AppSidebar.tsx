import { useState } from 'react';
import { Kanban, LayoutDashboard, CalendarDays, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AppView = 'board' | 'dashboard' | 'calendar';

interface AppSidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onSignOut: () => void;
}

const navItems = [
  { id: 'board' as AppView, label: 'Board', icon: Kanban },
  { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar' as AppView, label: 'Calendar', icon: CalendarDays },
];

export function AppSidebar({ currentView, onViewChange, onSignOut }: AppSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center py-6 gap-2 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out',
        expanded ? 'w-52' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 mb-4 px-3', expanded ? 'w-full' : 'justify-center')}>
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
          <Kanban className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {expanded && <span className="font-display font-bold text-sidebar-foreground text-lg truncate">TaskFlow</span>}
      </div>

      {/* Expand/Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-8 z-10 h-6 w-6 rounded-full border bg-card shadow-sm hover:bg-muted"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>

      {/* Nav items */}
      <div className="flex flex-col gap-1 w-full px-2 mt-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                !expanded && 'justify-center px-0'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Sign out */}
      <div className="px-2 w-full">
        <button
          onClick={onSignOut}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive w-full',
            !expanded && 'justify-center px-0'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {expanded && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
