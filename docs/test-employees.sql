-- Test employee data for development
-- Run this in your Supabase SQL editor to add test employees

INSERT INTO employees (
  emp_code,
  name,
  designation,
  department,
  email,
  phone_1,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Test employee 1
(
  'TEST001',
  'Test Employee One',
  'Software Developer',
  'IT Department',
  'test001@coalindia.in',
  '+919876543210',
  true,
  NOW(),
  NOW()
),
-- Test employee 2
(
  'ADMIN',
  'Admin User',
  'System Administrator',
  'IT Department', 
  'admin@coalindia.in',
  '+919876543211',
  true,
  NOW(),
  NOW()
),
-- Test employee 3
(
  'DEV001',
  'Developer One',
  'Senior Developer',
  'Technology',
  'dev001@coalindia.in',
  '+919876543212',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (emp_code) DO UPDATE SET
  name = EXCLUDED.name,
  designation = EXCLUDED.designation,
  department = EXCLUDED.department,
  email = EXCLUDED.email,
  phone_1 = EXCLUDED.phone_1,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
