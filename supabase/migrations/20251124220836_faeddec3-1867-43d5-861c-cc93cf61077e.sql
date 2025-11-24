-- Create user survey table to store onboarding questionnaire responses
CREATE TABLE public.user_survey (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mental_health_conditions TEXT[] DEFAULT '{}',
  hobbies_interests TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_survey ENABLE ROW LEVEL SECURITY;

-- Users can view their own survey
CREATE POLICY "Users can view own survey"
ON public.user_survey
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own survey
CREATE POLICY "Users can insert own survey"
ON public.user_survey
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own survey
CREATE POLICY "Users can update own survey"
ON public.user_survey
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_user_survey_updated_at
BEFORE UPDATE ON public.user_survey
FOR EACH ROW
EXECUTE FUNCTION public.update_journal_updated_at();