import { Droppable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Column, Task } from '@/types/kanban';

const columnAccents: Record<string, string> = {
  'To Do': 'bg-column-todo',
  'In Progress': 'bg-column-progress',
  'Completed': 'bg-column-done',
};

interface KanbanColumnProps {
  column: Column & { tasks: Task[] };
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanColumn({ column, onAddTask, onEditTask, onDeleteTask, onDeleteColumn }: KanbanColumnProps) {
  const accentColor = columnAccents[column.title] || 'bg-primary';

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
          <h3 className="font-display font-semibold text-sm text-foreground">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(column.id)}>
            <Plus className="h-4 w-4" />
          </Button>
          {!['To Do', 'In Progress', 'Completed'].includes(column.title) && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDeleteColumn(column.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2.5 rounded-xl p-2 min-h-[200px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-dashed' : 'bg-muted/30'
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))}
            {provided.placeholder}
            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                Drop tasks here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
