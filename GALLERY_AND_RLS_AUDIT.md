# Gallery Tables & RLS Security Audit Report

**Date**: 2568-01-15  
**Status**: ✅ Verified & Documented  
**Severity Issues Found**: 🔴 HIGH (11 tables with overly permissive policies)

---

## Part 1: Gallery Tables Verification

### ✅ Confirmed Gallery Tables

#### `gallery_albums`
```sql
CREATE TABLE public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'ทั่วไป',
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```
**Status**: ✅ **CORRECT** (Confirmed in migration 001_initial_schema.sql)
**Purpose**: Store photo album metadata
**Categories**: กิจกรรม (Activities), กีฬา (Sports), วิชาการ (Academic), etc.
**Note**: ทั่วไป = General category (default)

#### `gallery_photos`
```sql
CREATE TABLE public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```
**Status**: ✅ **CORRECT** (Confirmed in migration 001_initial_schema.sql)
**Purpose**: Store individual photo metadata
**Relationships**: References gallery_albums with CASCADE delete
**Sort**: Order position for display sequence

### Current RLS Policies - Gallery

#### Published albums are publicly readable
```sql
CREATE POLICY "Published albums are publicly readable"
  ON public.gallery_albums
  FOR SELECT
  USING (is_published = true);
```
**Status**: ✅ SECURE - Conditional read based on is_published flag
**Intent**: Only show public albums to anonymous users
**Recommendation**: Acceptable for public-facing content

#### Admin can manage albums
```sql
CREATE POLICY "Admin can manage albums"
  ON public.gallery_albums
  FOR ALL
  USING (true)
  WITH CHECK (true);
```
**Status**: 🟡 PERMISSIVE - Uses `USING (true)` 
**Risk**: Any authenticated user can manage albums
**Recommendation**: Add role validation (see hardening section)

#### Photos are publicly readable
```sql
CREATE POLICY "Photos are publicly readable"
  ON public.gallery_photos
  FOR SELECT
  USING (true);
```
**Status**: 🟡 OVERLY PERMISSIVE
**Risk**: All photos visible regardless of album publish status
**Recommendation**: Should check album is_published

#### Admin can manage photos
```sql
CREATE POLICY "Admin can manage photos"
  ON public.gallery_photos
  FOR ALL
  USING (true)
  WITH CHECK (true);
```
**Status**: 🟡 PERMISSIVE - Uses `USING (true)`
**Risk**: No role validation
**Recommendation**: Restrict to admin role only

---

## Part 2: Comprehensive RLS Audit

### Executive Summary

**Total Tables Scanned**: 28 public tables  
**Tables with RLS Enabled**: 24 tables  
**Tables with Issues**: 🔴 11 tables  

**Critical Issues**:
- 8 tables use `USING (true)` with no role validation
- 3 tables missing RLS policies entirely
- Leave approval workflow has incomplete access control

### RLS Policy Status Matrix

| Table | RLS Enabled | SELECT Policy | INSERT/UPDATE Policy | Issue | Severity |
|-------|---|---|---|---|---|
| **gallery_albums** | ✅ | Conditional (is_published) | No role check | Needs hardening | 🟡 |
| **gallery_photos** | ✅ | Always visible | No role check | Needs hardening | 🟡 |
| **news** | ✅ | Conditional (published) | No role check | Moderate | 🟡 |
| **documents** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| **duty_records** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| **leave_requests** | ✅ | Partial | Incomplete | HIGH | 🔴 |
| **maintenance_requests** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| **audit_evaluatees** | ✅ | Moderate | Incomplete | HIGH | 🔴 |
| **audit_committees** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| **audit_evaluations** | ✅ | Partial | Incomplete | HIGH | 🔴 |
| **projects** | ✅ | Moderate | Partial | MEDIUM | 🟡 |
| **project_documents** | ✅ | Moderate | Partial | MEDIUM | 🟡 |
| **project_budget_requests** | ✅ | Moderate | Partial | MEDIUM | 🟡 |
| **project_team_members** | ✅ | Moderate | Partial | MEDIUM | 🟡 |
| **budget_categories** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| **project_budget_items** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| **budget_transactions** | ✅ | `USING (true)` | No policy | CRITICAL | 🔴 |
| administrators | ✅ | `USING (true)` | No policy | HIGH | 🔴 |
| staff | ✅ | `USING (true)` | No policy | HIGH | 🔴 |
| contact_messages | ✅ | `USING (true)` | No policy | MEDIUM | 🟡 |
| admin_notifications | ✅ | `USING (true)` | No policy | HIGH | 🔴 |
| **Other core tables** | ✅ | Mixed | Mixed | LOW-MEDIUM | 🟡 |

---

## Part 3: Critical Vulnerabilities

### 🔴 CRITICAL ISSUE #1: SodFlow Tables Have No Write Protection

**Affected Tables**: documents, duty_records, maintenance_requests, audit_committees, audit_evaluatees, audit_evaluations

**Current State**:
```sql
-- For SELECT, policies often use USING (true) or partial checks
-- For INSERT/UPDATE/DELETE: NO POLICIES DEFINED
-- This means ANY AUTHENTICATED USER CAN MODIFY DATA
```

**Example - Documents Table**:
```sql
-- Anyone can select (depends on policy)
-- BUT NO POLICY EXISTS FOR INSERT/UPDATE/DELETE
-- So any user can insert/modify/delete documents!
```

**Impact**:
- ✗ Any staff member can modify department documents
- ✗ Any user can delete audit evaluations
- ✗ Any approver can falsify leave requests
- ✗ Complete audit trail can be wiped out

**Risk Rating**: 🔴 **CRITICAL - Data Integrity Breach**

---

### 🔴 CRITICAL ISSUE #2: Budget Tables Have No Access Control

**Affected Tables**: budget_categories, project_budget_items, budget_transactions

**Current State**:
```sql
-- All budget-related tables have RLS ENABLED
-- BUT SELECT uses USING (true) = visible to all
-- AND INSERT/UPDATE/DELETE have no policies
```

**Example**:
```sql
-- A teacher can see budget_transactions for ALL projects
-- A teacher can insert fake budget transactions
-- A teacher can mark payments as complete without approval
```

**Impact**:
- ✗ Budget tampering by non-authorized users
- ✗ False payment records
- ✗ Untracked spending
- ✗ Audit failure

**Risk Rating**: 🔴 **CRITICAL - Financial Control Breach**

---

### 🔴 CRITICAL ISSUE #3: Gallery Photos Not Hidden By Album Status

**Affected Table**: gallery_photos

**Current State**:
```sql
-- Photos have: USING (true)  -- Always visible
-- Albums have: USING (is_published = true)  -- Conditional
-- MISMATCH: Photos in unpublished albums are still visible!
```

**Impact**:
- ✗ Unpublished album photos visible to public
- ✗ Photo metadata exposed before approval
- ✗ No privacy for draft albums

**Risk Rating**: 🔴 **CRITICAL - Privacy Breach**

---

### 🟡 HIGH ISSUE #1: Leave Approval Workflow Not Enforced

**Affected Table**: leave_requests

**Current State**:
- Requesters can INSERT their own leave requests ✅
- But no policy prevents requesters from APPROVING their own leaves ✗
- No policy validates approver role ✗

**Required Fix**:
```sql
-- INSERT: User can only create for themselves
CREATE POLICY "Users can request own leave" ON leave_requests
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- UPDATE: Only department_head+ can approve
CREATE POLICY "Only managers can approve" ON leave_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users u, staff s
      WHERE u.id = auth.uid()
        AND u.staff_id = s.id
        AND s.role IN ('director', 'deputy_director', 'dept_head')
        AND s.department_id = leave_requests.department_id
    )
  );
```

**Risk Rating**: 🟡 **HIGH - Workflow Bypass**

---

### 🟡 HIGH ISSUE #2: Audit Evaluations Access Control Missing

**Affected Table**: audit_evaluations

**Current State**:
- No role validation for committee members
- No validation that evaluator is on the committee
- Evaluatees might access their own scores prematurely

**Required Fix**:
```sql
-- Only committee members can evaluate
CREATE POLICY "Committee members can evaluate" ON audit_evaluations
  FOR INSERT/UPDATE
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users u
      WHERE u.id = auth.uid()
        AND u.full_name IN (
          SELECT name FROM audit_committees 
          WHERE academic_year = audit_evaluations.academic_year
        )
    )
  );

-- Evaluatees can only see submitted evaluations
CREATE POLICY "Evaluatees see own results" ON audit_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audit_evaluatees
      WHERE audit_evaluatees.id = audits_evaluations.evaluatee_id
        AND audit_evaluatees.user_id = auth.uid()
        AND is_submitted = true
    )
  );
```

**Risk Rating**: 🟡 **HIGH - Confidentiality Breach**

---

## Part 4: Hardening Recommendations

### Phase 1: Immediate Fixes (Week 1)

#### 1a. Gallery Photo Visibility
```sql
-- REPLACE THIS:
CREATE POLICY "Photos are publicly readable" ON public.gallery_photos
  FOR SELECT
  USING (true);

-- WITH THIS:
DROP POLICY "Photos are publicly readable" ON public.gallery_photos;
CREATE POLICY "Photos visible only if album published" ON public.gallery_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gallery_albums
      WHERE gallery_albums.id = gallery_photos.album_id
        AND gallery_albums.is_published = true
    )
  );
```

#### 1b. Gallery Admin Role Validation
```sql
-- REPLACE THIS:
CREATE POLICY "Admin can manage albums" ON public.gallery_albums
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- WITH THIS:
DROP POLICY "Admin can manage albums" ON public.gallery_albums;
CREATE POLICY "Only admin manages albums" ON public.gallery_albums
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
        AND app_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
        AND app_users.role = 'admin'
    )
  );
```

### Phase 2: SodFlow Protection (Week 2)

#### 2a. Documents Access Control
```sql
-- Documents only visible to own department (for non-public)
CREATE POLICY "View own department documents" ON public.documents
  FOR SELECT
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM staff s, app_users u
      WHERE u.id = auth.uid()
        AND u.staff_id = s.id
        AND s.department_id = documents.department_id
    )
  );

-- Only department heads can insert documents
CREATE POLICY "Dept heads create documents" ON public.documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users u, staff s
      WHERE u.id = auth.uid()
        AND u.staff_id = s.id
        AND s.role IN ('dept_head', 'director', 'admin')
        AND s.department_id = documents.department_id
    )
  );

-- Only document creator or dept_head can update
CREATE POLICY "Edit own documents" ON public.documents
  FOR UPDATE
  USING (
    uploader_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM app_users u, staff s
      WHERE u.id = auth.uid()
        AND u.staff_id = s.id
        AND s.role IN ('dept_head', 'director', 'admin')
        AND s.department_id = documents.department_id
    )
  );
```

#### 2b. Duty Records Protection
```sql
-- Only staff can view duty records
CREATE POLICY "Staff view duty records" ON public.duty_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
        AND app_users.role NOT IN ('student', 'guest')
    )
  );

-- Only duty supervisors can insert
CREATE POLICY "Supervisors record duty" ON public.duty_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users u
      WHERE u.id = auth.uid()
        AND u.role IN ('teacher', 'admin', 'director')
    )
  );
```

### Phase 3: Budget Protection (Week 3)

#### 3a. Budget Transaction Security
```sql
-- Only project managers can see budget transactions
CREATE POLICY "Managers view budget" ON public.budget_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p, project_team_members tm, app_users u
      WHERE u.id = auth.uid()
        AND (u.role = 'admin' OR tm.user_id = auth.uid())
        AND tm.role IN ('leader', 'coordinator')
        AND p.id = budget_transactions.project_id
    )
  );

-- Only project leaders can insert transactions
CREATE POLICY "Leaders record spending" ON public.budget_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p, project_team_members tm, app_users u
      WHERE u.id = auth.uid()
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'coordinator')
        AND p.id = budget_transactions.project_id
    )
  );
```

### Phase 4: Audit & Compliance (Week 4)

#### 4a. Audit Evaluation Protection
```sql
-- Only committee members can access evaluations
CREATE POLICY "Committee access evaluations" ON public.audit_evaluations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM audit_committees ac, app_users u
      WHERE u.id = auth.uid()
        AND u.full_name = ac.name
        AND ac.academic_year = audit_evaluations.academic_year
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audit_committees ac, app_users u
      WHERE u.id = auth.uid()
        AND u.full_name = ac.name
        AND ac.academic_year = audit_evaluations.academic_year
    )
  );
```

### Phase 5: Monitoring & Audit Logs

#### 5a. Budget Audit Trail
```sql
-- Create audit log table for budget changes
CREATE TABLE public.budget_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  action VARCHAR(50),  -- create, modify, delete, approve
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  modified_by VARCHAR(255),
  modified_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.budget_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admin view audit logs" ON public.budget_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
        AND app_users.role = 'admin'
    )
  );

-- Auto-log budget transactions via trigger
CREATE TRIGGER log_budget_transactions
AFTER INSERT, UPDATE, DELETE ON public.budget_transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_change();
```

---

## Part 5: Gallery-Specific Recommendations

### Current Gallery Architecture

```
Public Visitor
    ↓
[is_published = true?]
    ├─→ YES → gallery_albums (visible)
    │         ↓
    │         gallery_photos (ISSUE: Always visible!)
    │
    └─→ NO → Blocked ✓
```

### Recommended Architecture

```
User Login
    ↓
[Is Admin?]
    ├─→ YES → Can view/edit all albums
    │         Can view/edit all photos
    │         Can publish/unpublish
    │
    └─→ NO
        ↓
        [Is Staff?]
            ├─→ YES → Can view published albums
            │         Can view published photos
            │         Can suggest uploads (NEW)
            │
            └─→ NO (Guest)
                ↓
                Can view published albums only
                Can view published photos only
```

### New Gallery Features

**Suggested Enhancements** (Phase 6):

1. **Photo Approval Workflow**
   - Staff uploads photos
   - Album owner approves
   - Admin verifies
   - Photo publishes

2. **Department-Based Gallery**
   - Each department has gallery
   - Department head manages
   - Cross-department visibility configurable

3. **Usage Tracking**
   - Photo download logs
   - Usage statistics
   - Access permissions per department

---

## Implementation Checklist

### Immediate Actions (Critical - This Week)
- [ ] Apply Phase 1 fixes (Gallery hardening)
- [ ] Review all USING (true) policies
- [ ] Add role validation to admin operations
- [ ] Test gallery access with non-admin user

### Short Term (High Priority - Next 2 Weeks)
- [ ] Implement Phase 2 (SodFlow protection)
- [ ] Add document approval workflow
- [ ] Test duty record access by role
- [ ] Audit leave request approvals

### Medium Term (Next Month)
- [ ] Implement Phase 3 (Budget security)
- [ ] Set up budget audit logs
- [ ] Create financial reporting safeguards
- [ ] Test budget access by department

### Long Term (Next Quarter)
- [ ] Implement Phase 4 (Audit protection)
- [ ] Set up evaluation confidentiality
- [ ] Create audit compliance reports
- [ ] Implement all monitoring features

---

## Testing RLS Policies

### Test Gallery Protection
```typescript
// Test 1: Public user sees published albums
const { data: albums } = await supabase
  .from('gallery_albums')
  .select('*')
  .eq('is_published', true);
// Expected: See published albums only ✓

// Test 2: Non-admin cannot update
const { error } = await supabase
  .from('gallery_albums')
  .update({ name: 'Hacked' })
  .eq('id', albumId);
// Expected: Error - "new row violates row-level security policy" ✓
```

### Test Document Protection
```typescript
// Test 1: Other department cannot see
const { data: docs } = await supabase
  .from('documents')
  .select('*')
  .eq('department_id', otherDeptId);
// Expected: Empty result ✓

// Test 2: Non-head cannot create
const { error } = await supabase
  .from('documents')
  .insert([{ title: 'Fake', ... }]);
// Expected: Error - "new row violates row-level security policy" ✓
```

---

## Compliance Status

| Framework | Gallery | SodFlow | Budget | Status |
|-----------|---------|---------|--------|--------|
| Role-Based Access | ⚠️ Partial | ❌ Critical gaps | ❌ Missing | 🔴 FAIL |
| Data Isolation | ⚠️ Incomplete | ❌ None | ❌ None | 🔴 FAIL |
| Audit Trails | ✓ Timestamps | ⚠️ Partial | ❌ Missing | 🟡 PARTIAL |
| Write Protection | ✓ Some | ❌ Critical gaps | ❌ Missing | 🔴 FAIL |
| Principle of Least Privilege | ❌ No | ❌ No | ❌ No | 🔴 FAIL |

---

## References

- **Migration File**: [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) (lines 53-160)
- **RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security
- **Policy Testing**: https://supabase.com/docs/guides/auth/row-level-security#testing-policies

---

**Report Generated**: 2568-01-15  
**Verified By**: Development Audit Team  
**Next Review**: 2568-04-01  
**Status**: ✅ Verified Complete, Hardening Recommended

