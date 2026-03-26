import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ListTodo, TrendingUp, AlertTriangle } from 'lucide-react';
import type { BoardData } from '@/types/kanban';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface DashboardViewProps {
  boardData: BoardData;
}

export function DashboardView({ boardData }: DashboardViewProps) {
  const allTasks = boardData.columns.flatMap(c => c.tasks);
  const totalTasks = allTasks.length;

  const byColumn = boardData.columns.reduce<Record<string, number>>((acc, col) => {
    acc[col.title] = col.tasks.length;
    return acc;
  }, {});

  const highCount = allTasks.filter(t => t.priority === 'high').length;
  const mediumCount = allTasks.filter(t => t.priority === 'medium').length;
  const lowCount = allTasks.filter(t => t.priority === 'low').length;

  const completedCol = boardData.columns.find(c => c.title.toLowerCase().includes('completed') || c.title.toLowerCase().includes('done'));
  const completedCount = completedCol?.tasks.length ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const avgProgress = totalTasks > 0 ? Math.round(allTasks.reduce((s, t) => s + t.progress, 0) / totalTasks) : 0;

  const overdueTasks = allTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && !(completedCol?.tasks.some(ct => ct.id === t.id)));
  const dueTodayTasks = allTasks.filter(t => t.due_date && isToday(new Date(t.due_date)));
  const dueTomorrowTasks = allTasks.filter(t => t.due_date && isTomorrow(new Date(t.due_date)));

  const statCards = [
    { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'text-primary' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-priority-low' },
    { label: 'In Progress', value: byColumn['In Progress'] ?? 0, icon: Clock, color: 'text-priority-medium' },
    { label: 'Overdue', value: overdueTasks.length, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your board activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion & Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2.5" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Avg Task Progress</span>
                <span className="font-semibold">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="h-2.5" />
            </div>

            {/* Column breakdown */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Column</p>
              {boardData.columns.map(col => (
                <div key={col.id} className="flex items-center justify-between text-sm">
                  <span>{col.title}</span>
                  <Badge variant="secondary" className="text-xs">{col.tasks.length}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'High', count: highCount, className: 'bg-priority-high', total: totalTasks },
              { label: 'Medium', count: mediumCount, className: 'bg-priority-medium', total: totalTasks },
              { label: 'Low', count: lowCount, className: 'bg-priority-low', total: totalTasks },
            ].map(p => (
              <div key={p.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.className}`} />
                    {p.label}
                  </span>
                  <span className="text-muted-foreground">{p.count} task{p.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.className} transition-all duration-500`}
                    style={{ width: `${p.total > 0 ? (p.count / p.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Upcoming deadlines */}
            {(dueTodayTasks.length > 0 || dueTomorrowTasks.length > 0 || overdueTasks.length > 0) && (
              <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming Deadlines</p>
                {overdueTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{t.title}</span>
                    <Badge variant="destructive" className="text-[10px] shrink-0">Overdue</Badge>
                  </div>
                ))}
                {dueTodayTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{t.title}</span>
                    <Badge className="text-[10px] bg-priority-medium text-primary-foreground shrink-0">Today</Badge>
                  </div>
                ))}
                {dueTomorrowTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{t.title}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">Tomorrow</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
