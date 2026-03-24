
# Kanban Board with AI Assistant

## Layout & Design
- Modern, clean design with a gradient accent color scheme (indigo/violet tones)
- Left icon sidebar for navigation
- Main content area with the Kanban board
- Right slide-out panel for the AI chatbot
- Smooth drag-and-drop animations, hover effects, glassmorphism cards

## Kanban Board
- **3 columns**: To Do, In Progress, Completed
- **Drag & drop** cards between columns using @hello-pangea/dnd
- **Add column** button to create custom columns
- **Task cards** showing:
  - Title & description
  - Priority badges (Low/Medium/High) with color coding
  - Category tags
  - Due date
  - Progress bar with percentage
  - "..." menu for edit/delete
- **Create Task** button opens a modal form with all card fields
- Edit task inline or via modal

## AI Chatbot (Right Panel)
- Toggleable slide-out chat panel with a floating button
- Powered by Lovable AI (Gemini) via edge function
- Capabilities: suggest tasks, summarize board status, general Q&A, break down tasks into subtasks
- Streaming responses rendered with markdown
- Board context is sent to AI so it can reason about your tasks

## Database & Persistence (Supabase via Lovable Cloud)
- Tables: `boards`, `columns`, `tasks`
- Save/load board state automatically
- User authentication so each user has their own board
- Real-time sync

## Tech
- React + Tailwind + shadcn/ui
- @hello-pangea/dnd for drag-and-drop
- Lovable Cloud (Supabase) for database + auth + edge functions
- Lovable AI gateway for the chatbot
