
-- LUMINA AI BACKEND SCHEMA
-- Optimized for PostgreSQL / Supabase

-- 1. Create the chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    grounding_links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
-- This ensures users cannot read or modify other users' messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy: Users can view their own messages
CREATE POLICY "Users can view their own messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert their own messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create Performance Indexes
-- Index on user_id and created_at for fast history retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at 
ON public.chat_messages (user_id, created_at ASC);

-- 5. Add a comment for documentation
COMMENT ON TABLE public.chat_messages IS 'Stores multimodal chat history and AI grounding metadata for Lumina users.';
