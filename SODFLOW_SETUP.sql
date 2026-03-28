-- =============================================
-- SODFLOW DOCUMENT MANAGEMENT SYSTEM
-- โรงเรียนโสตศึกษาจังหวัดสงขลา
-- Version: 1.3 — DROP & RECREATE (idempotent)
-- รันซ้ำได้ไม่มีปัญหา
-- =============================================

-- =============================================
-- STEP 0: DROP ตารางเก่า (CASCADE จัดการ FK อัตโนมัติ)
-- ลำดับ: ตารางที่มี FK ก่อน → ตารางหลักทีหลัง
-- =============================================
DROP TABLE IF EXISTS public.app_users           CASCADE;
DROP TABLE IF EXISTS public.audit_evaluations   CASCADE;
DROP TABLE IF EXISTS public.audit_committees    CASCADE;
DROP TABLE IF EXISTS public.audit_evaluatees    CASCADE;
DROP TABLE IF EXISTS public.maintenance_requests CASCADE;
DROP TABLE IF EXISTS public.leave_requests       CASCADE;
DROP TABLE IF EXISTS public.duty_records         CASCADE;
DROP TABLE IF EXISTS public.documents            CASCADE;
DROP TABLE IF EXISTS public.document_categories  CASCADE;
DROP TABLE IF EXISTS public.departments          CASCADE;


-- =============================================
-- 1. DEPARTMENTS TABLE - 5 ฝ่ายงาน
-- =============================================
CREATE TABLE public.departments (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT    NOT NULL,
  code           TEXT    NOT NULL UNIQUE,
  color          TEXT    DEFAULT 'blue',
  icon           TEXT    DEFAULT 'Folder',
  description    TEXT,
  order_position INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments readable"    ON public.departments FOR SELECT USING (true);
CREATE POLICY "Departments manageable"  ON public.departments FOR ALL    USING (true) WITH CHECK (true);

INSERT INTO public.departments (name, code, color, icon, description, order_position) VALUES
  ('ฝ่ายวิชาการ',              'academic',       'blue',   'BookOpen',      'งานวิชาการ หลักสูตร IEP IIP ITP งานประกันคุณภาพ', 1),
  ('ฝ่ายบริหารทั่วไป',         'general',        'green',  'Building2',     'งานอาคารสถานที่ แจ้งซ่อม บันทึกเวร รักษาความปลอดภัย', 2),
  ('ฝ่ายงบประมาณ',             'budget',         'yellow', 'DollarSign',    'งานการเงิน พัสดุ แผนงาน งบประมาณ', 3),
  ('ฝ่ายบริหารบุคคล',          'personnel',      'purple', 'Users',         'งานบุคลากร ใบลา PA ครู SAR', 4),
  ('ฝ่ายบริหารกิจการนักเรียน', 'student_affairs','orange', 'GraduationCap', 'งานกิจกรรมนักเรียน IEP นักเรียน ระเบียบวินัย', 5);

-- =============================================
-- 2. DOCUMENT CATEGORIES TABLE
-- =============================================
CREATE TABLE public.document_categories (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id  UUID    REFERENCES public.departments(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  code           TEXT    NOT NULL,
  description    TEXT,
  order_position INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DocCats readable"   ON public.document_categories FOR SELECT USING (true);
CREATE POLICY "DocCats manageable" ON public.document_categories FOR ALL    USING (true) WITH CHECK (true);

-- =============================================
-- 3. DOCUMENTS TABLE
-- =============================================
CREATE TABLE public.documents (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT    NOT NULL,
  department_id  UUID    REFERENCES public.departments(id) ON DELETE SET NULL,
  category_id    UUID    REFERENCES public.document_categories(id) ON DELETE SET NULL,
  academic_year  TEXT    DEFAULT '2568',
  semester       TEXT    DEFAULT '1',
  document_type  TEXT    DEFAULT 'general',
  status         TEXT    NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','submitted','approved','rejected','archived')),
  file_url       TEXT,
  file_name      TEXT,
  file_type      TEXT,
  file_size      INTEGER,
  uploader_name  TEXT,
  uploader_id    TEXT,
  description    TEXT,
  notes          TEXT,
  tags           TEXT[],
  is_public      BOOLEAN DEFAULT false,
  view_count     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documents readable"   ON public.documents FOR SELECT USING (true);
CREATE POLICY "Documents manageable" ON public.documents FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_documents_department  ON public.documents(department_id);
CREATE INDEX idx_documents_category    ON public.documents(category_id);
CREATE INDEX idx_documents_status      ON public.documents(status);
CREATE INDEX idx_documents_year        ON public.documents(academic_year);

-- =============================================
-- 4. DUTY RECORDS TABLE - บันทึกเวร
-- =============================================
CREATE TABLE public.duty_records (
  id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duty_date        DATE    NOT NULL,
  duty_shift       TEXT    NOT NULL DEFAULT 'morning'
                           CHECK (duty_shift IN ('morning','afternoon','evening','overnight')),
  duty_shift_label TEXT,
  recorder_name    TEXT    NOT NULL,
  recorder_position TEXT,
  start_time       TIME,
  end_time         TIME,
  students_present INTEGER DEFAULT 0,
  students_absent  INTEGER DEFAULT 0,
  incidents        TEXT,
  actions_taken    TEXT,
  remarks          TEXT,
  status           TEXT    DEFAULT 'recorded'
                           CHECK (status IN ('recorded','verified','approved')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.duty_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Duty readable"   ON public.duty_records FOR SELECT USING (true);
CREATE POLICY "Duty manageable" ON public.duty_records FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_duty_date ON public.duty_records(duty_date DESC);

-- =============================================
-- 5. LEAVE REQUESTS TABLE - ใบลา
-- =============================================
CREATE TABLE public.leave_requests (
  id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name       TEXT NOT NULL,
  requester_position   TEXT,
  department_id        UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  leave_type           TEXT NOT NULL
                            CHECK (leave_type IN ('sick','personal','vacation','maternity','ordination','other')),
  leave_type_label     TEXT,
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  total_days           INTEGER,
  reason               TEXT NOT NULL,
  contact_during_leave TEXT,
  substitute_name      TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by          TEXT,
  approved_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  document_url         TEXT,
  academic_year        TEXT DEFAULT '2568',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leave readable"   ON public.leave_requests FOR SELECT USING (true);
CREATE POLICY "Leave manageable" ON public.leave_requests FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_leave_status ON public.leave_requests(status);
CREATE INDEX idx_leave_dates  ON public.leave_requests(start_date, end_date);

-- =============================================
-- 6. MAINTENANCE REQUESTS TABLE - แจ้งซ่อม
-- =============================================
CREATE TABLE public.maintenance_requests (
  id               UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT          NOT NULL,
  location         TEXT,
  room_number      TEXT,
  description      TEXT          NOT NULL,
  priority         TEXT          NOT NULL DEFAULT 'normal'
                                 CHECK (priority IN ('low','normal','high','urgent')),
  status           TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','acknowledged','in_progress','completed','cancelled')),
  reported_by      TEXT          NOT NULL,
  reporter_phone   TEXT,
  assigned_to      TEXT,
  estimated_cost   DECIMAL(10,2),
  actual_cost      DECIMAL(10,2),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  image_url        TEXT,
  completion_notes TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintenance readable"   ON public.maintenance_requests FOR SELECT USING (true);
CREATE POLICY "Maintenance manageable" ON public.maintenance_requests FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_maint_priority ON public.maintenance_requests(priority);
CREATE INDEX idx_maint_status   ON public.maintenance_requests(status);

-- =============================================
-- 7. AUDIT TEACHER SYSTEM
-- =============================================

-- ผู้ถูกประเมิน
CREATE TABLE public.audit_evaluatees (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT    NOT NULL,
  position       TEXT    NOT NULL,
  position_type  TEXT    DEFAULT 'assistant'
                         CHECK (position_type IN ('assistant','permanent_employee','temp_employee','other')),
  department_id  UUID    REFERENCES public.departments(id) ON DELETE SET NULL,
  -- เชื่อมกับ app_users เพื่อดึงเอกสารที่บุคคลนั้นอัปโหลดมาแสดงให้กรรมการดู
  user_id        UUID    DEFAULT NULL,  -- FK to app_users.id (soft link)
  academic_year  TEXT    DEFAULT '2568',
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


ALTER TABLE public.audit_evaluatees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evaluatees readable"   ON public.audit_evaluatees FOR SELECT USING (true);
CREATE POLICY "Evaluatees manageable" ON public.audit_evaluatees FOR ALL    USING (true) WITH CHECK (true);

-- กรรมการประเมิน (น้ำหนักปรับได้)
CREATE TABLE public.audit_committees (
  id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT         NOT NULL,
  role           TEXT         NOT NULL
                              CHECK (role IN ('director','deputy_director','dept_head','other')),
  role_label     TEXT,
  weight_percent DECIMAL(8,4) NOT NULL DEFAULT 0,
  academic_year  TEXT         DEFAULT '2568',
  order_position INTEGER      DEFAULT 0,
  is_active      BOOLEAN      DEFAULT true,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_committees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Committees readable"   ON public.audit_committees FOR SELECT USING (true);
CREATE POLICY "Committees manageable" ON public.audit_committees FOR ALL    USING (true) WITH CHECK (true);

-- ผลการประเมินรายบุคคล (10 หัวข้อ 3 องค์ประกอบ)
CREATE TABLE public.audit_evaluations (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluatee_id   UUID    NOT NULL REFERENCES public.audit_evaluatees(id) ON DELETE CASCADE,
  committee_id   UUID    NOT NULL REFERENCES public.audit_committees(id) ON DELETE CASCADE,
  academic_year  TEXT    NOT NULL DEFAULT '2568',
  -- องค์ที่ 1: ความรู้
  score_1_1      DECIMAL(5,2) DEFAULT 0 CHECK (score_1_1 BETWEEN 0 AND 100),
  score_1_2      DECIMAL(5,2) DEFAULT 0 CHECK (score_1_2 BETWEEN 0 AND 100),
  -- องค์ที่ 2: ความสามารถ
  score_2_1      DECIMAL(5,2) DEFAULT 0 CHECK (score_2_1 BETWEEN 0 AND 100),
  score_2_2      DECIMAL(5,2) DEFAULT 0 CHECK (score_2_2 BETWEEN 0 AND 100),
  -- องค์ที่ 3: ความประพฤติ (8 หัวข้อ)
  score_3_1      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_1 BETWEEN 0 AND 100),
  score_3_2      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_2 BETWEEN 0 AND 100),
  score_3_3      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_3 BETWEEN 0 AND 100),
  score_3_4      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_4 BETWEEN 0 AND 100),
  score_3_5      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_5 BETWEEN 0 AND 100),
  score_3_6      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_6 BETWEEN 0 AND 100),
  score_3_7      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_7 BETWEEN 0 AND 100),
  score_3_8      DECIMAL(5,2) DEFAULT 0 CHECK (score_3_8 BETWEEN 0 AND 100),
  remarks        TEXT,
  is_submitted   BOOLEAN     DEFAULT false,
  submitted_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluatee_id, committee_id, academic_year)
);

ALTER TABLE public.audit_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evaluations readable"   ON public.audit_evaluations FOR SELECT USING (true);
CREATE POLICY "Evaluations manageable" ON public.audit_evaluations FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX idx_audit_eval_evaluatee ON public.audit_evaluations(evaluatee_id);
CREATE INDEX idx_audit_eval_year      ON public.audit_evaluations(academic_year);

-- =============================================
-- 8. TRIGGERS สำหรับ updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dept_updated_at      BEFORE UPDATE ON public.departments          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_docs_updated_at      BEFORE UPDATE ON public.documents            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_duty_updated_at      BEFORE UPDATE ON public.duty_records         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_leave_updated_at     BEFORE UPDATE ON public.leave_requests       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_maint_updated_at     BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_committee_updated_at BEFORE UPDATE ON public.audit_committees     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_evalua_updated_at    BEFORE UPDATE ON public.audit_evaluations    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. ข้อมูลเริ่มต้น: กรรมการประเมิน 8 คน
-- =============================================
INSERT INTO public.audit_committees (name, role, role_label, weight_percent, academic_year, order_position) VALUES
  ('ผู้อำนวยการโรงเรียน',         'director',        'ผอ.',        50.0000, '2568', 1),
  ('รองผู้อำนวยการฝ่ายวิชาการ',   'deputy_director', 'รองผอ.',     12.5000, '2568', 2),
  ('รองผู้อำนวยการฝ่ายบริหาร',    'deputy_director', 'รองผอ.',     12.5000, '2568', 3),
  ('หัวหน้าฝ่ายวิชาการ',          'dept_head',       'หัวหน้าฝ่าย', 6.2500, '2568', 4),
  ('หัวหน้าฝ่ายบริหารทั่วไป',     'dept_head',       'หัวหน้าฝ่าย', 6.2500, '2568', 5),
  ('หัวหน้าฝ่ายงบประมาณ',         'dept_head',       'หัวหน้าฝ่าย', 6.2500, '2568', 6),
  ('หัวหน้าฝ่ายบริหารบุคคล',      'dept_head',       'หัวหน้าฝ่าย', 3.1250, '2568', 7),
  ('หัวหน้าฝ่ายกิจการนักเรียน',   'dept_head',       'หัวหน้าฝ่าย', 3.1250, '2568', 8);

-- =============================================
-- 10. ข้อมูลเริ่มต้น: หมวดหมู่เอกสาร 18 หมวด
-- =============================================
INSERT INTO public.document_categories (department_id, name, code, description, order_position)
SELECT d.id, c.name, c.code, c.desc, c.pos
FROM public.departments d
JOIN (VALUES
  -- ฝ่ายวิชาการ
  ('academic', 'งานประกันคุณภาพ (QA)', 'qa',           'เอกสารงานประกันคุณภาพการศึกษา',     1),
  ('academic', 'แผน IEP',              'iep',          'แผนการจัดการศึกษาเฉพาะบุคคล',       2),
  ('academic', 'แผน IIP',              'iip',          'แผนการสอนรายบุคคล',                 3),
  ('academic', 'แผน ITP',              'itp',          'แผนการฝึกทักษะเฉพาะบุคคล',          4),
  ('academic', 'หลักสูตร',             'curriculum',   'เอกสารหลักสูตรการศึกษา',            5),
  -- ฝ่ายบริหารทั่วไป
  ('general',  'บันทึกเวรประจำวัน',    'duty_doc',     'รายงานเวรและบันทึกเหตุการณ์',       1),
  ('general',  'แจ้งซ่อมบำรุง',        'maint_doc',    'เอกสารแจ้งซ่อมอาคารและครุภัณฑ์',   2),
  ('general',  'งานอาคารสถานที่',       'facility',     'เอกสารงานอาคารสถานที่',             3),
  -- ฝ่ายงบประมาณ
  ('budget',   'แผนงบประมาณ',          'budget_plan',  'แผนการใช้งบประมาณประจำปี',          1),
  ('budget',   'รายงานการเงิน',        'finance_rpt',  'รายงานการเงินและบัญชี',             2),
  ('budget',   'งานพัสดุ',             'procurement',  'เอกสารจัดซื้อจัดจ้าง',              3),
  -- ฝ่ายบริหารบุคคล
  ('personnel','ใบลา',                  'leave_doc',    'ใบลาประเภทต่างๆ',                   1),
  ('personnel','PA ครู',                'pa',           'ข้อตกลงการพัฒนางาน (PA)',            2),
  ('personnel','SAR ครู',               'sar',          'รายงานการประเมินตนเอง (SAR)',        3),
  ('personnel','ประวัติบุคลากร',        'hr',           'เอกสารประวัติและทะเบียนบุคลากร',   4),
  -- ฝ่ายกิจการนักเรียน
  ('student_affairs','กิจกรรมนักเรียน','activity',      'เอกสารกิจกรรมและโครงการนักเรียน',  1),
  ('student_affairs','ระเบียบวินัย',    'discipline',   'บันทึกระเบียบวินัยนักเรียน',        2),
  ('student_affairs','IEP นักเรียน',   'student_iep',  'แผน IEP รายบุคคลของนักเรียน',       3)
) AS c(dept_code, name, code, desc, pos) ON d.code = c.dept_code;

-- =============================================
-- 11. APP_USERS TABLE — ระบบผู้ใช้งาน
-- รองรับหลายบทบาท: admin, director, deputy_director,
--   dept_head, teacher, support_staff, temp_employee, assistant
-- password_hash = SHA-256 hex ของ plaintext password
-- =============================================
CREATE TABLE public.app_users (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username       TEXT    NOT NULL UNIQUE,
  full_name      TEXT    NOT NULL,
  email          TEXT,
  password_hash  TEXT    NOT NULL,
  role           TEXT    NOT NULL DEFAULT 'teacher'
                         CHECK (role IN (
                           'admin','director','deputy_director','dept_head',
                           'teacher','support_staff','temp_employee','assistant'
                         )),
  staff_id       UUID    DEFAULT NULL,  -- FK to staff table (from SUPABASE_SETUP.sql)
  is_active      BOOLEAN DEFAULT true,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_users IS 'ตารางผู้ใช้งานระบบ SodFlow รองรับบุคลากรทุกประเภท';
COMMENT ON COLUMN public.app_users.password_hash IS 'SHA-256 hash ของรหัสผ่าน คำนวณโดย Web Crypto API';

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users: admin sees all"
  ON public.app_users FOR SELECT
  USING (true);
CREATE POLICY "Users: manageable"
  ON public.app_users FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_app_users_username ON public.app_users(username);
CREATE INDEX idx_app_users_role     ON public.app_users(role);

CREATE TRIGGER trg_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 12. ข้อมูลเริ่มต้น: บัญชีผู้ใช้
-- hash คำนวณจาก browser Web Crypto API (SHA-256 hex 64 chars)
-- admin123   → 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- teacher123 → cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416
-- assist123  → 2b24c026bf2dc89e367bee649a3d1f2522a972b76bc9731e4365279134121cc8
-- =============================================
INSERT INTO public.app_users (username, full_name, email, password_hash, role) VALUES
  ('admin',
   'ผู้ดูแลระบบ',
   'admin@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'admin'),
  ('director',
   'ผู้อำนวยการโรงเรียน',
   'director@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'director'),
  ('teacher01',
   'นางสาวทดสอบ ครูผู้สอน',
   'teacher01@school.ac.th',
   'cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416',
   'teacher'),
  ('assistant01',
   'นายทดสอบ ครูพี่เลี้ยง',
   'assistant01@school.ac.th',
   '2b24c026bf2dc89e367bee649a3d1f2522a972b76bc9731e4365279134121cc8',
   'assistant'),
  ('temp01',
   'นางทดสอบ ครูอัตราจ้าง',
   'temp01@school.ac.th',
   '2b24c026bf2dc89e367bee649a3d1f2522a972b76bc9731e4365279134121cc8',
   'temp_employee');


-- =============================================
-- 13. STORAGE BUCKET POLICY (school-images)
-- รันส่วนนี้บน Supabase SQL Editor หลังสร้าง bucket แล้ว
-- bucket "school-images" ต้องสร้างที่ Dashboard → Storage → New bucket
-- =============================================

-- Allow public read from school-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-images',
  'school-images',
  true,
  20971520,  -- 20 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520;

-- Storage RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'school-images: public read'
  ) THEN
    CREATE POLICY "school-images: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'school-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'school-images: anyone upload'
  ) THEN
    CREATE POLICY "school-images: anyone upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'school-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'school-images: anyone delete'
  ) THEN
    CREATE POLICY "school-images: anyone delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'school-images');
  END IF;
END $$;

-- =============================================
-- END OF SODFLOW SETUP v1.3 ✅
-- บัญชีทดสอบ:
--   admin / admin123   → ผู้ดูแลระบบ
--   director / admin123 → ผู้อำนวยการ
--   teacher01 / teacher123 → ครูผู้สอน
--   assistant01 / assist123 → ครูพี่เลี้ยง
--   temp01 / assist123 → ครูอัตราจ้าง
-- =============================================
