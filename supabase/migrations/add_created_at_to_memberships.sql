-- Add created_at column to community_memberships table
ALTER TABLE public.community_memberships
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have a created_at timestamp
UPDATE public.community_memberships
SET created_at = NOW()
WHERE created_at IS NULL;

-- Make created_at NOT NULL
ALTER TABLE public.community_memberships
ALTER COLUMN created_at SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_community_memberships_created_at
ON public.community_memberships(created_at);
