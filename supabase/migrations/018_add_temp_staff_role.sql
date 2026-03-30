-- Add temp_staff role to app_users role constraint
ALTER TABLE public.app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE public.app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN (
    'admin',
    'director',
    'deputy_director',
    'dept_head',
    'teacher',
    'support_staff',
    'temp_employee',
    'assistant',
    'temp_staff'
  ));
