import { useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { TaskDialog } from './TaskDialog';
import type { BoardData, Task, Priority } from '@/types/kanban';
import confetti from 'canvas-confetti';

interface KanbanBoardProps {
  boardData: BoardData;
  onMoveTask: (taskId: string, newColumnId: string, newPosition: number) => void;
  onAddTask: (columnId: string, task: { title: string; description?: string; priority: Priority; category?: string; due_date?: string; progress?: number }) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddColumn: (title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanBoard({ boardData, onMoveTask, onAddTask, onUpdateTask, onDeleteTask, onAddColumn, onDeleteColumn }: KanbanBoardProps) {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showNewColumn, setShowNewColumn] = useState(false);

  const fireConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#fbbf24', '#34d399', '#f472b6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    onMoveTask(draggableId, destination.droppableId, destination.index);

    const targetColumn = boardData.columns.find(c => c.id === destination.droppableId);
    if (targetColumn && targetColumn.title.toLowerCase().includes('completed')) {
      fireConfetti();
    }
  };

  const handleAddTask = (columnId: string) => {
    setActiveColumnId(columnId);
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setActiveColumnId(task.column_id);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (data: { title: string; description?: string; priority: Priority; category?: string; due_date?: string; progress?: number }) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, data);
    } else if (activeColumnId) {
      onAddTask(activeColumnId, data);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    onAddColumn(newColumnName.trim());
    setNewColumnName('');
    setShowNewColumn(false);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-4 px-1 scrollbar-thin h-full">
          {boardData.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={onDeleteTask}
              onDeleteColumn={onDeleteColumn}
            />
          ))}

          <div className="w-80 shrink-0">
            {showNewColumn ? (
              <div className="flex gap-2">
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Column name..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddColumn}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewColumn(false)}>✕</Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full border-dashed text-muted-foreground" onClick={() => setShowNewColumn(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Column
              </Button>
            )}
          </div>
        </div>
      </DragDropContext>

      <TaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </>
  );
}
