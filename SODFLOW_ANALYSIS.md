# SodFlow — โครงการวิเคราะห์โค้ด & Implementation Plan

**วันที่วิเคราะห์:** 2026-04-05  
**โครงการ:** SodFlow (ระบบจัดการโรงเรียนโสตศึกษา)  
**สถานะ:** ✅ ทำงานได้ | ⚠️ มีจุดที่ต้องปรับปรุง

---

## ✅ สิ่งที่ทำงานได้ดีแล้ว

| ฟีเจอร์ | หมายเหตุ |
|---|---|
| **Role-based Menu System** | ✅ เก่าเก่ว ภายนอก + DB override ยืดหยุ่น |
| **Evaluatee Portal** | ✅ Document upload + status tracking ครบถ้วน |
| **Audit Evaluation System** | ✅ 3 องค์ประกอบ, 10 หัวข้อ, weighted score |
| **Department Documents** | ✅ Filter by dept, category อย่างชัดเจน |
| **School Settings** | ✅ Key-value store + localStorage sync |
| **Admin Layout** | ✅ Desktop sidebar + mobile Sheet responsive |
| **ProjectManagement** | ✅ Dashboard + team members + CRUD |
| **Budget Dashboard** | ✅ Integration สมบูรณ์ (เพิ่งทำเสร็จ) |

---

## 🔴 ปัญหาที่ต้องแก้ — Priority Order

### **Priority 1️⃣: Type Safety (CRITICAL)**

#### ❌ Problem #1: `types.ts` ขาดตาราง SodFlow ทั้งหมด

**สาถานะปัจจุบัน:**
```typescript
// src/integrations/supabase/types.ts (790 lines)
// มี tables: admissions, curriculum_programs, curriculum_activities, faq, milestones
// ❌ NO: app_users, documents, duty_records, leave_requests, maintenance_requests
// ❌ NO: audit_evaluatees, audit_committees, audit_evaluations
// ❌ NO: projects, project_team_members, work_groups, user_menu_permissions
```

**ผลกระทบ:**
```typescript
// 14+ locations ใช้ as any — ไม่มี type safety
const result = await (supabase.from('documents' as any) as any).insert([payload]);
const res = await (supabase.from('duty_records' as any) as any).update(payload);
```

**วิธีแก้ไข:**
ต้อง add type definitions จาก SODFLOW_SETUP.sql สำหรับ:
- `app_users` (id, username, password_hash, role, is_active, created_at)
- `departments` (id, name, code, color, icon, description, is_active)
- `documents` (id, title, department_id, category_id, academic_year, status, file_url, created_by, created_at)
- `duty_records` (id, user_id, date, shift, status, notes, created_at)
- `leave_requests` (id, user_id, start_date, end_date, reason, status, workflow_step, supervisor_id, dept_head_id, created_at)
- `maintenance_requests` (id, issue_type, description, location, priority, status, assigned_to, created_by, created_at)
- `audit_evaluatees` (id, user_id, position, academic_year, committee_members_json, is_active)
- `audit_committees` (id, full_name, position, department, academic_year, is_active)
- `audit_evaluations` (id, evaluatee_id, committee_id, scores_json [10 หัวข้อ], weighted_score, created_at)
- `projects` (id, title, status, created_by_id, budget_amount, budget_used, created_at)
- `project_team_members` (id, project_id, user_id, role, created_at)
- `work_groups` (id, name, department_id, description, is_active)
- `work_group_members` (id, work_group_id, user_id, created_at)
- `user_menu_permissions` (id, user_id, menu_key, permission_level, created_at)

**ไฟล์ที่ต้องแก้:**
- `src/integrations/supabase/types.ts` — Add Database type definitions

**Estimated Effort:** 3-4 ชั่วโมง (ค่อนข้างซ้ำๆ แต่เป็น foundation)

---

### **Priority 2️⃣: Configuration Management (HIGH)**

#### ❌ Problem #2: Academic Year Hardcoded

**สาถานะปัจจุบัน:**
```typescript
// AuditTeacherManagement.tsx:114
const [filterYear, setFilterYear] = useState('2568');

// AuditTeacherManagement.tsx:126
academic_year: '2568'

// AuditTeacherManagement.tsx:313, 561
['2568', '2567', '2566'].map(y => <SelectItem ...>)

// EvaluateePortal.tsx:121
.eq('academic_year', '2568')
```

**ผลกระทบ:**
- ปีหน้า (2569) ต้องแก้ code hardcoded 4 จุด
- ยากต่อ maintenance
- ข้อมูลเก่าหายหลังจาก 3 ปี

**วิธีแก้ไข:**

**ขั้น 1:** ตั้งค่า `school_settings` key สำหรับปีการศึกษา
```sql
INSERT INTO school_settings (key, value) VALUES 
  ('current_academic_year', '2568'),
  ('academic_years', '["2568", "2567", "2566"]');
```

**ขั้น 2:** สร้าง hook `useAcademicYear()`
```typescript
// src/hooks/useAcademicYear.ts
export const useAcademicYear = () => {
  const { schoolSettings } = useSchoolSettings();
  const currentYear = schoolSettings['current_academic_year'] ?? '2568';
  const availableYears = JSON.parse(schoolSettings['academic_years'] ?? '["2568", "2567", "2566"]');
  return { currentYear, availableYears };
};
```

**ขั้น 3:** Replace hardcoded values
```typescript
// Before
const [filterYear, setFilterYear] = useState('2568');

// After
const { currentYear, availableYears } = useAcademicYear();
const [filterYear, setFilterYear] = useState(currentYear);

// Available years comes from settings, not hardcoded
<SelectContent>{availableYears.map(y => <SelectItem ...>)}</SelectContent>
```

**ไฟล์ที่ต้องแก้:**
- `src/hooks/useAcademicYear.ts` — NEW
- `src/components/admin/audit/AuditTeacherManagement.tsx` — 4 จุด
- `src/pages/EvaluateePortal.tsx` — 1 จุด

**Estimated Effort:** 1-2 ชั่วโมง

---

### **Priority 3️⃣: Leave Approval Workflow (HIGH)**

#### ❌ Problem #3: Workflow ไม่สมบูรณ์

**สาถานะปัจจุบัน:**
- Table `leave_requests` มี `workflow_step` column (0=pending, 1=supervisor, 2=dept_head, 3=approved)
- Code ใช้เฉพาะ `status` ไม่ได้ไล่ steps
- Supervisor/Dept Head ไม่เช็ค role ก่อนอนุมัติ

**ตัวอย่างปัญหา:**
```typescript
// ❌ Current: ใครก็อนุมัติได้
if (selectedLeave.status === 'pending') {
  // approve logic without checking role/workflow_step
}

// ✅ Should be:
if (selectedLeave.workflow_step === 0) { // only pending step 0
  if (currentUser.role === 'supervisor') { // only supervisor can approve
    // move to step 1
  }
}
```

**วิธีแก้ไข:**

**ขั้น 1:** สร้าง utility function
```typescript
// src/lib/leave-workflow.ts
export const getApprovalPath = (userRole: string) => {
  const paths = {
    supervisor: 1,      // can approve to step 1
    dept_head: 2,       // can approve to step 2
    director: 3,        // can approve to step 3
  };
  return paths[userRole] ?? null;
};

export const canApproveLeave = (
  leave: LeaveRequest,
  userRole: string,
  userId: string
) => {
  if (leave.workflow_step === 0) return userRole === 'supervisor';
  if (leave.workflow_step === 1) return userRole === 'dept_head' && leave.department_id === userDeptId;
  if (leave.workflow_step === 2) return userRole === 'director';
  return false;
};
```

**ขั้น 2:** Update LeaveManagement component
```typescript
// OLD: onClick={() => approveLeave(leave.id)}
// NEW: onClick={() => approveLeaveWithWorkflow(leave.id, currentUser.role, currentUser.id)}

const approveLeaveWithWorkflow = async (leaveId, role, userId) => {
  if (!canApproveLeave(selectedLeave, role, userId)) {
    toast({ title: 'ไม่มีสิทธิ์', description: 'บทบาทของคุณไม่สามารถอนุมัติในขั้นตอนนี้' });
    return;
  }
  
  const nextStep = getApprovalPath(role);
  await updateLeaveRequest(leaveId, { 
    workflow_step: nextStep, 
    status: nextStep === 3 ? 'approved' : 'pending' 
  });
};
```

**ไฟล์ที่ต้องแก้:**
- `src/lib/leave-workflow.ts` — NEW
- `src/components/admin/leave/LeaveManagement.tsx` — update approval logic

**Estimated Effort:** 2-3 ชั่วโมง

---

### **Priority 4️⃣: Real-time Updates (MEDIUM)**

#### ⚠️ Problem #4: ไม่มี Real-time Notifications

**สาถานะปัจจุบัน:**
- Supervisor อนุมัติใบลา → ผู้ยื่นต้อง refresh manual
- ช่างได้ task maintenance ใหม่ → ไม่มีแจ้งเตือน
- ผลการประเมิน update → ต้อง refresh

**วิธีแก้ไข:**

เพิ่ม Supabase Realtime subscription:
```typescript
// src/hooks/useRealtimeLeaveUpdates.ts
export const useRealtimeLeaveUpdates = (userId: string) => {
  const { toast } = useToast();
  
  useEffect(() => {
    const subscription = supabase
      .channel('leave_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests', filter: `user_id=eq.${userId}` },
        (payload) => {
          const leave = payload.new as LeaveRequest;
          if (leave.workflow_step === 3) {
            toast({
              title: '✅ ใบลาของคุณอนุมัติแล้ว',
              description: `${leave.start_date} ถึง ${leave.end_date}`
            });
            queryClient.invalidateQueries(['leaves']);
          }
        }
      )
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, [userId]);
};
```

ใช้ใน component:
```typescript
const EvaluateePortal = () => {
  const [user] = useState(getCurrentUser());
  useRealtimeLeaveUpdates(user?.id);
  // ... rest
};
```

**ไฟล์ที่ต้องสร้าง:**
- `src/hooks/useRealtimeLeaveUpdates.ts` — NEW
- `src/hooks/useRealtimeMaintenanceUpdates.ts` — NEW

**Estimated Effort:** 2-3 ชั่วโมง

---

### **Priority 5️⃣: RLS Policy Hardening (MEDIUM-HIGH)**

#### ⚠️ Problem #5: RLS Policies เปิดมากเกินไป

**สาถานะปัจจุบัน:**
```sql
-- ❌ ปัจจุบัน: ใครก็ได้อ่าน/เขียนได้
USING (true)
WITH CHECK (true)

-- ✅ ต้องเป็น:
USING (
  auth.uid() = user_id OR 
  (SELECT role FROM app_users WHERE id = auth.uid()) = 'admin'
)
```

**ไฟล์ที่ต้องแก้:**
- `SODFLOW_SETUP.sql` — ทุก RLS policy
- `SUPABASE_SETUP.sql` — ตรวจสอบ public tables

**Estimated Effort:** 3-4 ชั่วโมง

---

## 📋 Implementation Roadmap — แนะนำลำดับขั้นตอน

### **Week 1: Core Infrastructure (Foundation)**

| วัน | Task | Priority | Effort |
|---|---|---|---|
| Day 1 | Add types.ts definitions (SodFlow tables) | P1 | 4h |
| Day 2 | Create useAcademicYear hook + replace hardcoding | P2 | 2h |
| Day 3 | Test + fix any TypeScript compilation errors | P1 | 2h |

**Deliverable:** Full type safety ✅

---

### **Week 2: Business Logic (Features)**

| วัน | Task | Priority | Effort |
|---|---|---|---|
| Day 4 | Implement leave workflow (utility + component update) | P3 | 3h |
| Day 5 | Add real-time Realtime subscriptions | P4 | 3h |
| Day 6 | Testing + bug fix | - | 2h |

**Deliverable:** Complete leave workflow + notifications ✅

---

### **Week 3-4: Security & Polish**

| วัน | Task | Priority | Effort |
|---|---|---|---|
| Day 7-8 | Harden RLS policies | P5 | 4h |
| Day 9 | Add notification badges to sidebar | - | 2h |
| Day 10 | Performance optimization + final test | - | 2h |

**Deliverable:** Secure production-ready system ✅

---

## 🎯 Action Items — แนะนำให้ทำ

### **Immediate (This Week)**

- [ ] **Task 1.1:** Generate types.ts from SODFLOW_SETUP.sql
  - ⚙️ Option: Use `supabase gen types typescript --db-url=...`
  - Or manually add ~12 table definitions

- [ ] **Task 1.2:** Replace all `as any` casts
  - `grep -n "as any" src/components/admin/**/*.tsx`
  - Replace with proper types

- [ ] **Task 2.1:** Create `useAcademicYear.ts`
  - Add to `src/hooks/`

- [ ] **Task 2.2:** Update academic year settings
  - Insert into `school_settings` table

### **Next Week**

- [ ] **Task 3.1:** Create `src/lib/leave-workflow.ts`
  - Add `canApproveLeave()` function
  - Add `getApprovalPath()` function

- [ ] **Task 3.2:** Update LeaveManagement component
  - Add workflow step check
  - Add role-based approval

### **Backlog (Nice to Have)**

- [ ] **Task 4.1:** Add Realtime updates
- [ ] **Task 5.1:** Harden RLS
- [ ] **Task 6.1:** Add notification badges
- [ ] **Task 6.2:** Export reports (CSV/PDF)
- [ ] **Task 6.3:** Split Enrollment.tsx (61KB → modules)

---

## 📊 Impact Analysis

| Change | Impact | Risk | Rollback |
|---|---|---|---|
| Add types.ts | ✅ High (全system type safety) | 🟢 Low | Easy (revert types.ts) |
| Academic year dynamic | ✅ Med (maintenance ease) | 🟢 Low | Easy (revert hook) |
| Leave workflow | ✅ High (business logic) | 🟡 Med (need testing) | Med (revert DB) |
| Real-time updates | ✅ Med (UX) | 🟡 Med (websocket) | Med (remove hook) |
| RLS hardening | ✅ High (security) | 🔴 High (may block users) | Hard (need DB test) |

---

## 🔍 ตอบ Open Questions

### **Q1: อยากพัฒนาฟีเจอร์อะไรต่อไป?**

**ตอบ:** ตามลำดับความสำคัญ:
1. **Type safety** (P1) — foundation สำคัญที่สุด
2. **Dynamic academic year** (P2) — ใช้ได้เลยสำหรับปีหน้า
3. **Complete leave workflow** (P3) — ธุรกิจลอจิก complete
4. **Real-time updates** (P4) — UX ดีขึ้น
5. **Export reports** (P5) — ผู้ใช้ request บ่อย

### **Q2: ต้องการ migrate ไป Supabase Auth จริงๆ หรือเปล่า?**

**ตอบ:** 
- **Option 1 (Short-term):** Keep SHA-256 hash แต่:
  - ❌ NOT ต้อง migrate ทันที (risky)
  - ✅ Add session timeout: 4 ชั่วโมง
  - ✅ Add bcrypt/Argon2 ลงไปค่อยๆ
  
- **Option 2 (Long-term):** Migrate ไป Supabase Auth
  - ✅ More secure (auto timeout, PKCE, etc.)
  - ⚠️ Need data migration
  - ⚠️ 2-3 วัน dev time

**แนะนำ:** ทำ Option 1 ตอนนี้, Option 2 ลงไป Q3/Q4

### **Q3: ตาราง `albums`/`photos` vs `gallery_albums`/`gallery_photos` ใช้ตารางไหนจริง?**

**ตอบ:** 
- **ตรวจสอบวิธี:** 
  ```bash
  psql $DATABASE_URL -c "\dt public.gallery_*"
  psql $DATABASE_URL -c "\dt public.albums"
  ```
- **เคยเห็น:** SUPABASE_SETUP.sql สร้าง `gallery_albums` + `gallery_photos`
- **แนะนำ:** Update types.ts → `gallery_albums` / `gallery_photos`

### **Q4: Academic Year 2569 — ต้องเตรียมระบบสลับปีการศึกษาหรือไม่?**

**ตอบ:** 
✅ **YES** — ต้องเตรียม! วิธีสั้น:
```typescript
// เก็บใน school_settings
{
  key: 'current_academic_year',
  value: '2569' // เปลี่ยนปีเดียว
}

// เปลี่ยนใน admin panel → Settings → Academic Year
<Select value={schoolSettings['current_academic_year']} onChange={...} />
```

เมื่อ 2569 เข้า: admin select year 2569 → system ใช้ค่านี้ทุกจุด (เพราะ dynamic ✅)

---

## 📝 File Structure สำหรับ Changes

```
src/
├── integrations/supabase/
│   └── types.ts                    [MODIFY] +500 lines (add 12 tables)
├── hooks/
│   ├── useAcademicYear.ts          [NEW]
│   ├── useRealtimeLeaveUpdates.ts  [NEW]
│   └── useRealtimeMaintenanceUpdates.ts [NEW]
├── lib/
│   ├── leave-workflow.ts           [NEW]
│   └── auth-session.ts             [NEW] optional: session timeout
├── components/admin/
│   ├── audit/
│   │   └── AuditTeacherManagement.tsx [MODIFY] 4 locations
│   └── leave/
│       └── LeaveManagement.tsx      [MODIFY] approval logic
└── pages/
    └── EvaluateePortal.tsx          [MODIFY] 1 location
```

---

## 🎬 Getting Started

### **Step 1: Backup** ⚠️
```bash
# Backup current database
pg_dump $DATABASE_URL > backup_2026-04-05.sql

# Backup current code
git commit -m "Before SodFlow refactoring"
git tag refactor/sodflow-v1
```

### **Step 2: Generate Types**
```bash
# Option A: Auto-generate (recommended)
supabase gen types typescript --db-url=$DATABASE_URL > /tmp/types.ts
# Then manually merge with existing types.ts (keep public tables)

# Option B: Manual (if auto doesn't work)
# Copy table definitions from SODFLOW_SETUP.sql → types.ts
```

### **Step 3: Create Hooks**
```bash
# Create files
touch src/hooks/useAcademicYear.ts
touch src/lib/leave-workflow.ts

# Copy code from examples above
# Test with: npm run build
```

### **Step 4: Test**
```bash
npm run build          # Check TypeScript
npm run dev            # Test locally
npm run test           # Run tests if available
```

---

## 📚 Reference Files

- **Migrations:** `/supabase/migrations/SODFLOW_SETUP.sql`
- **Database Schema:** `/SODFLOW_SETUP.sql`
- **Current Implementation:** `/src/components/admin/audit/AuditTeacherManagement.tsx`
- **Existing Hooks:** `/src/hooks/usePermissions.ts`, `/src/hooks/useSchoolSettings.ts`

---

## ✅ Success Criteria

| Criteria | Current | Target |
|---|---|---|
| Type safety | ❌ 14 `as any` casts | ✅ 0 `as any` |
| Academic year | ❌ 5 hardcoded places | ✅ 1 settings |
| Leave workflow | ⚠️ Status only | ✅ Full 4-step |
| Real-time updates | ❌ Manual refresh | ✅ Auto notification |
| RLS security | ⚠️ Mostly open | ✅ Role-based |

---

## 🚀 Timeline Estimate

| Phase | Duration | Effort | Notes |
|---|---|---|---|
| **Type Safety** | 1 day | 4h | Foundation, must do first |
| **Academic Year** | 0.5 day | 2h | Quick win |
| **Leave Workflow** | 1.5 days | 3.5h | Core feature |
| **Real-time** | 1 day | 3h | Nice to have |
| **Testing & Polish** | 1 day | 2h | QA |
| **Total** | **5 days** | **14.5h** | 1 developer |

**Timeline:** Manageable in 1 week with focused effort ✅

---

**ต่อการสอบถาม:** แสดงความพร้อม สำหรับการดำเนินการขั้นใด?
