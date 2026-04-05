# School Website - Database Schema Documentation

## Overview

Complete PostgreSQL database schema for school management system including:
- **School Administration**: News, Gallery, Staff, Students, Calendar
- **SodFlow Module**: Document management, duty tracking, leave requests, audits
- **Project Management**: Projects with team members, documents, budget tracking
- **Budget System**: Budget categories, item tracking, transaction history

**Total Tables**: 28 public tables
**Version**: As of 2568 Academic Year

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE TABLES                              │
├─────────────────────────────────────────────────────────────────┤
│
│  [app_users] ◄──────────────────────────────┐
│    • id (UUID)                             │
│    • username, password_hash                │
│    • role (admin, director, teacher, etc)  │
│    • is_active, last_login_at              │
│
│  [departments]                              │
│    • id, name, code, color, icon          │
│    • order_position, is_active             │
│
│  [school_settings]                         │
│    • id, academic_year, semester            │
│    • school_name, phone, email, address    │
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SODFLOW TABLES                               │
│              (Document Management & Workflow)                   │
├─────────────────────────────────────────────────────────────────┤
│
│  [documents] ◄──── [document_categories]
│    • id, title, department_id               • name, code
│    • category_id, academic_year, semester   • description
│    • file_url, file_name, file_type        │
│    • status, is_public, view_count         │
│
│  [duty_records]        [leave_requests]    [maintenance_requests]
│    • duty_date         • requester_name    • title, location
│    • duty_shift        • leave_type        • status, priority
│    • start_time        • start_date        • estimated/actual_cost
│    • status            • status            • image_url
│                        • approver info
│
│  [audit_evaluatees] ──► [audit_committees]
│    • name, position        • name, role
│    • department_id         • weight_percent
│    • academic_year         • is_active
│                            ↓
│                    [audit_evaluations]
│                      • 10 scoring categories
│                      • remarks, is_submitted
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PROJECT MANAGEMENT                            │
├─────────────────────────────────────────────────────────────────┤
│
│  [projects] ───────────┬────────────────┬──────────────┐
│    • title, type       │                │              │
│    • budget_amount     │                │              │
│    • status            │                │              │
│    • responsible_id    │                │              │
│    • department_id     │                │              │
│    • academic_year     │                │              │
│                        │                │              │
│                        ▼                ▼              ▼
│                 [project_documents]  [project_budget_requests]  [project_team_members]
│                   • document_id        • request_amount         • user_id, role
│                   • type, status       • status                 • responsibilities
│                   • approved_info      • approved_amount        • joined_at
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  BUDGET MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────┤
│
│  [budget_categories]
│    • name, code, description, is_active
│                │
│                ▼
│  [project_budget_items] ◄───┬───────────────────────┐
│    • project_id             │                       │
│    • category_id            │                       │
│    • item_name              │                       │
│    • planned_amount         │                       │
│                             │                       │
│                    [budget_transactions]            │
│                      • amount, type                 │
│                      • transaction_date        [projects]
│                      • created_by
│                      • document_id
│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 EXISTING TABLES (Pre-existing)                  │
├─────────────────────────────────────────────────────────────────┤
│
│  news, gallery, staff, students, curriculum_items
│  academic_calendar, contact_messages, events
│  student_council, maintenance_images, etc.
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Table Structure

### Core System Tables

#### `app_users`
**Purpose**: Central user directory with role-based access
```sql
CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'teacher',  -- admin, director, deputy_director, dept_head, teacher, support_staff, temp_employee, assistant
  staff_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Key Roles**: admin, director, deputy_director, dept_head, teacher, support_staff, temp_employee, assistant
**Indexes**: username, role, staff_id

---

#### `departments`
**Purpose**: School department hierarchy (5 departments)
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(50),
  icon VARCHAR(50),
  description TEXT,
  order_position INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Departments**: Academic Affairs, Student Affairs, General Affairs, HR, Admin
**Indexes**: code, order_position

---

#### `school_settings`
**Purpose**: System-wide configuration
```sql
CREATE TABLE school_settings (
  id UUID PRIMARY KEY,
  academic_year VARCHAR(4) NOT NULL,
  semester VARCHAR(10),
  school_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```
**Current Year**: 2568
**Usage**: All queries should reference this for academic_year

---

### SodFlow Tables

#### `document_categories`
**Purpose**: Categorize documents by type per department
```sql
CREATE TABLE document_categories (
  id UUID PRIMARY KEY,
  department_id UUID REFERENCES departments(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  order_position INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Example Categories**: Annual Reports, Minutes, Plans, Budgets, Audit Documents
**Count**: 18 categories across 5 departments

---

#### `documents`
**Purpose**: Store document metadata with file references
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id),
  category_id UUID REFERENCES document_categories(id),
  academic_year VARCHAR(4) NOT NULL,
  semester VARCHAR(10),
  document_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',  -- active, archived, deleted
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  uploader_name VARCHAR(255),
  uploader_id UUID,
  description TEXT,
  notes TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Storage**: Files in Supabase Storage bucket `school-images`
**Indexes**: department_id, category_id, academic_year, status, is_public

---

#### `duty_records`
**Purpose**: Daily duty/supervision records
```sql
CREATE TABLE duty_records (
  id UUID PRIMARY KEY,
  duty_date DATE NOT NULL,
  duty_shift VARCHAR(50) DEFAULT 'morning',  -- morning, afternoon, evening
  duty_shift_label VARCHAR(255),
  recorder_name VARCHAR(255) NOT NULL,
  recorder_position VARCHAR(255),
  start_time TIME,
  end_time TIME,
  students_present INTEGER DEFAULT 0,
  students_absent INTEGER DEFAULT 0,
  incidents TEXT,
  actions_taken TEXT,
  remarks TEXT,
  status VARCHAR(50) DEFAULT 'completed',  -- draft, completed, reviewed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Shifts**: morning, afternoon, evening
**Indexes**: duty_date, duty_shift, recorder_name

---

#### `leave_requests`
**Purpose**: Track and manage staff leave/absence requests
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  requester_name VARCHAR(255) NOT NULL,
  requester_position VARCHAR(255),
  department_id UUID REFERENCES departments(id),
  leave_type VARCHAR(50) NOT NULL,  -- sick, personal, emergency, training, other
  leave_type_label VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER,
  reason TEXT NOT NULL,
  contact_during_leave VARCHAR(255),
  substitute_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  document_url VARCHAR(500),
  academic_year VARCHAR(4) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Leave Types**: sick (ลาป่วย), personal (ลากิจ), emergency (ลาฉุกเฉิน), training (ลาเข้ารับการอบรม), other
**Statuses**: pending (รอการอนุมัติ), approved (อนุมัติแล้ว), rejected (ปฏิเสธ)
**Indexes**: department_id, status, approved_at, academic_year

---

#### `maintenance_requests`
**Purpose**: Facility maintenance tracking
```sql
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  room_number VARCHAR(50),
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium',  -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'open',  -- open, in_progress, completed, closed
  reported_by VARCHAR(255) NOT NULL,
  reporter_phone VARCHAR(20),
  assigned_to VARCHAR(255),
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  image_url VARCHAR(500),
  completion_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Priorities**: low, medium, high, urgent
**Statuses**: open, in_progress, completed, closed
**Indexes**: status, priority, assigned_to

---

#### `audit_evaluatees`
**Purpose**: Define people being audited/evaluated
```sql
CREATE TABLE audit_evaluatees (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  position_type VARCHAR(50),  -- teacher, staff, administrator
  department_id UUID REFERENCES departments(id),
  user_id UUID REFERENCES app_users(id),
  academic_year VARCHAR(4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Position Types**: teacher, staff, administrator
**Academic Year**: Specific to evaluation year
**Indexes**: department_id, user_id, academic_year

---

#### `audit_committees`
**Purpose**: Define audit committee members and their roles
```sql
CREATE TABLE audit_committees (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,  -- chairman, member, secretary
  role_label VARCHAR(255),
  weight_percent DECIMAL(5, 2) DEFAULT 100,
  academic_year VARCHAR(4) NOT NULL,
  order_position INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Roles**: chairman (ประธาน), member (สมาชิก), secretary (เลขานุการ)
**8 Members**: Pre-defined audit committee structure
**Indexes**: academic_year, role

---

#### `audit_evaluations`
**Purpose**: Evaluation scores across 10 criteria
```sql
CREATE TABLE audit_evaluations (
  id UUID PRIMARY KEY,
  evaluatee_id UUID NOT NULL REFERENCES audit_evaluatees(id),
  committee_id UUID NOT NULL REFERENCES audit_committees(id),
  academic_year VARCHAR(4) NOT NULL,
  -- Competency Area 1: Professional Competence (2 criteria)
  score_1_1 DECIMAL(3, 1),  -- Knowledge and expertise
  score_1_2 DECIMAL(3, 1),  -- Application
  -- Competency Area 2: Performance (2 criteria)  
  score_2_1 DECIMAL(3, 1),  -- Efficiency
  score_2_2 DECIMAL(3, 1),  -- Quality
  -- Competency Area 3: Quality (8 criteria)
  score_3_1 DECIMAL(3, 1),  -- Planning
  score_3_2 DECIMAL(3, 1),  -- Innovation
  score_3_3 DECIMAL(3, 1),  -- Commitment
  score_3_4 DECIMAL(3, 1),  -- Teamwork
  score_3_5 DECIMAL(3, 1),  -- Reliability
  score_3_6 DECIMAL(3, 1),  -- Initiative
  score_3_7 DECIMAL(3, 1),  -- Communication
  score_3_8 DECIMAL(3, 1),  -- Development
  remarks TEXT,
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Scoring**: 1-5 scale
**Areas**: Professional (2), Performance (2), Quality (8) = 10 total criteria
**Indexes**: evaluatee_id, committee_id, academic_year

---

### Project Management Tables

#### `projects`
**Purpose**: School projects with budget and team tracking
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(50),  -- curricular, extracurricular, support
  project_type_label VARCHAR(255),
  budget_source VARCHAR(100),
  budget_amount DECIMAL(14, 2),
  budget_used DECIMAL(14, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'planning',  -- planning, in_progress, completed, closed
  status_label VARCHAR(255),
  start_date DATE,
  end_date DATE,
  responsible_person_id UUID REFERENCES app_users(id),
  responsible_person_name VARCHAR(255),
  department_id UUID REFERENCES departments(id),
  academic_year VARCHAR(4) NOT NULL,
  semester VARCHAR(10),
  objectives TEXT[],
  expected_outcomes TEXT,
  actual_outcomes TEXT,
  challenges TEXT,
  lessons_learned TEXT,
  created_by_id UUID REFERENCES app_users(id),
  created_by_name VARCHAR(255),
  approved_by_id UUID REFERENCES app_users(id),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Types**: curricular, extracurricular, support
**Statuses**: planning, in_progress, completed, closed
**Indexes**: department_id, status, academic_year, responsible_person_id

---

#### `project_documents`
**Purpose**: Attach documents to projects
```sql
CREATE TABLE project_documents (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  document_id UUID REFERENCES documents(id),
  document_type VARCHAR(100),  -- plan, proposal, report, approval, receipt
  document_type_label VARCHAR(255),
  is_required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending',  -- pending, submitted, approved, rejected
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by_id UUID REFERENCES app_users(id),
  approved_by_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Types**: plan, proposal, report, approval, receipt
**Indexes**: project_id, document_id, status

---

#### `project_budget_requests`
**Purpose**: Track budget allocation and payment requests
```sql
CREATE TABLE project_budget_requests (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  request_amount DECIMAL(14, 2) NOT NULL,
  request_reason TEXT NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  requested_by_id UUID REFERENCES app_users(id),
  requested_by_name VARCHAR(255),
  approved_amount DECIMAL(14, 2),
  approved_by_id UUID REFERENCES app_users(id),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, paid, rejected
  status_label VARCHAR(255),
  payment_date DATE,
  receipt_document_id UUID REFERENCES documents(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Statuses**: pending, approved, paid, rejected
**Indexes**: project_id, status, approved_at

---

#### `project_team_members`
**Purpose**: Team composition for projects
```sql
CREATE TABLE project_team_members (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID REFERENCES app_users(id),
  user_name VARCHAR(255),
  role VARCHAR(100) DEFAULT 'member',  -- leader, coordinator, member, advisor
  role_label VARCHAR(255),
  responsibilities TEXT,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Roles**: leader, coordinator, member, advisor
**Indexes**: project_id, user_id, role

---

### Budget Management Tables

#### `budget_categories`
**Purpose**: Budget classification system
```sql
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Example Categories**: Personnel (บุคลากร), Materials (วัสดุ), Services (บริการ), Equipment (อุปกรณ์), Utilities (สาธารณูปโภค)
**Indexes**: code

---

#### `project_budget_items`
**Purpose**: Line items in project budgets
```sql
CREATE TABLE project_budget_items (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  category_id UUID NOT NULL REFERENCES budget_categories(id),
  item_name VARCHAR(255) NOT NULL,
  planned_amount DECIMAL(14, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Usage**: Break down project budgets by category
**Indexes**: project_id, category_id

---

#### `budget_transactions`
**Purpose**: Record actual budget spending
```sql
CREATE TABLE budget_transactions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  budget_item_id UUID REFERENCES project_budget_items(id),
  amount DECIMAL(14, 2) NOT NULL,
  transaction_type VARCHAR(50) DEFAULT 'expense',  -- expense, refund, adjustment
  description TEXT NOT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES app_users(id),
  document_id UUID REFERENCES documents(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Types**: expense (รายจ่าย), refund (คืนเงิน), adjustment (ปรับปรุง)
**Indexes**: project_id, transaction_date, transaction_type

---

## Row-Level Security (RLS) Policies

### Current Policy Status

All SodFlow and project tables have RLS enabled. **⚠️ SECURITY NOTE**: Many policies currently use `USING (true)` which is overly permissive. See hardening checklist in SODFLOW_CHECKLIST.md Phase 5.

### Policy Categories

#### 1. Read Policies (SELECT)
```sql
-- Example: Users can see documents from their department
CREATE POLICY "users_see_own_department_docs" ON documents
  FOR SELECT USING (
    department_id IN (
      SELECT department_id FROM staff WHERE user_id = auth.uid()
    )
  );
```

#### 2. Write Policies (INSERT, UPDATE)
```sql
-- Example: Only department heads can update department documents
CREATE POLICY "dept_head_update_docs" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'dept_head'
    )
  );
```

#### 3. Admin Bypass
```sql
-- Example: Admins bypass all policies
CREATE POLICY "admin_all_access" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Required Policy Improvements

**Priority Issues** (documented in SODFLOW_ANALYSIS.md Phase 5):

| Table | Current Policy | Required Fix |
|-------|---|---|
| documents | `USING (true)` | Add department/role filtering |
| duty_records | `USING (true)` | Restrict to dept_head+ roles |
| leave_requests | Moderate | Add approver role validation |
| audit_evaluations | Partial | Restrict to committee members + admin |
| projects | Moderate | Add team member + manager validation |
| budget_transactions | Missing | Add project manager + admin access |

---

## Database Performance Considerations

### Indexes Required

```sql
-- Core user/department indexes
CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_is_active ON app_users(is_active);
CREATE INDEX idx_departments_code ON departments(code);

-- SodFlow indexes
CREATE INDEX idx_documents_department_academic ON documents(department_id, academic_year);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_duty_records_date_shift ON duty_records(duty_date, duty_shift);
CREATE INDEX idx_leave_requests_status_year ON leave_requests(status, academic_year);
CREATE INDEX idx_audit_evaluations_evaluatee_year ON audit_evaluations(evaluatee_id, academic_year);

-- Project indexes
CREATE INDEX idx_projects_department_year ON projects(department_id, academic_year);
CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_project_budget_requests_project_status ON project_budget_requests(project_id, status);

-- Budget indexes
CREATE INDEX idx_budget_transactions_project_date ON budget_transactions(project_id, transaction_date);
CREATE INDEX idx_project_budget_items_project_category ON project_budget_items(project_id, category_id);
```

### Query Optimization

1. **Always filter by academic_year** - Most queries should include WHERE clause on academic_year
2. **Eager load relationships** - Use SELECT with JOINs rather than multiple queries
3. **Use RLS context** - Let database filter by user role/department instead of application logic
4. **Batch document operations** - Use transaction groups for related updates

### Typical Query Patterns

```typescript
// Get all documents for current user's department with category
select('documents')
  .eq('department_id', userDept)
  .eq('academic_year', currentYear)
  .select('*')
  .range(0, 49)
  .order('created_at', { ascending: false });

// Track leave requests with approver details
select('leave_requests')
  .eq('status', 'pending')
  .eq('department_id', userDept)
  .select('*, approver:approved_by(*)')
  .order('created_at');

// Get project budget summary
rpc('get_project_budget_summary', {
  project_id_param: projectId
});
```

---

## Migration History

| Version | Migration | Status |
|---------|-----------|--------|
| 001 | Initial schema (users, staff, news, gallery) | ✅ Deployed |
| 002 | Events and school_settings | ✅ Deployed |
| 003 | Administrator management | ✅ Deployed |
| 004 | Staff module | ✅ Deployed |
| 005 | Students module | ✅ Deployed |
| 006 | Admissions | ✅ Deployed |
| 007 | Curriculum | ✅ Deployed |
| 008 | Contact messages | ✅ Deployed |
| 009 | News external links | ✅ Deployed |
| 010 | Increment views function | ✅ Deployed |
| 011 | News creator tracking | ✅ Deployed |
| 012 | Maintenance images | ✅ Deployed |
| 013 | Password change notifications | ✅ Deployed |
| 014 | Duty swap workflow | ✅ Deployed |
| 015 | Duty assignments | ✅ Deployed |
| 016 | Duty record images | ✅ Deployed |
| 017 | Duty monthly reports | ✅ Deployed |
| 018 | Temp staff role | ✅ Deployed |
| 019 | Duty policies | ✅ Deployed |
| 020 | Projects management | ✅ Deployed |
| 021 | Fix document categories/projects menu | ✅ Deployed |
| 022 | Project budget management | ✅ Deployed |
| 023 | Budget constraints and functions | ✅ Deployed |

---

## Data Dictionary Reference

### Common Status Values

**Document Status**: `active`, `archived`, `deleted`
**Project Status**: `planning`, `in_progress`, `completed`, `closed`
**Leave Status**: `pending`, `approved`, `rejected`
**Maintenance Status**: `open`, `in_progress`, `completed`, `closed`
**User Roles**: `admin`, `director`, `deputy_director`, `dept_head`, `teacher`, `support_staff`, `temp_employee`, `assistant`

### Date/Time Conventions

- **academic_year**: "2568", "2567" (Thai Buddhist year)
- **semester**: "1", "2"
- **Timezone**: Asia/Bangkok (UTC+7)
- All timestamps use `TIMESTAMP WITH TIME ZONE`

### File Handling

- **Bucket**: `school-images` (Supabase Storage)
- **Max File Size**: Configured in Supabase storage policy
- **Allowed Types**: PDF, PNG, JPG, JPEG, XLSX, DOCX
- **Path Pattern**: `/{module}/{year}/{month}/{filename}`

---

## Accessing the Schema

### Supabase Dashboard
1. Navigate to SQL Editor in Supabase dashboard
2. Query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
3. View schema: `\d+ table_name`

### Programmatic Access
```typescript
// Get all tables and columns
const { data, error } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public');

// Get columns for specific table
const { data: columns } = await supabase
  .from('information_schema.columns')
  .select('column_name, data_type')
  .eq('table_name', 'documents');
```

---

## Maintenance & Backups

- Daily automated backups by Supabase
- Point-in-time recovery available (30-day window)
- Regular quarterly schema reviews recommended
- Test migrations in dev environment before production

---

**Last Updated**: 2568-01-15
**Maintained By**: Development Team
**Next Review**: 2568-06-01
