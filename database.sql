
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

-- 2. Create the memories table (NEW)
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'fact',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Chat Messages
CREATE POLICY "Users can manage own messages" ON public.chat_messages USING (auth.uid() = user_id);

-- Memories
CREATE POLICY "Users can manage own memories" ON public.memories USING (auth.uid() = user_id);

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at ON public.chat_messages (user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories (user_id);

COMMENT ON TABLE public.chat_messages IS 'Stores multimodal chat history.';
COMMENT ON TABLE public.memories IS 'Stores persistent user context and facts.';
