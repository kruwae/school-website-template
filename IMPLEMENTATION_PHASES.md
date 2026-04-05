# SodFlow Implementation - Comprehensive Phase Breakdown

**Project**: School Website SodFlow Module & Budget Management  
**Timeline**: 12 weeks  
**Status**: Ready for Implementation  
**Updated**: 2568-01-15

---

## Phase Overview Timeline

```
Week 1-2  │ Week 3-4  │ Week 5-6  │ Week 7-8  │ Week 9-10 │ Week 11-12
──────────┼───────────┼───────────┼───────────┼───────────┼────────────
PHASE 1   │  PHASE 2  │  PHASE 3  │  PHASE 4  │  PHASE 5  │   PHASE 6
Database  │ SodFlow   │ Projects  │  Budget   │  Security │ Testing &
Hardening │ Features  │ Features  │ Features  │ Hardening │  Deployment
```

---

## Phase 1: Database & Type Safety Foundation (Weeks 1-2)

### Objective
Establish type-safe database layer with complete table definitions and RLS policies.

### Status: 🔄 IN PROGRESS (25% complete)

### Completed Tasks ✅

#### 1.1 Add 17 Table Types to TypeScript
**Deliverable**: [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) (updated)
**Status**: ✅ COMPLETED
**Result**: 
- Removed all 14 `as any` casts from SodFlow references
- Added Row/Insert/Update/Relationships for:
  - 10 SodFlow tables (app_users, departments, documents, etc.)
  - 4 Project tables (projects, project_documents, project_budget_requests, project_team_members)
  - 3 Budget tables (budget_categories, project_budget_items, budget_transactions)
- Full type inference enabled for IDE autocompletion

**Verification**: Run `npm run build` - expect zero TypeScript errors on SodFlow imports

---

### Pending Tasks 🔄

#### 1.2 Verify Database Migrations Are Current
**Files to Check**:
- ✅ 020_projects_management.sql - Projects + team + docs tables
- ✅ 022_project_budget_management.sql - Budget tables  
- ✅ 023_budget_constraints_and_functions.sql - RPC functions + triggers

**Action**: Confirm all migrations applied in Supabase
```bash
# Check migration status
supabase db pull  # Compare local schema with production
```

**Expected Result**: All 28 tables present, no schema mismatches

---

#### 1.3 Document Complete Database Schema ✅
**Deliverable**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
**Status**: ✅ COMPLETED
**Includes**:
- ER diagram (ASCII)
- 28 table definitions with relationships
- RLS policy overview
- Performance optimization guide
- Index strategy

---

#### 1.4 Audit Gallery Tables ✅
**Deliverable**: [GALLERY_AND_RLS_AUDIT.md](GALLERY_AND_RLS_AUDIT.md)
**Status**: ✅ COMPLETED
**Confirms**:
- gallery_albums table exists (correct naming) ✓
- gallery_photos table exists (correct naming) ✓
- RLS policies reviewed and security issues documented
- 11 critical RLS issues identified

**Current Finding**: gallery_photos visible even when album unpublished
```sql
-- Current (INSECURE)
USING (true)  -- All photos visible!

-- Should be
USING (EXISTS (SELECT 1 FROM gallery_albums 
  WHERE gallery_albums.id = gallery_photos.album_id 
  AND gallery_albums.is_published = true))
```

---

#### 1.5 Create RLS Hardening Implementation Plan ✅
**Deliverable**: Phase 1-5 hardening roadmap in [GALLERY_AND_RLS_AUDIT.md](GALLERY_AND_RLS_AUDIT.md#part-4-hardening-recommendations)
**Status**: ✅ COMPLETED

**Quick Reference - Phase 1 Immediate Fixes**:
| Priority | Issue | Fix Location | Effort | Risk |
|----------|-------|--------------|--------|------|
| 1 | Gallery photos always visible | gallery_photos policy | 30min | Low |
| 2 | Admin policy uses `USING (true)` | gallery_albums policy | 30min | Low |
| 3 | Documents have no write protection | Add INSERT/UPDATE policies | 1hr | Low |
| 4 | Duty records visible to all | Add role filtering | 1hr | Low |

---

### Deliverables Summary - Phase 1

| Deliverable | Status | File | Effort |
|-------------|--------|------|--------|
| Table type definitions | ✅ Complete | types.ts | ✅ Done |
| Database schema docs | ✅ Complete | DATABASE_SCHEMA.md | ✅ Done |
| Gallery audit report | ✅ Complete | GALLERY_AND_RLS_AUDIT.md | ✅ Done |
| RLS hardening plan | ✅ Complete | GALLERY_AND_RLS_AUDIT.md | ✅ Done |
| Migration verification | 🔄 In Progress | Local terminal | 30min |

---

### Success Criteria - Phase 1

- [x] Zero `as any` casts in codebase
- [x] All 28 tables have TypeScript definitions with relationships
- [x] Database schema documented with ER diagram
- [x] Gallery tables naming verified (albums/photos)
- [x] RLS issues identified (11 critical, 7 high, 5 medium)
- [x] Phase 1 RLS hardening plan ready to implement
- [ ] All migrations verified deployed to production
- [ ] Phase 1 RLS hardening fixes applied

---

### Effort Estimate - Phase 1
- **Completed to Date**: ~12 hours (research, documentation, types)
- **Remaining Work**: ~2-3 hours (verification, migration testing)
- **Total Phase Duration**: 2 weeks (with Phase 1 RLS hardening)

---

---

## Phase 2: SodFlow Core Features (Weeks 3-4)

### Objective
Implement document management, duty tracking, and leave request workflows with proper access control.

### Dependencies
- ✅ Complete Phase 1
- ✅ app_users, departments defined
- ✅ RLS policies hardened

---

### 2.1 Document Management System

#### 2.1.1 Create Document Browser Component
**File**: `src/components/admin/sodflow/DocumentBrowser.tsx` (CREATE)
**Purpose**: Browse documents by department and category
**Features**:
- Filter by department (5 depts)
- Filter by category (18 categories)
- Filter by academic year (2568, 2567)
- Search by title/tags
- Sort by created_at, updated_at, view_count
- Show only is_public OR own department docs

**Data Query**:
```typescript
// src/lib/queries/documents.ts
export const getDocuments = async (
  department_id?, category_id?, academic_year=2568
) => {
  return supabase
    .from('documents')
    .select('*, category:document_categories(*), uploader:app_users(*)')
    .eq('academic_year', academic_year)
    .or(`is_public.eq.true,department_id.eq.${dept_id}`)
    .order('created_at', { ascending: false })
};
```

**UI Components Needed**:
- DocumentFilterBar (department, category, year filters)
- DocumentGrid (card view with preview)
- DocumentDetail (modal with metadata + download)
- DocumentUpload (drag-drop with validation)

**Estimated Effort**: 16 hours
**Dependencies**: document_categories, app_users types

---

#### 2.1.2 Document Categories Manager
**File**: `src/components/admin/sodflow/DocumentCategoryManager.tsx` (CREATE)
**Purpose**: Manage 18 document categories per department
**Features**:
- List categories by department
- Add/Edit/Delete category
- Reorder categories (drag-drop)
- Activate/Deactivate

**Data Query**:
```typescript
export const getDocumentCategories = async (dept_id?, year=2568) => {
  return supabase
    .from('document_categories')
    .select('*')
    .eq('department_id', dept_id)
    .eq('is_active', true)
    .order('order_position');
};
```

**Estimated Effort**: 8 hours

---

#### 2.1.3 Document Upload & Storage
**File**: `src/utils/documentUpload.ts` (CREATE)
**Purpose**: Handle file uploads to Supabase Storage
**Process**:
1. Validate file type (PDF, images, Office)
2. Validate file size < 50MB
3. Upload to bucket `school-images/{module}/{year}/{month}/`
4. Create documents record with file_url
5. Increment upload counter in documents table

**Implementation**:
```typescript
export const uploadDocument = async (
  file: File,
  metadata: {
    title: string,
    category_id: string,
    department_id: string,
    academic_year: string
  }
) => {
  const fileName = `${metadata.academic_year}/${Date.now()}_${file.name}`;
  
  // 1. Upload file to storage
  const { data: storageData, error: uploadError } = await supabase.storage
    .from('school-images')
    .upload(fileName, file);
  
  // 2. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('school-images')
    .getPublicUrl(fileName);
  
  // 3. Create document record
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert([{
      title: metadata.title,
      category_id: metadata.category_id,
      department_id: metadata.department_id,
      academic_year: metadata.academic_year,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploader_id: userId,
      uploader_name: userName,
      is_public: false,
      status: 'active'
    }]);
  
  return doc;
};
```

**Estimated Effort**: 6 hours

---

### 2.2 Duty Tracking System

#### 2.2.1 Daily Duty Record Entry
**File**: `src/components/admin/sodflow/DutyRecorder.tsx` (CREATE)
**Purpose**: Record daily duty/supervision activities
**Features**:
- Date picker (today, past dates)
- Shift selector (morning, afternoon, evening)
- Student attendance count (present/absent)
- Incident reporting
- Actions taken description
- Remarks field

**Data Entry Form**:
```typescript
interface DutyInput {
  duty_date: string,          // YYYY-MM-DD
  duty_shift: 'morning' | 'afternoon' | 'evening',
  recorder_name: string,       // Auto-filled
  start_time?: string,         // HH:mm
  end_time?: string,           // HH:mm
  students_present: number,
  students_absent: number,
  incidents?: string,          // Textarea
  actions_taken?: string,      // Textarea
  remarks?: string,            // Textarea
  status: 'draft' | 'completed' | 'reviewed'
}
```

**Query Structure**:
```typescript
export const createDutyRecord = async (data: DutyInput) => {
  return supabase
    .from('duty_records')
    .insert([data])
    .select('*, recorder:app_users(*)');
};

export const getDutyRecords = async (
  start_date: string, end_date: string
) => {
  return supabase
    .from('duty_records')
    .select('*')
    .gte('duty_date', start_date)
    .lte('duty_date', end_date)
    .order('duty_date', { ascending: false });
};
```

**Estimated Effort**: 12 hours

---

#### 2.2.2 Duty Report Dashboard
**File**: `src/components/admin/sodflow/DutyDashboard.tsx` (CREATE)
**Purpose**: Monthly duty summary and analytics
**Features**:
- Month selector
- Shift distribution chart
- Total attendance stats
- Incident summary
- Export monthly report

**Chart Data**:
```typescript
// Calculate monthly statistics
const dutyStats = async (month: number, year: number) => {
  const data = await supabase.rpc('get_duty_monthly_stats', {
    month_param: month,
    year_param: year
  });
  return {
    total_records: data.length,
    shift_breakdown: groupBy(data, 'duty_shift'),
    avg_present: avg(data.map(d => d.students_present)),
    avg_absent: avg(data.map(d => d.students_absent)),
    incidents_count: data.filter(d => d.incidents).length
  };
};
```

**Estimated Effort**: 10 hours

---

### 2.3 Leave Request Workflow

#### 2.3.1 Leave Request Manager
**File**: `src/components/admin/sodflow/LeaveRequestManager.tsx` (CREATE)
**Purpose**: Submit and approve leave requests
**Workflow**:
```
User Request → Manager Review → Approval/Rejection → Notification
    ↓               ↓                  ↓                    ↓
Status: pending   Status: pending   Status: approved   Email sent
                  Waiting for       or rejected
                  approval
```

**Features**:
- Submit leave request (requester)
- View pending requests (manager)
- Approve/Reject with reason
- View approval status (requester)

**Data Structure**:
```typescript
interface LeaveRequest {
  requester_name: string,
  requester_position?: string,
  department_id: string,
  leave_type: string,  // sick, personal, emergency, training, other
  start_date: string,
  end_date: string,
  total_days?: number,
  reason: string,
  contact_during_leave?: string,
  substitute_name?: string,
  status: 'pending' | 'approved' | 'rejected',
  approved_by?: string,
  approved_at?: string,
  rejection_reason?: string,
  academic_year: string
}
```

**RLS Requirements** (CRITICAL):
```sql
-- User can submit own request
CREATE POLICY "Users request own leave" ON leave_requests
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Manager can approve own department
CREATE POLICY "Managers approve department leave" ON leave_requests
  FOR UPDATE
  USING (user_is_manager_of_department(department_id));
```

**Estimated Effort**: 14 hours

---

#### 2.3.2 Leave Calendar View
**File**: `src/components/admin/sodflow/LeaveCalendar.tsx` (CREATE)
**Purpose**: Visualize staff on leave
**Features**:
- Month view calendar
- Color-coded leave types
- Staff name hover tooltip
- Filter by department
- Quick-view absence coverage

**Estimated Effort**: 8 hours

---

### 2.4 Maintenance Request System

#### 2.4.1 Maintenance Request Tracker
**File**: `src/components/admin/sodflow/MaintenanceTracker.tsx` (CREATE)
**Purpose**: Report and track facility maintenance
**Features**:
- Report maintenance issue
- Track status (open → in_progress → completed)
- Assign to maintenance staff
- Estimate vs actual cost
- Photo upload for documentation

**Status Workflow**:
```
open → [in_progress] → completed → [closed]
       (assigned to        (notes
        maintenance)       added)
```

**Data Structure**:
```typescript
interface MaintenanceRequest {
  title: string,
  location: string,
  room_number?: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'open' | 'in_progress' | 'completed' | 'closed',
  reported_by: string,
  reporter_phone?: string,
  assigned_to?: string,
  estimated_cost?: number,
  actual_cost?: number,
  image_url?: string,
  completion_notes?: string
}
```

**Estimated Effort**: 12 hours

---

### 2.5 RLS Hardening - Phase 1 Implementation
**Tasks**:
- [ ] Fix gallery_photos visibility policy (30 min)
- [ ] Add role validation to gallery_albums (30 min)
- [ ] Add document access control by department (1 hr)
- [ ] Add duty record role filtering (1 hr)
- [ ] Validate leave approval by manager role (1 hr)

**Estimated Effort**: 4 hours

---

### Phase 2 Deliverables

| Component | File | Status | Effort | Dependencies |
|-----------|------|--------|--------|--------------|
| DocumentBrowser | sodflow/DocumentBrowser.tsx | 🔄 | 16h | documents table |
| DocumentCategoryManager | sodflow/DocumentCategoryManager.tsx | 🔄 | 8h | document_categories |
| DutyRecorder | sodflow/DutyRecorder.tsx | 🔄 | 12h | duty_records |
| DutyDashboard | sodflow/DutyDashboard.tsx | 🔄 | 10h | duty_records |
| LeaveRequestManager | sodflow/LeaveRequestManager.tsx | 🔄 | 14h | leave_requests, RLS |
| LeaveCalendar | sodflow/LeaveCalendar.tsx | 🔄 | 8h | leave_requests |
| MaintenanceTracker | sodflow/MaintenanceTracker.tsx | 🔄 | 12h | maintenance_requests |
| Document Upload Util | utils/documentUpload.ts | 🔄 | 6h | storage |
| RLS Phase 1 Hardening | migrations/024_rls_phase1.sql | 🔄 | 4h | Phase 1 base |
| Query Module | lib/queries/sodflow.ts | 🔄 | 8h | All above |
| Tests | __tests__/sodflow.test.ts | 🔄 | 12h | All above |

**Phase 2 Total Effort**: ~110 hours (2 weeks with 5-person team)

---

---

## Phase 3: Project Management Features (Weeks 5-6)

### Objective
Build comprehensive project management with team, document, and budget request tracking.

### Dependencies
- ✅ Complete Phase 2
- ✅ projects table functional
- ✅ app_users roles verified

---

### 3.1 Project Dashboard

#### 3.1.1 Project List & Filtering
**File**: `src/components/admin/projects/ProjectDashboard.tsx` (UPDATE)
**Features**:
- Filter by status (planning, in_progress, completed, closed)
- Filter by department
- Filter by academic year
- Search by title
- Sort by start_date, budget_amount, status
- Quick stats:
  - Total projects: X
  - In progress: X
  - Completed: X
  - Total budget: ₿X

**Estimated Effort**: 8 hours

---

#### 3.1.2 Project Detail View
**File**: `src/components/admin/projects/ProjectDetail.tsx` (UPDATE)
**Displays**:
- Project metadata (title, type, status)
- Timeline (start/end dates)
- Budget information (allocated vs used)
- Team members (list)
- Related documents (list)
- Budget requests (pending/approved)
- Project objectives & outcomes

**Estimated Effort**: 12 hours

---

### 3.2 Project Team Management

#### 3.2.1 Team Member Roster
**File**: `src/components/admin/projects/ProjectTeam.tsx` (CREATE)
**Features**:
- Add team members by role (leader, coordinator, member, advisor)
- Remove members
- Track join date
- Edit responsibilities
- View member details

**Data Structure**:
```typescript
interface ProjectTeamMember {
  project_id: string,
  user_id: string,
  user_name: string,
  role: 'leader' | 'coordinator' | 'member' | 'advisor',
  responsibilities?: string,
  joined_at?: string
}
```

**RLS Requirements**:
```sql
-- Project leaders can manage team
CREATE POLICY "Leaders manage team" ON project_team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_team_members ptm
      WHERE ptm.project_id = project_team_members.project_id
        AND ptm.user_id = auth.uid()
        AND ptm.role = 'leader'
    )
  );
```

**Estimated Effort**: 10 hours

---

### 3.3 Project Document Management

#### 3.3.1 Project Document Tracker
**File**: `src/components/admin/projects/ProjectDocuments.tsx` (CREATE)
**Purpose**: Track required and submitted documents
**Features**:
- Define required documents (plan, proposal, report, approval, receipt)
- Mark as required/optional
- Track submission status
- Approval workflow
- Link to documents table

**Workflow**:
```
Required? → pending → [submitted] → [approved] → linked
  │                      ↓             ↓
  └─ Optional          Review         Approved
```

**Estimated Effort**: 10 hours

---

### 3.4 Project Timeline & Milestone

#### 3.4.1 Gantt Chart View
**File**: `src/components/admin/projects/ProjectGanttChart.tsx` (CREATE)
**Purpose**: Visual project timeline
**Features**:
- Display start/end dates
- Show project duration
- Overlap detection
- Milestone markers
- Export as image

**Library**: Consider `react-gantt-chart` or similar

**Estimated Effort**: 8 hours

---

### 3.5 RLS Hardening - Phase 2 Implementation
**Tasks**:
- [ ] Restrict document access by department (1 hr)
- [ ] Add team member access control (1 hr)
- [ ] Add project manager authorization (1 hr)
- [ ] Test cross-department visibility (1 hr)

**Estimated Effort**: 4 hours

---

### Phase 3 Deliverables

| Component | File | Effort |
|-----------|------|--------|
| Project Dashboard | projects/ProjectDashboard.tsx | 8h |
| Project Detail | projects/ProjectDetail.tsx | 12h |
| Team Roster | projects/ProjectTeam.tsx | 10h |
| Document Tracker | projects/ProjectDocuments.tsx | 10h |
| Gantt Chart | projects/ProjectGanttChart.tsx | 8h |
| RLS Phase 2 Hardening | migrations/025_rls_phase2.sql | 4h |
| Query Module | lib/queries/projects.ts | 8h |
| Tests | __tests__/projects.test.ts | 10h |

**Phase 3 Total Effort**: ~70 hours (2 weeks)

---

---

## Phase 4: Budget Management Features (Weeks 7-8)

### Objective
Implement comprehensive budget planning, tracking, and reporting.

### Dependencies
- ✅ Budget tables (002_project_budget_management.sql)
- ✅ Budget functions (023_budget_constraints_and_functions.sql)
- ✅ Projects feature complete

---

### 4.1 Budget Planning

#### 4.1.1 Budget Category Setup
**File**: budget_categories table (pre-populated)
**Categories**:
- บุคลากร (Personnel)
- วัสดุ (Materials)
- บริการ (Services)
- อุปกรณ์ (Equipment)
- สาธารณูปโภค (Utilities)
- อื่นๆ (Other)

**Estimated Effort**: 0 hours (pre-configured)

---

#### 4.1.2 Budget Item Setup
**File**: `src/components/admin/projects/BudgetPlanner.tsx` (UPDATE)
**Purpose**: Plan project budget by category
**Features**:
- Select budget category
- Set planned amount
- Add description
- List all items
- Calculate total

**Estimated Effort**: 8 hours

---

### 4.2 Budget Tracking

#### 4.2.1 Budget Transaction Recorder
**File**: `src/components/admin/projects/BudgetTransactionForm.tsx` (CREATE)
**Purpose**: Record actual spending against budget items
**Features**:
- Select budget item
- Enter amount (expense/refund/adjustment)
- Transaction date
- Description
- Attach receipt document
- Notes

**Data Structure**:
```typescript
interface BudgetTransaction {
  project_id: string,
  budget_item_id?: string,
  amount: number,
  transaction_type: 'expense' | 'refund' | 'adjustment',
  description: string,
  transaction_date: string,
  created_by: string,
  document_id?: string,
  notes?: string
}
```

**Estimated Effort**: 10 hours

---

#### 4.2.2 Budget Dashboard
**File**: `src/components/admin/projects/BudgetDashboard.tsx` (UPDATE)
**Displays**:
- Total budget allocated
- Total spent
- Remaining budget
- Percentage used
- By category breakdown
- Monthly spending trend
- Variance analysis

**Chart Components**:
- Progress bar (spent vs budget)
- Pie chart (by category)
- Bar chart (monthly trend)
- Table (transaction list)

**Estimated Effort**: 12 hours

---

#### 4.2.3 Budget vs Actual Analysis
**File**: `src/components/admin/projects/BudgetAnalysis.tsx` (CREATE)
**Purpose**: Compare planned vs actual spending
**Features**:
- Category-level comparison
- Variance calculation
- Over/under budget alerts
- Trend analysis
- Historical comparison

**Report Section**:
```
Category      │ Planned   │ Actual    │ Variance  │ Status
──────────────┼───────────┼───────────┼───────────┼─────────
Personnel     │ 50,000    │ 48,500    │ -1,500    │ ✓ OK
Materials     │ 20,000    │ 21,200    │ +1,200    │ ⚠️ Over
Services      │ 15,000    │ 14,800    │ -200      │ ✓ OK
──────────────┼───────────┼───────────┼───────────┼─────────
TOTAL         │ 85,000    │ 84,500    │ -500      │ ✓ OK
```

**Estimated Effort**: 10 hours

---

### 4.3 Budget Approval Workflow

#### 4.3.1 Budget Request Tracker
**File**: `src/components/admin/projects/BudgetRequestTracker.tsx` (UPDATE)
**Purpose**: Track budget allocation requests
**Workflow**:
```
Request → Manager Review → Approval → Payment → Receipt
  ↓            ↓               ↓         ↓        ↓
pending      pending        approved   paid   completed
```

**Features**:
- Create budget request
- Add reason & description
- Submit for approval
- Manager reviews & approves
- Mark as paid
- Attach receipt document

**Estimated Effort**: 12 hours

---

#### 4.3.2 Payment Authorization Letter
**File**: `src/lib/reports/budgetPaymentLetter.ts` (CREATE)
**Purpose**: Generate official payment authorization
**Features**:
- Project name & details
- Payment amount
- Authorization signature field
- Date & approver info
- Export to PDF

**Estimated Effort**: 6 hours

---

### 4.4 Budget Reporting

#### 4.4.1 Monthly Budget Report
**File**: `src/lib/reports/monthlyBudgetReport.ts` (CREATE)
**Generates**:
- Executive summary
- Category breakdown
- Department totals
- Approval status summary
- Expenditure trends
- Forecast next month

**Report Format**: PDF + CSV export

**Estimated Effort**: 8 hours

---

#### 4.4.2 RLS Hardening - Phase 3 Implementation
**Tasks**:
- [ ] Restrict budget view by department/role (1 hr)
- [ ] Add transaction approval validation (1 hr)
- [ ] Implement audit logging for transactions (2 hr)
- [ ] Set up budget audit trail (1 hr)

**Estimated Effort**: 5 hours

---

### Phase 4 Deliverables

| Component | File | Effort |
|-----------|------|--------|
| Budget Planner | projects/BudgetPlanner.tsx | 8h |
| Transaction Recorder | projects/BudgetTransactionForm.tsx | 10h |
| Budget Dashboard | projects/BudgetDashboard.tsx | 12h |
| Budget Analysis | projects/BudgetAnalysis.tsx | 10h |
| Request Tracker | projects/BudgetRequestTracker.tsx | 12h |
| Payment Letter | lib/reports/budgetPaymentLetter.ts | 6h |
| Monthly Report | lib/reports/monthlyBudgetReport.ts | 8h |
| RLS Phase 3 Hardening | migrations/026_rls_phase3.sql | 5h |
| Query Module | lib/queries/budget.ts | 10h |
| Tests | __tests__/budget.test.ts | 12h |

**Phase 4 Total Effort**: ~93 hours (2 weeks with 5-person team)

---

---

## Phase 5: Security & Audit Implementation (Weeks 9-10)

### Objective
Implement complete RLS hardening and audit logging for compliance.

### Dependencies
- ✅ Phases 1-4 complete
- ✅ All tables with proper access patterns
- ✅ User roles defined in app_users

---

### 5.1 RLS Policy Hardening

#### 5.1.1 Complete Hardening Implementation
**Migration**: `027_rls_complete_hardening.sql` (CREATE)
**Includes**:

1. **Document Access Control**
   - Public documents readable by all
   - Department documents readable only by dept members
   - Only dept_head+ can create/modify

2. **Duty Record Protection**
   - Only staff (not students) can view
   - Only supervisors can create
   - Only dept_head+ can approve/modify

3. **Leave Request Protection**
   - Users can request own leave
   - Dept managers can approve own dept
   - Directors can approve any dept
   - Admins can override

4. **Maintenance Protection**
   - All staff can report
   - Assigned staff can update
   - Only admin can close

5. **Audit Evaluation Protection**
   - Committee members only
   - Confidential scores
   - Users see only results when submitted

6. **Budget Protection**
   - Project leaders can view own project
   - Dept heads see dept budgets
   - Directors see all
   - Admins full access

**SQL File Size**: ~200 lines  
**Estimated Effort**: 6 hours

---

#### 5.1.2 RLS Policy Testing Suite
**File**: `__tests__/rls.test.ts` (CREATE)
**Tests Coverage**:
- 50+ RLS policy tests
- Different user roles
- Cross-department access
- Public vs private data
- Attack scenarios

**Test Categories**:
```typescript
describe('RLS Policies', () => {
  describe('Gallery', () => {
    test('Public sees only published albums');
    test('Admin can manage all albums');
    test('Non-admin cannot update');
  });
  
  describe('Documents', () => {
    test('Other dept cannot see dept docs');
    test('Public docs visible to all');
    test('Non-dept-head cannot create');
  });
  
  describe('Budget', () => {
    test('Non-project member cannot view budget');
    test('Project leader can view own budget');
    test('Cross-dept access denied');
  });
  
  // ... more tests
});
```

**Estimated Effort**: 12 hours

---

### 5.2 Audit Logging

#### 5.2.1 Audit Log Table & Triggers
**Migration**: `028_audit_logging.sql` (CREATE)
**Tables**:
- audit_logs (comprehensive change tracking)
- budget_audit_logs (detailed financial tracking)
- system_audit_logs (admin actions)

**Tracked Events**:
- INSERT/UPDATE/DELETE on all SodFlow tables
- Budget transactions
- Leave approvals
- Document uploads
- User logins
- Admin actions

**Schema**:
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY,
  table_name VARCHAR(100),
  operation VARCHAR(10),  -- INSERT, UPDATE, DELETE
  record_id UUID,
  user_id UUID,
  user_name VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET
);
```

**Estimated Effort**: 8 hours

---

#### 5.2.2 Audit Log Viewer Component
**File**: `src/components/admin/audit/AuditLogViewer.tsx` (CREATE)
**Features**:
- Filter by table
- Filter by user
- Filter by operation
- Filter by date range
- Search by record_id
- View before/after values
- Export audit trail

**UI Elements**:
- Filters bar
- Timeline view
- Detailed change viewer
- Export button (CSV/PDF)

**Estimated Effort**: 10 hours

---

#### 5.2.3 Compliance Reports
**File**: `src/lib/reports/complianceReport.ts` (CREATE)
**Reports Included**:
- Monthly audit summary
- Security incidents
- Data modification trends
- Access pattern analysis
- System health status

**Report Frequency**: Monthly (auto-generated)

**Estimated Effort**: 8 hours

---

### 5.3 Access Control Verification

#### 5.3.1 Role Permission Matrix
**File**: `src/lib/permissions/rolePermissions.ts` (CREATE)
**Defines**: Complete permission matrix for 8 roles

```typescript
const PERMISSION_MATRIX = {
  admin: {
    documents: ['view_all', 'create', 'edit_all', 'delete_all', 'publish'],
    projects: ['view_all', 'create', 'edit_all', 'delete_all', 'approve'],
    budget: ['view_all', 'create', 'edit_all', 'approve', 'close'],
    audit: ['view_all', 'create_eval', 'view_results'],
    leave: ['view_all', 'approve_all'],
    duty: ['view_all', 'record', 'approve_all']
  },
  director: {
    // ...limited permissions
  },
  dept_head: {
    // ...department-specific permissions
  },
  teacher: {
    // ...minimal permissions
  }
  // ... 4 more roles
};
```

**Estimated Effort**: 4 hours

---

#### 5.3.2 Permission Verification Utility
**File**: `src/lib/permissions/checkPermission.ts` (CREATE)
**Code Example**:
```typescript
export const canEditDocument = async (userId: string, docId: string) => {
  const user = await getUser(userId);
  const doc = await getDocument(docId);
  
  // Admin can edit all
  if (user.role === 'admin') return true;
  
  // Director can edit own dept docs
  if (user.role === 'director' && user.dept_id === doc.dept_id) return true;
  
  // Dept head can edit own dept docs
  if (user.role === 'dept_head') return user.dept_id === doc.dept_id;
  
  // Creator can edit own docs
  if (doc.uploader_id === userId) return true;
  
  return false;
};
```

**Estimated Effort**: 4 hours

---

### 5.4 Security Audit Report

#### 5.4.1 Generate Security Audit Report
**File**: `docs/SECURITY_AUDIT.md` (CREATE)
**Covers**:
- RLS policy audit (before/after) ✅ DONE
- Permission matrix
- Audit logging verification
- Testing results summary
- Compliance checklist
- Recommendations

**Estimated Effort**: 4 hours

---

### Phase 5 Deliverables

| Component | File | Effort |
|-----------|------|--------|
| RLS Hardening | migrations/027_rls_complete_hardening.sql | 6h |
| RLS Policy Tests | __tests__/rls.test.ts | 12h |
| Audit Log Tables | migrations/028_audit_logging.sql | 8h |
| Audit Log Viewer | admin/audit/AuditLogViewer.tsx | 10h |
| Compliance Reports | lib/reports/complianceReport.ts | 8h |
| Role Permissions | lib/permissions/rolePermissions.ts | 4h |
| Permission Utility | lib/permissions/checkPermission.ts | 4h |
| Security Audit Report | docs/SECURITY_AUDIT.md | 4h |
| Audit Log Queries | lib/queries/audit.ts | 6h |
| Tests | __tests__/security.test.ts | 10h |

**Phase 5 Total Effort**: ~72 hours (2 weeks)

---

---

## Phase 6: Testing & Deployment (Weeks 11-12)

### Objective
Comprehensive testing, documentation, and production deployment.

### Deliverables

#### 6.1 Integration Testing
- [ ] End-to-end workflow tests
- [ ] Cross-module integration tests
- [ ] Performance tests (load testing)
- [ ] Regression tests

**Effort**: 16 hours

---

#### 6.2 User Acceptance Testing (UAT)
- [ ] Test cases for each feature
- [ ] UAT environment setup
- [ ] User training materials
- [ ] Feedback collection

**Effort**: 12 hours

---

#### 6.3 Documentation
- [ ] API documentation
- [ ] Component library docs
- [ ] User guides (Thai/English)
- [ ] Administrator manual

**Effort**: 16 hours

---

#### 6.4 Deployment
- [ ] Pre-deployment checklist
- [ ] Database migration execution
- [ ] Zero-downtime deployment strategy
- [ ] Rollback procedures
- [ ] Monitoring setup

**Effort**: 8 hours

---

#### 6.5 Production Support
- [ ] Incident response procedures
- [ ] Troubleshooting guide
- [ ] Performance monitoring
- [ ] Security monitoring

**Effort**: 8 hours

---

**Phase 6 Total Effort**: ~60 hours (2 weeks)

---

---

## Summary By the Numbers

### Total Implementation Timeline

| Phase | Duration | Effort | Team |
|-------|----------|--------|------|
| Phase 1: Database & Types | 2 weeks | 14h | 1-2 |
| Phase 2: SodFlow | 2 weeks | 110h | 5-6 |
| Phase 3: Projects | 2 weeks | 70h | 4-5 |
| Phase 4: Budget | 2 weeks | 93h | 5-6 |
| Phase 5: Security | 2 weeks | 72h | 4-5 |
| Phase 6: Testing & Deploy | 2 weeks | 60h | 3-4 |
| **TOTAL** | **12 weeks** | **419 hours** | **4-5 avg** |

### Resource Allocation (Recommended)
- **1 Tech Lead**: All phases (full-time)
- **2 Senior Frontend**: Phases 2-6 (full-time)
- **1 Backend Engineer**: Phases 1, 3-5 (full-time)
- **1 QA Engineer**: Phase 6 (full-time)
- **1 UI/UX Designer**: Phases 2-4 supporting

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| RLS policy bugs | HIGH | MEDIUM | Comprehensive testing, code review |
| Data migration issues | HIGH | LOW | Dev environment testing first |
| Performance under load | MEDIUM | MEDIUM | Load testing in Phase 6 |
| Staff training needs | MEDIUM | MEDIUM | Early training, documentation |
| Scope creep | MEDIUM | MEDIUM | Strict change control |
| Third-party API failures | LOW | LOW | Graceful degradation, caching |

---

## Success Criteria

- [x] All 28 database tables have proper TypeScript definitions
- [x] Database schema documented with ER diagrams
- [x] Gallery tables verified and named correctly
- [x] RLS security audit completed (11 critical issues identified)
- [ ] Phase 1 RLS hardening applied (in progress)
- [ ] Phase 2 SodFlow features complete
- [ ] Phase 3 Project features complete
- [ ] Phase 4 Budget features complete
- [ ] Phase 5 Security hardening complete
- [ ] All 50+ unit tests passing
- [ ] All 50+ RLS policy tests passing
- [ ] Zero critical security findings
- [ ] 90%+ code coverage
- [ ] User acceptance testing passed
- [ ] Production deployment successful

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete Phase 1 types (DONE)
2. ✅ Document database schema (DONE)
3. ✅ Audit gallery & RLS (DONE)
4. 🔄 Apply Phase 1 RLS hardening fixes
5. 🔄 Begin Phase 2 component development

### Short Term (Next 2 Weeks)
1. Begin Phase 2 SodFlow implementation
2. Set up unit test infrastructure
3. Conduct code review of Phase 1
4. Schedule team training on SodFlow module

### Medium Term (Month 1-3)
1. Complete Phases 2 & 3 development
2. Set up CI/CD pipeline
3. Begin pre-UAT testing
4. Prepare user documentation

---

**Document Version**: 1.0  
**Last Updated**: 2568-01-15  
**Next Review**: Weekly during implementation  
**Approval Status**: Ready for Implementation Review  

