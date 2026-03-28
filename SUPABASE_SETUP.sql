-- =============================================
-- INITIAL SCHEMA - School Website Database
-- Version: 1.0
-- =============================================
-- This creates the core tables needed for the website
-- Run this FIRST before any other migrations
-- =============================================

-- =============================================
-- 1. NEWS TABLE - ตารางข่าวสาร
-- =============================================
CREATE TABLE IF NOT EXISTS public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  image_url TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'ข่าวประชาสัมพันธ์',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  cover_image_url TEXT,
  external_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.news IS 'ตารางเก็บข่าวสารและประชาสัมพันธ์';
COMMENT ON COLUMN public.news.category IS 'หมวดหมู่ข่าว เช่น ข่าวประชาสัมพันธ์, กิจกรรม, ผลงานนักเรียน, ประกาศ';
COMMENT ON COLUMN public.news.is_pinned IS 'ปักหมุดข่าวให้แสดงด้านบน';
COMMENT ON COLUMN public.news.sort_order IS 'ลำดับการแสดงผล (เริ่มจาก 0)';
COMMENT ON COLUMN public.news.external_links IS 'ลิงก์ภายนอกที่เกี่ยวข้อง (JSON array)';

-- =============================================
-- 2. NEWS CATEGORIES TABLE - ตารางหมวดหมู่ข่าว
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.news_categories IS 'ตารางเก็บหมวดหมู่ของข่าวสาร';

-- =============================================
-- 3. GALLERY ALBUMS TABLE - ตารางอัลบั้มภาพ
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'ทั่วไป',
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gallery_albums IS 'ตารางเก็บอัลบั้มรูปภาพ';
COMMENT ON COLUMN public.gallery_albums.category IS 'หมวดหมู่ เช่น กิจกรรม, กีฬา, วิชาการ';

-- =============================================
-- 4. GALLERY PHOTOS TABLE - ตารางรูปภาพ
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gallery_photos IS 'ตารางเก็บรูปภาพในแต่ละอัลบั้ม';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Public Read, Admin Write
-- =============================================

-- NEWS Policies
DROP POLICY IF EXISTS "Published news are publicly readable" ON public.news;
CREATE POLICY "Published news are publicly readable"
  ON public.news
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin can manage news" ON public.news;
CREATE POLICY "Admin can manage news"
  ON public.news
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- NEWS CATEGORIES Policies
DROP POLICY IF EXISTS "News categories are publicly readable" ON public.news_categories;
CREATE POLICY "News categories are publicly readable"
  ON public.news_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage news categories" ON public.news_categories;
CREATE POLICY "Admin can manage news categories"
  ON public.news_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- GALLERY ALBUMS Policies
DROP POLICY IF EXISTS "Published albums are publicly readable" ON public.gallery_albums;
CREATE POLICY "Published albums are publicly readable"
  ON public.gallery_albums
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin can manage albums" ON public.gallery_albums;
CREATE POLICY "Admin can manage albums"
  ON public.gallery_albums
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- GALLERY PHOTOS Policies
DROP POLICY IF EXISTS "Photos are publicly readable" ON public.gallery_photos;
CREATE POLICY "Photos are publicly readable"
  ON public.gallery_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage photos" ON public.gallery_photos;
CREATE POLICY "Admin can manage photos"
  ON public.gallery_photos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_news_updated_at ON public.news;
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_categories_updated_at ON public.news_categories;
CREATE TRIGGER update_news_categories_updated_at
  BEFORE UPDATE ON public.news_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gallery_albums_updated_at ON public.gallery_albums;
CREATE TRIGGER update_gallery_albums_updated_at
  BEFORE UPDATE ON public.gallery_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gallery_photos_updated_at ON public.gallery_photos;
CREATE TRIGGER update_gallery_photos_updated_at
  BEFORE UPDATE ON public.gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(published);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_pinned ON public.news(is_pinned);
CREATE INDEX IF NOT EXISTS idx_news_sort_order ON public.news(sort_order);

CREATE INDEX IF NOT EXISTS idx_gallery_albums_category ON public.gallery_albums(category);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_published ON public.gallery_albums(is_published);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_album_id ON public.gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_sort_order ON public.gallery_photos(sort_order);

-- =============================================
-- STORAGE BUCKET Setup (for file uploads)
-- =============================================

-- Note: Storage buckets need to be created in Supabase Dashboard or via:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('school-images', 'school-images', true);

-- This will be handled separately as storage is managed differently

-- =============================================
-- SAMPLE DATA - ข้อมูลเริ่มต้น
-- =============================================

-- Insert default news categories
INSERT INTO public.news_categories (name, description, color) VALUES
  ('ข่าวประชาสัมพันธ์', 'ข่าวสารทั่วไปของโรงเรียน', 'blue'),
  ('กิจกรรม', 'กิจกรรมต่างๆ ภายในโรงเรียน', 'green'),
  ('ผลงานนักเรียน', 'ผลงานและความสำเร็จของนักเรียน', 'purple'),
  ('ประกาศ', 'ประกาศสำคัญจากทางโรงเรียน', 'red')
ON CONFLICT (name) DO NOTHING;

-- Insert sample news (optional - can be removed if you want clean installation)
INSERT INTO public.news (title, content, excerpt, category, published, published_at, sort_order) VALUES
  (
    'ยินดีต้อนรับสู่เว็บไซต์โรงเรียน',
    '<p>ยินดีต้อนรับสู่เว็บไซต์โรงเรียนรูปแบบใหม่ พร้อมระบบจัดการที่ทันสมัย</p>',
    'ยินดีต้อนรับสู่เว็บไซต์โรงเรียนรูปแบบใหม่',
    'ข่าวประชาสัมพันธ์',
    true,
    now(),
    0
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- END OF INITIAL SCHEMA
-- =============================================
-- =============================================
-- Events and Settings Management Tables
-- For KK School Admin Panel
-- =============================================

-- =============================================
-- 1. EVENTS TABLE - ตารางกิจกรรม/ปฏิทิน
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(200),
  category VARCHAR(50) DEFAULT 'general',
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.events IS 'ตารางเก็บข้อมูลกิจกรรมและปฏิทินโรงเรียน';
COMMENT ON COLUMN public.events.category IS 'หมวดหมู่ เช่น academic, sports, cultural, general';
COMMENT ON COLUMN public.events.status IS 'สถานะการแสดงผล: draft, published, archived';

-- =============================================
-- 2. SCHOOL_SETTINGS TABLE - ตารางตั้งค่าโรงเรียน
-- =============================================
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.school_settings IS 'ตารางเก็บการตั้งค่าต่างๆ ของโรงเรียน';
COMMENT ON COLUMN public.school_settings.key IS 'คีย์การตั้งค่า เช่น school_name, phone, email';
COMMENT ON COLUMN public.school_settings.category IS 'หมวดหมู่ เช่น general, contact, social_media, branding';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Public Read for Published Content
-- =============================================

-- Drop existing policies first (for re-running migration)
DROP POLICY IF EXISTS "Published events are publicly readable" ON public.events;
DROP POLICY IF EXISTS "Admin can insert events" ON public.events;
DROP POLICY IF EXISTS "Admin can update events" ON public.events;
DROP POLICY IF EXISTS "Admin can delete events" ON public.events;
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can insert settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can delete settings" ON public.school_settings;

-- Events: อ่านได้เฉพาะที่ published
CREATE POLICY "Published events are publicly readable" 
  ON public.events 
  FOR SELECT 
  USING (status = 'published');

-- Events: Admin can do everything (temporarily allow all authenticated users)
-- Note: In production, you should check if user is admin
CREATE POLICY "Admin can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update events"
  ON public.events
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete events"
  ON public.events
  FOR DELETE
  USING (true);

-- Settings: อ่านได้ทั้งหมด
CREATE POLICY "Settings are publicly readable" 
  ON public.school_settings 
  FOR SELECT 
  USING (true);

-- Settings: Admin can do everything
CREATE POLICY "Admin can insert settings"
  ON public.school_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update settings"
  ON public.school_settings
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete settings"
  ON public.school_settings
  FOR DELETE
  USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Drop existing triggers first (for re-running migration)
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_school_settings_updated_at ON public.school_settings;

-- Function to update timestamps (create if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates on events
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for automatic timestamp updates on settings
DROP TRIGGER IF EXISTS update_school_settings_updated_at ON public.school_settings;
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES สำหรับประสิทธิภาพ
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_school_settings_key ON public.school_settings(key);
CREATE INDEX IF NOT EXISTS idx_school_settings_category ON public.school_settings(category);

-- =============================================
-- SAMPLE DATA - ข้อมูลเริ่มต้น
-- =============================================

-- Insert default school settings
INSERT INTO public.school_settings (key, value, category, description) VALUES
  ('school_name', 'โรงเรียนตัวอย่าง', 'general', 'ชื่อโรงเรียน'),
  ('school_motto', 'เรียนดี มีความสุข พัฒนาตน', 'general', 'คำขวัญโรงเรียน'),
  ('school_phone', '02-xxx-xxxx', 'contact', 'เบอร์โทรศัพท์'),
  ('school_email', 'info@school.ac.th', 'contact', 'อีเมล'),
  ('school_address', '123 ถนนตัวอย่าง เขต... กรุงเทพฯ 10xxx', 'contact', 'ที่อยู่'),
  ('facebook_url', '', 'social_media', 'Facebook Page URL'),
  ('line_id', '', 'social_media', 'LINE Official Account'),
  ('youtube_url', '', 'social_media', 'YouTube Channel URL')
ON CONFLICT (key) DO NOTHING;

-- Insert sample events
INSERT INTO public.events (title, description, event_date, event_time, location, category, status) VALUES
  (
    'วันเปิดเทอม ภาคเรียนที่ 1/2568',
    'พิธีเปิดภาคเรียนใหม่ ให้นักเรียนทุกคนมาพร้อมกัน',
    CURRENT_DATE + INTERVAL '7 days',
    '08:00:00',
    'โรงยิมนาเซียม',
    'academic',
    'published'
  ),
  (
    'กีฬาสีประจำปี 2568',
    'การแข่งขันกีฬาภายในโรงเรียน เพื่อส่งเสริมความสามัคคี',
    CURRENT_DATE + INTERVAL '30 days',
    '09:00:00',
    'สนามกีฬาโรงเรียน',
    'sports',
    'published'
  ),
  (
    'งานวันสถาปนาโรงเรียน',
    'ร่วมฉลองครบรอบวันสถาปนาโรงเรียน พร้อมกิจกรรมมากมาย',
    CURRENT_DATE + INTERVAL '60 days',
    '10:00:00',
    'หอประชุมโรงเรียน',
    'cultural',
    'published'
  );

-- =============================================
-- END OF MIGRATION
-- =============================================
-- Drop existing table (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS administrators CASCADE;

-- Create administrators table
CREATE TABLE administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    education TEXT,
    quote TEXT,
    photo_url TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for administrators"
ON administrators FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default data
INSERT INTO administrators (name, position, education, quote, order_position) VALUES
('ดร.สมศักดิ์ วิทยาการ', 'ผู้อำนวยการโรงเรียน', 'ปริญญาเอก บริหารการศึกษา', 'การศึกษาคือกุญแจสู่อนาคตที่สดใส', 1),
('นางสาวประภา สุขสวัสดิ์', 'รองผู้อำนวยการฝ่ายวิชาการ', 'ปริญญาโท หลักสูตรและการสอน', 'มุ่งมั่นพัฒนาคุณภาพการเรียนการสอน', 2),
('นายวิชัย บุญมี', 'รองผู้อำนวยการฝ่ายบริหาร', 'ปริญญาโท บริหารธุรกิจ', 'บริหารด้วยความโปร่งใสและมีประสิทธิภาพ', 3),
('นางรัชนี แสงทอง', 'รองผู้อำนวยการฝ่ายกิจการนักเรียน', 'ปริญญาโท จิตวิทยาการศึกษา', 'ดูแลนักเรียนด้วยหัวใจ', 4);
-- Drop existing table (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS staff CASCADE;

-- Create staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    subject TEXT,
    education TEXT,
    experience TEXT,
    photo_url TEXT,
    staff_type TEXT NOT NULL DEFAULT 'teaching' CHECK (staff_type IN ('teaching', 'support')),
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for staff"
ON staff FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default teaching staff
INSERT INTO staff (name, position, subject, education, experience, staff_type, order_position) VALUES
('นายสมชาย ใจดี', 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาไทย', 'ภาษาไทย', 'ปริญญาโท ภาษาไทย', '15 ปี', 'teaching', 1),
('นางสาวสุภา รักเรียน', 'หัวหน้ากลุ่มสาระการเรียนรู้คณิตศาสตร์', 'คณิตศาสตร์', 'ปริญญาโท คณิตศาสตร์ศึกษา', '12 ปี', 'teaching', 2),
('นายวิทยา ฉลาดคิด', 'หัวหน้ากลุ่มสาระการเรียนรู้วิทยาศาสตร์', 'วิทยาศาสตร์', 'ปริญญาโท วิทยาศาสตร์ศึกษา', '10 ปี', 'teaching', 3),
('นางภาวินี สุขสม', 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', 'ภาษาอังกฤษ', 'ปริญญาโท ภาษาอังกฤษ', '14 ปี', 'teaching', 4),
('นายประเสริฐ ศิลปิน', 'หัวหน้ากลุ่มสาระการเรียนรู้ศิลปะ', 'ศิลปะ', 'ปริญญาตรี ศิลปศึกษา', '8 ปี', 'teaching', 5),
('นางสาวกาญจนา แข็งแรง', 'หัวหน้ากลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา', 'สุขศึกษาและพลศึกษา', 'ปริญญาตรี พลศึกษา', '7 ปี', 'teaching', 6),
('นายอุดม ช่างคิด', 'หัวหน้ากลุ่มสาระการเรียนรู้การงานอาชีพ', 'การงานอาชีพ', 'ปริญญาโท เทคโนโลยีการศึกษา', '11 ปี', 'teaching', 7),
('นางสาวสังคม สันติสุข', 'หัวหน้ากลุ่มสาระการเรียนรู้สังคมศึกษา', 'สังคมศึกษา', 'ปริญญาโท สังคมศาสตร์', '13 ปี', 'teaching', 8);

-- Insert default support staff
INSERT INTO staff (name, position, department, experience, staff_type, order_position) VALUES
('นางสาวปราณี รักงาน', 'หัวหน้างานธุรการ', 'ฝ่ายบริหารทั่วไป', '10 ปี', 'support', 101),
('นายสมศักดิ์ รักษ์ความสะอาด', 'หัวหน้างานอาคารสถานที่', 'ฝ่ายบริหารทั่วไป', '8 ปี', 'support', 102),
('นางวันดี ใจดี', 'หัวหน้างานการเงินและพัสดุ', 'ฝ่ายบริหาร', '12 ปี', 'support', 103),
('นายคอมพิวเตอร์ เก่งมาก', 'หัวหน้างานเทคโนโลยีสารสนเทศ', 'ฝ่ายวิชาการ', '6 ปี', 'support', 104);
-- Drop existing tables (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS student_achievements CASCADE;
DROP TABLE IF EXISTS student_activities CASCADE;

-- Create student_achievements table
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    year TEXT,
    category TEXT DEFAULT 'รางวัล',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for student_achievements"
ON student_achievements FOR ALL
USING (true)
WITH CHECK (true);

-- Create student_activities table
CREATE TABLE student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    members INTEGER DEFAULT 0,
    description TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for student_activities"
ON student_activities FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default achievements
INSERT INTO student_achievements (title, description, year, category, order_position) VALUES
('เหรียญทองโอลิมปิกวิชาการ', 'นักเรียนได้รับเหรียญทองการแข่งขันคณิตศาสตร์โอลิมปิกระดับชาติ', '2567', 'โอลิมปิก', 1),
('รางวัลชนะเลิศวิทยาศาสตร์', 'โครงงานวิทยาศาสตร์ได้รับรางวัลชนะเลิศระดับภาค', '2567', 'วิทยาศาสตร์', 2),
('ทุนการศึกษาต่อต่างประเทศ', 'นักเรียนได้รับทุนเรียนต่อมหาวิทยาลัยชั้นนำในต่างประเทศ', '2567', 'ทุนการศึกษา', 3),
('ผลสอบ O-NET สูงกว่าค่าเฉลี่ย', 'ผลสอบ O-NET ทุกวิชาสูงกว่าค่าเฉลี่ยระดับประเทศ', '2566', 'วิชาการ', 4);

-- Insert default activities
INSERT INTO student_activities (name, members, description, order_position) VALUES
('ชมรมวิทยาศาสตร์', 85, 'ทดลองและค้นคว้าทางวิทยาศาสตร์', 1),
('ชมรมคณิตศาสตร์', 70, 'พัฒนาทักษะการคิดวิเคราะห์', 2),
('ชมรมภาษาอังกฤษ', 90, 'พัฒนาทักษะการสื่อสารภาษาอังกฤษ', 3),
('ชมรมดนตรี', 65, 'เรียนรู้และแสดงดนตรีหลากหลายแนว', 4),
('ชมรมกีฬา', 120, 'ฝึกฝนกีฬาและส่งเสริมสุขภาพ', 5),
('ชมรมศิลปะ', 55, 'สร้างสรรค์ผลงานศิลปะหลากหลายรูปแบบ', 6);

-- Create student_stats table for overview statistics
DROP TABLE IF EXISTS student_stats CASCADE;

CREATE TABLE student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT DEFAULT 'Users',
    color TEXT DEFAULT 'text-primary',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for student_stats"
ON student_stats FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO student_stats (label, value, icon, color, order_position) VALUES
('นักเรียนทั้งหมด', '1,250', 'Users', 'text-primary', 1),
('ม.ปลาย', '650', 'GraduationCap', 'text-accent', 2),
('ม.ต้น', '600', 'BookOpen', 'text-green-500', 3),
('นักเรียนเกียรตินิยม', '180', 'Trophy', 'text-purple-500', 4);

-- Create grade_data table for student counts per grade level
DROP TABLE IF EXISTS grade_data CASCADE;

CREATE TABLE grade_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    rooms INTEGER DEFAULT 0,
    students INTEGER DEFAULT 0,
    boys INTEGER DEFAULT 0,
    girls INTEGER DEFAULT 0,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE grade_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for grade_data"
ON grade_data FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO grade_data (level, rooms, students, boys, girls, order_position) VALUES
('มัธยมศึกษาปีที่ 1', 6, 210, 105, 105, 1),
('มัธยมศึกษาปีที่ 2', 6, 200, 98, 102, 2),
('มัธยมศึกษาปีที่ 3', 6, 190, 95, 95, 3),
('มัธยมศึกษาปีที่ 4', 6, 220, 110, 110, 4),
('มัธยมศึกษาปีที่ 5', 6, 215, 108, 107, 5),
('มัธยมศึกษาปีที่ 6', 6, 215, 107, 108, 6);

-- Create student_council table for student council members
DROP TABLE IF EXISTS student_council CASCADE;

CREATE TABLE student_council (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    class TEXT,
    initial TEXT,
    image_url TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE student_council ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for student_council"
ON student_council FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO student_council (name, position, class, initial, order_position) VALUES
('นายประสิทธิ์ เก่งมาก', 'ประธานสภานักเรียน', 'ม.6/1', 'ป', 1),
('นางสาวสุดา รักเรียน', 'รองประธานสภานักเรียน', 'ม.6/2', 'ส', 2),
('นายวิชัย ใจดี', 'เลขานุการสภานักเรียน', 'ม.5/1', 'ว', 3);
-- Drop existing table (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS admissions CASCADE;

-- Create admissions table for online enrollment applications
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_id_card TEXT,
    birth_date DATE,
    gender TEXT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    address TEXT,
    previous_school TEXT,
    grade_applying TEXT NOT NULL,
    program_applying TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

-- Allow public full access to admissions (simplified for admin panel to work)
-- In production, you should use proper authentication
CREATE POLICY "Allow public full access for admissions"
ON admissions FOR ALL
USING (true)
WITH CHECK (true);
-- 007_curriculum.sql
-- Create curriculum_programs table for managing study programs

DROP TABLE IF EXISTS curriculum_programs CASCADE;

CREATE TABLE curriculum_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'BookOpen',
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    subjects TEXT[] DEFAULT '{}',
    careers TEXT[] DEFAULT '{}',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE curriculum_programs ENABLE ROW LEVEL SECURITY;

-- Allow full public access (for development, same as other tables)
CREATE POLICY "Allow full access for curriculum_programs"
    ON curriculum_programs
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Insert default programs with subjects and careers
INSERT INTO curriculum_programs (title, description, icon, color, subjects, careers, order_position) VALUES
('วิทย์-คณิต', 'หลักสูตรเน้นวิทยาศาสตร์และคณิตศาสตร์ เตรียมความพร้อมสู่คณะแพทย์ วิศวกรรม และวิทยาศาสตร์', 'FlaskConical', 'bg-blue-500', ARRAY['ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'คณิตศาสตร์ขั้นสูง'], ARRAY['แพทย์', 'วิศวกร', 'นักวิทยาศาสตร์', 'เภสัชกร'], 1),
('ศิลป์-ภาษา', 'เน้นทักษะภาษาอังกฤษ จีน ญี่ปุ่น และฝรั่งเศส พร้อมสู่ความเป็นสากล', 'Languages', 'bg-purple-500', ARRAY['ภาษาอังกฤษ', 'ภาษาจีน', 'ภาษาญี่ปุ่น', 'ภาษาฝรั่งเศส'], ARRAY['นักแปล', 'มัคคุเทศก์', 'นักการทูต', 'ครูสอนภาษา'], 2),
('ศิลป์-คำนวณ', 'รวมศาสตร์สังคมศึกษากับคณิตศาสตร์ เตรียมพร้อมสู่คณะบริหาร เศรษฐศาสตร์ และนิติศาสตร์', 'Calculator', 'bg-green-500', ARRAY['สังคมศึกษา', 'เศรษฐศาสตร์', 'คณิตศาสตร์', 'การบัญชี'], ARRAY['นักบัญชี', 'นักเศรษฐศาสตร์', 'ทนายความ', 'นักธุรกิจ'], 3),
('คอมพิวเตอร์', 'หลักสูตรเทคโนโลยีสารสนเทศ เขียนโปรแกรม และ AI เตรียมความพร้อมสู่โลกดิจิทัล', 'Monitor', 'bg-orange-500', ARRAY['การเขียนโปรแกรม', 'AI และ Machine Learning', 'Web Development', 'Cybersecurity'], ARRAY['โปรแกรมเมอร์', 'นักวิเคราะห์ข้อมูล', 'UX Designer', 'AI Engineer'], 4);

-- Create curriculum_activities table for extra-curricular activities
DROP TABLE IF EXISTS curriculum_activities CASCADE;

CREATE TABLE curriculum_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'BookOpen',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE curriculum_activities ENABLE ROW LEVEL SECURITY;

-- Allow full public access
CREATE POLICY "Allow full access for curriculum_activities"
    ON curriculum_activities
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Insert default activities
INSERT INTO curriculum_activities (name, description, icon, order_position) VALUES
('ชมรมศิลปะ', 'วาดภาพ ปั้น และงานหัตถกรรม', 'Palette', 1),
('วงดนตรี', 'ดนตรีสากลและดนตรีไทย', 'Music', 2),
('กีฬา', 'ฟุตบอล บาสเกตบอล ว่ายน้ำ', 'Dumbbell', 3),
('ห้องสมุด', 'ชมรมหนังสือและการอ่าน', 'BookOpen', 4);

-- Create FAQ table for frequently asked questions
DROP TABLE IF EXISTS faq CASCADE;

CREATE TABLE faq (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Allow full public access
CREATE POLICY "Allow full access for faq"
    ON faq
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Insert default FAQ items
INSERT INTO faq (question, answer, order_position) VALUES
('ค่าธรรมเนียมการศึกษาเท่าไหร่?', 'ค่าธรรมเนียมการศึกษาต่อภาคเรียน ม.ต้น 15,000 บาท และ ม.ปลาย 18,000 บาท รวมค่าอุปกรณ์การเรียน', 1),
('มีรถรับส่งนักเรียนหรือไม่?', 'มีบริการรถรับส่งนักเรียน ครอบคลุมพื้นที่กรุงเทพฯ และปริมณฑล สอบถามเส้นทางได้ที่ฝ่ายธุรการ', 2),
('เปิดรับสมัครนักเรียนใหม่เมื่อไหร่?', 'เปิดรับสมัครนักเรียนใหม่ทุกปี ช่วงเดือนกุมภาพันธ์ - มีนาคม สำหรับปีการศึกษาถัดไป', 3);

-- Create milestones table for school history timeline
DROP TABLE IF EXISTS milestones CASCADE;

CREATE TABLE milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year VARCHAR(10) NOT NULL,
    event TEXT NOT NULL,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for milestones"
    ON milestones
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

INSERT INTO milestones (year, event, order_position) VALUES
('2517', 'ก่อตั้งโรงเรียนห้องสื่อครูคอมวิทยาคม', 1),
('2530', 'เปิดหลักสูตรวิทยาศาสตร์-คณิตศาสตร์', 2),
('2545', 'ได้รับรางวัลโรงเรียนพระราชทาน', 3),
('2555', 'เปิดหลักสูตรภาษาต่างประเทศ', 4),
('2565', 'เปิดหลักสูตรเทคโนโลยีและ AI', 5);

-- Create facilities table for school facilities
DROP TABLE IF EXISTS facilities CASCADE;

CREATE TABLE facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Building2',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for facilities"
    ON facilities
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

INSERT INTO facilities (title, description, icon, order_position) VALUES
('อาคารเรียน', 'อาคารเรียนทันสมัย 5 หลัง พร้อมห้องเรียนปรับอากาศ', 'Building2', 1),
('ห้องสมุด', 'ห้องสมุดขนาดใหญ่ หนังสือกว่า 50,000 เล่ม และ e-Library', 'BookOpen', 2),
('สนามกีฬา', 'สนามฟุตบอล สระว่ายน้ำ โรงยิม และสนามเทนนิส', 'Award', 3);

-- =============================================
-- FIX 008: Drop and Recreate Contact Messages Table
-- Run this if you encounter "column is_read does not exist" error
-- =============================================

-- 1. Drop the table if it exists (to clear old schema)
DROP TABLE IF EXISTS public.contact_messages;

-- 2. Recreate the table with the correct schema
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.contact_messages IS 'ตารางเก็บข้อความจากฟอร์มติดต่อเรา';
COMMENT ON COLUMN public.contact_messages.is_read IS 'สถานะการอ่านข้อความ';

-- 3. RLS Policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view messages"
  ON public.contact_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can update messages"
  ON public.contact_messages
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete messages"
  ON public.contact_messages
  FOR DELETE
  USING (true);

-- 4. Trigger for updated_at
-- (Assuming public.update_updated_at_column() already exists from previous migrations)
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Indexes
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages(is_read);
-- Add external_links column to news table
ALTER TABLE news ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN news.external_links IS 'List of external links (url, title) for the news item';
-- Function to increment news view count securely
-- This allows anonymous users to increment views without needing UPDATE permission on the table
CREATE OR REPLACE FUNCTION increment_news_view(news_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.news
  SET views = COALESCE(views, 0) + 1
  WHERE id = news_id;
END;
$$;