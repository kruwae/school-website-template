import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Trash2, Edit2, RefreshCcw, CheckCheck, Send, UserPlus, ClipboardPen, Upload, Image as ImageIcon, X, Loader2, FileText, Download, Users, ShieldCheck } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { useStaffList } from '@/hooks/useStaffList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DutyCalendarCell, DutyCalendarItem } from './DutyCalendarCell';

interface DutyAssignment {
    id: string;
    duty_date: string;
    duty_shift: string;
    duty_shift_label: string;
    assigned_user_id?: string | null;
    assigned_name: string;
    assigned_position?: string | null;
    assigned_by_user_id?: string | null;
    notes?: string | null;
    status: 'scheduled' | 'completed' | 'cancelled' | string;
    created_at?: string;
    updated_at?: string;
}

interface DutyImageItem {
    url: string;
    name: string;
    type?: string | null;
    size?: number | null;
}

interface DutyRecord {
    id: string;
    assignment_id?: string | null;
    duty_date: string;
    duty_shift: string;
    duty_shift_label: string;
    recorder_name: string;
    recorder_position: string;
    students_present: number;
    students_absent: number;
    incidents: string;
    actions_taken: string;
    remarks: string;
    status: string;
    created_at: string;
    swap_requested?: boolean;
    swap_requested_at?: string | null;
    swap_requested_by_user_id?: string | null;
    swap_requested_by_name?: string | null;
    swap_requested_by_position?: string | null;
    swap_target_user_id?: string | null;
    swap_target_name?: string | null;
    swap_target_position?: string | null;
    swap_response_status?: 'pending' | 'accepted' | 'rejected' | 'not_required' | string;
    swap_responded_at?: string | null;
    swap_responded_by_user_id?: string | null;
    swap_response_note?: string | null;
    final_duty_user_id?: string | null;
    final_duty_name?: string | null;
    final_duty_position?: string | null;
    approval_ready?: boolean;
    duty_images?: DutyImageItem[] | null;
}

const SHIFT_MAP: Record<string, string> = {
    morning: 'เช้า',
    afternoon: 'บ่าย',
    evening: 'เย็น',
    overnight: 'ค้างคืน',
};

const STATUS_MAP: Record<string, string> = {
    verified: 'ตกลง/แลกเวรแล้ว',
    approved: 'อนุมัติแล้ว',
    recorded: 'บันทึกเวรแล้ว',
};

const ASSIGNMENT_STATUS_MAP: Record<string, string> = {
    scheduled: 'กำหนดแล้ว',
    completed: 'บันทึกเวรแล้ว',
    cancelled: 'ยกเลิก',
};

const SWAP_STATUS_MAP: Record<string, string> = {
    not_required: 'ไม่เปลี่ยนเวร',
    pending: 'รอผู้รับเวรตอบตกลง',
    accepted: 'ตอบตกลงแล้ว',
    rejected: 'ปฏิเสธการรับเวร',
};

const APPROVAL_STEP_LABELS = [
    'ยืนยันหรือขอเปลี่ยนเวร',
    'ผู้รับเวรตอบตกลง',
    'สรุปผู้ปฏิบัติเวรสุดท้าย',
    'ส่งอนุมัติ',
    'บันทึกเวร',
];

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const toDateOnly = (value: string) => {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
};

const isPastDutyDate = (dutyDate: string) => toDateOnly(dutyDate).getTime() < startOfToday().getTime();

const buildRecordFormFromAssignment = (assignment: DutyAssignment, currentUser: any) => ({
    assignment_id: assignment.id,
    duty_date: assignment.duty_date,
    duty_shift: assignment.duty_shift,
    duty_shift_label: assignment.duty_shift_label,
    recorder_name: currentUser?.full_name || assignment.assigned_name || '',
    recorder_position: currentUser?.position || assignment.assigned_position || '',
    students_present: 0,
    students_absent: 0,
    incidents: '',
    actions_taken: '',
    remarks: '',
    status: 'verified',
    swap_requested: false,
    swap_requested_at: null as string | null,
    swap_requested_by_user_id: null as string | null,
    swap_requested_by_name: null as string | null,
    swap_requested_by_position: null as string | null,
    swap_target_user_id: null as string | null,
    swap_target_name: null as string | null,
    swap_target_position: null as string | null,
    swap_response_status: 'not_required',
    swap_responded_at: null as string | null,
    swap_responded_by_user_id: null as string | null,
    swap_response_note: '',
    final_duty_user_id: currentUser?.id || assignment.assigned_user_id || null,
    final_duty_name: currentUser?.full_name || assignment.assigned_name || '',
    final_duty_position: currentUser?.position || assignment.assigned_position || '',
    approval_ready: true,
    duty_images: [] as DutyImageItem[],
});

const sanitizeStorageSegment = (value: string) => {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[.-]+|[.-]+$/g, '')
        .trim();
};

const buildAssignmentForm = () => ({
    duty_date: new Date().toISOString().split('T')[0],
    duty_shift: 'morning',
    duty_shift_label: 'เวรเช้า',
    assigned_user_id: '',
    assigned_name: '',
    assigned_position: '',
    notes: '',
});

const isHeadManagerPosition = (position: string) => {
    const positionText = String(position || '').toLowerCase();
    return positionText.includes('หัวหน้ากิจการนักเรียน') || positionText.includes('หัวหน้าฝ่ายบริหารงานทั่วไป');
};

const getMonthGridDays = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const start = new Date(firstDay);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    const days: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        days.push(current);
    }
    return days;
};

const formatThaiShortDate = (date: Date) => date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });

const formatThaiDay = (date: Date) => date.toLocaleDateString('th-TH', { day: 'numeric' });

export const DutyManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const { role } = usePermissions();
    const { staffList, loading: staffLoading } = useStaffList();

    const currentUserId = currentUser?.id || '';
    const currentUserName = currentUser?.full_name || '';
    const currentUserPosition = (currentUser as any)?.position || '';
    const currentUserPositionText = String(currentUserPosition || '').toLowerCase();
    const canSelfSchedule = !!currentUserId;
    const isScheduleManager =
        ['admin', 'director', 'deputy_director', 'dept_head'].includes(role || '') ||
        isHeadManagerPosition(currentUserPositionText);
    const canManageReports = ['admin', 'dept_head', 'director', 'deputy_director'].includes(role || '') ||
        isHeadManagerPosition(currentUserPositionText);

    const [activeTab, setActiveTab] = useState('assignments');
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [assignments, setAssignments] = useState<DutyAssignment[]>([]);
    const [records, setRecords] = useState<DutyRecord[]>([]);
    const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
    const [assignmentForm, setAssignmentForm] = useState(buildAssignmentForm());
    const [editingAssignment, setEditingAssignment] = useState<DutyAssignment | null>(null);
    const [showRecordDialog, setShowRecordDialog] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<DutyAssignment | null>(null);
    const [recordForm, setRecordForm] = useState<any>(null);
    const [swapDialogRecord, setSwapDialogRecord] = useState<DutyRecord | null>(null);
    const [uploadingImages, setUploadingImages] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [swapTargetUserId, setSwapTargetUserId] = useState('');
    const [swapRequestNote, setSwapRequestNote] = useState('');
    const [respondDialogRecord, setRespondDialogRecord] = useState<DutyRecord | null>(null);
    const [swapResponseNote, setSwapResponseNote] = useState('');
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [assignmentRes, recordRes] = await Promise.all([
                (supabase.from('duty_assignments' as any) as any)
                    .select('*')
                    .order('duty_date', { ascending: true })
                    .order('duty_shift', { ascending: true })
                    .limit(300),
                (supabase.from('duty_records' as any) as any)
                    .select('*')
                    .order('duty_date', { ascending: false })
                    .limit(300),
            ]);

            if (assignmentRes.error) throw assignmentRes.error;
            if (recordRes.error) throw recordRes.error;

            setAssignments(assignmentRes.data || []);
            setRecords(recordRes.data || []);
        } catch (e) {
            console.error(e);
            toast({ title: 'โหลดข้อมูลเวรไม่สำเร็จ', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const recordByAssignmentId = useMemo(() => {
        const map = new Map<string, DutyRecord>();
        records.forEach(record => {
            if (record.assignment_id) {
                map.set(record.assignment_id, record);
            }
        });
        return map;
    }, [records]);

    const isCurrentUserAssignedDuty = (assignment: DutyAssignment) => {
        return assignment.assigned_user_id
            ? assignment.assigned_user_id === currentUserId
            : assignment.assigned_name === currentUserName;
    };

    const isCurrentUserFinalDuty = (record?: DutyRecord) => {
        if (!record?.final_duty_user_id) return false;
        return record.final_duty_user_id === currentUserId;
    };

    const isCurrentUserSwapRelated = (record?: DutyRecord) => {
        if (!record) return false;
        return record.swap_requested_by_user_id === currentUserId || record.swap_target_user_id === currentUserId;
    };

    const canSeeDutyAssignment = (assignment: DutyAssignment, record?: DutyRecord) => {
        if (isScheduleManager || canManageReports) return true;
        return (
            isCurrentUserAssignedDuty(assignment) ||
            isCurrentUserFinalDuty(record) ||
            isCurrentUserSwapRelated(record) ||
            record?.swap_requested_by_user_id === currentUserId ||
            record?.swap_target_user_id === currentUserId ||
            record?.status === 'verified' ||
            record?.status === 'approved' ||
            record?.status === 'recorded'
        );
    };

    const myAssignments = useMemo(() => {
        return assignments.filter(item => {
            const relatedRecord = recordByAssignmentId.get(item.id);
            return canSeeDutyAssignment(item, relatedRecord) && item.status !== 'cancelled';
        });
    }, [assignments, recordByAssignmentId, currentUserId, currentUserName, isScheduleManager, canManageReports]);

    const filteredAssignments = useMemo(() => {
        return assignments.filter(item => {
            const record = recordByAssignmentId.get(item.id);
            return (!filterMonth || item.duty_date.startsWith(filterMonth)) && canSeeDutyAssignment(item, record);
        });
    }, [assignments, filterMonth, recordByAssignmentId, currentUserId, currentUserName, isScheduleManager, canManageReports]);

    const filteredRecords = useMemo(() => {
        return records.filter(item => {
            const assignment = assignments.find(a => a.id === item.assignment_id);
            if (!filterMonth || !item.duty_date.startsWith(filterMonth)) return false;
            if (isScheduleManager || canManageReports) return true;
            return (
                (assignment ? isCurrentUserAssignedDuty(assignment) : false) ||
                isCurrentUserFinalDuty(item) ||
                isCurrentUserSwapRelated(item)
            );
        });
    }, [records, assignments, filterMonth, currentUserId, currentUserName, isScheduleManager, canManageReports]);

    const monthAssignments = useMemo(() => {
        return filteredAssignments.filter(item => item.duty_date.startsWith(filterMonth));
    }, [filteredAssignments, filterMonth]);

    const calendarDays = useMemo(() => getMonthGridDays(filterMonth || new Date().toISOString().slice(0, 7)), [filterMonth]);

    const calendarItemsByDate = useMemo(() => {
        const map = new Map<string, DutyCalendarItem[]>();
        monthAssignments.forEach(assignment => {
            const record = recordByAssignmentId.get(assignment.id);
            const key = assignment.duty_date;
            const items = map.get(key) || [];
            items.push({
                id: assignment.id,
                title: assignment.duty_shift_label || SHIFT_MAP[assignment.duty_shift] || assignment.duty_shift,
                subtitle: assignment.notes || undefined,
                ownerName: assignment.assigned_name,
                finalDutyName: record?.final_duty_name || assignment.assigned_name,
                finalDutyPosition: record?.final_duty_position || assignment.assigned_position || undefined,
                statusLabel: record?.status ? (STATUS_MAP[record.status] || record.status) : (ASSIGNMENT_STATUS_MAP[assignment.status] || assignment.status),
                swapResponseStatus: record?.swap_response_status || null,
                approvalReady: record?.approval_ready,
                status: record?.status || assignment.status,
                notes: assignment.notes || null,
            });
            map.set(key, items);
        });
        return map;
    }, [monthAssignments, recordByAssignmentId]);

    const selectableStaff = useMemo(() => {
        return staffList.filter(person => person.id !== currentUserId);
    }, [staffList, currentUserId]);

    const canManageAssignment = (_assignment: DutyAssignment) => {
        return isScheduleManager;
    };

    const handleOpenAssignmentDialog = () => {
        setEditingAssignment(null);
        setAssignmentForm(buildAssignmentForm());
        setShowAssignmentDialog(true);
    };

    const handleEditAssignment = (assignment: DutyAssignment) => {
        if (!canManageAssignment(assignment)) {
            toast({ title: 'คุณไม่มีสิทธิ์แก้ไขการกำหนดเวรนี้', variant: 'destructive' });
            return;
        }

        setEditingAssignment(assignment);
        setAssignmentForm({
            duty_date: assignment.duty_date,
            duty_shift: assignment.duty_shift,
            duty_shift_label: assignment.duty_shift_label,
            assigned_user_id: assignment.assigned_user_id || '',
            assigned_name: assignment.assigned_name || '',
            assigned_position: assignment.assigned_position || '',
            notes: assignment.notes || '',
        });
        setShowAssignmentDialog(true);
    };

    const handleDeleteAssignment = async (assignment: DutyAssignment) => {
        if (!canManageAssignment(assignment)) {
            toast({ title: 'คุณไม่มีสิทธิ์ลบการกำหนดเวรนี้', variant: 'destructive' });
            return;
        }

        if (!confirm('ต้องการลบกำหนดเวรนี้ใช่หรือไม่?')) return;

        const relatedRecord = recordByAssignmentId.get(assignment.id);
        if (relatedRecord) {
            toast({
                title: 'ไม่สามารถลบได้',
                description: 'เวรนี้มีการบันทึกเวรแล้ว กรุณาจัดการบันทึกเวรก่อน',
                variant: 'destructive',
            });
            return;
        }

        const { error } = await (supabase.from('duty_assignments' as any) as any)
            .delete()
            .eq('id', assignment.id);

        if (error) {
            toast({ title: 'ลบกำหนดเวรไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }

        toast({ title: 'ลบกำหนดเวรสำเร็จ' });
        fetchAll();
    };

    const handleSaveAssignment = async () => {
        const selectedStaff = isScheduleManager
            ? staffList.find(person => person.id === assignmentForm.assigned_user_id)
            : {
                id: currentUserId,
                name: currentUserName,
                position: currentUserPosition,
            };

        if (!selectedStaff?.id || !selectedStaff?.name) {
            toast({ title: 'กรุณาเลือกผู้เข้าเวร', variant: 'destructive' });
            return;
        }

        const payload = {
            duty_date: assignmentForm.duty_date,
            duty_shift: assignmentForm.duty_shift,
            duty_shift_label: assignmentForm.duty_shift_label,
            assigned_user_id: selectedStaff.id,
            assigned_name: selectedStaff.name,
            assigned_position: selectedStaff.position,
            assigned_by_user_id: currentUserId || null,
            notes: assignmentForm.notes.trim() || null,
            status: 'scheduled',
            updated_at: new Date().toISOString(),
        };

        const { error } = editingAssignment
            ? await (supabase.from('duty_assignments' as any) as any)
                .update(payload)
                .eq('id', editingAssignment.id)
            : await (supabase.from('duty_assignments' as any) as any)
                .insert([payload]);

        if (error) {
            toast({ title: 'บันทึกกำหนดเข้าเวรไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }

        toast({ title: editingAssignment ? 'แก้ไขกำหนดเข้าเวรสำเร็จ' : 'กำหนดเข้าเวรสำเร็จ' });
        setShowAssignmentDialog(false);
        setEditingAssignment(null);
        fetchAll();
    };

    const buildRecordFormFromExisting = (assignment: DutyAssignment, existingRecord: DutyRecord) => ({
        assignment_id: assignment.id,
        duty_date: existingRecord.duty_date,
        duty_shift: existingRecord.duty_shift,
        duty_shift_label: existingRecord.duty_shift_label,
        recorder_name: existingRecord.recorder_name,
        recorder_position: existingRecord.recorder_position || '',
        students_present: existingRecord.students_present || 0,
        students_absent: existingRecord.students_absent || 0,
        incidents: existingRecord.incidents || '',
        actions_taken: existingRecord.actions_taken || '',
        remarks: existingRecord.remarks || '',
        status: existingRecord.status,
        swap_requested: !!existingRecord.swap_requested,
        swap_requested_at: existingRecord.swap_requested_at || null,
        swap_requested_by_user_id: existingRecord.swap_requested_by_user_id || null,
        swap_requested_by_name: existingRecord.swap_requested_by_name || null,
        swap_requested_by_position: existingRecord.swap_requested_by_position || null,
        swap_target_user_id: existingRecord.swap_target_user_id || null,
        swap_target_name: existingRecord.swap_target_name || null,
        swap_target_position: existingRecord.swap_target_position || null,
        swap_response_status: existingRecord.swap_response_status || 'not_required',
        swap_responded_at: existingRecord.swap_responded_at || null,
        swap_responded_by_user_id: existingRecord.swap_responded_by_user_id || null,
        swap_response_note: existingRecord.swap_response_note || '',
        final_duty_user_id: existingRecord.final_duty_user_id || null,
        final_duty_name: existingRecord.final_duty_name || existingRecord.recorder_name,
        final_duty_position: existingRecord.final_duty_position || existingRecord.recorder_position || '',
        approval_ready: existingRecord.approval_ready ?? (!existingRecord.swap_requested || existingRecord.swap_response_status === 'accepted'),
        duty_images: existingRecord.duty_images || [],
    });

    const canCurrentUserRecordDuty = (assignment: DutyAssignment, record?: DutyRecord) => {
        if (!record) return false;
        if (record.final_duty_user_id) return record.final_duty_user_id === currentUserId;
        return isCurrentUserAssignedDuty(assignment);
    };

    const canOpenRecordDialog = (assignment: DutyAssignment, record?: DutyRecord) => {
        if (isPastDutyDate(assignment.duty_date)) return false;
        if (!record) return false;
        if (record.status !== 'approved') return false;
        return canCurrentUserRecordDuty(assignment, record);
    };

    const openRecordDialog = (assignment: DutyAssignment) => {
        if (isPastDutyDate(assignment.duty_date)) {
            toast({ title: 'วันที่เข้าเวรพ้นกำหนดแล้ว', description: 'ไม่สามารถเริ่มบันทึกหรือขอเปลี่ยนเวรย้อนหลังได้', variant: 'destructive' });
            return;
        }

        const existingRecord = recordByAssignmentId.get(assignment.id);
        if (!canOpenRecordDialog(assignment, existingRecord)) {
            toast({
                title: 'ยังไม่สามารถบันทึกเวรได้',
                description: 'ต้องตกลงหรือแลกเวรให้เสร็จ ส่งอนุมัติ และรออนุมัติก่อน',
                variant: 'destructive',
            });
            return;
        }

        setSelectedAssignment(assignment);
        setRecordForm(buildRecordFormFromExisting(assignment, existingRecord as DutyRecord));
        setShowRecordDialog(true);
    };

    const getOrCreateDraftRecord = async (assignment: DutyAssignment) => {
        const existingRecord = recordByAssignmentId.get(assignment.id);
        if (existingRecord) return existingRecord;

        const draftPayload = {
            ...buildRecordFormFromAssignment(assignment, currentUser),
            status: 'verified',
            approval_ready: false,
        };
        const { data, error } = await (supabase.from('duty_records' as any) as any)
            .insert([draftPayload])
            .select('*')
            .single();

        if (error) throw error;

        await (supabase.from('duty_assignments' as any) as any)
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', assignment.id);

        return data as DutyRecord;
    };

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        setUploadingImages(true);
        try {
            const uploadedItems: DutyImageItem[] = [];

            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    toast({ title: 'อนุญาตเฉพาะไฟล์รูปภาพ', description: `${file.name} ไม่ใช่ไฟล์รูปภาพ`, variant: 'destructive' });
                    continue;
                }

                const ext = sanitizeStorageSegment(file.name.split('.').pop() || 'jpg').replace(/\./g, '') || 'jpg';
                const baseName = sanitizeStorageSegment(file.name.replace(/\.[^.]+$/, '') || 'duty-image').replace(/\./g, '') || 'duty-image';
                const filePath = `duty-records/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${baseName}.${ext}`;

                const { data, error } = await supabase.storage
                    .from('school-images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type || 'image/jpeg',
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage.from('school-images').getPublicUrl(data.path);

                uploadedItems.push({
                    url: publicUrl,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                });
            }

            if (uploadedItems.length) {
                setRecordForm((prev: any) => ({
                    ...prev,
                    duty_images: [...(prev?.duty_images || []), ...uploadedItems],
                }));
                toast({ title: 'อัปโหลดรูปภาพสำเร็จ', description: `เพิ่มรูปภาพ ${uploadedItems.length} รูป` });
            }
        } catch (error: any) {
            toast({ title: 'อัปโหลดรูปภาพไม่สำเร็จ', description: error?.message || 'เกิดข้อผิดพลาด', variant: 'destructive' });
        } finally {
            setUploadingImages(false);
            event.target.value = '';
        }
    };

    const removeDutyImage = (imageUrl: string) => {
        setRecordForm((prev: any) => ({
            ...prev,
            duty_images: (prev?.duty_images || []).filter((item: DutyImageItem) => item.url !== imageUrl),
        }));
    };

    const handleSaveRecord = async () => {
        if (!selectedAssignment || !recordForm) return;

        if (isPastDutyDate(selectedAssignment.duty_date)) {
            toast({ title: 'วันที่เข้าเวรพ้นกำหนดแล้ว', variant: 'destructive' });
            return;
        }

        const existingRecord = recordByAssignmentId.get(selectedAssignment.id);

        const payload = {
            ...recordForm,
            assignment_id: selectedAssignment.id,
            duty_date: selectedAssignment.duty_date,
            duty_shift: selectedAssignment.duty_shift,
            duty_shift_label: selectedAssignment.duty_shift_label,
            recorder_name: recordForm.recorder_name || currentUserName || selectedAssignment.assigned_name,
            recorder_position: recordForm.recorder_position || currentUserPosition || selectedAssignment.assigned_position || '',
            approval_ready: true,
            final_duty_name: recordForm.final_duty_name || recordForm.recorder_name || currentUserName || selectedAssignment.assigned_name,
            final_duty_position: recordForm.final_duty_position || recordForm.recorder_position || currentUserPosition || selectedAssignment.assigned_position || '',
            final_duty_user_id: recordForm.final_duty_user_id || currentUserId || selectedAssignment.assigned_user_id || null,
            swap_response_status: recordForm.swap_requested ? recordForm.swap_response_status : 'not_required',
            duty_images: recordForm.duty_images || [],
            status: 'recorded',
        };

        let error = null;

        if (existingRecord) {
            const res = await (supabase.from('duty_records' as any) as any).update(payload).eq('id', existingRecord.id);
            error = res.error;
        } else {
            const res = await (supabase.from('duty_records' as any) as any).insert([payload]);
            error = res.error;
        }

        if (error) {
            toast({ title: 'บันทึกเวรไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }

        await (supabase.from('duty_assignments' as any) as any)
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', selectedAssignment.id);

        toast({ title: existingRecord ? 'อัปเดตบันทึกเวรสำเร็จ' : 'บันทึกเวรสำเร็จ' });
        setShowRecordDialog(false);
        setSelectedAssignment(null);
        setRecordForm(null);
        fetchAll();
    };

    const belongsToCurrentUser = (assignment: DutyAssignment) => {
        return assignment.assigned_user_id
            ? assignment.assigned_user_id === currentUserId
            : assignment.assigned_name === currentUserName;
    };

    const canConfirmNoSwap = (assignment: DutyAssignment, record?: DutyRecord) => {
        if (isPastDutyDate(assignment.duty_date)) return false;
        if (!isCurrentUserAssignedDuty(assignment)) return false;
        if (record && record.status !== 'draft' && record.status !== 'verified') return false;
        return !record || !record.swap_requested;
    };

    const canRequestSwap = (assignment: DutyAssignment, record?: DutyRecord) => {
        if (isPastDutyDate(assignment.duty_date)) return false;
        if (!isCurrentUserAssignedDuty(assignment)) return false;
        if (!record) return true;
        if (record.status === 'approved' || record.status === 'recorded') return false;
        return !record.swap_requested || record.swap_response_status === 'rejected';
    };

    const canOpenSelfRecordActions = (assignment: DutyAssignment, record?: DutyRecord) => {
        if (isPastDutyDate(assignment.duty_date)) return false;
        if (!record) return false;
        if (!isCurrentUserAssignedDuty(assignment) && !isCurrentUserFinalDuty(record)) return false;
        return record.status === 'verified' || record.status === 'approved' || record.status === 'recorded';
    };

    const canRespondSwap = (record: DutyRecord, assignment?: DutyAssignment) => {
        if (!assignment || isPastDutyDate(assignment.duty_date)) return false;
        if (!currentUserId) return false;
        if (!record.swap_requested) return false;
        if (record.swap_response_status !== 'pending') return false;
        return record.swap_target_user_id === currentUserId;
    };

    const canSubmitForApproval = (record: DutyRecord, assignment?: DutyAssignment) => {
        if (!assignment || isPastDutyDate(assignment.duty_date)) return false;
        if (!isCurrentUserAssignedDuty(assignment) && !isCurrentUserFinalDuty(record)) return false;
        if (record.swap_requested && record.swap_requested_by_user_id && record.swap_requested_by_user_id !== currentUserId) return false;
        if (record.status !== 'verified') return false;
        if (record.swap_requested && record.swap_response_status !== 'accepted') return false;
        return !!record.approval_ready;
    };

    const handleConfirmNoSwap = async (assignment: DutyAssignment) => {
        if (isPastDutyDate(assignment.duty_date)) {
            toast({ title: 'วันที่เข้าเวรพ้นกำหนดแล้ว', variant: 'destructive' });
            return;
        }

        try {
            const existingRecord = recordByAssignmentId.get(assignment.id);
            if (existingRecord) {
                const { error } = await (supabase.from('duty_records' as any) as any)
                    .update({
                        swap_requested: false,
                        swap_requested_at: null,
                        swap_requested_by_user_id: currentUserId || null,
                        swap_requested_by_name: currentUserName || assignment.assigned_name,
                        swap_requested_by_position: currentUserPosition || assignment.assigned_position || '',
                        swap_target_user_id: null,
                        swap_target_name: null,
                        swap_target_position: null,
                        swap_response_status: 'not_required',
                        swap_responded_at: null,
                        swap_responded_by_user_id: null,
                        swap_response_note: null,
                        final_duty_user_id: currentUserId || assignment.assigned_user_id || null,
                        final_duty_name: currentUserName || assignment.assigned_name,
                        final_duty_position: currentUserPosition || assignment.assigned_position || '',
                        approval_ready: true,
                        status: 'verified',
                    })
                    .eq('id', existingRecord.id);

                if (error) throw error;
            } else {
                const payload = {
                    ...buildRecordFormFromAssignment(assignment, currentUser),
                    swap_requested: false,
                    swap_requested_at: new Date().toISOString(),
                    swap_requested_by_user_id: currentUserId || null,
                    swap_requested_by_name: currentUserName || assignment.assigned_name,
                    swap_requested_by_position: currentUserPosition || assignment.assigned_position || '',
                    swap_response_status: 'not_required',
                    final_duty_user_id: currentUserId || assignment.assigned_user_id || null,
                    final_duty_name: currentUserName || assignment.assigned_name,
                    final_duty_position: currentUserPosition || assignment.assigned_position || '',
                    approval_ready: true,
                    status: 'verified',
                };

                const { error } = await (supabase.from('duty_records' as any) as any).insert([payload]);
                if (error) throw error;
            }

            await (supabase.from('duty_assignments' as any) as any)
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', assignment.id);

            toast({ title: 'ยืนยันเวรนี้แล้ว', description: 'ไม่มีการแลกเวร และสามารถส่งอนุมัติได้' });
            fetchAll();
        } catch (error: any) {
            toast({ title: 'ยืนยันเวรไม่สำเร็จ', description: error?.message || 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    const openSwapDialog = async (assignment: DutyAssignment) => {
        if (isPastDutyDate(assignment.duty_date)) {
            toast({ title: 'วันที่เข้าเวรพ้นกำหนดแล้ว', description: 'ไม่สามารถเปลี่ยนเวรย้อนหลังได้', variant: 'destructive' });
            return;
        }

        try {
            const record = await getOrCreateDraftRecord(assignment);
            setSwapDialogRecord(record);
            setSwapTargetUserId(record.swap_target_user_id || '');
            setSwapRequestNote(record.swap_response_status === 'rejected' ? '' : record.swap_response_note || '');
            fetchAll();
        } catch (error: any) {
            toast({ title: 'เปิดหน้าขอแลกเวรไม่สำเร็จ', description: error?.message || 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    const handleSwapRequest = async () => {
        if (!swapDialogRecord) return;
        const assignment = assignments.find(item => item.id === swapDialogRecord.assignment_id);
        if (!assignment || isPastDutyDate(assignment.duty_date)) {
            toast({ title: 'วันที่เข้าเวรพ้นกำหนดแล้ว', variant: 'destructive' });
            return;
        }

        const selected = selectableStaff.find(person => person.id === swapTargetUserId);
        if (!selected) {
            toast({ title: 'กรุณาเลือกผู้รับเปลี่ยนเวร', variant: 'destructive' });
            return;
        }

        const payload = {
            swap_requested: true,
            swap_requested_at: new Date().toISOString(),
            swap_requested_by_user_id: currentUserId || null,
            swap_requested_by_name: currentUserName || swapDialogRecord.recorder_name,
            swap_requested_by_position: currentUserPosition || swapDialogRecord.recorder_position,
            swap_target_user_id: selected.id,
            swap_target_name: selected.name,
            swap_target_position: selected.position,
            swap_response_status: 'pending',
            swap_responded_at: null,
            swap_responded_by_user_id: null,
            swap_response_note: swapRequestNote.trim() || null,
            final_duty_user_id: null,
            final_duty_name: null,
            final_duty_position: null,
            approval_ready: false,
        };

        const { error } = await (supabase.from('duty_records' as any) as any)
            .update(payload)
            .eq('id', swapDialogRecord.id);

        if (error) {
            toast({ title: 'ส่งคำขอเปลี่ยนเวรไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }

        toast({ title: 'ส่งคำขอเปลี่ยนเวรแล้ว' });
        setSwapDialogRecord(null);
        setSwapTargetUserId('');
        setSwapRequestNote('');
        fetchAll();
    };

    const openRespondDialog = (record: DutyRecord) => {
        setRespondDialogRecord(record);
        setSwapResponseNote(record.swap_response_note || '');
    };

    const handleSwapResponse = async (decision: 'accepted' | 'rejected') => {
        if (!respondDialogRecord) return;
        const assignment = assignments.find(item => item.id === respondDialogRecord.assignment_id);
        if (!assignment || isPastDutyDate(assignment.duty_date)) {
            toast({ title: 'วันที่เข้าเวรพ้นกำหนดแล้ว', variant: 'destructive' });
            return;
        }

        const payload = decision === 'accepted'
            ? {
                swap_response_status: 'accepted',
                swap_responded_at: new Date().toISOString(),
                swap_responded_by_user_id: currentUserId || null,
                swap_response_note: swapResponseNote.trim() || null,
                final_duty_user_id: currentUserId || null,
                final_duty_name: currentUserName,
                final_duty_position: currentUserPosition,
                approval_ready: true,
            }
            : {
                swap_response_status: 'rejected',
                swap_responded_at: new Date().toISOString(),
                swap_responded_by_user_id: currentUserId || null,
                swap_response_note: swapResponseNote.trim() || null,
                final_duty_user_id: respondDialogRecord.swap_requested_by_user_id || null,
                final_duty_name: respondDialogRecord.swap_requested_by_name || respondDialogRecord.recorder_name,
                final_duty_position: respondDialogRecord.swap_requested_by_position || respondDialogRecord.recorder_position,
                approval_ready: false,
            };

        const { error } = await (supabase.from('duty_records' as any) as any)
            .update(payload)
            .eq('id', respondDialogRecord.id);

        if (error) {
            toast({ title: 'บันทึกการตอบรับไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }

        toast({ title: decision === 'accepted' ? 'ตอบตกลงรับเวรแล้ว' : 'ปฏิเสธการรับเวรแล้ว' });
        setRespondDialogRecord(null);
        setSwapResponseNote('');
        fetchAll();
    };

    const handleSubmitForApproval = async (record: DutyRecord) => {
        const assignment = assignments.find(item => item.id === record.assignment_id);
        if (!canSubmitForApproval(record, assignment)) {
            toast({ title: 'ยังไม่สามารถส่งอนุมัติได้', description: 'ต้องตอบตกลงการเปลี่ยนเวรก่อน และวันเวรต้องยังไม่พ้นกำหนด', variant: 'destructive' });
            return;
        }

        const { error } = await (supabase.from('duty_records' as any) as any)
            .update({ status: 'approved' })
            .eq('id', record.id);

        if (error) {
            toast({ title: 'ส่งอนุมัติไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }

        toast({ title: 'ส่งบันทึกเวรเข้าอนุมัติตามลำดับแล้ว' });
        fetchAll();
    };

    const getApprovalFlowState = (assignment: DutyAssignment, record?: DutyRecord) => {
        const isOwner = isCurrentUserAssignedDuty(assignment);
        const isSwapTarget = !!record?.swap_target_user_id && record.swap_target_user_id === currentUserId;
          const isFinalDutyUser = !!record?.final_duty_user_id && record.final_duty_user_id === currentUserId;
          const isManagerViewer = isScheduleManager || canManageReports;


        const hasAcceptedSwap = record?.swap_requested && record?.swap_response_status === 'accepted';
        const finalDutyResolved = !!record?.final_duty_name;
        const submittedForApproval = record?.status === 'approved' || record?.status === 'recorded';
        const canRecordNow = !!record && canOpenRecordDialog(assignment, record);

        return [
            {
                label: APPROVAL_STEP_LABELS[0],
                done: !!record && (!record.swap_requested || record.swap_response_status === 'not_required' || record.swap_response_status === 'pending' || record.swap_response_status === 'accepted' || record.swap_response_status === 'rejected'),
                active: isOwner && !record,
            },
            {
                label: APPROVAL_STEP_LABELS[1],
                done: !record?.swap_requested || hasAcceptedSwap,
                active: !!record?.swap_requested && record?.swap_response_status === 'pending' && isSwapTarget,
            },
            {
                label: APPROVAL_STEP_LABELS[2],
                done: finalDutyResolved,
                active: !!record && !finalDutyResolved && (isFinalDutyUser || isManagerViewer),
            },
            {
                label: APPROVAL_STEP_LABELS[3],
                done: submittedForApproval,
                active: !!record && !submittedForApproval && canSubmitForApproval(record, assignment),
            },
            {
                label: APPROVAL_STEP_LABELS[4],
                done: canRecordNow || record?.status === 'recorded',
                active: submittedForApproval && !canRecordNow && record?.status !== 'recorded',
            },
        ];
    };

    const exportMonthlyReportPdf = () => {
        if (!canManageReports) {
            toast({ title: 'ไม่มีสิทธิ์ส่งออกรายงาน', description: 'เฉพาะหัวหน้าฝ่ายและแอดมิน', variant: 'destructive' });
            return;
        }

        const reportRecords = records.filter(item => item.duty_date.startsWith(reportMonth));
        const reportTitle = `รายงานบันทึกเวร ประจำเดือน ${reportMonth}`;
        const printableWindow = window.open('', '_blank', 'width=1200,height=900');

        if (!printableWindow) {
            toast({ title: 'ไม่สามารถเปิดหน้าพิมพ์ได้', variant: 'destructive' });
            return;
        }

        const rows = reportRecords.map((record, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${new Date(record.duty_date).toLocaleDateString('th-TH')}</td>
                <td>${record.duty_shift_label}</td>
                <td>${record.swap_requested_by_name || '-'}</td>
                <td>${record.swap_target_name || '-'}</td>
                <td>${record.final_duty_name || record.recorder_name || '-'}</td>
                <td>${STATUS_MAP[record.status] || record.status}</td>
                <td>${record.incidents || '-'}</td>
            </tr>
        `).join('');

        printableWindow.document.write(`
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        body { font-family: Tahoma, sans-serif; padding: 32px; color: #111827; }
                        h1 { font-size: 24px; margin-bottom: 8px; }
                        p { margin: 0 0 16px; color: #4b5563; }
                        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                        th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
                        th { background: #f3f4f6; text-align: left; }
                        .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
                        .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fafafa; }
                    </style>
                </head>
                <body>
                    <h1>${reportTitle}</h1>
                    <p>สรุปรายการบันทึกเวรและการเปลี่ยนเวรสำหรับส่งออกเป็น PDF</p>
                    <div class="meta">
                        <div class="box"><strong>เดือนรายงาน</strong><br/>${reportMonth}</div>
                        <div class="box"><strong>จำนวนรายการ</strong><br/>${reportRecords.length} รายการ</div>
                        <div class="box"><strong>ผู้ส่งออก</strong><br/>${currentUserName || '-'}</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>วันที่</th>
                                <th>ช่วงเวร</th>
                                <th>ผู้ขอเปลี่ยนเวร</th>
                                <th>ผู้รับเปลี่ยนเวร</th>
                                <th>ผู้ปฏิบัติเวรสุดท้าย</th>
                                <th>สถานะ</th>
                                <th>เหตุการณ์</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows || '<tr><td colspan="8">ไม่พบข้อมูลในเดือนที่เลือก</td></tr>'}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printableWindow.document.close();
        printableWindow.focus();
        printableWindow.print();
    };

    const renderAssignmentCard = (assignment: DutyAssignment, forMine = false) => {
        const record = recordByAssignmentId.get(assignment.id);
        if (!canSeeDutyAssignment(assignment, record)) return null;
        const dutyExpired = isPastDutyDate(assignment.duty_date);
        const approvalFlow = getApprovalFlowState(assignment, record);

        return (
            <Card key={assignment.id} className="border">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">
                                    {new Date(assignment.duty_date).toLocaleDateString('th-TH')} • {assignment.duty_shift_label || SHIFT_MAP[assignment.duty_shift] || assignment.duty_shift}
                                </h3>
                                <Badge variant="outline">{ASSIGNMENT_STATUS_MAP[assignment.status] || assignment.status}</Badge>
                                {dutyExpired && <Badge variant="destructive">พ้นกำหนด</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                ผู้เข้าเวร: <span className="font-medium text-foreground">{assignment.assigned_name}</span>
                                {assignment.assigned_position ? ` (${assignment.assigned_position})` : ''}
                            </p>
                            {assignment.notes && (
                                <p className="text-sm text-muted-foreground">หมายเหตุ: {assignment.notes}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            {canManageAssignment(assignment) && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEditAssignment(assignment)}
                                        title="แก้ไขกำหนดเวร"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleDeleteAssignment(assignment)}
                                        title="ลบกำหนดเวร"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            )}

                            {canConfirmNoSwap(assignment, record) && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleConfirmNoSwap(assignment)}
                                    disabled={dutyExpired}
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    ตกลง
                                </Button>
                            )}

                            {canRequestSwap(assignment, record) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => openSwapDialog(assignment)}
                                    disabled={dutyExpired}
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    แลกเวร
                                </Button>
                            )}

                            {record && (
                                <>
                                    {canOpenRecordDialog(assignment, record) && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => openRecordDialog(assignment)}
                                            disabled={dutyExpired}
                                        >
                                            <ClipboardPen className="w-4 h-4" />
                                            บันทึกเวร
                                        </Button>
                                    )}

                                    {canOpenSelfRecordActions(assignment, record) && (
                                        <>
                                            {canRespondSwap(record, assignment) && (
                                                <Button variant="secondary" size="sm" className="gap-2" onClick={() => openRespondDialog(record)}>
                                                    <CheckCheck className="w-4 h-4" />
                                                    ตอบรับเปลี่ยนเวร
                                                </Button>
                                            )}

                                            {canSubmitForApproval(record, assignment) && (
                                                <Button size="sm" className="gap-2" onClick={() => handleSubmitForApproval(record)}>
                                                    <Send className="w-4 h-4" />
                                                    ส่งอนุมัติ
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {record && (
                        <div className="space-y-3">
                            <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
                                <div className="rounded-xl border bg-background p-3">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <p className="text-sm font-semibold">สถานะการดำเนินงาน</p>
                                        <Badge variant="outline">{STATUS_MAP[record.status] || record.status}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        {approvalFlow.map((step, index) => (
                                            <div
                                                key={step.label}
                                                className={`rounded-lg border p-2 text-xs ${
                                                    step.done
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                                        : step.active
                                                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                                                            : 'border-border bg-muted/20 text-muted-foreground'
                                                }`}
                                            >
                                                <div className="mb-1 font-semibold">ขั้นตอน {index + 1}</div>
                                                <div>{step.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-muted/20 p-3">
                                    <p className="text-sm font-semibold mb-3">สรุปการเปลี่ยนเวร</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">ผู้ขอเปลี่ยนเวร</p>
                                                <p className="font-medium">{record.swap_requested_by_name || assignment.assigned_name || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <RefreshCcw className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">ผู้รับเปลี่ยนเวร</p>
                                                <p className="font-medium">{record.swap_target_name || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <ShieldCheck className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">ผู้ปฏิบัติเวรสุดท้าย</p>
                                                <p className="font-medium">{record.final_duty_name || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">สถานะบันทึกเวร</p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge variant="outline">{STATUS_MAP[record.status] || record.status}</Badge>
                                        <Badge variant={record.swap_response_status === 'accepted' ? 'default' : 'outline'}>
                                            {SWAP_STATUS_MAP[record.swap_response_status || 'not_required'] || record.swap_response_status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">เหตุการณ์: <span className="text-foreground">{record.incidents || '-'}</span></p>
                                    {!!record.duty_images?.length && (
                                        <p className="text-sm text-muted-foreground mt-2">แนบรูปภาพแล้ว {record.duty_images.length} รูป</p>
                                    )}
                                </div>
                                <div className="rounded-lg border bg-emerald-50 p-3">
                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">ผู้ปฏิบัติเวรสุดท้าย</p>
                                    <p className="text-sm font-medium text-emerald-900">{record.final_duty_name || record.recorder_name}</p>
                                    <p className="text-xs text-emerald-700">{record.final_duty_position || record.recorder_position || '-'}</p>
                                    <p className="text-xs text-emerald-700 mt-2">
                                        {record.status === 'approved'
                                            ? 'อนุมัติแล้ว ผู้ปฏิบัติเวรสุดท้ายเท่านั้นที่จะเห็นปุ่มบันทึกเวร'
                                            : record.swap_requested
                                                ? 'กรณีแลกเวร ต้องให้ผู้รับเวรตอบตกลงก่อน ระบบจะแสดงผู้รับเวรและผู้ปฏิบัติเวรสุดท้ายให้ชัดเจน แล้วจึงส่งอนุมัติตามลำดับ'
                                                : 'กรณีตกลงไม่มีการแลกเวร เจ้าของเวรจะเป็นผู้ส่งอนุมัติ'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {forMine && !record && !dutyExpired && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                            เวรนี้เป็นของคุณ ปุ่ม “ตกลง” คือยืนยันว่าไม่มีการแลกเวร ส่วน “แลกเวร” คือส่งคำขอแลกเวรโดยเลือกผู้มารับเวรแทน เมื่ออนุมัติแล้ว ผู้ที่ปฏิบัติเวรจริงจะเห็นปุ่ม “บันทึกเวร”
                        </div>
                    )}

                    {dutyExpired && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                            วันที่เข้าเวรพ้นกำหนดแล้ว จึงไม่สามารถเปลี่ยนเวรกับผู้อื่นได้
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="rounded-2xl border bg-gradient-to-r from-background to-muted/30 p-5">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarCheck className="w-6 h-6 text-green-600" /> จัดการเวรประจำวัน
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            มุมมองใหม่แบบปฏิทิน เน้นสถานะสำคัญ ปุ่มชัด และลดข้อความยาวที่ไม่จำเป็น
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-44" />
                        {canManageReports && (
                            <>
                                <Input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="w-44" />
                                <Button variant="outline" className="gap-2" onClick={exportMonthlyReportPdf}>
                                    <Download className="w-4 h-4" />
                                    ส่งออก PDF
                                </Button>
                            </>
                        )}
                        {canSelfSchedule && (
                            <Button onClick={handleOpenAssignmentDialog} className="gap-2">
                                <UserPlus className="w-4 h-4" />
                                กำหนดเข้าเวร
                            </Button>
                        )}
                    </div>
                </div>

                {canManageReports && (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="w-4 h-4 text-primary" />
                                รายงานประจำเดือน
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">สร้างสรุปบันทึกเวรและรายการเปลี่ยนเวรตามเดือนที่เลือก</p>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-sm font-medium">สิทธิ์การใช้งาน</div>
                            <p className="text-xs text-muted-foreground mt-1">เฉพาะหัวหน้าฝ่ายและแอดมินเท่านั้น</p>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                            <div className="text-sm font-medium">รูปแบบส่งออก</div>
                            <p className="text-xs text-muted-foreground mt-1">เปิดหน้าพิมพ์เพื่อบันทึกเป็น PDF ได้ทันที</p>
                        </div>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assignments">กำหนดเข้าเวร</TabsTrigger>
                    <TabsTrigger value="records">บันทึกเวร</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <p className="font-medium">ภาพรวมการกำหนดเข้าเวร</p>
                            <p className="text-sm text-muted-foreground">
                                ปฏิทินแสดงเวรของเดือนที่เลือกพร้อมสถานะการแลกเวร การรับเวร และผู้ปฏิบัติเวรสุดท้าย
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid xl:grid-cols-[1.45fr_1fr] gap-6">
                        <div className="space-y-4">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold">ปฏิทินกำหนดเข้าเวร</h2>
                                    <p className="text-sm text-muted-foreground">แสดงรายการตามเดือนที่เลือกแบบปฏิทินรายเดือน</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <Badge variant="outline">กำหนดเวร</Badge>
                                    <Badge className="bg-sky-50 text-sky-900 border-sky-200">พร้อมอนุมัติ</Badge>
                                    <Badge className="bg-amber-50 text-amber-900 border-amber-200">รอรับเวร</Badge>
                                    <Badge className="bg-emerald-50 text-emerald-900 border-emerald-200">บันทึกแล้ว</Badge>
                                </div>
                            </div>

                            {loading ? (
                                <Card><CardContent className="p-8 text-center text-muted-foreground">กำลังโหลด...</CardContent></Card>
                            ) : (
                                <div className="rounded-2xl border bg-background p-3">
                                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                                            <div key={day} className="py-2">{day}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {calendarDays.map(date => {
                                            const key = date.toISOString().split('T')[0];
                                            const items = calendarItemsByDate.get(key) || [];
                                            const isCurrentMonth = key.startsWith(filterMonth);
                                            const isToday = key === new Date().toISOString().split('T')[0];
                                            return (
                                                <DutyCalendarCell
                                                    key={key}
                                                    dateLabel={formatThaiShortDate(date)}
                                                    dayNumber={formatThaiDay(date)}
                                                    isCurrentMonth={isCurrentMonth}
                                                    isToday={isToday}
                                                    items={items}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold">รายการกำหนดเข้าเวรทั้งหมด</h2>
                                <p className="text-sm text-muted-foreground">ใช้สำหรับตรวจสอบรายการแบบละเอียดและจัดการ CRUD ได้ตามสิทธิ์</p>
                            </div>

                            {!isScheduleManager ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        คุณยังสามารถกำหนดเวรของตนเองได้ตามปกติ ส่วนมุมมองกำหนดเวรภาพรวมสงวนไว้สำหรับหัวหน้ากิจการนักเรียนและหัวหน้าฝ่ายบริหารงานทั่วไป
                                    </CardContent>
                                </Card>
                            ) : loading ? (
                                <Card><CardContent className="p-8 text-center text-muted-foreground">กำลังโหลด...</CardContent></Card>
                            ) : filteredAssignments.length === 0 ? (
                                <Card><CardContent className="p-8 text-center text-muted-foreground">ยังไม่มีรายการกำหนดเข้าเวร</CardContent></Card>
                            ) : (
                                filteredAssignments.map(item => renderAssignmentCard(item))
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="records" className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <p className="font-medium">บันทึกเวรตามวันที่ได้รับมอบหมาย</p>
                            <p className="text-sm text-muted-foreground">
                                workflow ที่ถูกต้องคือ: กำหนดเข้าเวร → ตกลงหรือแลกเวร → ผู้รับเวรตอบรับ (ถ้ามี) → ผู้ขอส่งอนุมัติ → เมื่ออนุมัติแล้ว ผู้ที่ปฏิบัติเวรจริงจึงเห็นปุ่ม “บันทึกเวร” และอัปโหลดรูปภาพเหตุการณ์ได้
                            </p>
                        </CardContent>
                    </Card>

                    {loading ? (
                        <Card><CardContent className="p-8 text-center text-muted-foreground">กำลังโหลด...</CardContent></Card>
                    ) : filteredRecords.length === 0 ? (
                        <Card><CardContent className="p-8 text-center text-muted-foreground">ยังไม่มีบันทึกเวร</CardContent></Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map(record => {
                                const assignment = assignments.find(item => item.id === record.assignment_id);
                                const fallbackAssignment: DutyAssignment | undefined = assignment;
                                return renderAssignmentCard(
                                    fallbackAssignment || {
                                        id: record.assignment_id || record.id,
                                        duty_date: record.duty_date,
                                        duty_shift: record.duty_shift,
                                        duty_shift_label: record.duty_shift_label,
                                        assigned_user_id: record.final_duty_user_id || null,
                                        assigned_name: record.final_duty_name || record.recorder_name,
                                        assigned_position: record.final_duty_position || record.recorder_position,
                                        status: 'scheduled',
                                    } as DutyAssignment
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAssignment
                                ? (isScheduleManager ? 'แก้ไขกำหนดเข้าเวร' : 'แก้ไขเวรของตนเอง')
                                : (isScheduleManager ? 'กำหนดเข้าเวร' : 'กำหนดเวรของตนเอง')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>วันที่เข้าเวร *</Label>
                                <Input
                                    type="date"
                                    value={assignmentForm.duty_date}
                                    onChange={e => setAssignmentForm(p => ({ ...p, duty_date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>ช่วงเวร *</Label>
                                <Select
                                    value={assignmentForm.duty_shift}
                                    onValueChange={v => setAssignmentForm(p => ({ ...p, duty_shift: v, duty_shift_label: `เวร${SHIFT_MAP[v]}` }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SHIFT_MAP).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>เวร{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>ผู้ที่ต้องเข้าเวร *</Label>
                            {isScheduleManager ? (
                                <Select
                                    value={assignmentForm.assigned_user_id}
                                    onValueChange={v => {
                                        const selected = staffList.find(item => item.id === v);
                                        setAssignmentForm(p => ({
                                            ...p,
                                            assigned_user_id: v,
                                            assigned_name: selected?.name || '',
                                            assigned_position: selected?.position || '',
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={staffLoading ? 'กำลังโหลดรายชื่อ...' : 'เลือกบุคลากร'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffList.map(person => (
                                            <SelectItem key={person.id} value={person.id}>
                                                {person.name}{person.position ? ` (${person.position})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                                    {currentUserName || '-'}{currentUserPosition ? ` (${currentUserPosition})` : ''}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>หมายเหตุ</Label>
                            <Textarea
                                value={assignmentForm.notes}
                                onChange={e => setAssignmentForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="เช่น กำหนดเวรพิเศษ / เวรประจำวัน / เวรแทน"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAssignmentDialog(false);
                                setEditingAssignment(null);
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleSaveAssignment}>
                            {editingAssignment ? 'บันทึกการแก้ไข' : 'บันทึกกำหนดเข้าเวร'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>บันทึกเวรตามวันที่กำหนด</DialogTitle>
                    </DialogHeader>
                    {recordForm && selectedAssignment && (
                        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
                            {(() => {
                                const currentRecord = recordByAssignmentId.get(selectedAssignment.id);
                                if (!canOpenRecordDialog(selectedAssignment, currentRecord)) {
                                    return (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                            ต้องผ่านขั้นตอนตกลง/แลกเวร ส่งอนุมัติ และอนุมัติก่อน จึงจะบันทึกเวรและอัปโหลดรูปภาพได้
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div className="rounded-lg border bg-muted/20 p-3">
                                <p className="text-sm font-medium">
                                    วันที่ {new Date(selectedAssignment.duty_date).toLocaleDateString('th-TH')} • {selectedAssignment.duty_shift_label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    เวรของ {selectedAssignment.assigned_name}{selectedAssignment.assigned_position ? ` (${selectedAssignment.assigned_position})` : ''}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>นักเรียนมา</Label>
                                        <Input type="number" value={recordForm.students_present} onChange={e => setRecordForm((p: any) => ({ ...p, students_present: Number(e.target.value || 0) }))} />
                                </div>
                                <div>
                                    <Label>นักเรียนขาด</Label>
                                        <Input type="number" value={recordForm.students_absent} onChange={e => setRecordForm((p: any) => ({ ...p, students_absent: Number(e.target.value || 0) }))} />
                                </div>
                            </div>

                            <div>
                                <Label>เหตุการณ์ที่เกิดขึ้น</Label>
                                <Textarea value={recordForm.incidents} onChange={e => setRecordForm((p: any) => ({ ...p, incidents: e.target.value }))} rows={3} />
                            </div>

                            <div>
                                <Label>การดำเนินการ</Label>
                                <Textarea value={recordForm.actions_taken} onChange={e => setRecordForm((p: any) => ({ ...p, actions_taken: e.target.value }))} rows={3} />
                            </div>

                            <div>
                                <Label>หมายเหตุ</Label>
                                <Input value={recordForm.remarks} onChange={e => setRecordForm((p: any) => ({ ...p, remarks: e.target.value }))} />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>รูปภาพประกอบบันทึกเวร</Label>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={uploadingImages}
                                    >
                                        {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        อัปโหลดรูปภาพหลายรูป
                                    </Button>
                                </div>

                                {!!recordForm.duty_images?.length && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {recordForm.duty_images.map((image: DutyImageItem) => (
                                            <div key={image.url} className="relative rounded-lg overflow-hidden border bg-muted/20">
                                                <img src={image.url} alt={image.name} className="w-full h-32 object-cover" />
                                                <div className="p-2 space-y-1">
                                                    <p className="text-xs truncate font-medium">{image.name}</p>
                                                    <a
                                                        href={image.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary underline"
                                                    >
                                                        เปิดดูรูป
                                                    </a>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7"
                                                    onClick={() => removeDutyImage(image.url)}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!recordForm.duty_images?.length && (
                                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        ยังไม่มีรูปภาพประกอบบันทึกเวร สามารถอัปโหลดได้หลายรูป
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRecordDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSaveRecord}>บันทึกเวร</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!swapDialogRecord} onOpenChange={(open) => !open && setSwapDialogRecord(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>ขอเปลี่ยนเวร</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-sm font-medium">{swapDialogRecord?.recorder_name} ต้องการเปลี่ยนเวร</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                วันที่ {swapDialogRecord ? new Date(swapDialogRecord.duty_date).toLocaleDateString('th-TH') : '-'} • {swapDialogRecord?.duty_shift_label || '-'}
                            </p>
                        </div>

                        <div>
                            <Label>เลือกผู้รับเปลี่ยนเวร *</Label>
                            <Select value={swapTargetUserId} onValueChange={setSwapTargetUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={staffLoading ? 'กำลังโหลดรายชื่อ...' : 'เลือกบุคลากร'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectableStaff.map(person => (
                                        <SelectItem key={person.id} value={person.id}>
                                            {person.name}{person.position ? ` (${person.position})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>หมายเหตุถึงผู้รับเวร</Label>
                            <Textarea
                                value={swapRequestNote}
                                onChange={e => setSwapRequestNote(e.target.value)}
                                placeholder="เช่น ขอเปลี่ยนเวรเนื่องจากติดภารกิจ"
                                rows={3}
                            />
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            ผู้รับเปลี่ยนเวรต้องกด “ตอบตกลงรับเวร” ก่อน ระบบจึงจะแสดงผู้ปฏิบัติเวรสุดท้ายอย่างชัดเจน และเปิดให้ผู้ขอเปลี่ยนเวรส่งอนุมัติตามลำดับ
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            เมื่อวันที่เข้าเวรพ้นกำหนดแล้ว ระบบจะไม่อนุญาตให้เปลี่ยนเวรกับผู้อื่น
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSwapDialogRecord(null)}>ยกเลิก</Button>
                        <Button onClick={handleSwapRequest}>ส่งคำขอเปลี่ยนเวร</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!respondDialogRecord} onOpenChange={(open) => !open && setRespondDialogRecord(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>ตอบรับการเปลี่ยนเวร</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                            <p className="text-sm font-medium">
                                {respondDialogRecord?.swap_requested_by_name || respondDialogRecord?.recorder_name} ขอให้คุณรับเวรแทน
                            </p>
                            <p className="text-xs text-muted-foreground">
                                วันที่ {respondDialogRecord ? new Date(respondDialogRecord.duty_date).toLocaleDateString('th-TH') : '-'} • {respondDialogRecord?.duty_shift_label || '-'}
                            </p>
                        </div>

                        <div>
                            <Label>หมายเหตุการตอบรับ</Label>
                            <Textarea
                                value={swapResponseNote}
                                onChange={e => setSwapResponseNote(e.target.value)}
                                placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between gap-2">
                        <Button variant="outline" onClick={() => handleSwapResponse('rejected')}>ปฏิเสธ</Button>
                        <Button onClick={() => handleSwapResponse('accepted')}>ตอบตกลงรับเวร</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
