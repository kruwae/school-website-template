import { supabase } from '@/integrations/supabase/client';

export interface PublicMaintenanceRequest {
  id: string;
  title: string;
  subject?: string | null;
  status: string;
  completed_at?: string | null;
  updated_at?: string | null;
  location?: string | null;
  summary?: string | null;
}

const COMPLETED_STATUS = 'completed';

const normalizeMaintenanceRequest = (item: any): PublicMaintenanceRequest => {
  const title = String(item?.title || item?.subject || 'รายการซ่อม').trim();

  return {
    id: String(item?.id || ''),
    title,
    subject: item?.subject || item?.title || null,
    status: String(item?.status || ''),
    completed_at: item?.completed_at || item?.updated_at || null,
    updated_at: item?.updated_at || item?.created_at || null,
    location: item?.location || item?.room_number || null,
    summary: item?.summary || item?.completion_notes || item?.description || null,
  };
};

export const getCompletedMaintenanceRequestsPublic = async (limit = 5): Promise<PublicMaintenanceRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('id, title, subject, status, completed_at, updated_at, location, room_number, summary, completion_notes, description, created_at')
      .eq('status', COMPLETED_STATUS)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(normalizeMaintenanceRequest).filter(item => !!item.id);
  } catch (error) {
    console.warn('getCompletedMaintenanceRequestsPublic error:', error);
    try {
      const { data, error: fallbackError } = await supabase
        .from('maintenance_requests')
        .select('id, title, subject, status, updated_at, location, room_number, summary, completion_notes, description, created_at')
        .eq('status', COMPLETED_STATUS)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return (data || []).map(normalizeMaintenanceRequest).filter(item => !!item.id);
    } catch (fallbackError) {
      console.warn('getCompletedMaintenanceRequestsPublic fallback error:', fallbackError);
      return [];
    }
  }
};