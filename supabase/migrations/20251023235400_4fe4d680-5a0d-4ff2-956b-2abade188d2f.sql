-- Update RLS policy for resources table to be more explicit about authentication
DROP POLICY IF EXISTS "Resources are viewable by authenticated users" ON public.resources;

CREATE POLICY "Resources are viewable by authenticated users" 
ON public.resources 
FOR SELECT 
USING (auth.role() = 'authenticated');