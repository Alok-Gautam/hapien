-- Hapien Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- =====================================================
-- FRIENDSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate friendships
  UNIQUE(requester_id, addressee_id),
  -- Prevent self-friendships
  CHECK (requester_id != addressee_id)
);

-- Indexes for friendship lookups
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- =====================================================
-- COMMUNITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('society', 'campus', 'office')),
  location JSONB,
  description TEXT,
  cover_image_url TEXT,
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for community lookups
CREATE INDEX IF NOT EXISTS idx_communities_type ON public.communities(type);
CREATE INDEX IF NOT EXISTS idx_communities_admin ON public.communities(admin_id);
CREATE INDEX IF NOT EXISTS idx_communities_name ON public.communities USING gin(name gin_trgm_ops);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- COMMUNITY MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate memberships
  UNIQUE(user_id, community_id)
);

-- Indexes for membership lookups
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_community ON public.community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.community_memberships(status);

-- =====================================================
-- POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('friends', 'friends_communities', 'community_only')),
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for post lookups
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

-- =====================================================
-- HANGOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hangouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('sports', 'food', 'shopping', 'learning', 'chill')),
  location JSONB,
  date_time TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  visibility TEXT NOT NULL DEFAULT 'community' CHECK (visibility IN ('friends', 'community', 'public_in_community')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for hangout lookups
CREATE INDEX IF NOT EXISTS idx_hangouts_host ON public.hangouts(host_id);
CREATE INDEX IF NOT EXISTS idx_hangouts_community ON public.hangouts(community_id);
CREATE INDEX IF NOT EXISTS idx_hangouts_datetime ON public.hangouts(date_time);
CREATE INDEX IF NOT EXISTS idx_hangouts_status ON public.hangouts(status);
CREATE INDEX IF NOT EXISTS idx_hangouts_category ON public.hangouts(category);

-- =====================================================
-- HANGOUT RSVPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hangout_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('interested', 'going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate RSVPs
  UNIQUE(hangout_id, user_id)
);

-- Indexes for RSVP lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_hangout ON public.hangout_rsvps(hangout_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON public.hangout_rsvps(user_id);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  hangout_id UUID REFERENCES public.hangouts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Must reference either a post or a hangout
  CHECK ((post_id IS NOT NULL AND hangout_id IS NULL) OR (post_id IS NULL AND hangout_id IS NOT NULL))
);

-- Indexes for comment lookups
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_hangout ON public.comments(hangout_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

-- =====================================================
-- REACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'celebrate')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reactions
  UNIQUE(user_id, post_id)
);

-- Indexes for reaction lookups
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'hangout_invite', 'hangout_rsvp', 'community_approved', 'comment', 'reaction')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own friendships" ON public.friendships FOR UPDATE 
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Communities policies
CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Admins can update communities" ON public.communities FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Community memberships policies
CREATE POLICY "Users can view memberships" ON public.community_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.community_memberships FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT admin_id FROM public.communities WHERE id = community_id));
CREATE POLICY "Users can delete own membership" ON public.community_memberships FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable by friends and community members" ON public.posts FOR SELECT USING (
  auth.uid() = user_id 
  OR (visibility = 'friends' AND EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND ((requester_id = auth.uid() AND addressee_id = user_id) OR (addressee_id = auth.uid() AND requester_id = user_id))
  ))
  OR (visibility IN ('friends_communities', 'community_only') AND EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = posts.community_id AND status = 'approved'
  ))
);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Hangouts policies
CREATE POLICY "Hangouts are viewable by community members" ON public.hangouts FOR SELECT USING (
  auth.uid() = host_id
  OR EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = hangouts.community_id AND status = 'approved'
  )
);
CREATE POLICY "Community members can create hangouts" ON public.hangouts FOR INSERT WITH CHECK (
  auth.uid() = host_id 
  AND EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = hangouts.community_id AND status = 'approved'
  )
);
CREATE POLICY "Hosts can update hangouts" ON public.hangouts FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete hangouts" ON public.hangouts FOR DELETE USING (auth.uid() = host_id);

-- Hangout RSVPs policies
CREATE POLICY "RSVPs are viewable by community members" ON public.hangout_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP to hangouts" ON public.hangout_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVP" ON public.hangout_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVP" ON public.hangout_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_hangouts_updated_at BEFORE UPDATE ON public.hangouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update community member count
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.communities SET member_count = member_count - 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =====================================================

-- You can add sample communities here for testing
-- INSERT INTO public.communities (name, type, admin_id, description) VALUES
-- ('Sample Society', 'society', 'YOUR_USER_ID', 'A sample residential society');

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run these in Supabase Dashboard -> Storage

-- Create avatars bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create posts bucket  
-- INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);

-- Create hangouts bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('hangouts', 'hangouts', true);

-- Create communities bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('communities', 'communities', true);

-- Storage policies
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
-- CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
