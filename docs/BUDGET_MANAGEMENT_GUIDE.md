# ระบบจัดการงบประมาณโครงการ (Project Budget Management System)

## 📋 ภาพรวมระบบ

ระบบจัดการงบประมาณโครงการเป็นระบบบริหารจัดการทรัพยากรที่เสร็จสมบูรณ์ สำหรับติดตามและควบคุมการใช้งบประมาณในโครงการ มีฟีเจอร์มากมายรวมถึง:

- 📊 **แผนการงบประมาณ** - วางแผนรายการและจำนวนเงินที่ต้องใช้
- 💰 **ติดตามค่าใช้จ่าย** - บันทึกรายจ่าย คืนเงิน และการปรับปรุง
- 📈 **รายงานและวิเคราะห์** - ดูสถิติการใช้งบประมาณแบบเรียลไทม์
- 🔒 **ความปลอดภัยข้อมูล** - ควบคุมการเข้าถึงตามบทบาท (RLS)
- 📝 **บันทึกการเปลี่ยนแปลง** - ตรวจสอบประวัติการแก้ไข

---

## 🗄️ โครงสร้างฐานข้อมูล

### ตารางหลัก

#### 1. `budget_categories` - หมวดหมู่งบประมาณ
หมวดหมู่ของรายการค่าใช้จ่าย เช่น วัสดุ, ค่าเดินทาง, ค่าจ้าง

```sql
CREATE TABLE budget_categories (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,      -- เช่น MAT, TRAVEL, LABOR
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
);
```

**ข้อมูลเริ่มต้น:**
- วัสดุและอุปกรณ์ (MAT)
- ค่าเดินทาง (TRAVEL)
- ค่าจ้างแรงงาน (LABOR)
- ค่าบริการ (SERVICE)
- ค่าอาหารและเครื่องดื่ม (FOOD)
- ค่าพัฒนาซอฟต์แวร์ (SOFTWARE)
- ค่าอื่นๆ (OTHER)

#### 2. `project_budget_items` - รายการงบประมาณที่วางแผน
รายการค่าใช้จ่ายที่วางแผนสำหรับแต่ละโครงการ

```sql
CREATE TABLE project_budget_items (
  id              UUID PRIMARY KEY,
  project_id      UUID NOT NULL,
  category_id     UUID NOT NULL,
  item_name       TEXT NOT NULL,
  planned_amount  DECIMAL(12,2) NOT NULL,  -- จำนวนเงินที่วางแผน
  description     TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
);
```

#### 3. `budget_transactions` - บันทึกการใช้จ่ายจริง
ธุรกรรมใช้จ่ายจริง รวมถึงรายจ่าย คืนเงิน และการปรับปรุง

```sql
CREATE TABLE budget_transactions (
  id                UUID PRIMARY KEY,
  project_id        UUID NOT NULL,
  budget_item_id    UUID,                    -- อ้างอิงถึง planned item
  amount            DECIMAL(12,2) NOT NULL,
  transaction_type  TEXT NOT NULL,           -- expense, refund, adjustment
  description       TEXT NOT NULL,
  transaction_date  DATE NOT NULL,
  created_by        UUID,
  document_id       UUID,                    -- อ้างอิงถึงใบสำคัญ
  notes             TEXT,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ
);
```

### Views (มุมมอง)

#### `project_budget_summary` - สรุปงบประมาณโครงการ
```sql
SELECT
  project_id,
  project_title,
  total_planned,           -- ทั้งหมด
  total_used,              -- ใช้ไปแล้ว
  remaining_budget,        -- คงเหลือ
  utilization_percentage,  -- เปอร์เซ็นต์การใช้
  budget_items_count,      -- จำนวนรายการ
  transactions_count       -- จำนวนธุรกรรม
FROM project_budget_summary;
```

#### `budget_category_details` - รายละเอียดหมวดหมู่
```sql
SELECT
  id,
  name,
  code,
  items_count,              -- จำนวนรายการในหมวดหมู่
  total_planned_amount,     -- ทั้งหมดในหมวดหมู่
  total_spent,              -- ใช้ไปแล้ว
FROM budget_category_details;
```

---

## 🔧 Helper Functions (ฟังก์ชันชั่วย)

### 1. `get_project_remaining_budget(project_uuid)`
**ใช้ประโยชน์:** คำนวณเงินคงเหลือของโครงการ

```sql
SELECT get_project_remaining_budget('project-id') as remaining;
-- ผลลัพธ์: 50000.00
```

### 2. `get_budget_utilization_percentage(project_uuid)`
**ใช้ประโยชน์:** คำนวณเปอร์เซ็นต์การใช้งบประมาณ (0-999.99%)

```sql
SELECT get_budget_utilization_percentage('project-id') as percentage;
-- ผลลัพธ์: 68.50
```

### 3. `get_category_summary(project_uuid)`
**ใช้ประโยชน์:** ดูการใช้งบประมาณแยกตามหมวดหมู่

```sql
SELECT * FROM get_category_summary('project-id');
-- ผลลัพธ์: ตารางแสดงการใช้ของแต่ละหมวดหมู่
```

### 4. `can_create_expense(project_uuid, amount)`
**ใช้ประโยชน์:** ตรวจสอบว่ามีเงินเพียงพอสำหรับรายจ่ายใหม่หรือไม่

```sql
SELECT can_create_expense('project-id', 5000) as can_spend;
-- ผลลัพธ์: true หรือ false
```

### 5. `get_budget_statistics(project_uuid)`
**ใช้ประโยชน์:** ดึงสถิติงบประมาณที่ครอบคลุม

```sql
SELECT * FROM get_budget_statistics('project-id');
-- ผลลัพธ์: 
-- {
--   total_budget: 100000,
--   total_spent: 68500,
--   net_spent: 68500,
--   remaining_budget: 31500,
--   budget_items_count: 12,
--   transactions_count: 45,
--   average_transaction_amount: 1522.22
-- }
```

---

## 💻 Backend API Queries

ตัวอักษร `src/lib/queries/budget.ts` ให้ฟังก์ชันต่อไปนี้:

### Budget Categories
```typescript
getBudgetCategories()                          // ดึงหมวดหมู่ทั้งหมด
createBudgetCategory(category)                 // สร้างหมวดหมู่ใหม่
updateBudgetCategory(id, updates)              // อัปเดตหมวดหมู่
```

### Project Budget Items
```typescript
getProjectBudgetItems(projectId)               // ดึงรายการงบประมาณ
createProjectBudgetItem(item)                  // สร้างรายการใหม่
updateProjectBudgetItem(id, updates)           // อัปเดตรายการ
deleteProjectBudgetItem(id)                    // ลบรายการ
```

### Budget Transactions
```typescript
getProjectBudgetTransactions(projectId)        // ดึงธุรกรรมทั้งหมด
createBudgetTransaction(transaction)           // สร้างธุรกรรมใหม่
updateBudgetTransaction(id, updates)           // อัปเดตธุรกรรม
deleteBudgetTransaction(id)                    // ลบธุรกรรม
getFilteredBudgetTransactions(filters)         // ค้นหาธุรกรรมด้วยตัวกรอง
```

### Budget Summary & Reports
```typescript
getProjectBudgetSummary(projectId)             // ดึงสรุปโครงการ
getAllProjectsBudgetSummary()                  // ดึงสรุปทั้งหมด
getBudgetDashboardStats()                      // ดึงสถิติ dashboard
```

### Helper Functions (RPC)
```typescript
getProjectRemainingBudget(projectId)           // เงินคงเหลือ
getBudgetUtilizationPercentage(projectId)      // เปอร์เซ็นต์การใช้
getCategorySummary(projectId)                  // สรุปตามหมวดหมู่
canCreateExpense(projectId, amount)            // ตรวจสอบเงิน
getBudgetStatistics(projectId)                 // สถิติครอบคลุม
```

---

## 🎨 Frontend Components

### Component: `BudgetDashboard`
**ตำแหน่ง:** `src/components/admin/projects/BudgetDashboard.tsx`

ระบบแสดงผล dashboard หลัก พร้อมสถิติรวมและรายธุรกรรมล่าสุด

**Props:**
```typescript
- loading: boolean
- stats: BudgetDashboardStats
- projectsSummary: ProjectBudgetSummary[]
- recentTransactions: BudgetTransaction[]
```

### Component: `BudgetSummaryCard`
**ตำแหน่ง:** `src/components/admin/projects/BudgetSummaryCard.tsx`

การ์ดแสดงสรุปงบประมาณโครงการเดียว พร้อมแถบความคืบหน้า

**Props:**
```typescript
interface BudgetSummaryCardProps {
  summary: ProjectBudgetSummary;
  clickable?: boolean;
  onClick?: () => void;
}
```

### Component: `BudgetTransactionList`
**ตำแหน่ง:** `src/components/admin/projects/BudgetTransactionList.tsx`

ตารางแสดงธุรกรรมทั้งหมด พร้อมตัวกรองและการค้นหา

**Props:**
```typescript
interface BudgetTransactionListProps {
  projectId: string;
  onEdit: (transaction: BudgetTransaction) => void;
  onAddNew: () => void;
  refresh?: boolean;
}
```

### Component: `BudgetCategoryBreakdown`
**ตำแหน่ง:** `src/components/admin/projects/BudgetCategoryBreakdown.tsx`

การแสดงผลการใช้งบประมาณแยกตามหมวดหมู่

**Props:**
```typescript
interface BudgetCategoryBreakdownProps {
  projectId: string;
  refresh?: boolean;
}
```

### Component: `BudgetCategorySelector`
**ตำแหน่ง:** `src/components/admin/projects/BudgetCategorySelector.tsx`

Dropdown selector สำหรับเลือกหมวดหมู่

**Props:**
```typescript
interface BudgetCategorySelectorProps {
  categories: BudgetCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

### Component: `AddBudgetItemModal` 
**ตำแหน่ง:** `src/components/admin/projects/AddBudgetItemModal.tsx`

Modal สำหรับเพิ่ม/แก้ไขรายการงบประมาณ

### Component: `AddExpenseModal`
**ตำแหน่ง:** `src/components/admin/projects/AddExpenseModal.tsx`

Modal สำหรับบันทึกรายจ่ายใหม่

---

## 🔐 Row Level Security (RLS)

ระบบใช้ RLS เพื่อควบคุมการเข้าถึงข้อมูล:

### Budget Categories
- **SELECT**: ทุกคนสามารถอ่านได้
- **INSERT/UPDATE/DELETE**: เฉพาะ admin และ director

### Project Budget Items
- **SELECT**: ผู้สร้างโครงการ, สมาชิกทีม, และ admin
- **INSERT/UPDATE/DELETE**: ผู้สร้างโครงการ, สมาชิกทีม, และ admin

### Budget Transactions
- **SELECT**: ผู้สร้างโครงการ, สมาชิกทีม, และ admin
- **INSERT/UPDATE/DELETE**: ผู้สร้างโครงการ, สมาชิกทีม, และ admin

---

## ✅ Constraints & Validation

### Database Constraints
```sql
-- planned_amount ต้องมากกว่า 0
CHECK (planned_amount >= 0)

-- transaction_type และ amount ต้องสอดคล้องกัน
CHECK (
  (transaction_type = 'expense' AND amount > 0) OR
  (transaction_type = 'refund' AND amount > 0) OR
  (transaction_type = 'adjustment' AND amount != 0)
)

-- category code ต้องเป็นตัวพิมพ์ใหญ่และตัวเลข
CHECK (code ~ '^[A-Z0-9_]+$')
```

### Application Validation
- ตรวจสอบว่า planned_amount ไม่เป็นลบ
- ตรวจสอบว่า transaction_amount > 0
- ตรวจสอบว่ามีเงินเพียงพอก่อนสร้างรายจ่าย
- ตรวจสอบความเป็นไปได้คืนเงิน

---

## 📊 ตัวอย่างการใช้งาน

### 1. ดึงสรุปงบประมาณโครงการ
```typescript
const summary = await getProjectBudgetSummary('project-123');
console.log(`ทั้งหมด: ${formatCurrency(summary.total_planned)}`);
console.log(`ใช้ไปแล้ว: ${formatCurrency(summary.total_used)}`);
console.log(`คงเหลือ: ${formatCurrency(summary.remaining_budget)}`);
```

### 2. บันทึกรายจ่ายใหม่
```typescript
const transaction = await createBudgetTransaction({
  project_id: 'project-123',
  budget_item_id: 'item-456',
  amount: 5000,
  transaction_type: 'expense',
  description: 'ซื้อวัสดุสำนักงาน',
  transaction_date: '2026-04-05',
  document_id: 'doc-789'
});
```

### 3. ตรวจสอบเงินเพียงพอหรือไม่
```typescript
const canSpend = await canCreateExpense('project-123', 10000);
if (canSpend) {
  // ดำเนินการบันทึกรายจ่าย
} else {
  // แสดงการแจ้งเตือน: เงินไม่พอ
}
```

### 4. ดูการใช้งบประมาณแยกตามหมวดหมู่
```typescript
const categoryData = await getCategorySummary('project-123');
categoryData.forEach(cat => {
  console.log(`${cat.category_name}: ${cat.utilization_percentage}%`);
});
```

---

## 🧪 Testing

ไฟล์ทดสอบ: `src/__tests__/budget.test.ts`

รันการทดสอบ:
```bash
npm run test budget
```

### ข้อมูลที่ทดสอบ
- ✅ เรียกใช้ helper functions
- ✅ ตรวจสอบ data structure
- ✅ ตรวจสอบ transaction types
- ✅ ตรวจสอบ data validation

---

## 🚀 Best Practices

### 1. การดึงข้อมูล
```typescript
// ✅ ดี: ดึงเฉพาะสิ่งที่ต้องการ
const items = await getProjectBudgetItems(projectId);

// ❌ ไม่ดี: อย่าดึงข้อมูลซ้ำๆ
for (let i = 0; i < projects.length; i++) {
  const items = await getProjectBudgetItems(projects[i].id); // ทำหลายครั้ง
}
```

### 2. การสร้าง Error Handling
```typescript
try {
  const summary = await getProjectBudgetSummary(projectId);
} catch (error) {
  console.error('Failed to load budget:', error);
  toast({
    title: 'เกิดข้อผิดพลาด',
    description: 'ไม่สามารถโหลดข้อมูลงบประมาณ',
    variant: 'destructive'
  });
}
```

### 3. การแสดงผลจำนวนเงิน
```typescript
// ✅ ใช้ formatCurrency utility
import { formatCurrency } from '@/lib/utils';
<span>{formatCurrency(1234.56)}</span>  // ฿1,234.56
```

---

## 📚 Reference

- **Database Schema**: `/supabase/migrations/022_project_budget_management.sql`
- **Constraints**: `/supabase/migrations/023_budget_constraints_and_functions.sql`
- **Type Definitions**: `/src/lib/types/budget.ts`
- **API Queries**: `/src/lib/queries/budget.ts`
- **Components**: `/src/components/admin/projects/`
- **Tests**: `/src/__tests__/budget.test.ts`

---

## 📞 Support & Troubleshooting

### ปัญหา: เกิดข้อผิดพลาด RLS
**สาเหตุ**: ผู้ใช้ไม่มีสิทธิ์เข้าถึง
**วิธีแก้ไข**: ตรวจสอบ app_users role และ project_team_members

### ปัญหา: งบประมาณคำนวณไม่ถูกต้อง
**สาเหตุ**: ธุรกรรม refund ถูกนับเป็นบวก
**วิธีแก้ไข**: ตรวจสอบให้แน่ใจว่า transaction_type ถูกต้อง

### ปัญหา: Performance ช้า
**สาเหตุ**: ขาด indexes
**วิธีแก้ไข**: รัน migration 023 เพื่อเพิ่ม indexes

---

**เวอร์ชัน**: 1.0.0  
**วันที่อัปเดต**: 2026-04-05  
**ผู้พัฒนา**: Project Budget Management Team
