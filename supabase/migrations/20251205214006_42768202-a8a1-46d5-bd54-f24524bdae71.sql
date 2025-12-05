-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own therapy messages" ON public.therapy_messages;
DROP POLICY IF EXISTS "Users can view their own therapy messages" ON public.therapy_messages;
DROP POLICY IF EXISTS "Users can delete their own therapy messages" ON public.therapy_messages;

-- Recreate with additional session ownership validation
CREATE POLICY "Users can create their own therapy messages" 
ON public.therapy_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.therapy_sessions 
    WHERE therapy_sessions.id = session_id 
    AND therapy_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own therapy messages" 
ON public.therapy_messages 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.therapy_sessions 
    WHERE therapy_sessions.id = session_id 
    AND therapy_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own therapy messages" 
ON public.therapy_messages 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.therapy_sessions 
    WHERE therapy_sessions.id = session_id 
    AND therapy_sessions.user_id = auth.uid()
  )
);