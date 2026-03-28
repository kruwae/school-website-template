-- ============================================================
-- 012_maintenance_images.sql
-- เพิ่มคอลัมน์รูปภาพ 3 ระยะในระบบแจ้งซ่อม
-- ============================================================

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS image_before  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_during  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_after   TEXT DEFAULT NULL;

COMMENT ON COLUMN maintenance_requests.image_before IS 'รูปภาพก่อนซ่อม (สภาพปัญหา)';
COMMENT ON COLUMN maintenance_requests.image_during IS 'รูปภาพระหว่างดำเนินการ (เจ้าหน้าที่อัปโหลด)';
COMMENT ON COLUMN maintenance_requests.image_after  IS 'รูปภาพหลังดำเนินการเสร็จสิ้น';
