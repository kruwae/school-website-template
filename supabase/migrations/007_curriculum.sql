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
('2517', 'ก่อตั้งโรงเรียนโสตศึกษา', 1),
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
