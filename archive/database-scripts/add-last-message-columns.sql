-- Add last_message and last_message_at columns to messaging_groups table if they don't exist

-- Check if last_message column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messaging_groups' 
                   AND column_name = 'last_message') THEN
        ALTER TABLE messaging_groups 
        ADD COLUMN last_message TEXT;
    END IF;
END $$;

-- Check if last_message_at column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messaging_groups' 
                   AND column_name = 'last_message_at') THEN
        ALTER TABLE messaging_groups 
        ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing groups with their last message
UPDATE messaging_groups g
SET 
    last_message = subquery.formatted_message,
    last_message_at = subquery.created_at
FROM (
    SELECT DISTINCT ON (m.group_id)
        m.group_id,
        CONCAT(SPLIT_PART(e.name, ' ', 1), ': ', 
               CASE 
                   WHEN LENGTH(m.content) > 47 
                   THEN SUBSTRING(m.content, 1, 47) || '...'
                   ELSE m.content 
               END
        ) as formatted_message,
        m.created_at
    FROM messaging_messages m
    JOIN employees e ON e.emp_code = m.sender_id
    WHERE m.deleted_at IS NULL
    ORDER BY m.group_id, m.created_at DESC
) AS subquery
WHERE g.id = subquery.group_id
  AND g.last_message IS NULL;

-- Create or replace function to update last message automatically
CREATE OR REPLACE FUNCTION update_group_last_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_first_name TEXT;
    formatted_message TEXT;
BEGIN
    -- Get sender's first name
    SELECT SPLIT_PART(name, ' ', 1) INTO sender_first_name
    FROM employees
    WHERE emp_code = NEW.sender_id;
    
    -- Format the message
    formatted_message := CONCAT(
        COALESCE(sender_first_name, 'Unknown'), 
        ': ', 
        CASE 
            WHEN LENGTH(NEW.content) > 47 
            THEN SUBSTRING(NEW.content, 1, 47) || '...'
            ELSE NEW.content 
        END
    );
    
    -- Update the group's last message
    UPDATE messaging_groups
    SET 
        last_message = formatted_message,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.group_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_group_last_message_trigger') THEN
        CREATE TRIGGER update_group_last_message_trigger
        AFTER INSERT ON messaging_messages
        FOR EACH ROW
        WHEN (NEW.deleted_at IS NULL)
        EXECUTE FUNCTION update_group_last_message();
    END IF;
END $$;

-- Update the SQL function to include last_message if it exists
CREATE OR REPLACE FUNCTION get_user_groups(user_id VARCHAR)
RETURNS TABLE (
    id INT,
    name VARCHAR,
    description TEXT,
    created_by VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    memberCount BIGINT,
    unreadCount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        g.created_by,
        g.created_at,
        g.updated_at,
        g.last_message,
        g.last_message_at,
        COUNT(DISTINCT gm2.employee_id)::BIGINT as memberCount,
        COUNT(DISTINCT CASE 
            WHEN m.id IS NOT NULL AND NOT (user_id = ANY(m.read_by)) 
            THEN m.id 
        END)::BIGINT as unreadCount
    FROM messaging_groups g
    INNER JOIN messaging_group_members gm ON g.id = gm.group_id
    LEFT JOIN messaging_group_members gm2 ON g.id = gm2.group_id
    LEFT JOIN messaging_messages m ON g.id = m.group_id AND m.deleted_at IS NULL
    WHERE gm.employee_id = user_id
    GROUP BY g.id, g.name, g.description, g.created_by, g.created_at, g.updated_at, g.last_message, g.last_message_at
    ORDER BY COALESCE(g.last_message_at, g.updated_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
