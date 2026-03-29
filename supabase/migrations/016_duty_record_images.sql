-- ============================================================
-- 016_duty_record_images.sql
-- เพิ่มรูปภาพหลายรูปสำหรับบันทึกเวร
-- ============================================================

ALTER TABLE public.duty_records
  ADD COLUMN IF NOT EXISTS duty_images JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.duty_records.duty_images IS 'รายการรูปภาพประกอบบันทึกเวร รองรับหลายรูปแบบ JSON array';

UPDATE public.duty_records
SET duty_images = '[]'::jsonb
WHERE duty_images IS NULL;
