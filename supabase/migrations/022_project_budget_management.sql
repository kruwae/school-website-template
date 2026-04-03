-- =============================================
-- PROJECT BUDGET MANAGEMENT SYSTEM
-- Migration: 022_project_budget_management.sql
-- Date: 2026-04-03
-- Description: Add comprehensive budget management for projects
-- =============================================

-- =============================================
-- 1. BUDGET CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.budget_categories IS 'หมวดหมู่รายการงบประมาณ เช่น วัสดุ, ค่าเดินทาง, ค่าจ้าง';
COMMENT ON COLUMN public.budget_categories.code IS 'รหัสหมวดหมู่ เช่น MAT (วัสดุ), TRAVEL (เดินทาง)';

-- =============================================
-- 2. PROJECT BUDGET ITEMS TABLE (planned budget)
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_budget_items (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.budget_categories(id) ON DELETE RESTRICT,
  item_name       TEXT NOT NULL,
  planned_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_budget_items IS 'รายการงบประมาณที่วางแผนสำหรับแต่ละโครงการ';
COMMENT ON COLUMN public.project_budget_items.planned_amount IS 'จำนวนเงินที่วางแผนจะใช้';

-- =============================================
-- 3. BUDGET TRANSACTIONS TABLE (actual spending)
-- =============================================
CREATE TABLE IF NOT EXISTS public.budget_transactions (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_item_id    UUID REFERENCES public.project_budget_items(id) ON DELETE SET NULL,
  amount            DECIMAL(12,2) NOT NULL,
  transaction_type  TEXT NOT NULL DEFAULT 'expense'
                      CHECK (transaction_type IN ('expense', 'refund', 'adjustment')),
  description       TEXT NOT NULL,
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by        UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  document_id       UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.budget_transactions IS 'ธุรกรรมงบประมาณจริง (รายจ่าย, คืนเงิน, ปรับปรุง)';
COMMENT ON COLUMN public.budget_transactions.transaction_type IS 'ประเภท: expense=รายจ่าย, refund=คืนเงิน, adjustment=ปรับปรุง';
COMMENT ON COLUMN public.budget_transactions.document_id IS 'ลิงก์ไปยังเอกสารหลักฐาน (ใบเสร็จ, ใบสำคัญ)';

-- =============================================
-- 4. VIEW: PROJECT BUDGET SUMMARY
-- =============================================
CREATE OR REPLACE VIEW public.project_budget_summary AS
SELECT
  p.id as project_id,
  p.title as project_title,
  p.status as project_status,
  COALESCE(SUM(pbi.planned_amount), 0) as total_planned,
  COALESCE(SUM(bt.amount), 0) as total_used,
  COALESCE(SUM(pbi.planned_amount), 0) - COALESCE(SUM(bt.amount), 0) as remaining_budget,
  COUNT(DISTINCT pbi.id) as budget_items_count,
  COUNT(DISTINCT bt.id) as transactions_count
FROM public.projects p
LEFT JOIN public.project_budget_items pbi ON p.id = pbi.project_id
LEFT JOIN public.budget_transactions bt ON p.id = bt.project_id
  AND bt.transaction_type = 'expense'
GROUP BY p.id, p.title, p.status;

COMMENT ON VIEW public.project_budget_summary IS 'สรุปงบประมาณรวมของแต่ละโครงการ';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

-- Budget Categories: Everyone can read, admins can manage
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Budget categories readable" ON public.budget_categories;
CREATE POLICY "Budget categories readable"
  ON public.budget_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Budget categories manageable" ON public.budget_categories;
CREATE POLICY "Budget categories manageable"
  ON public.budget_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

-- Project Budget Items: Project team and admins can manage
ALTER TABLE public.project_budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Budget items readable" ON public.project_budget_items;
CREATE POLICY "Budget items readable"
  ON public.project_budget_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_budget_items.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  );

DROP POLICY IF EXISTS "Budget items manageable" ON public.project_budget_items;
CREATE POLICY "Budget items manageable"
  ON public.project_budget_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_budget_items.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = project_budget_items.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  );

-- Budget Transactions: Project team and admins can manage
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Budget transactions readable" ON public.budget_transactions;
CREATE POLICY "Budget transactions readable"
  ON public.budget_transactions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = budget_transactions.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  );

DROP POLICY IF EXISTS "Budget transactions manageable" ON public.budget_transactions;
CREATE POLICY "Budget transactions manageable"
  ON public.budget_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = budget_transactions.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
      WHERE p.id = budget_transactions.project_id
      AND (p.created_by_id = auth.uid() OR ptm.user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_budget')))
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Budget categories
CREATE INDEX IF NOT EXISTS idx_budget_categories_code ON public.budget_categories(code);
CREATE INDEX IF NOT EXISTS idx_budget_categories_active ON public.budget_categories(is_active);

-- Project budget items
CREATE INDEX IF NOT EXISTS idx_budget_items_project ON public.project_budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.project_budget_items(category_id);

-- Budget transactions
CREATE INDEX IF NOT EXISTS idx_budget_transactions_project ON public.budget_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_item ON public.budget_transactions(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_date ON public.budget_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_type ON public.budget_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_created_by ON public.budget_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_document ON public.budget_transactions(document_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON public.budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
    BEFORE UPDATE ON public.budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_items_updated_at ON public.project_budget_items;
CREATE TRIGGER update_budget_items_updated_at
    BEFORE UPDATE ON public.project_budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_transactions_updated_at ON public.budget_transactions;
CREATE TRIGGER update_budget_transactions_updated_at
    BEFORE UPDATE ON public.budget_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert default budget categories
INSERT INTO public.budget_categories (name, code, description) VALUES
  ('วัสดุและอุปกรณ์', 'MAT', 'วัสดุ อุปกรณ์ และเครื่องมือที่ใช้ในโครงการ'),
  ('ค่าเดินทาง', 'TRAVEL', 'ค่าเดินทาง ค่าที่พัก ค่าอาหารระหว่างเดินทาง'),
  ('ค่าจ้างแรงงาน', 'LABOR', 'ค่าจ้างพนักงานชั่วคราวหรือแรงงานพิเศษ'),
  ('ค่าบริการ', 'SERVICE', 'ค่าบริการจากภายนอก เช่น เช่าอุปกรณ์ พิมพ์เอกสาร'),
  ('ค่าอาหารและเครื่องดื่ม', 'FOOD', 'ค่าอาหาร เครื่องดื่ม และค่าประชุม'),
  ('ค่าพัฒนาซอฟต์แวร์', 'SOFTWARE', 'ค่าลิขสิทธิ์ซอฟต์แวร์และการพัฒนา'),
  ('ค่าอื่นๆ', 'OTHER', 'รายการอื่นๆ ที่ไม่เข้าหมวดหมู่ข้างต้น')
ON CONFLICT (code) DO NOTHING;