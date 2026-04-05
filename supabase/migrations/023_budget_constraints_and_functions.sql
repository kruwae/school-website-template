-- =============================================
-- PROJECT BUDGET CONSTRAINTS & FUNCTIONS
-- Migration: 023_budget_constraints_and_functions.sql
-- Date: 2026-04-05
-- Description: Add constraints for data validation and helper functions
-- =============================================

-- =============================================
-- 1. ADD CONSTRAINTS FOR VALIDATION
-- =============================================

-- Prevent negative planned amounts
ALTER TABLE public.project_budget_items
ADD CONSTRAINT check_planned_amount_non_negative 
CHECK (planned_amount >= 0);

-- Prevent negative amounts in transactions
ALTER TABLE public.budget_transactions
ADD CONSTRAINT check_transaction_amount_non_zero 
CHECK (amount != 0);

-- Validate transaction type with amount rules
ALTER TABLE public.budget_transactions
ADD CONSTRAINT check_transaction_type_amount_rules
CHECK (
  (transaction_type = 'expense' AND amount > 0) OR
  (transaction_type = 'refund' AND amount > 0) OR
  (transaction_type = 'adjustment' AND amount != 0)
);

-- Validate budget category code format (uppercase alphanumeric with underscore)
ALTER TABLE public.budget_categories
ADD CONSTRAINT check_category_code_format
CHECK (code ~ '^[A-Z0-9_]+$');

-- =============================================
-- 2. HELPER FUNCTIONS
-- =============================================

-- Function: Get remaining budget for a project
CREATE OR REPLACE FUNCTION public.get_project_remaining_budget(project_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  planned DECIMAL(12,2) := 0;
  used DECIMAL(12,2) := 0;
BEGIN
  SELECT COALESCE(SUM(planned_amount), 0) INTO planned
  FROM public.project_budget_items 
  WHERE project_id = project_uuid;
  
  SELECT COALESCE(SUM(amount), 0) INTO used
  FROM public.budget_transactions 
  WHERE project_id = project_uuid AND transaction_type = 'expense';
  
  RETURN planned - used;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE;

COMMENT ON FUNCTION public.get_project_remaining_budget(UUID) IS 'คำนวณเงินงบประมาณคงเหลือของโครงการ';

-- Function: Get budget utilization percentage
CREATE OR REPLACE FUNCTION public.get_budget_utilization_percentage(project_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  planned DECIMAL(12,2) := 0;
  used DECIMAL(12,2) := 0;
  percentage NUMERIC;
BEGIN
  SELECT COALESCE(SUM(planned_amount), 0) INTO planned
  FROM public.project_budget_items 
  WHERE project_id = project_uuid;
  
  IF planned = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COALESCE(SUM(amount), 0) INTO used
  FROM public.budget_transactions 
  WHERE project_id = project_uuid AND transaction_type = 'expense';
  
  percentage := (used::NUMERIC / planned::NUMERIC) * 100;
  RETURN LEAST(percentage, 999.99); -- Cap at 999.99%
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE;

COMMENT ON FUNCTION public.get_budget_utilization_percentage(UUID) IS 'คำนวณเปอร์เซ็นต์การใช้งบประมาณของโครงการ';

-- Function: Get category summary
CREATE OR REPLACE FUNCTION public.get_category_summary(project_uuid UUID)
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  category_code TEXT,
  total_planned DECIMAL,
  total_used DECIMAL,
  remaining DECIMAL,
  utilization_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id as category_id,
    bc.name as category_name,
    bc.code as category_code,
    COALESCE(SUM(pbi.planned_amount), 0) as total_planned,
    COALESCE(SUM(bt.amount), 0) as total_used,
    COALESCE(SUM(pbi.planned_amount), 0) - COALESCE(SUM(bt.amount), 0) as remaining,
    CASE 
      WHEN COALESCE(SUM(pbi.planned_amount), 0) = 0 THEN 0
      ELSE (COALESCE(SUM(bt.amount), 0)::NUMERIC / COALESCE(SUM(pbi.planned_amount), 0)::NUMERIC) * 100
    END as utilization_percentage
  FROM public.budget_categories bc
  LEFT JOIN public.project_budget_items pbi ON bc.id = pbi.category_id AND pbi.project_id = project_uuid
  LEFT JOIN public.budget_transactions bt ON pbi.id = bt.budget_item_id 
    AND bt.transaction_type = 'expense'
  WHERE bc.is_active = true
  GROUP BY bc.id, bc.name, bc.code
  ORDER BY bc.name;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE;

COMMENT ON FUNCTION public.get_category_summary(UUID) IS 'สรุปการใช้งบประมาณแยกตามหมวดหมู่';

-- Function: Check if budget available (before expense)
CREATE OR REPLACE FUNCTION public.can_create_expense(project_uuid UUID, amount_to_spend DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
  remaining DECIMAL(12,2);
BEGIN
  remaining := public.get_project_remaining_budget(project_uuid);
  RETURN remaining >= amount_to_spend;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE;

COMMENT ON FUNCTION public.can_create_expense(UUID, DECIMAL) IS 'ตรวจสอบว่าสามารถกำหนดรายจ่ายได้หรือไม่';

-- Function: Get budget statistics
CREATE OR REPLACE FUNCTION public.get_budget_statistics(project_uuid UUID)
RETURNS TABLE(
  total_budget DECIMAL,
  total_spent DECIMAL,
  total_refunded DECIMAL,
  net_spent DECIMAL,
  remaining_budget DECIMAL,
  budget_items_count BIGINT,
  transactions_count BIGINT,
  expense_transactions_count BIGINT,
  refund_transactions_count BIGINT,
  adjustment_transactions_count BIGINT,
  average_transaction_amount DECIMAL,
  largest_transaction DECIMAL,
  smallest_transaction DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total budget
    COALESCE(SUM(pbi.planned_amount), 0)::DECIMAL as total_budget,
    -- Total spent (expenses)
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END), 0)::DECIMAL as total_spent,
    -- Total refunded
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'refund' THEN bt.amount ELSE 0 END), 0)::DECIMAL as total_refunded,
    -- Net spent (expenses - refunds)
    COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount 
                      WHEN bt.transaction_type = 'refund' THEN -bt.amount 
                      ELSE 0 END), 0)::DECIMAL as net_spent,
    -- Remaining budget
    (COALESCE(SUM(pbi.planned_amount), 0) - 
     COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END), 0) +
     COALESCE(SUM(CASE WHEN bt.transaction_type = 'refund' THEN bt.amount ELSE 0 END), 0))::DECIMAL as remaining_budget,
    -- Budget items count
    COUNT(DISTINCT pbi.id) as budget_items_count,
    -- Total transactions count
    COUNT(DISTINCT bt.id) as transactions_count,
    -- Expense transactions count
    COUNT(DISTINCT CASE WHEN bt.transaction_type = 'expense' THEN bt.id END) as expense_transactions_count,
    -- Refund transactions count
    COUNT(DISTINCT CASE WHEN bt.transaction_type = 'refund' THEN bt.id END) as refund_transactions_count,
    -- Adjustment transactions count
    COUNT(DISTINCT CASE WHEN bt.transaction_type = 'adjustment' THEN bt.id END) as adjustment_transactions_count,
    -- Average transaction amount
    COALESCE(AVG(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount END), 0)::DECIMAL as average_transaction_amount,
    -- Largest transaction
    COALESCE(MAX(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount END), 0)::DECIMAL as largest_transaction,
    -- Smallest transaction (excluding zero)
    COALESCE(MIN(CASE WHEN bt.transaction_type = 'expense' AND bt.amount > 0 THEN bt.amount END), 0)::DECIMAL as smallest_transaction
  FROM public.projects p
  LEFT JOIN public.project_budget_items pbi ON p.id = pbi.project_id
  LEFT JOIN public.budget_transactions bt ON p.id = bt.project_id
  WHERE p.id = project_uuid;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
STABLE;

COMMENT ON FUNCTION public.get_budget_statistics(UUID) IS 'ดึงข้อมูลสถิติงบประมาณรวมของโครงการ';

-- =============================================
-- 3. AUDIT LOGGING (Optional but recommended)
-- =============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.budget_audit_logs (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  changed_by  UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_audit_logs_table ON public.budget_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_budget_audit_logs_record ON public.budget_audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_budget_audit_logs_changed_by ON public.budget_audit_logs(changed_by);

COMMENT ON TABLE public.budget_audit_logs IS 'บันทึกการเปลี่ยนแปลงข้อมูลงบประมาณ';

-- =============================================
-- ENABLE RLS ON AUDIT LOGS
-- =============================================

ALTER TABLE public.budget_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Budget audit logs readable by admins" ON public.budget_audit_logs;
CREATE POLICY "Budget audit logs readable by admins"
  ON public.budget_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

-- =============================================
-- 4. UPDATED VIEWS WITH ADDITIONAL METRICS
-- =============================================

-- Enhanced project budget summary view
DROP VIEW IF EXISTS public.project_budget_summary CASCADE;

CREATE OR REPLACE VIEW public.project_budget_summary AS
SELECT
  p.id as project_id,
  p.title as project_title,
  p.status as project_status,
  COALESCE(SUM(pbi.planned_amount), 0) as total_planned,
  COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END), 0) as total_used,
  COALESCE(SUM(CASE WHEN bt.transaction_type = 'refund' THEN bt.amount ELSE 0 END), 0) as total_refunded,
  COALESCE(SUM(pbi.planned_amount), 0) - 
  COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END), 0) +
  COALESCE(SUM(CASE WHEN bt.transaction_type = 'refund' THEN bt.amount ELSE 0 END), 0) as remaining_budget,
  CASE 
    WHEN COALESCE(SUM(pbi.planned_amount), 0) = 0 THEN 0
    ELSE ROUND(((COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END), 0)::NUMERIC / 
                 COALESCE(SUM(pbi.planned_amount), 0)::NUMERIC) * 100)::NUMERIC, 2)
  END as utilization_percentage,
  COUNT(DISTINCT pbi.id) as budget_items_count,
  COUNT(DISTINCT bt.id) as transactions_count,
  COUNT(DISTINCT CASE WHEN bt.transaction_type = 'expense' THEN bt.id END) as expense_count,
  COUNT(DISTINCT CASE WHEN bt.transaction_type = 'refund' THEN bt.id END) as refund_count
FROM public.projects p
LEFT JOIN public.project_budget_items pbi ON p.id = pbi.project_id
LEFT JOIN public.budget_transactions bt ON p.id = bt.project_id
GROUP BY p.id, p.title, p.status;

COMMENT ON VIEW public.project_budget_summary IS 'สรุปงบประมาณรวมพร้อมเมตริกเพิ่มเติม';

-- Budget category details view
CREATE OR REPLACE VIEW public.budget_category_details AS
SELECT
  bc.id,
  bc.name,
  bc.code,
  bc.description,
  bc.is_active,
  COUNT(DISTINCT pbi.id) as items_count,
  COALESCE(SUM(pbi.planned_amount), 0) as total_planned_amount,
  COALESCE(SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END), 0) as total_spent,
  bc.created_at,
  bc.updated_at
FROM public.budget_categories bc
LEFT JOIN public.project_budget_items pbi ON bc.id = pbi.category_id
LEFT JOIN public.budget_transactions bt ON pbi.id = bt.budget_item_id AND bt.transaction_type = 'expense'
GROUP BY bc.id, bc.name, bc.code, bc.description, bc.is_active, bc.created_at, bc.updated_at;

COMMENT ON VIEW public.budget_category_details IS 'รายละเอียดของแต่ละหมวดหมู่งบประมาณ';

-- =============================================
-- 5. PERFORMANCE INDICATORS
-- =============================================

-- Index for budget queries performance
CREATE INDEX IF NOT EXISTS idx_budget_transactions_project_type 
  ON public.budget_transactions(project_id, transaction_type);

CREATE INDEX IF NOT EXISTS idx_budget_items_project_category 
  ON public.project_budget_items(project_id, category_id);

CREATE INDEX IF NOT EXISTS idx_budget_transactions_created_date 
  ON public.budget_transactions(created_at DESC);

-- =============================================
-- 6. SEED DATA (if needed)
-- =============================================

-- The budget categories should already be inserted from 022_project_budget_management.sql
-- This is just a placeholder for additional category insights
