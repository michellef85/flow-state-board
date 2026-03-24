export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  category: string | null;
  due_date: string | null;
  progress: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface BoardData {
  board: Board;
  columns: (Column & { tasks: Task[] })[];
}
