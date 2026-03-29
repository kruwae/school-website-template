-- ============================================================
-- 015_duty_assignments.sql
-- ตารางกำหนดเข้าเวรล่วงหน้า แยกจากบันทึกเวรประจำวัน
-- ============================================================

CREATE TABLE IF NOT EXISTS public.duty_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duty_date DATE NOT NULL,
  duty_shift TEXT NOT NULL,
  duty_shift_label TEXT NOT NULL,
  assigned_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  assigned_name TEXT NOT NULL,
  assigned_position TEXT NULL,
  assigned_by_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.duty_assignments IS 'ตารางกำหนดเข้าเวรล่วงหน้า ก่อนการบันทึกเวรจริง';
COMMENT ON COLUMN public.duty_assignments.duty_date IS 'วันที่ต้องเข้าเวร';
COMMENT ON COLUMN public.duty_assignments.duty_shift IS 'รหัสช่วงเวร';
COMMENT ON COLUMN public.duty_assignments.duty_shift_label IS 'ชื่อช่วงเวร';
COMMENT ON COLUMN public.duty_assignments.assigned_user_id IS 'ผู้ที่ถูกกำหนดให้เข้าเวร';
COMMENT ON COLUMN public.duty_assignments.assigned_name IS 'ชื่อผู้เข้าเวร';
COMMENT ON COLUMN public.duty_assignments.assigned_position IS 'ตำแหน่งผู้เข้าเวร';
COMMENT ON COLUMN public.duty_assignments.assigned_by_user_id IS 'ผู้กำหนดตารางเวร';
COMMENT ON COLUMN public.duty_assignments.notes IS 'หมายเหตุกำหนดเวร';
COMMENT ON COLUMN public.duty_assignments.status IS 'สถานะตารางเวร: scheduled, completed, cancelled';

ALTER TABLE public.duty_assignments
  DROP CONSTRAINT IF EXISTS duty_assignments_status_check;

ALTER TABLE public.duty_assignments
  ADD CONSTRAINT duty_assignments_status_check
  CHECK (status IN ('scheduled', 'completed', 'cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_duty_assignments_date_shift_user
  ON public.duty_assignments(duty_date, duty_shift, assigned_name);

CREATE INDEX IF NOT EXISTS idx_duty_assignments_date
  ON public.duty_assignments(duty_date);

CREATE INDEX IF NOT EXISTS idx_duty_assignments_user
  ON public.duty_assignments(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_duty_assignments_status
  ON public.duty_assignments(status);

ALTER TABLE public.duty_records
  ADD COLUMN IF NOT EXISTS assignment_id UUID NULL REFERENCES public.duty_assignments(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.duty_records.assignment_id IS 'อ้างอิงตารางกำหนดเข้าเวร เพื่อให้บันทึกเวรผูกกับเวรที่ถูกมอบหมายไว้';

CREATE INDEX IF NOT EXISTS idx_duty_records_assignment_id
  ON public.duty_records(assignment_id);
