-- Fix missing 'attempts' column in production otp_verifications table
-- Run this in Supabase SQL Editor for production database

-- Check if the attempts column exists, if not add it
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'otp_verifications' 
        AND column_name = 'attempts'
    ) THEN
        -- Add the missing column
        ALTER TABLE otp_verifications 
        ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added missing "attempts" column to otp_verifications table';
    ELSE
        RAISE NOTICE 'Column "attempts" already exists in otp_verifications table';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'otp_verifications'
ORDER BY 
    ordinal_position;
