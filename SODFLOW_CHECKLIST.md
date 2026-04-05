# SodFlow — Implementation Checklist & Quick Actions

**Generated:** 2026-04-05  
**Status:** 📋 Ready to Implement

---

## 🎯 Priority 1️⃣: Type Safety — MUST DO FIRST

### Task 1.1: Generate/Update `types.ts` with SodFlow Tables

**Status:** ⏳ Not Started  
**Effort:** 4 hours  
**Blocking:** Yes (all other tasks depend on this)

```bash
# Step 1: Backup
cp src/integrations/supabase/types.ts src/integrations/supabase/types.ts.backup

# Step 2: Generate new types (choose one)
# Option A: Supabase CLI (if available)
supabase gen types typescript --db-url=$DATABASE_URL

# Option B: Or manually add these 12 table definitions
# See SODFLOW_SETUP.sql lines for schema
```

**Tables to Add:**
- [ ] `app_users` (id, username, password_hash, role, is_active, created_at)
- [ ] `departments` (id, name, code, color, icon, description, is_active)
- [ ] `document_categories` (id, department_id, name, code, description, is_active)
- [ ] `documents` (id, title, department_id, category_id, academic_year, status, file_url, created_by)
- [ ] `duty_records` (id, user_id, date, shift, status, notes, created_at)
- [ ] `leave_requests` (id, user_id, start_date, end_date, reason, status, workflow_step, supervisor_id)
- [ ] `maintenance_requests` (id, issue_type, description, location, priority, status, assigned_to)
- [ ] `audit_evaluatees` (id, user_id, position, academic_year, committee_members_json, is_active)
- [ ] `audit_committees` (id, full_name, position, department, academic_year, is_active)
- [ ] `audit_evaluations` (id, evaluatee_id, committee_id, scores_json, weighted_score)
- [ ] `projects` (id, title, status, budget_amount, created_by_id)
- [ ] `user_menu_permissions` (id, user_id, menu_key, permission_level)

**Verification:**
```bash
# After update, check no more 'as any'
grep -r "as any" src/components/admin/ | grep -v node_modules | wc -l
# Should be: 0 (down from 14)
```

**Files Changed:**
- `src/integrations/supabase/types.ts`

---

### Task 1.2: Remove All `as any` Casts

**Status:** ⏳ Not Started (blocked by 1.1)  
**Effort:** 1 hour  
**Blocking:** Yes

Find & replace in these files:

```typescript
// BEFORE:
const result = await (supabase.from('documents' as any) as any).insert([payload]);

// AFTER:
const result = await supabase
  .from('documents')
  .insert([payload]);
```

**Files to Fix:**
- [ ] `src/components/admin/documents/DocumentsManagement.tsx` (2 places)
- [ ] `src/components/admin/duty/DutyManagement.tsx` (3 places)
- [ ] `src/components/admin/users/UserMenuControl.tsx` (1 place)
- [ ] `src/components/admin/audit/AuditCommitteeManagement.tsx` (4 places)
- [ ] `src/components/admin/audit/AuditTeacherManagement.tsx` (2 places)
- [ ] And any others found by grep

**Test:**
```bash
npm run build  # Should have zero TypeScript errors
```

---

## 🎯 Priority 2️⃣: Dynamic Academic Year

### Task 2.1: Create `useAcademicYear` Hook

**Status:** ⏳ Not Started  
**Effort:** 1 hour  
**Blocking:** No (but recommended before P3)

**File:** `src/hooks/useAcademicYear.ts`

```typescript
import { useSchoolSettings } from './useSchoolSettings';

export const useAcademicYear = () => {
  const { schoolSettings } = useSchoolSettings();
  
  const currentYear = schoolSettings['current_academic_year'] ?? '2568';
  const availableYears = Array.isArray(schoolSettings['academic_years'])
    ? schoolSettings['academic_years']
    : ['2568', '2567', '2566'];
  
  return { 
    currentYear, 
    availableYears 
  };
};
```

**Test:**
```bash
# Verify hook returns values
npm run dev
# Open browser console → useAcademicYear() should return { currentYear, availableYears }
```

---

### Task 2.2: Ensure `school_settings` Initialized

**Status:** ⏳ Verify  
**Effort:** 0.5 hour

**In Supabase DB:**
```sql
-- Check if keys exist
SELECT * FROM school_settings 
WHERE key IN ('current_academic_year', 'academic_years');

-- If missing, insert:
INSERT INTO school_settings (key, value) VALUES 
  ('current_academic_year', '2568'),
  ('academic_years', '["2568", "2567", "2566"]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

### Task 2.3: Update Components to Use Hook

**Status:** ⏳ Not Started (depends on 2.1)  
**Effort:** 1.5 hours

**Files to Update:**
- [ ] `src/components/admin/audit/AuditTeacherManagement.tsx`
  - Line 114: `useState('2568')` → `useState(currentYear)`
  - Line 313: `['2568', '2567', '2566']` → `availableYears`
  - Line 561: same as 313

- [ ] `src/pages/EvaluateePortal.tsx`
  - Line 121: `.eq('academic_year', '2568')` → `.eq('academic_year', currentYear)`

**Code Pattern:**
```typescript
// Add to component
const { currentYear, availableYears } = useAcademicYear();

// Replace hardcoded '2568' with currentYear
// Replace hardcoded ['2568'...] with availableYears
```

---

## 🎯 Priority 3️⃣: Leave Request Workflow

### Task 3.1: Create Workflow Utility

**Status:** ⏳ Not Started  
**Effort:** 1 hour  
**Blocking:** No

**File:** `src/lib/leave-workflow.ts`

```typescript
import type { AppUser } from '@/lib/auth';
import type { Database } from '@/integrations/supabase/types';

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'];

// Workflow steps: 0=pending, 1=supervisor approved, 2=dept approved, 3=director approved
export const WORKFLOW_STEPS = {
  PENDING: 0,
  SUPERVISOR_APPROVED: 1,
  DEPT_HEAD_APPROVED: 2,
  DIRECTOR_APPROVED: 3,
} as const;

export const getNextWorkflowStep = (currentStep: number, userRole: string): number | null => {
  if (currentStep === 0 && userRole === 'supervisor') return 1;
  if (currentStep === 1 && userRole === 'dept_head') return 2;
  if (currentStep === 2 && ['director', 'admin'].includes(userRole)) return 3;
  return null;
};

export const canApproveLeave = (
  leave: LeaveRequest,
  userRole: string,
  userDeptId?: string
): boolean => {
  // Person at step 0 can't approve (already pending)
  if (leave.workflow_step === 0) return userRole === 'supervisor';
  
  // Step 1: only dept_head of same dept
  if (leave.workflow_step === 1) return userRole === 'dept_head' && userDeptId === leave.department_id;
  
  // Step 2: only director/admin
  if (leave.workflow_step === 2) return ['director', 'admin'].includes(userRole);
  
  // Step 3: approved already
  return false;
};

export const getApprovalRequiredFrom = (step: number): string => {
  const labels = {
    0: 'Supervisor',
    1: 'Department Head',
    2: 'Director',
    3: 'Approved',
  };
  return labels[step as keyof typeof labels] ?? 'Unknown';
};
```

---

### Task 3.2: Update LeaveManagement Component

**Status:** ⏳ Not Started (depends on 3.1)  
**Effort:** 2 hours  
**Blocking:** No

**File:** `src/components/admin/leave/LeaveManagement.tsx`

**Changes:**
```typescript
// Import at top
import { canApproveLeave, getNextWorkflowStep } from '@/lib/leave-workflow';

// In approval function (replace current logic)
const handleApproveLeave = async (leave: LeaveRequest) => {
  const user = getCurrentUser();
  
  if (!canApproveLeave(leave, user?.role ?? '', user?.department_id)) {
    toast({
      title: 'ไม่มีสิทธิ์',
      description: `บทบาทของคุณ (${user?.role}) ไม่สามารถอนุมัติในขั้นตอนนี้`,
      variant: 'destructive'
    });
    return;
  }
  
  const nextStep = getNextWorkflowStep(leave.workflow_step, user?.role ?? '');
  if (nextStep === null) {
    toast({ title: 'ข้อผิดพลาด', variant: 'destructive' });
    return;
  }
  
  const { error } = await supabase
    .from('leave_requests')
    .update({
      workflow_step: nextStep,
      status: nextStep === 3 ? 'approved' : 'pending',
    })
    .eq('id', leave.id);
    
  if (!error) {
    toast({ title: 'อนุมัติสำเร็จ' });
    // Refresh list
  }
};
```

---

## 🎯 Priority 4️⃣: Real-time Updates

### Task 4.1: Create Real-time Hooks

**Status:** ⏳ Not Started  
**Effort:** 2 hours  
**Blocking:** No

**Files:**
- `src/hooks/useRealtimeLeaveUpdates.ts`
- `src/hooks/useRealtimeMaintenanceUpdates.ts`

**File:** `src/hooks/useRealtimeLeaveUpdates.ts`

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeLeaveUpdates = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`leave_updates_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leave_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const leave = payload.new as any;
          
          if (leave.workflow_step === 3) {
            toast({
              title: '✅ ใบลาของคุณอนุมัติแล้ว',
              description: `${leave.start_date} ถึง ${leave.end_date}`,
            });
          } else if (leave.status === 'rejected') {
            toast({
              title: '❌ ใบลาของคุณถูกส่งคืน',
              description: leave.notes ?? undefined,
              variant: 'destructive',
            });
          }
          
          // Refresh queries
          queryClient.invalidateQueries({ queryKey: ['leaves'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, toast, queryClient]);
};
```

---

## 🎯 Priority 5️⃣: RLS Policy Hardening

### Task 5.1: Review & Update RLS Policies

**Status:** ⏳ Not Started  
**Effort:** 3 hours  
**Blocking:** Medium (may break functionality if wrong)

**Review Checklist:**
- [ ] `documents` — only creator + admin can see/edit
- [ ] `leave_requests` — only creator + supervisor + manager + admin
- [ ] `duty_records` — only creator + admin + supervisor
- [ ] `audit_evaluations` — only own evaluation + committee member + admin

**Example Update (for `documents` table):**
```sql
-- BEFORE (❌ too open)
CREATE POLICY "Documents readable"
ON documents FOR SELECT
USING (true);  -- Anyone can read!

-- AFTER (✅ correct)
CREATE POLICY "Documents readable"
ON documents FOR SELECT
USING (
  created_by = auth.uid() OR
  (SELECT role FROM app_users WHERE id = auth.uid()) = 'admin'
);
```

**Files to Update:**
- [ ] Check `SODFLOW_SETUP.sql` (lines with CREATE POLICY)
- [ ] Run updated migrations to staging DB first

---

## 📊 Quick Start — One Week Plan

### **Day 1 (4h): Type Safety Foundation**
- [ ] Task 1.1: Generate types from DB
- [ ] Task 1.2: Remove `as any` casts  
- [ ] Test: `npm run build` ✅

### **Day 2 (3h): Academic Year**
- [ ] Task 2.1: Create hook
- [ ] Task 2.2: Initialize settings
- [ ] Task 2.3: Update components

### **Day 3 (3h): Leave Workflow**
- [ ] Task 3.1: Create utility
- [ ] Task 3.2: Update component
- [ ] Manual test approval flow

### **Day 4 (2h): Real-time**
- [ ] Task 4.1: Create hooks
- [ ] Integration test

### **Day 5 (3h): Security + Testing**
- [ ] Task 5.1: Review RLS (read-only check)
- [ ] Full system test
- [ ] Create PR + review

---

## ⚠️ Risks & Mitigation

| Risk | Mitigation |
|---|---|
| Type generation breaks | Backup types.ts, merge carefully |
| Leave workflow breaks approval | Test in staging, manual approval walkthrough |
| RLS too strict = blocks users | Test with multiple roles before production |
| Realtime causes websocket issues | Use fallback to polling |

---

## ✅ Done Checklist (Copy this when complete)

**Phase 1: Type Safety**
- [ ] Task 1.1: types.ts updated
- [ ] Task 1.2: All `as any` removed
- [ ] Build passes: `npm run build` ✅

**Phase 2: Academic Year**
- [ ] Task 2.1: Hook created
- [ ] Task 2.2: Settings initialized
- [ ] Task 2.3: Components updated
- [ ] Manual test: Change year → all components use new value ✅

**Phase 3: Leave Workflow**
- [ ] Task 3.1: Utility created
- [ ] Task 3.2: Component updated
- [ ] Workflow test: All 4 steps work ✅

**Phase 4: Real-time**
- [ ] Task 4.1: Hooks created
- [ ] Toast notifications appear ✅

**Phase 5: Security**
- [ ] Task 5.1: RLS reviewed
- [ ] No open policies ✅

---

**Status:** Ready to Start ✅  
**Estimated Total Effort:** 14.5 hours  
**Estimated Calendar Time:** 1 week (with focused effort)

**Next Step:** Confirm priority + start with Task 1.1
