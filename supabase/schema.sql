
-- Reference SQL for Supabase SQL Editor
-- Run this in your Supabase project to set up the database structure

-- Profiles: Extend Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions: Biological data captures
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  stage TEXT CHECK (stage IN ('PRE', 'POST')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  facs JSONB NOT NULL,
  bio JSONB NOT NULL,
  gaze JSONB NOT NULL,
  skin JSONB NOT NULL,
  voice JSONB,
  transcript TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analyses: Gemini AI comparative results
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  pre_session_id UUID REFERENCES public.sessions(id),
  post_session_id UUID REFERENCES public.sessions(id),
  neuro_score INTEGER,
  key_shift TEXT,
  detailed_analysis TEXT,
  visual_cues JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
