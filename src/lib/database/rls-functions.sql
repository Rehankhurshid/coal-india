-- Function to set current user ID for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user groups (optimized query)
CREATE OR REPLACE FUNCTION get_user_groups(user_id TEXT)
RETURNS TABLE (
  id INTEGER,
  name VARCHAR(255),
  description TEXT,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT,
  last_message TEXT,
  unread_count BIGINT,
  user_role VARCHAR(20),
  avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_memberships AS (
    SELECT 
      mgm.group_id,
      mgm.role
    FROM messaging_group_members mgm
    WHERE mgm.employee_id = user_id
  ),
  group_stats AS (
    SELECT 
      mg.id,
      mg.name,
      mg.description,
      mg.created_by,
      mg.created_at,
      mg.updated_at,
      um.role as user_role,
      COUNT(DISTINCT mgm.employee_id) as member_count
    FROM messaging_groups mg
    INNER JOIN user_memberships um ON mg.id = um.group_id
    LEFT JOIN messaging_group_members mgm ON mg.id = mgm.group_id
    GROUP BY mg.id, mg.name, mg.description, mg.created_by, mg.created_at, mg.updated_at, um.role
  ),
  last_messages AS (
    SELECT DISTINCT ON (group_id)
      group_id,
      content,
      created_at
    FROM messaging_messages
    WHERE deleted_at IS NULL
    ORDER BY group_id, created_at DESC
  ),
  unread_counts AS (
    SELECT 
      m.group_id,
      COUNT(*) FILTER (WHERE NOT (user_id = ANY(m.read_by))) as unread_count
    FROM messaging_messages m
    INNER JOIN user_memberships um ON m.group_id = um.group_id
    WHERE m.deleted_at IS NULL
    GROUP BY m.group_id
  )
  SELECT 
    gs.id,
    gs.name,
    gs.description,
    gs.created_by,
    gs.created_at,
    gs.updated_at,
    gs.member_count,
    COALESCE(lm.content, 'No messages yet') as last_message,
    COALESCE(uc.unread_count, 0) as unread_count,
    gs.user_role,
    UPPER(SUBSTRING(
      array_to_string(
        array(
          SELECT SUBSTRING(word, 1, 1) 
          FROM unnest(string_to_array(gs.name, ' ')) AS word
          LIMIT 2
        ), 
        ''
      ), 
      1, 
      2
    )) as avatar
  FROM group_stats gs
  LEFT JOIN last_messages lm ON gs.id = lm.group_id
  LEFT JOIN unread_counts uc ON gs.id = uc.group_id
  ORDER BY COALESCE(lm.created_at, gs.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION set_current_user_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_groups(TEXT) TO authenticated;
