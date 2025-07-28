-- Create message_attachments table for storing file attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Enable RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view attachments for messages they can view
CREATE POLICY "Users can view attachments for accessible messages" ON public.message_attachments
    FOR SELECT
    USING (
        message_id IN (
            SELECT m.id 
            FROM public.messages m
            JOIN public.group_members gm ON m.group_id = gm.group_id
            WHERE gm.employee_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert attachments for their own messages
CREATE POLICY "Users can insert attachments for their messages" ON public.message_attachments
    FOR INSERT
    WITH CHECK (
        message_id IN (
            SELECT id 
            FROM public.messages
            WHERE sender_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON public.message_attachments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.message_attachments_id_seq TO authenticated;
