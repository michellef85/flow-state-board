import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Board, Column, Task, BoardData, Priority } from '@/types/kanban';
import { toast } from 'sonner';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Completed'];

export function useBoard(userId: string | undefined) {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBoard = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    let { data: boards } = await supabase.from('boards').select('*').eq('user_id', userId).limit(1);

    let board: Board;
    if (!boards || boards.length === 0) {
      const { data: newBoard, error } = await supabase.from('boards').insert({ user_id: userId, title: 'My Board' }).select().single();
      if (error || !newBoard) { toast.error('Failed to create board'); setLoading(false); return; }
      board = newBoard as Board;

      for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
        await supabase.from('columns').insert({ board_id: board.id, title: DEFAULT_COLUMNS[i], position: i });
      }
    } else {
      board = boards[0] as Board;
    }

    const { data: columns } = await supabase.from('columns').select('*').eq('board_id', board.id).order('position');
    const { data: tasks } = await supabase.from('tasks').select('*').in('column_id', (columns || []).map(c => c.id)).order('position');

    const columnsWithTasks = (columns || []).map(col => ({
      ...col,
      tasks: (tasks || []).filter(t => t.column_id === col.id).map(t => ({ ...t, priority: t.priority as Priority })),
    }));

    setBoardData({ board, columns: columnsWithTasks });
    setLoading(false);
  }, []);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const addTask = async (columnId: string, task: { title: string; description?: string; priority: Priority; category?: string; due_date?: string; progress?: number }) => {
    const col = boardData?.columns.find(c => c.id === columnId);
    const position = col ? col.tasks.length : 0;
    const { error } = await supabase.from('tasks').insert({
      column_id: columnId,
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      category: task.category || null,
      due_date: task.due_date || null,
      progress: task.progress || 0,
      position,
    });
    if (error) { toast.error('Failed to add task'); return; }
    await loadBoard();
    toast.success('Task added!');
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) { toast.error('Failed to update task'); return; }
    await loadBoard();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) { toast.error('Failed to delete task'); return; }
    await loadBoard();
    toast.success('Task deleted');
  };

  const moveTask = async (taskId: string, newColumnId: string, newPosition: number) => {
    const { error } = await supabase.from('tasks').update({ column_id: newColumnId, position: newPosition }).eq('id', taskId);
    if (error) { toast.error('Failed to move task'); return; }
    await loadBoard();
  };

  const addColumn = async (title: string) => {
    if (!boardData) return;
    const position = boardData.columns.length;
    const { error } = await supabase.from('columns').insert({ board_id: boardData.board.id, title, position });
    if (error) { toast.error('Failed to add column'); return; }
    await loadBoard();
    toast.success('Column added!');
  };

  const deleteColumn = async (columnId: string) => {
    const { error } = await supabase.from('columns').delete().eq('id', columnId);
    if (error) { toast.error('Failed to delete column'); return; }
    await loadBoard();
    toast.success('Column deleted');
  };

  return { boardData, loading, addTask, updateTask, deleteTask, moveTask, addColumn, deleteColumn, reload: loadBoard };
}
