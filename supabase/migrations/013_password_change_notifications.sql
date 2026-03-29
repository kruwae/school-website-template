-- ============================================================
-- 013_password_change_notifications.sql
-- แจ้งเตือน admin เมื่อมีการเปลี่ยนรหัสผ่าน และรองรับบันทึกการรีเซ็ตรหัสผ่านโดย admin
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  target_user_id UUID NULL REFERENCES public.app_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_notifications IS 'ตารางแจ้งเตือนสำหรับ admin';
COMMENT ON COLUMN public.admin_notifications.type IS 'ประเภทแจ้งเตือน เช่น password_changed, password_reset_by_admin';
COMMENT ON COLUMN public.admin_notifications.title IS 'หัวข้อแจ้งเตือน';
COMMENT ON COLUMN public.admin_notifications.message IS 'รายละเอียดแจ้งเตือน โดยไม่เก็บรหัสผ่านจริง';
COMMENT ON COLUMN public.admin_notifications.actor_user_id IS 'ผู้กระทำ เช่น ผู้ใช้ที่เปลี่ยนรหัส หรือ admin ที่รีเซ็ต';
COMMENT ON COLUMN public.admin_notifications.target_user_id IS 'ผู้ใช้เป้าหมาย เช่น บัญชีที่ถูกรีเซ็ตรหัสผ่าน';
COMMENT ON COLUMN public.admin_notifications.metadata IS 'ข้อมูลประกอบเพิ่มเติมที่ไม่ใช่รหัสผ่าน';

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admin can insert notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admin can delete notifications" ON public.admin_notifications;

CREATE POLICY "Admin can read notifications"
  ON public.admin_notifications
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert notifications"
  ON public.admin_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update notifications"
  ON public.admin_notifications
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete notifications"
  ON public.admin_notifications
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_actor_user_id ON public.admin_notifications(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_user_id ON public.admin_notifications(target_user_id);
