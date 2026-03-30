import { supabase } from '@/integrations/supabase/client';

export type UserRole =
  | 'admin'
  | 'director'
  | 'deputy_director'
  | 'dept_head'
  | 'teacher'
  | 'support_staff'
  | 'temp_employee'
  | 'assistant'
  | 'temp_staff';

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  position?: string;  // ชื่อตำแหน่ง เช่น "หัวหน้าฝ่ายบริหารทั่วไป" — ใช้จับคู่ committee.name
  staff_id?: string;
  email?: string;
}

const SESSION_KEY = 'sodflow_user';

/** Simple hash (SHA-256 via Web Crypto) */
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Login: query app_users table */
export async function login(username: string, password: string): Promise<AppUser | null> {
  const hashed = await hashPassword(password);
  console.log('[auth] login attempt:', username, '| hash:', hashed);

  const { data, error } = await (supabase.from('app_users' as any) as any)
    .select('id, username, full_name, role, position, staff_id, email, password_hash')
    .eq('username', username.trim())
    .eq('is_active', true)
    .single();

  console.log('[auth] query result — data:', data, '| error:', error);

  if (error || !data) {
    console.error('[auth] DB error or no user found:', error?.message);
    return null;
  }

  // Compare hash
  if (data.password_hash !== hashed) {
    console.warn('[auth] Password hash mismatch. DB hash:', data.password_hash, '| computed:', hashed);
    return null;
  }

  const user: AppUser = {
    id: data.id,
    username: data.username,
    full_name: data.full_name,
    role: data.role,
    position: data.position ?? undefined,
    staff_id: data.staff_id,
    email: data.email,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Legacy flag for AdminDashboard guard
  sessionStorage.setItem('adminLoggedIn', 'true');
  return user;
}

/** Logout */
export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('adminLoggedIn');
}

/** Get current session user */
export function getCurrentUser(): AppUser | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

/** Check if logged in */
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

/** Admin roles that can access full dashboard */
export const ADMIN_ROLES: UserRole[] = ['admin', 'director', 'deputy_director', 'dept_head'];

/** Roles that go to evaluatee portal */
export const EVALUATEE_ROLES: UserRole[] = ['assistant', 'temp_employee', 'temp_staff'];

/** Redirect path based on role — ทุก role ใช้ dashboard เดียวกัน (menu จำกัดตาม permissions) */
export function getRedirectPath(role: UserRole): string {
  return '/admin/dashboard';
}
