-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_group_messages_with_names(bigint, integer, integer);

-- Create an improved function that includes attachments
CREATE OR REPLACE FUNCTION get_group_messages_with_names(
  p_group_id bigint,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  group_id bigint,
  sender_id text,
  content text,
  message_type text,
  status text,
  read_by text[],
  created_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  reply_to_id bigint,
  edit_count integer,
  sender_name text,
  reply_content text,
  reply_sender_name text,
  attachments json
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.group_id,
    m.sender_id,
    m.content,
    m.message_type,
    m.status,
    m.read_by,
    m.created_at,
    m.edited_at,
    m.deleted_at,
    m.reply_to_id,
    m.edit_count,
    COALESCE(e.name, 'Unknown User') as sender_name,
    r.content as reply_content,
    COALESCE(re.name, 'Unknown User') as reply_sender_name,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', ma.id,
            'file_name', ma.file_name,
            'file_type', ma.file_type,
            'file_size', ma.file_size,
            'public_url', ma.public_url,
            'uploaded_at', ma.uploaded_at
          )
        )
        FROM message_attachments ma
        WHERE ma.message_id = m.id
      ),
      '[]'::json
    ) as attachments
  FROM messaging_messages m
  LEFT JOIN employees e ON e.emp_code = m.sender_id
  LEFT JOIN messaging_messages r ON r.id = m.reply_to_id
  LEFT JOIN employees re ON re.emp_code = r.sender_id
  WHERE m.group_id = p_group_id
    AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_group_messages_with_names TO authenticated;
