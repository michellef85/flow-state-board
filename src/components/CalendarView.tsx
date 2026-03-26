import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import type { BoardData, Task } from '@/types/kanban';
import { format, isSameDay, startOfDay, addDays, isToday, isPast } from 'date-fns';

interface CalendarViewProps {
  boardData: BoardData;
}

export function CalendarView({ boardData }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const allTasks = useMemo(() => boardData.columns.flatMap(c => c.tasks), [boardData]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach(t => {
      if (t.due_date) {
        const key = format(new Date(t.due_date), 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      }
    });
    return map;
  }, [allTasks]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const tasksForSelected = tasksByDate.get(selectedKey) || [];

  // Tasks without due dates
  const unscheduled = allTasks.filter(t => !t.due_date);

  // Dates that have tasks (for calendar highlighting)
  const datesWithTasks = useMemo(() => {
    return Array.from(tasksByDate.keys()).map(d => new Date(d));
  }, [tasksByDate]);

  // Next 7 days summary
  const next7Days = useMemo(() => {
    const days: { date: Date; tasks: Task[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(startOfDay(new Date()), i);
      const key = format(d, 'yyyy-MM-dd');
      days.push({ date: d, tasks: tasksByDate.get(key) || [] });
    }
    return days;
  }, [tasksByDate]);

  const getColumnName = (task: Task) => {
    const col = boardData.columns.find(c => c.id === task.column_id);
    return col?.title || 'Unknown';
  };

  const priorityDot: Record<string, string> = {
    high: 'bg-priority-high',
    medium: 'bg-priority-medium',
    low: 'bg-priority-low',
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground">Calendar</h2>
        <p className="text-sm text-muted-foreground mt-1">Track tasks by due date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="pointer-events-auto"
              modifiers={{ hasTasks: datesWithTasks }}
              modifiersClassNames={{ hasTasks: 'font-bold text-primary' }}
            />
          </CardContent>
        </Card>

        {/* Selected day detail */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d, yyyy')}
              <Badge variant="secondary" className="ml-auto text-xs">{tasksForSelected.length} task{tasksForSelected.length !== 1 ? 's' : ''}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksForSelected.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tasks due on this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasksForSelected.map(task => (
                  <div key={task.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
                        <h4 className="font-medium text-sm">{task.title}</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{getColumnName(task)}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground pl-[18px]">{task.description}</p>
                    )}
                    {task.progress > 0 && (
                      <div className="pl-[18px]">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-day outlook */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">7-Day Outlook</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {next7Days.map(({ date, tasks }) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`rounded-lg border p-3 text-center transition-all hover:border-primary/50 cursor-pointer ${
                  isSameDay(date, selectedDate) ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : ''
                }`}
              >
                <p className="text-[10px] text-muted-foreground uppercase">{format(date, 'EEE')}</p>
                <p className={`text-lg font-display font-bold mt-0.5 ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </p>
                {tasks.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1.5">
                    {tasks.slice(0, 3).map(t => (
                      <span key={t.id} className={`w-1.5 h-1.5 rounded-full ${priorityDot[t.priority]}`} />
                    ))}
                    {tasks.length > 3 && <span className="text-[8px] text-muted-foreground">+{tasks.length - 3}</span>}
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">Unscheduled Tasks ({unscheduled.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unscheduled.map(task => (
                <div key={task.id} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
                  <span className="truncate">{task.title}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto shrink-0">{getColumnName(task)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
