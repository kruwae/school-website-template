import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, type UserRole } from '@/lib/auth';

// =============================================
// รายการเมนูทั้งหมดในระบบ
// =============================================
export const ALL_MENU_IDS = [
  'dashboard',
  'news',
  'dept-academic',
  'dept-general',
  'dept-budget',
  'dept-personnel',
  'dept-student',
  'documents',
  'duty',
  'leave',
  'maintenance',
  'audit-teacher',
  'audit-committee',
  'staff',
  'administrators',
  'settings',
  'user-menu-control',
] as const;

export type MenuId = (typeof ALL_MENU_IDS)[number];

// =============================================
// สิทธิ์เมนูเริ่มต้นตาม Role
// (ถ้าไม่มี override ใน user_menu_permissions)
// =============================================
export const DEFAULT_ROLE_MENUS: Record<UserRole, Set<string>> = {
  // admin เห็นทุกเมนู
  admin: new Set(ALL_MENU_IDS),

  // ผอ. เห็นเกือบทุกเมนู ยกเว้น settings และ user-menu-control
  director: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
    'audit-teacher', 'audit-committee',
    'staff', 'administrators',
  ]),

  // รองผอ. เห็นเกือบทั้งหมด ยกเว้น settings/user-menu-control
  deputy_director: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
    'audit-teacher', 'audit-committee',
    'staff', 'administrators',
  ]),

  // หัวหน้าฝ่าย/งาน เห็นฝ่ายของตน + งานประจำวัน + ประเมินครู
  dept_head: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
    'audit-teacher',
  ]),

  // ครูผู้สอน เห็นเมนูพื้นฐาน
  teacher: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
  ]),

  // เจ้าหน้าที่สนับสนุน เห็นเหมือนครู
  support_staff: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
  ]),

  // ครูอัตราจ้าง เห็นเมนูพื้นฐาน
  temp_employee: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
  ]),

  // ครูพี่เลี้ยง เห็นเมนูพื้นฐาน
  assistant: new Set([
    'dashboard', 'news',
    'dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student',
    'documents', 'duty', 'leave', 'maintenance',
  ]),
};

// =============================================
// ระดับที่อนุมัติได้ (Approval Roles)
// =============================================
export const CAN_APPROVE_ROLES: UserRole[] = [
  'admin', 'director', 'deputy_director', 'dept_head',
];

// =============================================
// หน้าที่แสดง label ลำดับ approval
// =============================================
export const APPROVAL_FLOW = [
  { step: 0, label: 'รอหัวหน้างาน', status: 'pending' },
  { step: 1, label: 'ผ่านหัวหน้างาน → รอหัวหน้าฝ่าย', status: 'supervisor_approved' },
  { step: 2, label: 'ผ่านหัวหน้าฝ่าย → รอรองผอ./ผอ.', status: 'dept_head_approved' },
  { step: 3, label: 'อนุมัติแล้ว', status: 'approved' },
];

// =============================================
// hook: usePermissions
// =============================================
export function usePermissions() {
  const user = getCurrentUser();
  const role = (user?.role ?? 'teacher') as UserRole;

  const [enabledMenus, setEnabledMenus] = useState<Set<string>>(
    DEFAULT_ROLE_MENUS[role] ?? new Set()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEnabledMenus(new Set());
      setLoading(false);
      return;
    }

    // admin ไม่ต้อง check DB — เห็นทั้งหมด
    if (role === 'admin') {
      setEnabledMenus(new Set(ALL_MENU_IDS));
      setLoading(false);
      return;
    }

    // ดึง override จาก user_menu_permissions
    const fetchOverrides = async () => {
      try {
        const { data } = await (supabase.from('user_menu_permissions' as any) as any)
          .select('menu_id, is_enabled')
          .eq('user_id', user.id);

        if (data && data.length > 0) {
          // เริ่มจาก default ของ role แล้ว override
          const base = new Set(DEFAULT_ROLE_MENUS[role] ?? []);
          for (const row of data) {
            if (row.is_enabled) {
              base.add(row.menu_id);
            } else {
              base.delete(row.menu_id);
            }
          }
          setEnabledMenus(base);
        } else {
          // ไม่มี override → ใช้ default
          setEnabledMenus(DEFAULT_ROLE_MENUS[role] ?? new Set());
        }
      } catch (e) {
        console.error('[usePermissions] error:', e);
        setEnabledMenus(DEFAULT_ROLE_MENUS[role] ?? new Set());
      } finally {
        setLoading(false);
      }
    };

    fetchOverrides();
  }, [user?.id, role]);

  /** ตรวจว่าเมนูนี้เห็นได้หรือไม่ */
  const canSee = (menuId: string): boolean => enabledMenus.has(menuId);

  /** ตรวจว่า role นี้อนุมัติได้หรือไม่ */
  const canApprove = (): boolean => CAN_APPROVE_ROLES.includes(role);

  /** ตรวจว่าเป็น admin หรือไม่ */
  const isAdmin = (): boolean => role === 'admin';

  return { enabledMenus, canSee, canApprove, isAdmin, loading, role, user };
}
