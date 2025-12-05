-- Allow users to delete their own therapy messages for privacy control
CREATE POLICY "Users can delete their own therapy messages" 
ON public.therapy_messages 
FOR DELETE 
USING (auth.uid() = user_id);