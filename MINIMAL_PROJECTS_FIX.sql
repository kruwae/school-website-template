-- =============================================
-- MINIMAL FIX: Projects Table Only
-- Run this in Supabase SQL Editor if the full migration fails
-- =============================================

-- Drop existing policies for projects only
DROP POLICY IF EXISTS "Projects readable" ON public.projects;
DROP POLICY IF EXISTS "Projects manageable" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.projects;

-- Create new permissive policies
CREATE POLICY "Projects readable"
  ON public.projects FOR SELECT USING (true);

CREATE POLICY "Projects manageable"
  ON public.projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Test: Try deleting/editing a project now
-- =============================================