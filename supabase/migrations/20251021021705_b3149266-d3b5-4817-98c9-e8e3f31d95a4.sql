-- Add activity tags to mood entries
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS activity_tags text[] DEFAULT '{}';

-- Create journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create crisis resources table
CREATE TABLE IF NOT EXISTS crisis_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  phone text,
  url text,
  available_hours text,
  category text NOT NULL,
  is_emergency boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on crisis_resources
ALTER TABLE crisis_resources ENABLE ROW LEVEL SECURITY;

-- RLS policy for crisis resources (viewable by all authenticated users)
CREATE POLICY "Crisis resources are viewable by authenticated users"
  ON crisis_resources FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert OSU specific crisis resources
INSERT INTO crisis_resources (title, description, phone, url, available_hours, category, is_emergency) VALUES
  ('OSU Counseling and Consultation Service (CCS)', 'Confidential mental health services for OSU students', '614-292-5766', 'https://ccs.osu.edu', 'Mon-Fri 8am-5pm', 'counseling', false),
  ('OSU Student Wellness Center', 'Mental health support and wellness programs', '614-292-4527', 'https://swc.osu.edu', 'Mon-Fri 8am-5pm', 'wellness', false),
  ('OSU Sexual Violence Support Coordinator', '24/7 confidential support for sexual assault survivors', '614-247-5838', 'https://titleix.osu.edu', '24/7', 'crisis', true),
  ('National Suicide Prevention Lifeline', '24/7 crisis support', '988', 'https://988lifeline.org', '24/7', 'crisis', true),
  ('Crisis Text Line', 'Text-based crisis support', 'Text HOME to 741741', 'https://crisistextline.org', '24/7', 'crisis', true),
  ('OSU Buckeye Peer Access Line (PAL)', 'Peer-to-peer mental health support', '614-247-LOVE (5683)', null, 'Daily 8pm-midnight', 'peer-support', false),
  ('OSU Student Life Student Advocacy Center', 'Support navigating university processes', '614-292-1111', 'https://advocacy.osu.edu', 'Mon-Fri 8am-5pm', 'advocacy', false),
  ('Emergency Services', 'Call 911 for immediate life-threatening emergencies', '911', null, '24/7', 'emergency', true);

-- Create trigger for journal_entries updated_at
CREATE OR REPLACE FUNCTION update_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_updated_at();