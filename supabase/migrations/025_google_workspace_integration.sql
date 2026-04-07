-- =============================================
-- GOOGLE WORKSPACE INTEGRATION API ENDPOINTS
-- Supabase Edge Functions สำหรับเชื่อมต่อ Google Services
-- =============================================

-- 1. ตารางเก็บ Google OAuth tokens
CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ตารางเก็บ Google Classroom data
CREATE TABLE IF NOT EXISTS public.google_classroom_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_course_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  section TEXT,
  room TEXT,
  owner_id TEXT,
  enrollment_code TEXT,
  course_state TEXT DEFAULT 'ACTIVE',
  school_id UUID REFERENCES public.schools(id),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ตารางเก็บ Google Calendar events
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_event_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT DEFAULT 'academic', -- academic, holiday, activity, etc.
  is_all_day BOOLEAN DEFAULT false,
  calendar_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ตารางเก็บ Google Drive files
CREATE TABLE IF NOT EXISTS public.google_drive_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_file_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mime_type TEXT,
  web_view_link TEXT,
  download_url TEXT,
  thumbnail_link TEXT,
  size_bytes BIGINT,
  shared BOOLEAN DEFAULT false,
  folder_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_classroom_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only for security)
CREATE POLICY "Google tokens admin access"
  ON public.google_oauth_tokens FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Google classroom admin access"
  ON public.google_classroom_courses FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Google calendar admin access"
  ON public.google_calendar_events FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Google drive admin access"
  ON public.google_drive_files FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- =============================================
-- API ENDPOINTS (Supabase Edge Functions)
-- =============================================

-- Note: สร้าง Edge Functions ในโฟลเดอร์ supabase/functions/
-- 1. google-auth - จัดการ OAuth flow
-- 2. google-classroom - Sync classroom data
-- 3. google-calendar - Sync calendar events
-- 4. google-drive - Access drive files

-- =============================================
-- INTEGRATION COMPLETE
-- =============================================