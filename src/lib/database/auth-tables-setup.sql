-- Authentication Tables Setup for Coal India Directory
-- Run this in Supabase SQL Editor for production database

-- Create auth_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    session_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create otp_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS otp_verifications (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    session_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create login_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_employee_id ON auth_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_is_active ON auth_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_session_id ON otp_verifications(session_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_employee_id ON otp_verifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_employee_id ON login_attempts(employee_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

-- Add foreign key constraints if employees table exists
DO $$
BEGIN
    -- Check if employees table exists before adding foreign keys
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        -- Add foreign key for auth_sessions
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'auth_sessions_employee_id_fkey'
        ) THEN
            ALTER TABLE auth_sessions 
            ADD CONSTRAINT auth_sessions_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES employees(emp_code);
        END IF;

        -- Add foreign key for otp_verifications
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'otp_verifications_employee_id_fkey'
        ) THEN
            ALTER TABLE otp_verifications 
            ADD CONSTRAINT otp_verifications_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES employees(emp_code);
        END IF;

        -- Add foreign key for login_attempts (nullable)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'login_attempts_employee_id_fkey'
        ) THEN
            ALTER TABLE login_attempts 
            ADD CONSTRAINT login_attempts_employee_id_fkey 
            FOREIGN KEY (employee_id) REFERENCES employees(emp_code);
        END IF;
    END IF;
END $$;

-- Enable Row Level Security (RLS) for security
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role to manage all)
DO $$
BEGIN
    -- Auth sessions policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'auth_sessions' AND policyname = 'Service role can manage auth_sessions'
    ) THEN
        CREATE POLICY "Service role can manage auth_sessions" ON auth_sessions
        USING (auth.role() = 'service_role');
    END IF;

    -- OTP verifications policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'otp_verifications' AND policyname = 'Service role can manage otp_verifications'
    ) THEN
        CREATE POLICY "Service role can manage otp_verifications" ON otp_verifications
        USING (auth.role() = 'service_role');
    END IF;

    -- Login attempts policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'login_attempts' AND policyname = 'Service role can manage login_attempts'
    ) THEN
        CREATE POLICY "Service role can manage login_attempts" ON login_attempts
        USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON auth_sessions TO service_role;
GRANT ALL ON otp_verifications TO service_role;
GRANT ALL ON login_attempts TO service_role;

-- Create a function to clean up expired records
CREATE OR REPLACE FUNCTION cleanup_expired_auth_records()
RETURNS void AS $$
BEGIN
    -- Deactivate expired sessions
    UPDATE auth_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Delete old OTP verifications (older than 1 hour)
    DELETE FROM otp_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    -- Delete old login attempts (older than 30 days)
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create extension for generating UUIDs if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify tables were created successfully
DO $$
BEGIN
    RAISE NOTICE 'Authentication tables setup completed successfully!';
    RAISE NOTICE 'Tables created: auth_sessions, otp_verifications, login_attempts';
    RAISE NOTICE 'Indexes and RLS policies applied.';
    RAISE NOTICE 'Run SELECT cleanup_expired_auth_records(); periodically to clean up old records.';
END $$;
