
-- Create boards table
CREATE TABLE public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Board',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create columns table
CREATE TABLE public.columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  due_date DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Boards RLS
CREATE POLICY "Users can view own boards" ON public.boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own boards" ON public.boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boards" ON public.boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own boards" ON public.boards FOR DELETE USING (auth.uid() = user_id);

-- Columns RLS (via board ownership)
CREATE POLICY "Users can view own columns" ON public.columns FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can create own columns" ON public.columns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can update own columns" ON public.columns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can delete own columns" ON public.columns FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);

-- Tasks RLS (via column -> board ownership)
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id AND boards.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.columns 
    JOIN public.boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id AND boards.user_id = auth.uid()
  )
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
