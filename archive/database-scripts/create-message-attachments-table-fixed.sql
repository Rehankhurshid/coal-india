-- Drop the old table if it exists
DROP TABLE IF EXISTS public.message_attachments CASCADE;

-- Create message_attachments table for storing file attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL DEFAULT -1, -- -1 for temporary uploads before message is sent
    group_id BIGINT NOT NULL REFERENCES public.messaging_groups(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL REFERENCES public.employees(emp_code),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_group_id ON public.message_attachments(group_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by ON public.message_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view attachments in their groups (fixed with text cast)
CREATE POLICY "Users can view attachments in their groups" ON public.message_attachments
    FOR SELECT
    USING (
        group_id IN (
            SELECT group_id 
            FROM public.messaging_group_members
            WHERE employee_id = auth.uid()::text
        )
    );

-- RLS Policy: Users can insert attachments in their groups (fixed with text cast)
CREATE POLICY "Users can insert attachments in their groups" ON public.message_attachments
    FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id 
            FROM public.messaging_group_members
            WHERE employee_id = auth.uid()::text
        )
    );

-- RLS Policy: Users can update their own attachments (fixed with text cast)
CREATE POLICY "Users can update their own attachments" ON public.message_attachments
    FOR UPDATE
    USING (uploaded_by = auth.uid()::text)
    WITH CHECK (uploaded_by = auth.uid()::text);

-- RLS Policy: Users can delete their own attachments (fixed with text cast)
CREATE POLICY "Users can delete their own attachments" ON public.message_attachments
    FOR DELETE
    USING (uploaded_by = auth.uid()::text);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_attachments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.message_attachments_id_seq TO authenticated;

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'message-attachments', 
    'message-attachments', 
    true, 
    false, 
    15728640, -- 15MB in bytes
    ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'video/mp4', 'video/mpeg', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/webm'
    ]
)
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for the bucket (fixed with proper auth checks)
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'message-attachments' 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view files" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'message-attachments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
