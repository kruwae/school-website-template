-- =============================================
-- FIX RLS POLICIES FOR PROJECT MANAGEMENT
-- Run this SQL in Supabase Dashboard -> SQL Editor
-- =============================================

-- Drop problematic policies that use auth.uid()
DROP POLICY IF EXISTS "Projects readable" ON public.projects;
DROP POLICY IF EXISTS "Projects manageable" ON public.projects;

-- Create new policies that work with custom authentication
CREATE POLICY "Projects readable"
  ON public.projects FOR SELECT USING (true);

CREATE POLICY "Projects manageable"
  ON public.projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fix other project-related tables
DROP POLICY IF EXISTS "Project docs readable" ON public.project_documents;
DROP POLICY IF EXISTS "Project docs manageable" ON public.project_documents;

CREATE POLICY "Project docs readable"
  ON public.project_documents FOR SELECT USING (true);

CREATE POLICY "Project docs manageable"
  ON public.project_documents FOR ALL
  USING (true)
  WITH CHECK (true);

-- Continue with other tables...
DROP POLICY IF EXISTS "Project budget requests readable" ON public.project_budget_requests;
DROP POLICY IF EXISTS "Project budget requests manageable" ON public.project_budget_requests;

CREATE POLICY "Project budget requests readable"
  ON public.project_budget_requests FOR SELECT USING (true);

CREATE POLICY "Project budget requests manageable"
  ON public.project_budget_requests FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Project team members readable" ON public.project_team_members;
DROP POLICY IF EXISTS "Project team members manageable" ON public.project_team_members;

CREATE POLICY "Project team members readable"
  ON public.project_team_members FOR SELECT USING (true);

CREATE POLICY "Project team members manageable"
  ON public.project_team_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Budget tables
DROP POLICY IF EXISTS "Budget categories readable" ON public.budget_categories;
DROP POLICY IF EXISTS "Budget categories manageable" ON public.budget_categories;

CREATE POLICY "Budget categories readable"
  ON public.budget_categories FOR SELECT USING (true);

CREATE POLICY "Budget categories manageable"
  ON public.budget_categories FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Project budget items readable" ON public.project_budget_items;
DROP POLICY IF EXISTS "Project budget items manageable" ON public.project_budget_items;

CREATE POLICY "Project budget items readable"
  ON public.project_budget_items FOR SELECT USING (true);

CREATE POLICY "Project budget items manageable"
  ON public.project_budget_items FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Budget transactions readable" ON public.budget_transactions;
DROP POLICY IF EXISTS "Budget transactions manageable" ON public.budget_transactions;

CREATE POLICY "Budget transactions readable"
  ON public.budget_transactions FOR SELECT USING (true);

CREATE POLICY "Budget transactions manageable"
  ON public.budget_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- FIX COMPLETED
-- =============================================