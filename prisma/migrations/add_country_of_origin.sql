-- Add countryOfOrigin column to users table
-- This column stores the user's country of origin for visa-free detection and personalized recommendations

DO $$ 
BEGIN
    -- Add countryOfOrigin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'countryOfOrigin'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "countryOfOrigin" TEXT;
        
        -- Add index for faster queries
        CREATE INDEX "users_countryOfOrigin_idx" ON "users"("countryOfOrigin");
        
        RAISE NOTICE 'Successfully added countryOfOrigin column to users table';
    ELSE
        RAISE NOTICE 'countryOfOrigin column already exists';
    END IF;
END $$;

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'countryOfOrigin';
