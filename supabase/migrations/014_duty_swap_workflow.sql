-- ============================================================
-- 014_duty_swap_workflow.sql
-- เพิ่ม workflow เปลี่ยนเวรสำหรับ duty_records
-- ============================================================

ALTER TABLE public.duty_records
  ADD COLUMN IF NOT EXISTS swap_requested BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS swap_requested_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS swap_requested_by_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS swap_requested_by_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS swap_requested_by_position TEXT NULL,
  ADD COLUMN IF NOT EXISTS swap_target_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS swap_target_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS swap_target_position TEXT NULL,
  ADD COLUMN IF NOT EXISTS swap_response_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS swap_responded_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS swap_responded_by_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS swap_response_note TEXT NULL,
  ADD COLUMN IF NOT EXISTS final_duty_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS final_duty_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS final_duty_position TEXT NULL,
  ADD COLUMN IF NOT EXISTS approval_ready BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.duty_records.swap_requested IS 'มีการยื่นคำขอเปลี่ยนเวรหรือไม่';
COMMENT ON COLUMN public.duty_records.swap_requested_at IS 'วันที่เวลาที่ยื่นคำขอเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_requested_by_user_id IS 'ผู้ยื่นคำขอเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_requested_by_name IS 'ชื่อผู้ยื่นคำขอเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_requested_by_position IS 'ตำแหน่งผู้ยื่นคำขอเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_target_user_id IS 'ผู้ถูกเลือกให้รับเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_target_name IS 'ชื่อผู้ถูกเลือกให้รับเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_target_position IS 'ตำแหน่งผู้ถูกเลือกให้รับเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_response_status IS 'สถานะการตอบรับเปลี่ยนเวร: pending, accepted, rejected, not_required';
COMMENT ON COLUMN public.duty_records.swap_responded_at IS 'วันที่เวลาที่ผู้รับเปลี่ยนเวรตอบกลับ';
COMMENT ON COLUMN public.duty_records.swap_responded_by_user_id IS 'ผู้ตอบรับ/ปฏิเสธการเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.swap_response_note IS 'หมายเหตุจากผู้รับเปลี่ยนเวร';
COMMENT ON COLUMN public.duty_records.final_duty_user_id IS 'ผู้ปฏิบัติเวรสุดท้ายที่ใช้สำหรับเสนออนุมัติ';
COMMENT ON COLUMN public.duty_records.final_duty_name IS 'ชื่อผู้ปฏิบัติเวรสุดท้าย';
COMMENT ON COLUMN public.duty_records.final_duty_position IS 'ตำแหน่งผู้ปฏิบัติเวรสุดท้าย';
COMMENT ON COLUMN public.duty_records.approval_ready IS 'พร้อมส่งอนุมัติเมื่อ workflow เปลี่ยนเวรครบถ้วนแล้ว';

UPDATE public.duty_records
SET
  swap_response_status = CASE
    WHEN COALESCE(swap_requested, FALSE) = TRUE THEN COALESCE(NULLIF(swap_response_status, ''), 'pending')
    ELSE 'not_required'
  END,
  final_duty_name = COALESCE(final_duty_name, recorder_name),
  final_duty_position = COALESCE(final_duty_position, recorder_position),
  approval_ready = CASE
    WHEN COALESCE(swap_requested, FALSE) = TRUE AND COALESCE(swap_response_status, 'pending') = 'accepted' THEN TRUE
    WHEN COALESCE(swap_requested, FALSE) = TRUE THEN FALSE
    ELSE TRUE
  END
WHERE final_duty_name IS NULL
   OR final_duty_position IS NULL
   OR swap_response_status IS NULL
   OR approval_ready IS DISTINCT FROM CASE
     WHEN COALESCE(swap_requested, FALSE) = TRUE AND COALESCE(swap_response_status, 'pending') = 'accepted' THEN TRUE
     WHEN COALESCE(swap_requested, FALSE) = TRUE THEN FALSE
     ELSE TRUE
   END;

ALTER TABLE public.duty_records
  DROP CONSTRAINT IF EXISTS duty_records_swap_response_status_check;

ALTER TABLE public.duty_records
  ADD CONSTRAINT duty_records_swap_response_status_check
  CHECK (swap_response_status IN ('pending', 'accepted', 'rejected', 'not_required'));

CREATE INDEX IF NOT EXISTS idx_duty_records_swap_requested ON public.duty_records(swap_requested);
CREATE INDEX IF NOT EXISTS idx_duty_records_swap_target_user_id ON public.duty_records(swap_target_user_id);
CREATE INDEX IF NOT EXISTS idx_duty_records_swap_response_status ON public.duty_records(swap_response_status);
CREATE INDEX IF NOT EXISTS idx_duty_records_final_duty_user_id ON public.duty_records(final_duty_user_id);
