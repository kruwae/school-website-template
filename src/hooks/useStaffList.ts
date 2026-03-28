import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StaffOption {
  id: string;
  name: string;       // จะ map จาก full_name
  position: string;
  role: string;
  department?: string; // จะ map จาก departments.name
}

/**
 * ดึงรายชื่อบุคลากร **จาก app_users** (Single Source of Truth)
 * เพื่อให้ผู้แจ้งซ่อม/ผู้ยื่นลา ตรงกับ user ที่ login จริง
 */
export function useStaffList() {
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase.from('app_users' as any) as any)
          .select('id, full_name, position, role, departments(name)')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (error) {
          console.error('[useStaffList] Supabase error:', error.message);
          setStaffList([]);
        } else {
          const mapped: StaffOption[] = (data ?? []).map((u: any) => ({
            id: u.id,
            name: u.full_name,
            position: u.position || u.role,
            role: u.role,
            department: u.departments?.name,
          }));
          console.log('[useStaffList] loaded', mapped.length, 'users from app_users');
          setStaffList(mapped);
        }
      } catch (e) {
        console.error('[useStaffList] unexpected error:', e);
        setStaffList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return { staffList, loading };
}
