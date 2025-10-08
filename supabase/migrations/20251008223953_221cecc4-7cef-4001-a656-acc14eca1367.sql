-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create mood_entries table
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_level INTEGER NOT NULL CHECK (mood_level BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Mood entries policies
CREATE POLICY "Users can view own mood entries"
  ON public.mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON public.mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON public.mood_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON public.mood_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_mood_entries_user_created 
  ON public.mood_entries(user_id, created_at DESC);

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS - resources are public
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources are viewable by authenticated users"
  ON public.resources FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample resources
INSERT INTO public.resources (title, description, category, url, icon) VALUES
  ('Breathing Exercises', 'Simple breathing techniques to reduce stress and anxiety', 'Stress Management', 'https://www.headspace.com/meditation/breathing-exercises', 'Wind'),
  ('Campus Counseling', 'Free counseling services available to all students', 'Professional Help', null, 'Heart'),
  ('Meditation Guide', 'Beginner-friendly meditation practices for mental clarity', 'Mindfulness', 'https://www.calm.com/blog/how-to-meditate', 'Brain'),
  ('Sleep Hygiene Tips', 'Improve your sleep quality with these evidence-based tips', 'Self-Care', 'https://www.sleepfoundation.org/sleep-hygiene', 'Moon'),
  ('Study Break Ideas', 'Creative ways to recharge during study sessions', 'Academic Balance', null, 'Coffee'),
  ('Crisis Hotline', '24/7 support for students in crisis - you are not alone', 'Emergency Support', 'tel:988', 'Phone'),
  ('Exercise for Mental Health', 'How physical activity boosts mood and reduces stress', 'Physical Wellness', null, 'Dumbbell'),
  ('Time Management', 'Balance academics and wellbeing with better planning', 'Productivity', null, 'Clock');