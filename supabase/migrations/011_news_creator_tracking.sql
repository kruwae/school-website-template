-- =============================================
-- Migration 011: News Creator Tracking
-- เพิ่มคอลัมน์ created_by_user_id ในตาราง news
-- เพื่อติดตามเจ้าของประกาศข่าว สำหรับควบคุมสิทธิ์แก้ไข/ลบ
-- =============================================

-- เพิ่มคอลัมน์ created_by_user_id (UUID อ้างอิงจาก app_users)
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- Comment
COMMENT ON COLUMN public.news.created_by_user_id
  IS 'ID ของผู้สร้างประกาศข่าว (อ้างอิงจาก app_users.id)';

-- Index เพื่อช่วยในการ query ตามเจ้าของ
CREATE INDEX IF NOT EXISTS idx_news_created_by_user_id
  ON public.news (created_by_user_id);

-- =============================================
-- หมายเหตุ: ข่าวเก่าที่สร้างก่อน migration นี้
-- จะมี created_by_user_id = NULL
-- ซึ่งหมายความว่า เฉพาะ admin เท่านั้น
-- จึงจะแก้ไข/ลบได้ (ตาม canManageNews logic)
-- =============================================
