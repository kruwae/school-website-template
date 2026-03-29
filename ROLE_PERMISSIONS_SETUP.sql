-- =============================================
-- SODFLOW — ROLE PERMISSIONS & WORKFLOW SETUP
-- Version: 1.0
-- รันหลัง SODFLOW_SETUP.sql
-- =============================================

-- =============================================
-- STEP 1: เพิ่มคอลัมน์ใน app_users
--   position     = ชื่อตำแหน่ง เช่น "ครูผู้สอน", "หัวหน้าฝ่ายวิชาการ"
--   department_id = อ้างอิงฝ่ายงานหลักของ user
-- =============================================
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS position      TEXT,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- =============================================
-- STEP 2: ตาราง work_groups — กลุ่มงาน
--   หัวหน้างาน 1 คน อาจเป็นหัวหน้าหลายกลุ่มงาน
-- =============================================
CREATE TABLE IF NOT EXISTS public.work_groups (
  id             UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT    NOT NULL,
  code           TEXT    NOT NULL UNIQUE,
  department_id  UUID    REFERENCES public.departments(id) ON DELETE CASCADE,
  supervisor_id  UUID    REFERENCES public.app_users(id) ON DELETE SET NULL, -- หัวหน้างาน
  description    TEXT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WorkGroups readable"   ON public.work_groups;
DROP POLICY IF EXISTS "WorkGroups manageable" ON public.work_groups;
CREATE POLICY "WorkGroups readable"   ON public.work_groups FOR SELECT USING (true);
CREATE POLICY "WorkGroups manageable" ON public.work_groups FOR ALL    USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_workgroups_updated_at ON public.work_groups;
CREATE TRIGGER trg_workgroups_updated_at
  BEFORE UPDATE ON public.work_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STEP 3: ตาราง work_group_members — สมาชิกกลุ่มงาน (many-to-many)
--   user 1 คน อาจอยู่หลายกลุ่มงาน
--   หัวหน้างาน 1 คน อาจดูแลหลายกลุ่มงาน
-- =============================================
CREATE TABLE IF NOT EXISTS public.work_group_members (
  id            UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_group_id UUID    NOT NULL REFERENCES public.work_groups(id) ON DELETE CASCADE,
  user_id       UUID    NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role_in_group TEXT    DEFAULT 'member'
                        CHECK (role_in_group IN ('supervisor','project_head','member')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(work_group_id, user_id)
);

ALTER TABLE public.work_group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WorkGroupMembers readable"   ON public.work_group_members;
DROP POLICY IF EXISTS "WorkGroupMembers manageable" ON public.work_group_members;
CREATE POLICY "WorkGroupMembers readable"   ON public.work_group_members FOR SELECT USING (true);
CREATE POLICY "WorkGroupMembers manageable" ON public.work_group_members FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wgm_group  ON public.work_group_members(work_group_id);
CREATE INDEX IF NOT EXISTS idx_wgm_user   ON public.work_group_members(user_id);

-- =============================================
-- STEP 4: ตาราง user_menu_permissions
--   เก็บการ override เมนูรายคน (admin จัดการ)
--   ถ้าไม่มี row → ใช้ default ของ role
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_menu_permissions (
  id          UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  menu_id     TEXT    NOT NULL,  -- 'dashboard','news','dept-academic',etc.
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  updated_by  UUID    REFERENCES public.app_users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, menu_id)
);

ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MenuPerms readable"   ON public.user_menu_permissions;
DROP POLICY IF EXISTS "MenuPerms manageable" ON public.user_menu_permissions;
CREATE POLICY "MenuPerms readable"   ON public.user_menu_permissions FOR SELECT USING (true);
CREATE POLICY "MenuPerms manageable" ON public.user_menu_permissions FOR ALL    USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_menu_perms_user ON public.user_menu_permissions(user_id);

-- =============================================
-- STEP 5: อัปเดต leave_requests status
--   เพิ่ม supervisor_approved, dept_head_approved สำหรับ workflow 5 ระดับ
--   requester_user_id → เชื่อมกับ app_users
-- =============================================
ALTER TABLE public.leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_status_check;

ALTER TABLE public.leave_requests
  ADD CONSTRAINT leave_requests_status_check
    CHECK (status IN (
      'pending',
      'supervisor_approved',
      'dept_head_approved',
      'approved',
      'rejected',
      'cancelled'
    ));

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS requester_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by_id    UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_step      INTEGER DEFAULT 0; -- 0=pending,1=supervisor,2=dept_head,3=director

-- =============================================
-- STEP 6: อัปเดต maintenance_requests
--   เพิ่ม reporter_user_id → เชื่อมกับ app_users
--   เพิ่ม step ในการอนุมัติ
-- =============================================
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS reporter_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_step     INTEGER DEFAULT 0;

-- =============================================
-- STEP 7: อัปเดต duty_records
--   เพิ่ม recorder_user_id
-- =============================================
ALTER TABLE public.duty_records
  ADD COLUMN IF NOT EXISTS recorder_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- =============================================
-- STEP 8: อัปเดต documents
--   เพิ่ม uploader_user_id → เชื่อมกับ app_users
-- =============================================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploader_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- =============================================
-- STEP 9: เพิ่ม INDEX ใหม่
-- =============================================
CREATE INDEX IF NOT EXISTS idx_app_users_department ON public.app_users(department_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_dept     ON public.work_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_supervisor ON public.work_groups(supervisor_id);

-- =============================================
-- STEP 10: อัปเดต app_users ที่มีอยู่ — เพิ่ม position
-- =============================================
UPDATE public.app_users SET position = 'ผู้ดูแลระบบ'       WHERE username = 'admin';
UPDATE public.app_users SET position = 'ผู้อำนวยการโรงเรียน' WHERE username = 'director';
UPDATE public.app_users SET position = 'ครูผู้สอน'           WHERE username = 'teacher01';
UPDATE public.app_users SET position = 'ครูพี่เลี้ยง'          WHERE username = 'assistant01';
UPDATE public.app_users SET position = 'ครูอัตราจ้าง'         WHERE username = 'temp01';

-- =============================================
-- STEP 11: เพิ่ม users ระดับหัวหน้า
-- รหัสผ่านทั้งหมด = "school2568"
-- SHA-256("school2568") = 8f14e45fceea167a5a36dedd4bea2543f43ac671e944d8e7ae96e6c8d76a2e22
-- รหัสผ่านเดิม = "admin123"
-- SHA-256("admin123") = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- =============================================

-- รองผู้อำนวยการ
INSERT INTO public.app_users (username, full_name, email, password_hash, role, position)
VALUES
  ('deputy01', 'นางสาวประภา สุขสวัสดิ์', 'deputy01@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'deputy_director', 'รองผู้อำนวยการฝ่ายวิชาการ'),
  ('deputy02', 'นายวิชัย บุญมี', 'deputy02@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'deputy_director', 'รองผู้อำนวยการฝ่ายบริหาร')
ON CONFLICT (username) DO UPDATE SET
  position = EXCLUDED.position,
  role = EXCLUDED.role;

-- หัวหน้าฝ่าย (dept_head)
INSERT INTO public.app_users (username, full_name, email, password_hash, role, position)
VALUES
  ('head_academic',  'นายสมชาย ใจดี',       'head_academic@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'dept_head', 'หัวหน้าฝ่ายวิชาการ'),
  ('head_general',   'นางสาวปราณี รักงาน',   'head_general@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'dept_head', 'หัวหน้าฝ่ายบริหารทั่วไป'),
  ('head_budget',    'นางวันดี ใจดี',         'head_budget@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'dept_head', 'หัวหน้าฝ่ายงบประมาณ'),
  ('head_personnel', 'นายสมศักดิ์ วิทยา',    'head_personnel@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'dept_head', 'หัวหน้าฝ่ายบริหารบุคคล'),
  ('head_student',   'นางภาวินี สุขสม',       'head_student@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'dept_head', 'หัวหน้าฝ่ายกิจการนักเรียน')
ON CONFLICT (username) DO UPDATE SET
  position = EXCLUDED.position,
  role = EXCLUDED.role;

-- ครูเพิ่มเติม (สำหรับทดสอบ workflow)
INSERT INTO public.app_users (username, full_name, email, password_hash, role, position)
VALUES
  ('teacher02', 'นางสาวสุภา รักเรียน', 'teacher02@school.ac.th',
   'cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416',
   'teacher', 'ครูผู้สอนคณิตศาสตร์'),
  ('teacher03', 'นายวิทยา ฉลาดคิด', 'teacher03@school.ac.th',
   'cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416',
   'teacher', 'ครูผู้สอนวิทยาศาสตร์'),
  ('technician01', 'นายช่างสมหมาย ซ่อมดี', 'technician01@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'support_staff', 'ช่างซ่อมอาคารสถานที่'),
  ('technician02', 'นายช่างประยุทธ์ แก้ไว', 'technician02@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'support_staff', 'ช่างไฟฟ้า'),
  ('technician03', 'นายช่างอนันต์ ดูแลดี', 'technician03@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'support_staff', 'ช่างประปา')
ON CONFLICT (username) DO UPDATE SET
  position = EXCLUDED.position,
  role = EXCLUDED.role;

-- =============================================
-- STEP 12: เชื่อม department_id กับ users
-- =============================================
UPDATE public.app_users u
SET department_id = d.id
FROM public.departments d
WHERE d.code = 'academic'
  AND u.username IN ('head_academic', 'teacher01', 'teacher02', 'teacher03');

UPDATE public.app_users u
SET department_id = d.id
FROM public.departments d
WHERE d.code = 'general'
  AND u.username IN ('head_general', 'technician01', 'technician02', 'technician03');

UPDATE public.app_users u
SET department_id = d.id
FROM public.departments d
WHERE d.code = 'budget'
  AND u.username IN ('head_budget');

UPDATE public.app_users u
SET department_id = d.id
FROM public.departments d
WHERE d.code = 'personnel'
  AND u.username IN ('head_personnel');

UPDATE public.app_users u
SET department_id = d.id
FROM public.departments d
WHERE d.code = 'student_affairs'
  AND u.username IN ('head_student');

-- =============================================
-- STEP 13: สร้างกลุ่มงานตัวอย่าง
-- =============================================
INSERT INTO public.work_groups (name, code, department_id, description)
SELECT
  g.name, g.code, d.id, g.desc
FROM public.departments d
JOIN (VALUES
  ('academic', 'งานประกันคุณภาพ', 'wg_qa', 'งานประกันคุณภาพการศึกษา QA'),
  ('academic', 'งานหลักสูตรและ IEP', 'wg_iep', 'งานหลักสูตร IEP IIP ITP'),
  ('general', 'งานอาคารสถานที่', 'wg_facility', 'งานอาคาร แจ้งซ่อม บันทึกเวร'),
  ('budget', 'งานการเงินและพัสดุ', 'wg_finance', 'งานการเงิน พัสดุ จัดซื้อ'),
  ('personnel', 'งานบุคลากร', 'wg_hr', 'งานทะเบียนบุคลากร ใบลา PA')
) AS g(dept_code, name, code, desc) ON d.code = g.dept_code
ON CONFLICT (code) DO NOTHING;

-- เชื่อม supervisor กับ work_group
UPDATE public.work_groups wg
SET supervisor_id = u.id
FROM public.app_users u
WHERE u.username = 'head_academic' AND wg.code IN ('wg_qa', 'wg_iep');

UPDATE public.work_groups wg
SET supervisor_id = u.id
FROM public.app_users u
WHERE u.username = 'head_general' AND wg.code = 'wg_facility';

UPDATE public.work_groups wg
SET supervisor_id = u.id
FROM public.app_users u
WHERE u.username = 'head_budget' AND wg.code = 'wg_finance';

UPDATE public.work_groups wg
SET supervisor_id = u.id
FROM public.app_users u
WHERE u.username = 'head_personnel' AND wg.code = 'wg_hr';

-- =============================================
-- STEP 14: เพิ่มสมาชิกในกลุ่มงาน
-- =============================================
-- QA group: head_academic (supervisor), teacher01
INSERT INTO public.work_group_members (work_group_id, user_id, role_in_group)
SELECT wg.id, u.id,
  CASE WHEN u.username = 'head_academic' THEN 'supervisor' ELSE 'member' END
FROM public.work_groups wg, public.app_users u
WHERE wg.code = 'wg_qa'
  AND u.username IN ('head_academic','teacher01','teacher02')
ON CONFLICT (work_group_id, user_id) DO NOTHING;

-- IEP group: head_academic (supervisor), teacher02, teacher03
INSERT INTO public.work_group_members (work_group_id, user_id, role_in_group)
SELECT wg.id, u.id,
  CASE WHEN u.username = 'head_academic' THEN 'supervisor' ELSE 'member' END
FROM public.work_groups wg, public.app_users u
WHERE wg.code = 'wg_iep'
  AND u.username IN ('head_academic','teacher02','teacher03')
ON CONFLICT (work_group_id, user_id) DO NOTHING;

-- Facility group: head_general, technicians
INSERT INTO public.work_group_members (work_group_id, user_id, role_in_group)
SELECT wg.id, u.id,
  CASE WHEN u.username = 'head_general' THEN 'supervisor' ELSE 'member' END
FROM public.work_groups wg, public.app_users u
WHERE wg.code = 'wg_facility'
  AND u.username IN ('head_general','technician01','technician02','technician03')
ON CONFLICT (work_group_id, user_id) DO NOTHING;

-- HR group: head_personnel, assistant01, temp01
INSERT INTO public.work_group_members (work_group_id, user_id, role_in_group)
SELECT wg.id, u.id,
  CASE WHEN u.username = 'head_personnel' THEN 'supervisor' ELSE 'member' END
FROM public.work_groups wg, public.app_users u
WHERE wg.code = 'wg_hr'
  AND u.username IN ('head_personnel','assistant01','temp01')
ON CONFLICT (work_group_id, user_id) DO NOTHING;

-- =============================================
-- END OF ROLE_PERMISSIONS_SETUP.sql ✅
--
-- บัญชีทดสอบใหม่ (password: admin123):
--   deputy01 / admin123    → รองผอ.ฝ่ายวิชาการ
--   deputy02 / admin123    → รองผอ.ฝ่ายบริหาร
--   head_academic / admin123 → หัวหน้าฝ่ายวิชาการ
--   head_general / admin123  → หัวหน้าฝ่ายบริหารทั่วไป
--   head_budget / admin123   → หัวหน้าฝ่ายงบประมาณ
--   head_personnel / admin123 → หัวหน้าฝ่ายบริหารบุคคล
--   head_student / admin123  → หัวหน้าฝ่ายกิจการนักเรียน
--   teacher02 / teacher123   → ครูผู้สอนคณิตศาสตร์
--   teacher03 / teacher123   → ครูผู้สอนวิทยาศาสตร์
--   technician01 / admin123  → ช่างซ่อมอาคารสถานที่
--   technician02 / admin123  → ช่างไฟฟ้า
--   technician03 / admin123  → ช่างประปา
-- =============================================
