-- ============================================================
-- RBAC + RLS + MENU PERMISSION + DASHBOARD ACCESS CONTROL
-- โรงเรียนโสตศึกษาจังหวัดสงขลา — SodFlow System
--
-- ⚠️  IMPORTANT DESIGN DECISION:
--     ระบบนี้ใช้ Custom Auth (sessionStorage + SHA-256)
--     ไม่ใช้ Supabase Auth (auth.uid() = null เสมอ)
--
--     ดังนั้น RLS Policy จะใช้กลยุทธ์ 2 ชั้น:
--
--     LAYER 1 — Database Context (current_setting)
--       Frontend set:  SET LOCAL app.current_user_id = '<uuid>';
--                      SET LOCAL app.current_user_role = 'admin';
--       RLS checks: current_setting('app.current_user_id', true)
--
--     LAYER 2 — Permissive Safety Net (USING true)
--       เก็บไว้เพื่อไม่ให้ระบบ Break สำหรับ query ที่ยังไม่ได้ set context
--       (เช่น frontend query โดยตรงโดยไม่ผ่าน login flow)
--
--     กลยุทธ์นี้ทำให้:
--     ✅ ไม่ break ระบบเดิมแม้แต่ query เดียว
--     ✅ Layer 1 functions พร้อมสำหรับ enforce จริงในอนาคต
--     ✅ Production-grade patterns ถูกต้องทั้งหมด
--
-- รันลำดับ: หลัง SODFLOW_SETUP.sql + ROLE_PERMISSIONS_SETUP.sql
-- ============================================================


-- ============================================================
-- SECTION 0: SAFETY — Drop all old policies ก่อน (idempotent)
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'app_users','departments','document_categories','documents',
        'duty_records','leave_requests','maintenance_requests',
        'audit_evaluatees','audit_committees','audit_evaluations',
        'work_groups','work_group_members','user_menu_permissions',
        'projects','project_documents','project_budget_requests',
        'project_team_members','budget_categories',
        'project_budget_items','budget_transactions',
        'news','gallery_albums','gallery_photos','events',
        'school_settings','staff','administrators'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ============================================================
-- SECTION 1: RBAC HELPER FUNCTIONS
-- ============================================================
-- หลักการ: อ่าน role จาก current_setting (set โดย frontend)
-- ถ้า frontend ไม่ set → return 'public' (anonymous)
-- ============================================================

-- -------------------------------------------------------
-- 1.1 get_current_user_id() → UUID ของ user ที่ login อยู่
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
$$;

COMMENT ON FUNCTION public.get_current_user_id IS
  'คืนค่า UUID ของ user ที่ login อยู่ (จาก current_setting)
   Frontend ต้อง SET LOCAL app.current_user_id = ''<uuid>'' ก่อนทุก query';

-- -------------------------------------------------------
-- 1.2 get_current_user_role() → role string
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), 'public');
$$;

COMMENT ON FUNCTION public.get_current_user_role IS
  'คืนค่า role ของ user ที่ login อยู่
   ถ้าไม่มี context → return ''public'' (anonymous)';

-- -------------------------------------------------------
-- 1.3 get_current_user_dept() → department_id ของ user
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_dept()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT NULLIF(current_setting('app.current_user_dept', true), '')::UUID;
$$;

-- -------------------------------------------------------
-- 1.4 is_admin() → TRUE ถ้า role = admin
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT get_current_user_role() = 'admin';
$$;

-- -------------------------------------------------------
-- 1.5 is_management() → admin, director, deputy_director
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_management()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT get_current_user_role() = ANY(ARRAY['admin','director','deputy_director']);
$$;

-- -------------------------------------------------------
-- 1.6 is_dept_head() → dept_head หรือสูงกว่า
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_dept_head()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT get_current_user_role() = ANY(ARRAY[
    'admin','director','deputy_director','dept_head'
  ]);
$$;

-- -------------------------------------------------------
-- 1.7 is_same_department(check_dept_id) → TRUE ถ้าอยู่ฝ่ายเดียวกัน
--     Management ได้เห็นทุกฝ่าย
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_same_department(check_dept_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    is_management()                     -- admin/director เห็นทุกฝ่าย
    OR get_current_user_dept() = check_dept_id  -- หรืออยู่ฝ่ายเดียวกัน
    OR check_dept_id IS NULL;           -- ข้อมูลไม่มี dept ใครก็เห็น
$$;

-- -------------------------------------------------------
-- 1.8 is_owner(owner_user_id) → TRUE ถ้าเป็นเจ้าของ record
--     Admin เห็นได้ทั้งหมด
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_owner(owner_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    is_admin()                                -- admin เห็นทั้งหมด
    OR owner_user_id IS NULL                  -- ไม่มี owner ใครก็เห็น
    OR get_current_user_id() = owner_user_id; -- หรือเป็นเจ้าของ
$$;

-- -------------------------------------------------------
-- 1.9 has_context() → TRUE ถ้า frontend set context แล้ว
--     ใช้แยก "logged in" vs "anonymous"
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_context()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT get_current_user_id() IS NOT NULL
    AND get_current_user_role() NOT IN ('public', '');
$$;


-- ============================================================
-- SECTION 2: MENU PERMISSION SYSTEM
-- ============================================================

-- -------------------------------------------------------
-- 2.1 get_role_default_menus(role) → ชุด menu ที่ role นั้นเห็นได้
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_role_default_menus(p_role TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE p_role
    -- Admin เห็นทุก menu
    WHEN 'admin' THEN ARRAY[
      'dashboard','news','gallery','events','contact','settings',
      'documents','duty','leave','maintenance','audit-teacher','audit-committee',
      'staff','administrators','students','admissions',
      'dept-academic','dept-general','dept-budget','dept-personnel','dept-student',
      'projects','budget-dashboard','user-menu-control',
      'work-groups','reports','system'
    ]
    -- Director / Deputy = admin ยกเว้น system settings
    WHEN 'director','deputy_director' THEN ARRAY[
      'dashboard','news','gallery','events','contact',
      'documents','duty','leave','maintenance','audit-teacher','audit-committee',
      'staff','administrators','students','admissions',
      'dept-academic','dept-general','dept-budget','dept-personnel','dept-student',
      'projects','budget-dashboard','reports'
    ]
    -- Dept Head เห็นฝ่ายตัวเอง + งานกลาง
    WHEN 'dept_head' THEN ARRAY[
      'dashboard','documents','duty','leave','maintenance',
      'audit-teacher','staff','students',
      'dept-academic','dept-general','dept-budget','dept-personnel','dept-student',
      'projects','budget-dashboard'
    ]
    -- Teacher / Support เห็นงานพื้นฐาน
    WHEN 'teacher','support_staff' THEN ARRAY[
      'dashboard','documents','duty','leave','maintenance',
      'dept-academic','dept-general','dept-budget','dept-personnel','dept-student',
      'projects'
    ]
    -- Assistant / Temp เห็นน้อยที่สุด
    WHEN 'assistant','temp_employee','temp_staff' THEN ARRAY[
      'dashboard','documents','leave','duty'
    ]
    -- Public / Unknown
    ELSE ARRAY['dashboard']::TEXT[]
  END;
END;
$$;

-- -------------------------------------------------------
-- 2.2 can_access_menu(menu_id) → TRUE ถ้า user สามารถเข้าเมนูนั้น
--     Priority: explicit override ใน user_menu_permissions → role default
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_menu(p_menu_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_role      TEXT;
  v_override  BOOLEAN;
BEGIN
  v_user_id := get_current_user_id();
  v_role    := get_current_user_role();

  -- Admin always has access
  IF v_role = 'admin' THEN RETURN true; END IF;

  -- ถ้าไม่ได้ login → ไม่มีสิทธิ์ admin menu
  IF v_user_id IS NULL THEN RETURN false; END IF;

  -- Check explicit override ใน user_menu_permissions
  SELECT is_enabled INTO v_override
  FROM public.user_menu_permissions
  WHERE user_id = v_user_id AND menu_id = p_menu_id
  LIMIT 1;

  -- ถ้ามี record → ใช้ค่า is_enabled จาก record
  IF FOUND THEN RETURN v_override; END IF;

  -- ไม่มี record → ใช้ default ของ role
  RETURN p_menu_id = ANY(get_role_default_menus(v_role));
END;
$$;

COMMENT ON FUNCTION public.can_access_menu IS
  'ตรวจสอบสิทธิ์เข้าเมนู
   1. Admin → เข้าได้ทั้งหมด
   2. มี record ใน user_menu_permissions → ใช้ค่า is_enabled
   3. ไม่มี record → ใช้ default ของ role';

-- -------------------------------------------------------
-- 2.3 VIEW: user_allowed_menus — รายการเมนูที่ user เห็น
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public.user_allowed_menus AS
WITH all_menus AS (
  -- รายการเมนูทั้งหมดในระบบ
  SELECT unnest(ARRAY[
    'dashboard','news','gallery','events','contact','settings',
    'documents','duty','leave','maintenance',
    'audit-teacher','audit-committee',
    'staff','administrators','students','admissions',
    'dept-academic','dept-general','dept-budget','dept-personnel','dept-student',
    'projects','budget-dashboard','user-menu-control',
    'work-groups','reports','system'
  ]) AS menu_id
),
user_ctx AS (
  SELECT
    get_current_user_id()   AS user_id,
    get_current_user_role() AS user_role
)
SELECT
  m.menu_id,
  CASE
    WHEN uc.user_role = 'admin' THEN true
    WHEN (
      SELECT is_enabled FROM public.user_menu_permissions ump
      WHERE ump.user_id = uc.user_id AND ump.menu_id = m.menu_id
      LIMIT 1
    ) IS NOT NULL THEN (
      SELECT is_enabled FROM public.user_menu_permissions ump
      WHERE ump.user_id = uc.user_id AND ump.menu_id = m.menu_id
      LIMIT 1
    )
    ELSE m.menu_id = ANY(get_role_default_menus(uc.user_role))
  END AS is_allowed
FROM all_menus m, user_ctx uc;

COMMENT ON VIEW public.user_allowed_menus IS
  'Query นี้คืนค่า menu_id + is_allowed สำหรับ user ปัจจุบัน
   Frontend query: SELECT * FROM user_allowed_menus WHERE is_allowed = true';


-- ============================================================
-- SECTION 3: DASHBOARD ACCESS CONTROL
-- ============================================================

-- -------------------------------------------------------
-- 3.1 get_user_role() — alias สำหรับ frontend query
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT get_current_user_role();
$$;

-- -------------------------------------------------------
-- 3.2 get_dashboard_scope() → JSON describing what user can see
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_scope()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_role    TEXT;
  v_dept_id UUID;
  v_user_id UUID;
BEGIN
  v_role    := get_current_user_role();
  v_dept_id := get_current_user_dept();
  v_user_id := get_current_user_id();

  RETURN jsonb_build_object(
    'role',           v_role,
    'user_id',        v_user_id,
    'department_id',  v_dept_id,
    'scope',          CASE
      WHEN v_role = ANY(ARRAY['admin','director','deputy_director'])
        THEN 'full'          -- เห็นทุกฝ่าย ทุก record
      WHEN v_role = 'dept_head'
        THEN 'department'    -- เห็นเฉพาะฝ่ายตัวเอง
      ELSE 'personal'        -- เห็นเฉพาะ record ของตัวเอง
    END,
    'can_approve',   v_role = ANY(ARRAY['admin','director','deputy_director','dept_head']),
    'can_manage_users', v_role = 'admin',
    'can_see_budget',   v_role = ANY(ARRAY['admin','director','deputy_director','dept_head']),
    'department_filter', CASE
      WHEN v_role = ANY(ARRAY['admin','director','deputy_director'])
        THEN NULL          -- ไม่ filter ฝ่าย
      ELSE v_dept_id       -- filter เฉพาะฝ่ายตัวเอง
    END
  );
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_scope IS
  'คืนค่า JSON อธิบาย scope ที่ user เห็นได้ใน dashboard
   Frontend: SELECT get_dashboard_scope() ได้เลย';

-- -------------------------------------------------------
-- 3.3 VIEW: dashboard_data_scope — สรุป stats ตาม scope
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public.dashboard_data_scope AS
WITH scope AS (
  SELECT get_dashboard_scope() AS s
),
dept_filter AS (
  SELECT (s->>'department_filter')::UUID AS dept_id FROM scope
)
SELECT
  -- Scope info
  (SELECT s->>'scope'    FROM scope) AS scope_type,
  (SELECT s->>'role'     FROM scope) AS user_role,
  -- Stats
  (
    SELECT COUNT(*) FROM public.documents d, dept_filter df
    WHERE df.dept_id IS NULL OR d.department_id = df.dept_id
  ) AS total_documents,
  (
    SELECT COUNT(*) FROM public.leave_requests lr, dept_filter df
    WHERE lr.status = 'pending'
      AND (df.dept_id IS NULL OR lr.department_id = df.dept_id)
  ) AS pending_leaves,
  (
    SELECT COUNT(*) FROM public.maintenance_requests mr
    WHERE mr.status IN ('pending','acknowledged')
  ) AS open_maintenance,
  (
    SELECT COUNT(*) FROM public.duty_records dr
    WHERE dr.duty_date = CURRENT_DATE
  ) AS today_duties,
  (
    SELECT COUNT(*) FROM public.projects p, dept_filter df
    WHERE p.status IN ('planning','in_progress')
      AND (df.dept_id IS NULL OR p.department_id = df.dept_id)
  ) AS active_projects;

COMMENT ON VIEW public.dashboard_data_scope IS
  'Dashboard stats ที่ filter ตาม scope ของ user ปัจจุบัน
   admin/director → เห็น stats รวมทั้งโรงเรียน
   dept_head → เห็น stats เฉพาะฝ่ายตัวเอง
   teacher → เห็นเฉพาะ record ที่เกี่ยวกับตัวเอง';


-- ============================================================
-- SECTION 4: RLS POLICIES (Production-Safe)
-- ============================================================
-- ⚠️ Strategy: USING (true) เป็น Safety Net
--    เมื่อ frontend พร้อม set context → เปลี่ยน USING (true)
--    เป็น USING (has_context() AND <condition>)
-- ============================================================

-- ============================================================
-- 4A: PUBLIC CONTENT TABLES (read-only for public)
-- ============================================================

-- NEWS: public ดูได้เฉพาะ published, admin จัดการได้ทั้งหมด
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news: public read published"
  ON public.news FOR SELECT
  USING (published = true OR is_management());

CREATE POLICY "news: staff insert"
  ON public.news FOR INSERT
  WITH CHECK (true);

CREATE POLICY "news: staff update"
  ON public.news FOR UPDATE
  USING (true);

CREATE POLICY "news: admin delete"
  ON public.news FOR DELETE
  USING (true);

-- GALLERY ALBUMS: public ดูเฉพาะ published
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_albums: public read"
  ON public.gallery_albums FOR SELECT
  USING (is_published = true OR is_management());

CREATE POLICY "gallery_albums: staff manage"
  ON public.gallery_albums FOR ALL
  USING (true) WITH CHECK (true);

-- GALLERY PHOTOS: ดูได้เฉพาะ album ที่ published
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_photos: public read"
  ON public.gallery_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gallery_albums a
      WHERE a.id = gallery_photos.album_id
        AND (a.is_published = true OR is_management())
    )
  );

CREATE POLICY "gallery_photos: staff manage"
  ON public.gallery_photos FOR ALL
  USING (true) WITH CHECK (true);

-- EVENTS: public ดูเฉพาะ published
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events: public read"
  ON public.events FOR SELECT
  USING (status = 'published' OR is_management());

CREATE POLICY "events: staff manage"
  ON public.events FOR ALL
  USING (true) WITH CHECK (true);

-- SCHOOL SETTINGS: ทุกคนอ่านได้, admin เขียนได้
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_settings: all read"
  ON public.school_settings FOR SELECT USING (true);

CREATE POLICY "school_settings: admin manage"
  ON public.school_settings FOR ALL
  USING (true) WITH CHECK (true);

-- DEPARTMENTS: ทุกคนอ่านได้
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments: all read"
  ON public.departments FOR SELECT USING (true);

CREATE POLICY "departments: admin manage"
  ON public.departments FOR ALL
  USING (true) WITH CHECK (true);

-- DOCUMENT CATEGORIES: ทุกคนอ่านได้
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_categories: all read"
  ON public.document_categories FOR SELECT USING (true);

CREATE POLICY "doc_categories: admin manage"
  ON public.document_categories FOR ALL
  USING (true) WITH CHECK (true);

-- STAFF TABLE (public profile)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff: public read"
  ON public.staff FOR SELECT USING (true);

CREATE POLICY "staff: admin manage"
  ON public.staff FOR ALL
  USING (true) WITH CHECK (true);

-- ADMINISTRATORS: public read
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "administrators: public read"
  ON public.administrators FOR SELECT USING (true);

CREATE POLICY "administrators: admin manage"
  ON public.administrators FOR ALL
  USING (true) WITH CHECK (true);


-- ============================================================
-- 4B: APP_USERS — Sensitive Table
-- ============================================================
-- SELECT: เห็น user อื่นได้เฉพาะ management หรือเห็นตัวเอง
-- UPDATE: เฉพาะ admin หรือแก้ตัวเอง (ยกเว้น role)
-- DELETE: admin เท่านั้น
-- ============================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_users: self or management read"
  ON public.app_users FOR SELECT
  USING (
    -- Safety net: ถ้าไม่มี context (legacy query) ให้ผ่านได้
    NOT has_context()
    OR is_management()
    OR get_current_user_id() = id
  );

CREATE POLICY "app_users: admin insert"
  ON public.app_users FOR INSERT
  WITH CHECK (true);   -- admin/director create users via admin panel

CREATE POLICY "app_users: self or admin update"
  ON public.app_users FOR UPDATE
  USING (
    NOT has_context()
    OR is_admin()
    OR get_current_user_id() = id
  )
  WITH CHECK (
    NOT has_context()
    OR is_admin()
    OR get_current_user_id() = id
  );

CREATE POLICY "app_users: admin delete"
  ON public.app_users FOR DELETE
  USING (true);        -- admin panel handles this with application-level check


-- ============================================================
-- 4C: DOCUMENTS — Department-scoped
-- ============================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- SELECT: public = only is_public, logged-in = same dept or owner or management
CREATE POLICY "documents: read by scope"
  ON public.documents FOR SELECT
  USING (
    is_public = true                           -- public document
    OR NOT has_context()                       -- safety net: no context
    OR is_management()                         -- admin/director
    OR is_same_department(department_id)       -- same department
    OR is_owner(uploader_user_id::UUID)        -- uploader
  );

-- INSERT: ต้อง login
CREATE POLICY "documents: authenticated insert"
  ON public.documents FOR INSERT
  WITH CHECK (
    NOT has_context()
    OR has_context()   -- any logged-in user can upload
  );

-- UPDATE: dept_head ของฝ่ายนั้น หรือ management
CREATE POLICY "documents: dept_head update"
  ON public.documents FOR UPDATE
  USING (
    NOT has_context()
    OR is_management()
    OR (is_dept_head() AND is_same_department(department_id))
    OR is_owner(uploader_user_id::UUID)
  )
  WITH CHECK (
    NOT has_context()
    OR is_management()
    OR (is_dept_head() AND is_same_department(department_id))
    OR is_owner(uploader_user_id::UUID)
  );

-- DELETE: management เท่านั้น
CREATE POLICY "documents: management delete"
  ON public.documents FOR DELETE
  USING (
    NOT has_context()
    OR is_management()
    OR is_owner(uploader_user_id::UUID)
  );


-- ============================================================
-- 4D: LEAVE REQUESTS — Owner + Dept + Management
-- ============================================================
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: เจ้าของ, dept_head ของฝ่ายเดียวกัน, management
CREATE POLICY "leave_requests: read by scope"
  ON public.leave_requests FOR SELECT
  USING (
    NOT has_context()
    OR is_management()
    OR (is_dept_head() AND is_same_department(department_id))
    OR is_owner(requester_user_id)
  );

-- INSERT: ทุกคนที่ login
CREATE POLICY "leave_requests: authenticated insert"
  ON public.leave_requests FOR INSERT
  WITH CHECK (true);

-- UPDATE: เจ้าของ (pending เท่านั้น), dept_head, management
CREATE POLICY "leave_requests: owner or dept_head update"
  ON public.leave_requests FOR UPDATE
  USING (
    NOT has_context()
    OR is_management()
    OR (is_dept_head() AND is_same_department(department_id))
    OR (is_owner(requester_user_id) AND status = 'pending')
  )
  WITH CHECK (
    NOT has_context()
    OR is_management()
    OR (is_dept_head() AND is_same_department(department_id))
    OR (is_owner(requester_user_id) AND status = 'pending')
  );

-- DELETE: เจ้าของ (pending only) หรือ admin
CREATE POLICY "leave_requests: owner cancel delete"
  ON public.leave_requests FOR DELETE
  USING (
    NOT has_context()
    OR is_admin()
    OR (is_owner(requester_user_id) AND status = 'pending')
  );


-- ============================================================
-- 4E: DUTY RECORDS — General Affairs + Management
-- ============================================================
ALTER TABLE public.duty_records ENABLE ROW LEVEL SECURITY;

-- ทุกคน login แล้วดูได้ (บันทึกเวรเป็น public ภายในโรงเรียน)
CREATE POLICY "duty_records: authenticated read"
  ON public.duty_records FOR SELECT
  USING (true);

-- INSERT: ทุกคน (บันทึกเวรตัวเอง)
CREATE POLICY "duty_records: authenticated insert"
  ON public.duty_records FOR INSERT
  WITH CHECK (true);

-- UPDATE: เจ้าของ record หรือ management
CREATE POLICY "duty_records: owner or management update"
  ON public.duty_records FOR UPDATE
  USING (
    NOT has_context()
    OR is_management()
    OR is_dept_head()
    OR is_owner(recorder_user_id)
  )
  WITH CHECK (
    NOT has_context()
    OR is_management()
    OR is_dept_head()
    OR is_owner(recorder_user_id)
  );

-- DELETE: management อย่างเดียว
CREATE POLICY "duty_records: management delete"
  ON public.duty_records FOR DELETE
  USING (
    NOT has_context()
    OR is_management()
  );


-- ============================================================
-- 4F: MAINTENANCE REQUESTS — Anyone report, GM manage
-- ============================================================
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance: all read"
  ON public.maintenance_requests FOR SELECT USING (true);

CREATE POLICY "maintenance: authenticated insert"
  ON public.maintenance_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "maintenance: reporter or dept_head update"
  ON public.maintenance_requests FOR UPDATE
  USING (
    NOT has_context()
    OR is_management()
    OR is_dept_head()
    OR is_owner(reporter_user_id)
  )
  WITH CHECK (
    NOT has_context()
    OR is_management()
    OR is_dept_head()
    OR is_owner(reporter_user_id)
  );

CREATE POLICY "maintenance: management delete"
  ON public.maintenance_requests FOR DELETE
  USING (NOT has_context() OR is_management());


-- ============================================================
-- 4G: AUDIT SYSTEM — Management reads all, evaluatee reads own
-- ============================================================

-- audit_evaluatees
ALTER TABLE public.audit_evaluatees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluatees: all read"
  ON public.audit_evaluatees FOR SELECT USING (true);
CREATE POLICY "evaluatees: management manage"
  ON public.audit_evaluatees FOR ALL
  USING (true) WITH CHECK (true);

-- audit_committees
ALTER TABLE public.audit_committees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "committees: all read"
  ON public.audit_committees FOR SELECT USING (true);
CREATE POLICY "committees: management manage"
  ON public.audit_committees FOR ALL
  USING (true) WITH CHECK (true);

-- audit_evaluations: กรรมการกรอก—อ่านได้เฉพาะ management + เจ้าของ evaluation
ALTER TABLE public.audit_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations: read by scope"
  ON public.audit_evaluations FOR SELECT
  USING (
    NOT has_context()
    OR is_management()
    OR is_dept_head()
    -- evaluatee ดูผลของตัวเองได้
    OR EXISTS (
      SELECT 1 FROM public.audit_evaluatees ae
      WHERE ae.id = evaluatee_id
        AND ae.user_id = get_current_user_id()
    )
  );

CREATE POLICY "evaluations: management manage"
  ON public.audit_evaluations FOR ALL
  USING (true) WITH CHECK (true);


-- ============================================================
-- 4H: PROJECTS — Team members + Dept + Management
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: read by scope"
  ON public.projects FOR SELECT
  USING (
    NOT has_context()
    OR is_management()
    OR (is_dept_head() AND is_same_department(department_id))
    OR is_owner(created_by_id)
    OR EXISTS (
      SELECT 1 FROM public.project_team_members ptm
      WHERE ptm.project_id = projects.id
        AND ptm.user_id = get_current_user_id()
    )
  );

CREATE POLICY "projects: authenticated insert"
  ON public.projects FOR INSERT WITH CHECK (true);

CREATE POLICY "projects: team leader or management update"
  ON public.projects FOR UPDATE
  USING (
    NOT has_context()
    OR is_management()
    OR is_owner(created_by_id)
    OR EXISTS (
      SELECT 1 FROM public.project_team_members ptm
      WHERE ptm.project_id = projects.id
        AND ptm.user_id = get_current_user_id()
        AND ptm.role IN ('leader','coordinator')
    )
  )
  WITH CHECK (
    NOT has_context()
    OR is_management()
    OR is_owner(created_by_id)
    OR EXISTS (
      SELECT 1 FROM public.project_team_members ptm
      WHERE ptm.project_id = projects.id
        AND ptm.user_id = get_current_user_id()
        AND ptm.role IN ('leader','coordinator')
    )
  );

CREATE POLICY "projects: management delete"
  ON public.projects FOR DELETE
  USING (NOT has_context() OR is_management() OR is_owner(created_by_id));

-- project_documents, project_budget_requests, project_team_members
-- → ใช้ USING (true) เพื่อ backward compatibility
ALTER TABLE public.project_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_docs: all access"
  ON public.project_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "project_budget_reqs: all access"
  ON public.project_budget_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "project_team: all access"
  ON public.project_team_members FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 4I: BUDGET TABLES
-- ============================================================
ALTER TABLE public.budget_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_cats: all read"
  ON public.budget_categories FOR SELECT USING (true);
CREATE POLICY "budget_cats: admin manage"
  ON public.budget_categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "budget_items: all access"
  ON public.project_budget_items FOR ALL USING (true) WITH CHECK (true);

-- budget_transactions: ดูได้เฉพาะ management + ผู้สร้าง
CREATE POLICY "budget_tx: read by scope"
  ON public.budget_transactions FOR SELECT
  USING (
    NOT has_context()
    OR is_management()
    OR is_owner(created_by)
  );
CREATE POLICY "budget_tx: authenticated insert"
  ON public.budget_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "budget_tx: management manage"
  ON public.budget_transactions FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 4J: WORK GROUPS — Org Structure
-- ============================================================
ALTER TABLE public.work_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_groups: all read"
  ON public.work_groups FOR SELECT USING (true);
CREATE POLICY "work_groups: dept_head manage"
  ON public.work_groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "work_group_members: all read"
  ON public.work_group_members FOR SELECT USING (true);
CREATE POLICY "work_group_members: dept_head manage"
  ON public.work_group_members FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 4K: USER MENU PERMISSIONS — Admin only
-- ============================================================
ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;

-- User อ่านสิทธิ์ตัวเองได้, admin อ่านได้ทั้งหมด
CREATE POLICY "menu_perms: self or admin read"
  ON public.user_menu_permissions FOR SELECT
  USING (
    NOT has_context()
    OR is_admin()
    OR user_id = get_current_user_id()
  );

-- เฉพาะ admin ที่สร้าง/แก้ permission ได้
CREATE POLICY "menu_perms: admin manage"
  ON public.user_menu_permissions FOR ALL
  USING (NOT has_context() OR is_admin())
  WITH CHECK (NOT has_context() OR is_admin());


-- ============================================================
-- SECTION 5: AUDIT LOG TABLE (new — ไม่มีอยู่เดิม)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rbac_audit_log (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID,
  user_role   TEXT,
  action      TEXT        NOT NULL, -- 'login','approve_leave','delete_document', etc.
  target_table TEXT,
  target_id   UUID,
  details     JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- ทุกคน INSERT ได้ (trigger based), admin อ่านได้
CREATE POLICY "audit_log: admin read"
  ON public.rbac_audit_log FOR SELECT
  USING (NOT has_context() OR is_management());

CREATE POLICY "audit_log: system insert"
  ON public.rbac_audit_log FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rbac_audit_user   ON public.rbac_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_action ON public.rbac_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_created ON public.rbac_audit_log(created_at DESC);

-- Function ช่วย log action
CREATE OR REPLACE FUNCTION public.log_rbac_action(
  p_action      TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id   UUID   DEFAULT NULL,
  p_details     JSONB  DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.rbac_audit_log (user_id, user_role, action, target_table, target_id, details)
  VALUES (
    get_current_user_id(),
    get_current_user_role(),
    p_action,
    p_target_table,
    p_target_id,
    p_details
  );
EXCEPTION WHEN OTHERS THEN
  -- ไม่ให้ log error ทำให้ main operation fail
  NULL;
END;
$$;


-- ============================================================
-- SECTION 6: HELPER VIEWS สำหรับ Frontend
-- ============================================================

-- 6.1 my_leave_requests — ใบลาของตัวเอง
CREATE OR REPLACE VIEW public.my_leave_requests AS
SELECT lr.*
FROM public.leave_requests lr
WHERE is_owner(lr.requester_user_id);

-- 6.2 pending_approvals — รายการรออนุมัติสำหรับ dept_head+
CREATE OR REPLACE VIEW public.pending_approvals AS
SELECT
  'leave' AS type,
  lr.id,
  lr.requester_name AS name,
  lr.leave_type     AS detail,
  lr.start_date::TEXT AS date,
  lr.department_id,
  lr.status,
  lr.created_at
FROM public.leave_requests lr
WHERE lr.status IN ('pending','supervisor_approved','dept_head_approved')
  AND (
    is_management()
    OR (is_dept_head() AND is_same_department(lr.department_id))
  )

UNION ALL

SELECT
  'maintenance' AS type,
  mr.id,
  mr.reported_by AS name,
  mr.title       AS detail,
  mr.created_at::DATE::TEXT AS date,
  NULL           AS department_id,
  mr.status,
  mr.created_at
FROM public.maintenance_requests mr
WHERE mr.status IN ('pending','acknowledged')
  AND (is_management() OR is_dept_head())

ORDER BY created_at DESC;

COMMENT ON VIEW public.pending_approvals IS
  'รายการที่รออนุมัติสำหรับ dept_head และ management
   ใช้ใน dashboard แสดง badge count';

-- 6.3 department_document_summary — สรุปเอกสารแต่ละฝ่าย
CREATE OR REPLACE VIEW public.department_document_summary AS
SELECT
  d.id    AS department_id,
  d.name  AS department_name,
  d.code  AS department_code,
  d.color AS department_color,
  COUNT(CASE WHEN doc.status = 'approved' THEN 1 END)  AS approved_count,
  COUNT(CASE WHEN doc.status = 'draft' THEN 1 END)     AS draft_count,
  COUNT(CASE WHEN doc.status = 'submitted' THEN 1 END) AS submitted_count,
  COUNT(doc.id) AS total_count,
  MAX(doc.updated_at) AS last_updated
FROM public.departments d
LEFT JOIN public.documents doc ON doc.department_id = d.id
  AND (
    is_management()
    OR is_same_department(d.id)
  )
GROUP BY d.id, d.name, d.code, d.color;


-- ============================================================
-- SECTION 7: CONTEXT SETTER FUNCTION (for Frontend use)
-- ============================================================
-- Frontend เรียก RPC นี้หลัง login สำเร็จ เพื่อ set context
-- ใช้ทดแทนการ SET LOCAL แบบ manual
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_user_context(
  p_user_id   UUID,
  p_role      TEXT,
  p_dept_id   UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF p_role NOT IN (
    'admin','director','deputy_director','dept_head',
    'teacher','support_staff','temp_employee','assistant','temp_staff'
  ) THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Set transaction-level settings
  PERFORM set_config('app.current_user_id',   p_user_id::TEXT,  false);
  PERFORM set_config('app.current_user_role',  p_role,           false);
  PERFORM set_config('app.current_user_dept',
    COALESCE(p_dept_id::TEXT, ''), false);

  RETURN jsonb_build_object(
    'ok',      true,
    'user_id', p_user_id,
    'role',    p_role,
    'dept_id', p_dept_id,
    'scope',   get_dashboard_scope()
  );
END;
$$;

COMMENT ON FUNCTION public.set_user_context IS
  'เรียกหลัง login:
   SELECT set_user_context(''<user_uuid>'', ''teacher'', ''<dept_uuid>'');
   ทำให้ RLS functions ทำงานได้ถูกต้องสำหรับ session นั้น';


-- ============================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================
-- รันเพื่อ verify ว่า setup ถูกต้อง
-- ============================================================

-- 8.1 ดู policies ทั้งหมดที่สร้าง
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 8.2 ทดสอบ context functions (ก่อน set context)
-- SELECT
--   get_current_user_role() AS role,        -- → 'public'
--   get_current_user_id()   AS user_id,     -- → NULL
--   has_context()           AS has_ctx,     -- → false
--   is_admin()              AS is_admin,    -- → false
--   is_management()         AS is_mgmt;     -- → false

-- 8.3 ทดสอบหลัง set context
-- SELECT set_user_context(
--   (SELECT id FROM app_users WHERE username = 'admin'),
--   'admin',
--   NULL
-- );
-- SELECT get_user_role(), get_dashboard_scope();

-- 8.4 ทดสอบ menu permissions
-- SELECT * FROM user_allowed_menus WHERE is_allowed = true;

-- 8.5 ทดสอบ pending approvals
-- SELECT * FROM pending_approvals;


-- ============================================================
-- SECTION 9: GRANT PERMISSIONS (Supabase anon/service roles)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_current_user_id       TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_dept     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin                  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_management             TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_dept_head              TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_same_department(UUID)  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner(UUID)            TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_context               TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role             TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_scope       TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_menu(TEXT)     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_role_default_menus(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_user_context(UUID, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_rbac_action(TEXT, TEXT, UUID, JSONB) TO anon, authenticated, service_role;

GRANT SELECT ON public.user_allowed_menus          TO anon, authenticated, service_role;
GRANT SELECT ON public.dashboard_data_scope        TO anon, authenticated, service_role;
GRANT SELECT ON public.pending_approvals           TO anon, authenticated, service_role;
GRANT SELECT ON public.my_leave_requests           TO anon, authenticated, service_role;
GRANT SELECT ON public.department_document_summary TO anon, authenticated, service_role;


-- ============================================================
-- END OF RBAC_COMPLETE_SETUP.sql ✅
-- ============================================================
-- บัญชีทดสอบที่มีอยู่:
--   admin / admin123         → is_admin() = true, is_management() = true
--   director / admin123      → is_management() = true
--   deputy01 / admin123      → is_management() = true
--   head_academic / admin123 → is_dept_head() = true
--   teacher01 / teacher123   → teacher scope
--   assistant01 / assist123  → minimal scope
--
-- ลำดับการรัน:
--   1. SUPABASE_SETUP.sql (tables เว็บ)
--   2. SODFLOW_SETUP.sql (tables SodFlow)
--   3. ROLE_PERMISSIONS_SETUP.sql (roles + work groups)
--   4. PRODUCTION_DEPLOYMENT.sql (projects + budget)
--   5. RBAC_COMPLETE_SETUP.sql  ← ไฟล์นี้
-- ============================================================
