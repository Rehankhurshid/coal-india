-- Complete Authentication Tables Fix
-- This script fixes all the issues with the otp_verifications table
-- Run this after the initial auth-tables-setup.sql if you encounter errors

-- 1. Add missing 'attempts' column with default value
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- 2. Add missing 'phone_number' column
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS phone_number text;

-- 3. Fix 'id' column type (was integer, needs to be text for secure hash IDs)
ALTER TABLE public.otp_verifications 
ALTER COLUMN id TYPE text;

-- 4. Fix 'session_id' column length (was varchar(32), needs to be longer for secure IDs)
ALTER TABLE public.otp_verifications 
ALTER COLUMN session_id TYPE character varying(255);

-- 5. Remove NOT NULL constraint from 'phone' column if it exists
-- This allows the table to work with both 'phone' and 'phone_number' columns
ALTER TABLE public.otp_verifications 
ALTER COLUMN phone DROP NOT NULL;

-- Verify the final structure
-- Expected columns:
-- - id: text
-- - employee_id: varchar(50)
-- - phone: varchar(20) (nullable)
-- - phone_number: text
-- - otp_code: varchar(6)
-- - session_id: varchar(255)
-- - expires_at: timestamp
-- - verified: boolean
-- - attempts: integer
-- - created_at: timestamp

-- Note: The code now inserts phone numbers into both 'phone' and 'phone_number' columns
-- to maintain compatibility with any existing code that may use either column.
