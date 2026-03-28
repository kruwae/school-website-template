-- =============================================
-- FIX_PASSWORDS.sql  (v2 — hashes verified from browser Web Crypto API)
-- รันบน Supabase SQL Editor เพื่อแก้ password_hash ที่ truncated
--
-- SHA-256 hash (64 chars) คำนวณจาก browser console:
--   admin123   → 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
--   teacher123 → cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416
--   assist123  → 2b24c026bf2dc89e367bee649a3d1f2522a972b76bc9731e4365279134121cc8
-- =============================================

-- ลบบัญชีเดิม (ที่มี hash truncated) แล้ว insert ใหม่ด้วย hash ที่ถูกต้อง
DELETE FROM public.app_users
WHERE username IN ('admin', 'director', 'teacher01', 'assistant01', 'temp01');

INSERT INTO public.app_users (username, full_name, email, password_hash, role) VALUES
  ('admin',
   'ผู้ดูแลระบบ',
   'admin@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'admin'),
  ('director',
   'ผู้อำนวยการโรงเรียน',
   'director@school.ac.th',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
   'director'),
  ('teacher01',
   'นางสาวทดสอบ ครูผู้สอน',
   'teacher01@school.ac.th',
   'cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416',
   'teacher'),
  ('assistant01',
   'นายทดสอบ ครูพี่เลี้ยง',
   'assistant01@school.ac.th',
   '2b24c026bf2dc89e367bee649a3d1f2522a972b76bc9731e4365279134121cc8',
   'assistant'),
  ('temp01',
   'นางทดสอบ ครูอัตราจ้าง',
   'temp01@school.ac.th',
   '2b24c026bf2dc89e367bee649a3d1f2522a972b76bc9731e4365279134121cc8',
   'temp_employee');

-- ตรวจสอบ
SELECT username, full_name, role,
       length(password_hash) AS hash_length,
       password_hash
FROM public.app_users
ORDER BY role;

-- =============================================
-- บัญชีทดสอบ:
--   admin      / admin123   → /admin/dashboard
--   director   / admin123   → /admin/dashboard
--   teacher01  / teacher123 → /portal/evaluatee
--   assistant01 / assist123 → /portal/evaluatee
--   temp01     / assist123  → /portal/evaluatee
-- =============================================
