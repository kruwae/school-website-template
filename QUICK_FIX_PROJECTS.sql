-- =============================================
-- QUICK FIX: RLS Policies for Projects Only
-- Run this FIRST in Supabase SQL Editor
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Projects readable" ON public.projects;
DROP POLICY IF EXISTS "Projects manageable" ON public.projects;

-- Create new policies
CREATE POLICY "Projects readable"
  ON public.projects FOR SELECT USING (true);

CREATE POLICY "Projects manageable"
  ON public.projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- SUCCESS: Projects should now work
-- Test by trying to delete/edit a project
-- =============================================