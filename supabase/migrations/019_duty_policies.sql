-- ============================================================
-- 019_duty_policies.sql
-- เปิด RLS และกำหนดสิทธิ์สำหรับ duty_assignments / duty_records
-- ============================================================

-- Enable RLS
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_records ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies so migration is re-runnable
DROP POLICY IF EXISTS "Duty assignments readable by related users" ON public.duty_assignments;
DROP POLICY IF EXISTS "Duty assignments insertable by related users" ON public.duty_assignments;
DROP POLICY IF EXISTS "Duty assignments updatable by related users" ON public.duty_assignments;
DROP POLICY IF EXISTS "Duty assignments deletable by related users" ON public.duty_assignments;
DROP POLICY IF EXISTS "Duty assignments admin full access" ON public.duty_assignments;

DROP POLICY IF EXISTS "Duty records readable by related users" ON public.duty_records;
DROP POLICY IF EXISTS "Duty records insertable by related users" ON public.duty_records;
DROP POLICY IF EXISTS "Duty records updatable by related users" ON public.duty_records;
DROP POLICY IF EXISTS "Duty records deletable by related users" ON public.duty_records;
DROP POLICY IF EXISTS "Duty records admin full access" ON public.duty_records;

-- Duty assignments: admin/director/deputy/director head full access
CREATE POLICY "Duty assignments admin full access"
  ON public.duty_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty assignments: related users can read their own assignments
CREATE POLICY "Duty assignments readable by related users"
  ON public.duty_assignments
  FOR SELECT
  USING (
    assigned_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty assignments: related users can create own assignment
CREATE POLICY "Duty assignments insertable by related users"
  ON public.duty_assignments
  FOR INSERT
  WITH CHECK (
    assigned_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty assignments: related users can update their own assignment
CREATE POLICY "Duty assignments updatable by related users"
  ON public.duty_assignments
  FOR UPDATE
  USING (
    assigned_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  )
  WITH CHECK (
    assigned_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty assignments: related users can delete their own assignment
CREATE POLICY "Duty assignments deletable by related users"
  ON public.duty_assignments
  FOR DELETE
  USING (
    assigned_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty records: admin/director/deputy/dept head full access
CREATE POLICY "Duty records admin full access"
  ON public.duty_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty records: readable by users related to the record
CREATE POLICY "Duty records readable by related users"
  ON public.duty_records
  FOR SELECT
  USING (
    recorder_user_id = auth.uid()
    OR final_duty_user_id = auth.uid()
    OR swap_requested_by_user_id = auth.uid()
    OR swap_target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.duty_assignments a
      WHERE a.id = public.duty_records.assignment_id
        AND a.assigned_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty records: insertable by recorder / related users
CREATE POLICY "Duty records insertable by related users"
  ON public.duty_records
  FOR INSERT
  WITH CHECK (
    recorder_user_id = auth.uid()
    OR final_duty_user_id = auth.uid()
    OR swap_requested_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.duty_assignments a
      WHERE a.id = public.duty_records.assignment_id
        AND a.assigned_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty records: updatable by related users
CREATE POLICY "Duty records updatable by related users"
  ON public.duty_records
  FOR UPDATE
  USING (
    recorder_user_id = auth.uid()
    OR final_duty_user_id = auth.uid()
    OR swap_requested_by_user_id = auth.uid()
    OR swap_target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.duty_assignments a
      WHERE a.id = public.duty_records.assignment_id
        AND a.assigned_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  )
  WITH CHECK (
    recorder_user_id = auth.uid()
    OR final_duty_user_id = auth.uid()
    OR swap_requested_by_user_id = auth.uid()
    OR swap_target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.duty_assignments a
      WHERE a.id = public.duty_records.assignment_id
        AND a.assigned_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );

-- Duty records: delete restricted to related users
CREATE POLICY "Duty records deletable by related users"
  ON public.duty_records
  FOR DELETE
  USING (
    recorder_user_id = auth.uid()
    OR final_duty_user_id = auth.uid()
    OR swap_requested_by_user_id = auth.uid()
    OR swap_target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.duty_assignments a
      WHERE a.id = public.duty_records.assignment_id
        AND a.assigned_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.app_users u
      WHERE u.id = auth.uid()
        AND u.is_active = true
        AND u.role IN ('admin', 'director', 'deputy_director', 'dept_head')
    )
  );
