-- Authentication System Database Schema
-- Run this in your Supabase SQL editor to create the necessary tables

-- 1. Auth Sessions Table
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key to employees table
    CONSTRAINT fk_auth_sessions_employee 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(emp_code) 
        ON DELETE CASCADE
);

-- 2. OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key to employees table
    CONSTRAINT fk_otp_verifications_employee 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(emp_code) 
        ON DELETE CASCADE
);

-- 3. Login Attempts Table (for security monitoring)
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key to employees table (nullable for failed attempts)
    CONSTRAINT fk_login_attempts_employee 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(emp_code) 
        ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_employee_id ON auth_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_active ON auth_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_token ON auth_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_employee_id ON otp_verifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_session_id ON otp_verifications(session_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_employee_id ON login_attempts(employee_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_sessions
CREATE POLICY "Users can view own sessions" ON auth_sessions
    FOR SELECT USING (employee_id = current_setting('app.current_user_id', true));

CREATE POLICY "System can manage all sessions" ON auth_sessions
    FOR ALL USING (current_user = 'service_role');

-- RLS Policies for otp_verifications
CREATE POLICY "Users can view own OTP verifications" ON otp_verifications
    FOR SELECT USING (employee_id = current_setting('app.current_user_id', true));

CREATE POLICY "System can manage all OTP verifications" ON otp_verifications
    FOR ALL USING (current_user = 'service_role');

-- RLS Policies for login_attempts
CREATE POLICY "System can manage all login attempts" ON login_attempts
    FOR ALL USING (current_user = 'service_role');

-- Function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions (run this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
    -- Deactivate expired sessions
    UPDATE auth_sessions 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    -- Delete old OTP verifications (older than 1 hour)
    DELETE FROM otp_verifications 
    WHERE created_at < NOW() - INTERVAL '1 hour';
    
    -- Delete old login attempts (older than 30 days)
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete inactive sessions older than 7 days
    DELETE FROM auth_sessions 
    WHERE is_active = FALSE AND last_used_at < NOW() - INTERVAL '7 days';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON otp_verifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON login_attempts TO service_role;

-- Create a scheduled job to clean up expired data (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-auth-data', '0 2 * * *', 'SELECT cleanup_expired_auth_data();');

COMMENT ON TABLE auth_sessions IS 'Stores active user authentication sessions with JWT tokens';
COMMENT ON TABLE otp_verifications IS 'Stores OTP verification attempts for login authentication';
COMMENT ON TABLE login_attempts IS 'Logs all login attempts for security monitoring and rate limiting';
