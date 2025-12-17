-- =====================================================
-- Remove Community Type Restrictions Migration
-- =====================================================
-- This migration removes the type field from communities
-- allowing any kind of community to be created
-- =====================================================

-- Step 1: Drop the index on communities.type field
DROP INDEX IF EXISTS idx_communities_type;

-- Step 2: Drop the CHECK constraint on communities.type
ALTER TABLE public.communities
DROP CONSTRAINT IF EXISTS communities_type_check;

-- Step 3: Drop the type column from communities table
ALTER TABLE public.communities
DROP COLUMN IF EXISTS type;

-- Step 4: Drop the CHECK constraint on community_requests.type
ALTER TABLE public.community_requests
DROP CONSTRAINT IF EXISTS community_requests_type_check;

-- Step 5: Drop the type column from community_requests table
ALTER TABLE public.community_requests
DROP COLUMN IF EXISTS type;

-- =====================================================
-- Note: All existing communities will remain unchanged
-- except for the removal of their type classification
-- =====================================================

-- Rollback instructions (if needed):
-- ALTER TABLE public.communities ADD COLUMN type TEXT DEFAULT 'society';
-- ALTER TABLE public.communities ADD CONSTRAINT communities_type_check CHECK (type IN ('society', 'campus', 'office'));
-- CREATE INDEX idx_communities_type ON public.communities(type);
--
-- ALTER TABLE public.community_requests ADD COLUMN type TEXT;
-- ALTER TABLE public.community_requests ADD CONSTRAINT community_requests_type_check CHECK (type IN ('society', 'campus', 'office'));
