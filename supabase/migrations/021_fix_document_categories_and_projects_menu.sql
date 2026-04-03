-- =============================================
-- FIX DOCUMENT CATEGORIES CODE AND ADD PROJECTS MENU
-- Migration: 021_fix_document_categories_and_projects_menu.sql
-- Date: 2026-04-03
-- Description: Fix document_categories code field and prepare for projects menu
-- =============================================

-- =============================================
-- 1. FIX DOCUMENT CATEGORIES CODE FIELD
-- =============================================

-- Update existing categories with NULL code to have proper code
UPDATE public.document_categories
SET code = 'CAT' || id
WHERE code IS NULL OR code = '';

-- Ensure all categories have unique codes
UPDATE public.document_categories
SET code = code || '_' || id
WHERE code IN (
    SELECT code
    FROM public.document_categories
    GROUP BY code
    HAVING COUNT(*) > 1
);

-- Add constraint to ensure code is not null and unique
ALTER TABLE public.document_categories
ALTER COLUMN code SET NOT NULL,
ADD CONSTRAINT document_categories_code_unique UNIQUE (code);

-- =============================================
-- 2. ADD PROJECTS MENU PERMISSIONS (REMOVED - table schema mismatch)
-- =============================================

-- Note: user_menu_permissions table has different schema (user-specific permissions)
-- Menu configuration is handled in AdminLayout.tsx component instead

-- =============================================
-- 3. ENSURE PROJECTS TABLE HAS PROPER DEFAULTS
-- =============================================

-- Update project types and statuses with labels
UPDATE public.projects
SET project_type_label = CASE
    WHEN project_type = 'new' THEN 'โครงการใหม่'
    WHEN project_type = 'continuing' THEN 'โครงการต่อเนื่อง'
    ELSE project_type
END
WHERE project_type_label IS NULL;

UPDATE public.projects
SET status_label = CASE
    WHEN status = 'planning' THEN 'วางแผน'
    WHEN status = 'approved' THEN 'อนุมัติแล้ว'
    WHEN status = 'in_progress' THEN 'ดำเนินการ'
    WHEN status = 'completed' THEN 'เสร็จสิ้น'
    WHEN status = 'cancelled' THEN 'ยกเลิก'
    ELSE status
END
WHERE status_label IS NULL;

-- =============================================
-- 4. ADD INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Add index for document_categories code lookup
CREATE INDEX IF NOT EXISTS idx_document_categories_code ON public.document_categories(code);

-- Add index for projects lookup by department and status
CREATE INDEX IF NOT EXISTS idx_projects_dept_status ON public.projects(department_id, status);

-- =============================================
-- 5. UPDATE PROJECT TEAM MEMBERS WITH LABELS
-- =============================================

UPDATE public.project_team_members
SET role_label = CASE
    WHEN role = 'leader' THEN 'หัวหน้าโครงการ'
    WHEN role = 'co_leader' THEN 'รองหัวหน้า'
    WHEN role = 'member' THEN 'สมาชิก'
    WHEN role = 'advisor' THEN 'ที่ปรึกษา'
    ELSE role
END
WHERE role_label IS NULL;

-- =============================================
-- 6. BUDGET REQUESTS STATUS LABELS
-- =============================================

UPDATE public.project_budget_requests
SET status_label = CASE
    WHEN status = 'pending' THEN 'รอดำเนินการ'
    WHEN status = 'approved' THEN 'อนุมัติ'
    WHEN status = 'rejected' THEN 'ปฏิเสธ'
    WHEN status = 'paid' THEN 'จ่ายแล้ว'
    ELSE status
END
WHERE status_label IS NULL;

-- =============================================
-- 7. PROJECT DOCUMENTS TYPE LABELS
-- =============================================

UPDATE public.project_documents
SET document_type_label = CASE
    WHEN document_type = 'proposal' THEN 'ข้อเสนอโครงการ'
    WHEN document_type = 'budget' THEN 'เอกสารงบประมาณ'
    WHEN document_type = 'report' THEN 'รายงาน'
    WHEN document_type = 'evidence' THEN 'หลักฐาน'
    WHEN document_type = 'other' THEN 'อื่นๆ'
    ELSE document_type
END
WHERE document_type_label IS NULL;