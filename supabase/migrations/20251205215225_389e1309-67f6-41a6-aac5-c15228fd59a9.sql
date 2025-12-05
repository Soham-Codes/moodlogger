-- Fix meditation_reflections INSERT policy to validate session ownership
DROP POLICY IF EXISTS "Users can create their own reflections" ON public.meditation_reflections;

CREATE POLICY "Users can create their own reflections" 
ON public.meditation_reflections 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.meditation_sessions 
    WHERE meditation_sessions.id = session_id 
    AND meditation_sessions.user_id = auth.uid()
  )
);