-- Create user preferences table for communication preferences and purchase preferences
-- FASE 3 - Configuration section

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Communication preferences
  email_newsletter_promotions boolean DEFAULT true NOT NULL,
  email_newsletter_news boolean DEFAULT true NOT NULL,
  email_order_updates boolean DEFAULT true NOT NULL,
  -- Purchase preferences (for future use)
  preferred_delivery_time text, -- "morning", "afternoon", "any"
  recurring_order_preference boolean DEFAULT false NOT NULL,
  -- Privacy & Cookies
  cookies_analytics boolean DEFAULT true NOT NULL,
  cookies_personalization boolean DEFAULT true NOT NULL,
  cookies_marketing boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for fast lookups by user
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view only their own preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences (if they don't exist yet)
CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins bypass RLS and can manage all preferences
CREATE POLICY "Admins can manage all preferences"
  ON public.user_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
