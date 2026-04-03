-- =============================================
-- PROJECTS MANAGEMENT SYSTEM
-- Migration: 020_projects_management.sql
-- Date: 2026-04-03
-- Description: Add projects table and related functionality
-- =============================================

-- =============================================
-- 1. PROJECTS TABLE - ตารางจัดการโครงการ
-- =============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title                 TEXT NOT NULL,
  description           TEXT,
  project_type          TEXT NOT NULL DEFAULT 'new'
                           CHECK (project_type IN ('new', 'continuing')),
  project_type_label    TEXT,
  budget_source         TEXT,
  budget_amount         DECIMAL(12,2),
  budget_used           DECIMAL(12,2) DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'planning'
                           CHECK (status IN ('planning', 'approved', 'in_progress', 'completed', 'cancelled')),
  status_label          TEXT,
  start_date            DATE,
  end_date              DATE,
  responsible_person_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  responsible_person_name TEXT,
  department_id         UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  academic_year         TEXT DEFAULT '2568',
  semester              TEXT DEFAULT '1',
  objectives            TEXT[],
  expected_outcomes     TEXT,
  actual_outcomes       TEXT,
  challenges            TEXT,
  lessons_learned       TEXT,
  created_by_id         UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_by_name       TEXT,
  approved_by_id        UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_by_name      TEXT,
  approved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.projects IS 'ตารางเก็บข้อมูลโครงการต่างๆ ของโรงเรียน';
COMMENT ON COLUMN public.projects.project_type IS 'ประเภทโครงการ: new=ใหม่, continuing=ต่อเนื่อง';
COMMENT ON COLUMN public.projects.budget_source IS 'แหล่งที่มาของงบประมาณ';
COMMENT ON COLUMN public.projects.budget_amount IS 'จำนวนงบประมาณที่ได้รับ';
COMMENT ON COLUMN public.projects.budget_used IS 'จำนวนงบประมาณที่ใช้ไปแล้ว';
COMMENT ON COLUMN public.projects.status IS 'สถานะโครงการ';
COMMENT ON COLUMN public.projects.objectives IS 'วัตถุประสงค์ของโครงการ (array)';
COMMENT ON COLUMN public.projects.expected_outcomes IS 'ผลลัพธ์ที่คาดหวัง';
COMMENT ON COLUMN public.projects.actual_outcomes IS 'ผลลัพธ์จริง';
COMMENT ON COLUMN public.projects.challenges IS 'ปัญหาและอุปสรรค';
COMMENT ON COLUMN public.projects.lessons_learned IS 'บทเรียนที่ได้เรียนรู้';

-- =============================================
-- 2. PROJECT DOCUMENTS TABLE - เอกสารที่เกี่ยวข้องกับโครงการ
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_documents (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id           UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  document_type         TEXT NOT NULL DEFAULT 'proposal'
                           CHECK (document_type IN ('proposal', 'budget', 'report', 'evidence', 'other')),
  document_type_label   TEXT,
  is_required           BOOLEAN DEFAULT false,
  status                TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at          TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  approved_by_id        UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_by_name      TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_documents IS 'ตารางเชื่อมโยงเอกสารกับโครงการ';
COMMENT ON COLUMN public.project_documents.document_type IS 'ประเภทเอกสาร: proposal=ข้อเสนอโครงการ, budget=เอกสารงบประมาณ, report=รายงาน, evidence=หลักฐาน, other=อื่นๆ';

-- =============================================
-- 3. PROJECT BUDGET REQUESTS TABLE - คำขอเบิกงบประมาณ
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_budget_requests (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  request_amount        DECIMAL(12,2) NOT NULL,
  request_reason        TEXT NOT NULL,
  request_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by_id       UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  requested_by_name     TEXT,
  approved_amount       DECIMAL(12,2),
  approved_by_id        UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_by_name      TEXT,
  approved_at           TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  status_label          TEXT,
  payment_date          DATE,
  receipt_document_id   UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_budget_requests IS 'ตารางคำขอเบิกงบประมาณโครงการ';
COMMENT ON COLUMN public.project_budget_requests.request_amount IS 'จำนวนเงินที่ขอเบิก';
COMMENT ON COLUMN public.project_budget_requests.approved_amount IS 'จำนวนเงินที่อนุมัติ';
COMMENT ON COLUMN public.project_budget_requests.status IS 'สถานะ: pending=รอดำเนินการ, approved=อนุมัติ, rejected=ปฏิเสธ, paid=จ่ายแล้ว';

-- =============================================
-- 4. PROJECT TEAM MEMBERS TABLE - สมาชิกทีมโครงการ
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_team_members (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  user_name             TEXT,
  role                  TEXT NOT NULL DEFAULT 'member'
                           CHECK (role IN ('leader', 'co_leader', 'member', 'advisor')),
  role_label            TEXT,
  responsibilities      TEXT,
  joined_at             TIMESTAMPTZ DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

COMMENT ON TABLE public.project_team_members IS 'ตารางสมาชิกทีมโครงการ';
COMMENT ON COLUMN public.project_team_members.role IS 'บทบาท: leader=หัวหน้า, co_leader=รองหัวหน้า, member=สมาชิก, advisor=ที่ปรึกษา';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Projects: Everyone can read, creators and admins can manage
DROP POLICY IF EXISTS "Projects readable" ON public.projects;
CREATE POLICY "Projects readable"
  ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Projects manageable" ON public.projects;
CREATE POLICY "Projects manageable"
  ON public.projects FOR ALL
  USING (
    created_by_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director'))
  )
  WITH CHECK (
    created_by_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

-- Project Documents: Readable by project team and admins
DROP POLICY IF EXISTS "Project docs readable" ON public.project_documents;
CREATE POLICY "Project docs readable"
  ON public.project_documents FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_documents.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director')))
    )
  );

DROP POLICY IF EXISTS "Project docs manageable" ON public.project_documents;
CREATE POLICY "Project docs manageable"
  ON public.project_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_documents.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_documents.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director')))
    )
  );

-- Budget Requests: Project team and admins can manage
DROP POLICY IF EXISTS "Budget requests readable" ON public.project_budget_requests;
CREATE POLICY "Budget requests readable"
  ON public.project_budget_requests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_budget_requests.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  );

DROP POLICY IF EXISTS "Budget requests manageable" ON public.project_budget_requests;
CREATE POLICY "Budget requests manageable"
  ON public.project_budget_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_budget_requests.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_budget_requests.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  );

-- Team Members: Project creators and admins can manage
DROP POLICY IF EXISTS "Team members readable" ON public.project_team_members;
CREATE POLICY "Team members readable"
  ON public.project_team_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_team_members.project_id
      AND (p.created_by_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director')))
    )
  );

DROP POLICY IF EXISTS "Team members manageable" ON public.project_team_members;
CREATE POLICY "Team members manageable"
  ON public.project_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_team_members.project_id
      AND (p.created_by_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_team_members.project_id
      AND (p.created_by_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director')))
    )
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_projects_department    ON public.projects(department_id);
CREATE INDEX idx_projects_status         ON public.projects(status);
CREATE INDEX idx_projects_year           ON public.projects(academic_year);
CREATE INDEX idx_projects_created_by     ON public.projects(created_by_id);
CREATE INDEX idx_projects_responsible    ON public.projects(responsible_person_id);

CREATE INDEX idx_project_docs_project    ON public.project_documents(project_id);
CREATE INDEX idx_project_docs_document   ON public.project_documents(document_id);
CREATE INDEX idx_project_docs_status     ON public.project_documents(status);

CREATE INDEX idx_budget_requests_project ON public.project_budget_requests(project_id);
CREATE INDEX idx_budget_requests_status  ON public.project_budget_requests(status);
CREATE INDEX idx_budget_requests_date    ON public.project_budget_requests(request_date);

CREATE INDEX idx_team_members_project    ON public.project_team_members(project_id);
CREATE INDEX idx_team_members_user       ON public.project_team_members(user_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_documents_updated_at ON public.project_documents;
CREATE TRIGGER update_project_documents_updated_at
    BEFORE UPDATE ON public.project_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_requests_updated_at ON public.project_budget_requests;
CREATE TRIGGER update_budget_requests_updated_at
    BEFORE UPDATE ON public.project_budget_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.project_team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.project_team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert some default project types and statuses (for reference)
INSERT INTO public.projects (title, description, project_type, status, academic_year, created_by_name)
VALUES
  ('โครงการตัวอย่าง - โครงการใหม่', 'โครงการตัวอย่างสำหรับการทดสอบระบบ', 'new', 'planning', '2568', 'System'),
  ('โครงการตัวอย่าง - โครงการต่อเนื่อง', 'โครงการต่อเนื่องตัวอย่าง', 'continuing', 'in_progress', '2568', 'System')
ON CONFLICT DO NOTHING;