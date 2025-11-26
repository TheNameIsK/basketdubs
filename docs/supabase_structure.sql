-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- LeBot Usage Tracking
-- Note: bot_usage.query_count is kept in sync with chat_history for quick reference
-- The source of truth is chat_history (count of user messages)
CREATE TABLE public.bot_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  query_count integer DEFAULT 0,
  CONSTRAINT bot_usage_pkey PRIMARY KEY (user_id, usage_date),
  CONSTRAINT bot_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- LeBot Chat History (Source of Truth for Message Count)
-- Stores actual messages for context memory
-- Rate limiting counts user messages from this table
CREATE TABLE public.chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_date date NOT NULL DEFAULT CURRENT_DATE,
  role text NOT NULL CHECK (role IN ('user', 'bot')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Index for faster queries (used for rate limiting and context loading)
CREATE INDEX idx_chat_history_user_date ON public.chat_history(user_id, message_date, created_at);

-- Enable Row Level Security on chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_history
CREATE POLICY "Users can view own chat history"
  ON public.chat_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies = immutable chat history
-- (except CASCADE delete when user is deleted)
CREATE TABLE public.games (
  id integer NOT NULL,
  game_date timestamp with time zone NOT NULL,
  status text NOT NULL,
  period numeric,
  time text,
  home_team_id integer NOT NULL,
  home_team_name text NOT NULL,
  home_team_abbreviation text NOT NULL,
  home_team_city text NOT NULL,
  home_team_score numeric,
  visitor_team_id integer NOT NULL,
  visitor_team_name text NOT NULL,
  visitor_team_abbreviation text NOT NULL,
  visitor_team_city text NOT NULL,
  visitor_team_score numeric,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT games_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id integer NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.shop_items(id)
);
CREATE TABLE public.predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id integer NOT NULL,
  predicted_team_id integer NOT NULL,
  status text DEFAULT 'pending'::text,
  result text,
  game_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT predictions_pkey PRIMARY KEY (id),
  CONSTRAINT predictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT predictions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.shop_items (
  id integer NOT NULL DEFAULT nextval('shop_items_id_seq'::regclass),
  name text NOT NULL,
  category text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  asset_ref text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT shop_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  username text CHECK (char_length(username) >= 3),
  spendable_points integer DEFAULT 0 CHECK (spendable_points >= 0),
  all_time_points integer DEFAULT 0,
  avatar_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ==============================================================================
-- TRIGGER: Auto-create user profile on signup
-- ==============================================================================

-- Function: Handle New User Signup
-- Automatically creates a public profile when a user signs in with Google
-- Username is set to NULL to trigger the welcome page flow
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    new.id, 
    new.email, 
    NULL  -- Username starts as NULL (user sets it on welcome page)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fires on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();