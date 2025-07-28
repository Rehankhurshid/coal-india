-- Add admin role column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update ADMIN001 as the main admin
UPDATE employees 
SET is_admin = TRUE 
WHERE emp_code = 'ADMIN001';

-- Create login_logs table to track user logins
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  emp_code VARCHAR(50) NOT NULL,
  employee_name VARCHAR(255),
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_method VARCHAR(50) DEFAULT 'OTP',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_login_logs_emp_code ON login_logs(emp_code);
CREATE INDEX idx_login_logs_login_time ON login_logs(login_time);

-- Enable RLS on login_logs
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all login logs
CREATE POLICY "Admins can view all login logs" ON login_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.emp_code = auth.jwt() ->> 'emp_code' 
      AND employees.is_admin = TRUE
    )
  );

-- Policy for users to view their own login logs
CREATE POLICY "Users can view own login logs" ON login_logs
  FOR SELECT
  USING (emp_code = auth.jwt() ->> 'emp_code');

-- Policy for system to insert login logs
CREATE POLICY "System can insert login logs" ON login_logs
  FOR INSERT
  WITH CHECK (true);
