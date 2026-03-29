import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarCheck, Trash2, Edit2, RefreshCcw, CheckCheck, Send } from 'lucide-react';
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

interface DutyRecord {
    id: string;
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
}

const SHIFT_MAP: Record<string, string> = {
    morning: 'เช้า', afternoon: 'บ่าย', evening: 'เย็น', overnight: 'ค้างคืน',
};

const STATUS_MAP: Record<string, string> = {
    recorded: 'บันทึกแล้ว',
    verified: 'ตรวจสอบแล้ว',
    approved: 'อนุมัติแล้ว',
};

const SWAP_STATUS_MAP: Record<string, string> = {
    not_required: 'ไม่เปลี่ยนเวร',
    pending: 'รอผู้รับเวรตอบตกลง',
    accepted: 'ตอบตกลงแล้ว',
    rejected: 'ปฏิเสธการรับเวร',
};

const buildDefaultForm = (currentUser: any) => ({
    duty_date: new Date().toISOString().split('T')[0],
    duty_shift: 'morning',
    duty_shift_label: 'เวรเช้า',
    recorder_name: currentUser?.full_name || '',
    recorder_position: currentUser?.position || '',
    students_present: 0,
    students_absent: 0,
    incidents: '',
    actions_taken: '',
    remarks: '',
    status: 'recorded',
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
    final_duty_user_id: currentUser?.id || null,
    final_duty_name: currentUser?.full_name || '',
    final_duty_position: currentUser?.position || '',
    approval_ready: true,
});

export const DutyManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const { role } = usePermissions();
    const { staffList, loading: staffLoading } = useStaffList();
    const currentUserId = currentUser?.id || '';
    const currentUserName = currentUser?.full_name || '';
    const currentUserPosition = (currentUser as any)?.position || '';

    const [records, setRecords] = useState<DutyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editRecord, setEditRecord] = useState<DutyRecord | null>(null);
    const [form, setForm] = useState(buildDefaultForm(currentUser));
    const [swapDialogRecord, setSwapDialogRecord] = useState<DutyRecord | null>(null);
    const [swapTargetUserId, setSwapTargetUserId] = useState('');
    const [swapRequestNote, setSwapRequestNote] = useState('');
    const [respondDialogRecord, setRespondDialogRecord] = useState<DutyRecord | null>(null);
    const [swapResponseNote, setSwapResponseNote] = useState('');

    const selectableStaff = useMemo(() => {
        return staffList.filter(person => person.id !== currentUserId);
    }, [staffList, currentUserId]);

    const canModify = (r: DutyRecord): boolean => {
        if (r.status === 'verified' || r.status === 'approved') return false;
        if (!currentUser) return false;
        if (role === 'admin' || role === 'director' || role === 'deputy_director') return true;
        return r.recorder_name === currentUserName;
    };

    const canRequestSwap = (r: DutyRecord): boolean => {
        if (!canModify(r)) return false;
        return !r.swap_requested || r.swap_response_status === 'rejected';
    };

    const canRespondSwap = (r: DutyRecord): boolean => {
        if (!currentUserId) return false;
        if (!r.swap_requested) return false;
        if (r.swap_response_status !== 'pending') return false;
        return r.swap_target_user_id === currentUserId;
    };

    const canSubmitForApproval = (r: DutyRecord): boolean => {
        if (r.status !== 'recorded') return false;
        if (r.swap_requested && r.swap_response_status !== 'accepted') return false;
        return !!r.approval_ready;
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase.from('duty_records' as any) as any)
                .select('*')
                .order('duty_date', { ascending: false })
                .limit(100);

            if (error) throw error;
            if (data) setRecords(data);
        } catch (e) {
            console.error(e);
            toast({ title: 'โหลดข้อมูลบันทึกเวรไม่สำเร็จ', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditRecord(null);
        setForm(buildDefaultForm(currentUser));
        setShowDialog(true);
    };

    const openEdit = (r: DutyRecord) => {
        setEditRecord(r);
        setForm({
            duty_date: r.duty_date,
            duty_shift: r.duty_shift,
            duty_shift_label: r.duty_shift_label || '',
            recorder_name: r.recorder_name,
            recorder_position: r.recorder_position || '',
            students_present: r.students_present || 0,
            students_absent: r.students_absent || 0,
            incidents: r.incidents || '',
            actions_taken: r.actions_taken || '',
            remarks: r.remarks || '',
            status: r.status,
            swap_requested: !!r.swap_requested,
            swap_requested_at: r.swap_requested_at || null,
            swap_requested_by_user_id: r.swap_requested_by_user_id || null,
            swap_requested_by_name: r.swap_requested_by_name || null,
            swap_requested_by_position: r.swap_requested_by_position || null,
            swap_target_user_id: r.swap_target_user_id || null,
            swap_target_name: r.swap_target_name || null,
            swap_target_position: r.swap_target_position || null,
            swap_response_status: r.swap_response_status || 'not_required',
            swap_responded_at: r.swap_responded_at || null,
            swap_responded_by_user_id: r.swap_responded_by_user_id || null,
            swap_response_note: r.swap_response_note || '',
            final_duty_user_id: r.final_duty_user_id || null,
            final_duty_name: r.final_duty_name || r.recorder_name,
            final_duty_position: r.final_duty_position || r.recorder_position || '',
            approval_ready: r.approval_ready ?? (!r.swap_requested || r.swap_response_status === 'accepted'),
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.recorder_name) {
            toast({ title: 'กรุณากรอกชื่อผู้บันทึก', variant: 'destructive' });
            return;
        }

        if (form.swap_requested && !form.swap_target_user_id) {
            toast({ title: 'กรุณาเลือกผู้รับเปลี่ยนเวร', variant: 'destructive' });
            return;
        }

        if (form.swap_requested && form.swap_response_status !== 'accepted') {
            toast({
                title: 'ยังไม่สามารถส่งอนุมัติได้',
                description: 'ต้องรอผู้รับเปลี่ยนเวรตอบตกลงก่อน',
                variant: 'destructive',
            });
            return;
        }

        const payload = {
            ...form,
            approval_ready: form.swap_requested ? form.swap_response_status === 'accepted' : true,
            final_duty_name: form.swap_requested ? form.final_duty_name : form.recorder_name,
            final_duty_position: form.swap_requested ? form.final_duty_position : form.recorder_position,
            final_duty_user_id: form.swap_requested ? form.final_duty_user_id : currentUserId || null,
            swap_response_status: form.swap_requested ? form.swap_response_status : 'not_required',
        };

        try {
            if (editRecord) {
                const { error } = await (supabase.from('duty_records' as any) as any)
                    .update(payload)
                    .eq('id', editRecord.id);

                if (error) throw error;
                toast({ title: 'อัปเดตบันทึกเวรสำเร็จ' });
            } else {
                const { error } = await (supabase.from('duty_records' as any) as any).insert([payload]);
                if (error) throw error;
                toast({ title: 'บันทึกเวรสำเร็จ' });
            }

            setShowDialog(false);
            fetchRecords();
        } catch (e) {
            console.error(e);
            toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบบันทึกเวรนี้?')) return;
        const { error } = await (supabase.from('duty_records' as any) as any).delete().eq('id', id);
        if (error) {
            toast({ title: 'ลบไม่สำเร็จ', variant: 'destructive' });
            return;
        }
        toast({ title: 'ลบสำเร็จ' });
        fetchRecords();
    };

    const openSwapDialog = (record: DutyRecord) => {
        setSwapDialogRecord(record);
        setSwapTargetUserId(record.swap_target_user_id || '');
        setSwapRequestNote(record.swap_response_status === 'rejected' ? '' : record.swap_response_note || '');
    };

    const handleSwapRequest = async () => {
        if (!swapDialogRecord) return;
        const selected = selectableStaff.find(person => person.id === swapTargetUserId);
        if (!selected) {
            toast({ title: 'กรุณาเลือกผู้รับเปลี่ยนเวร', variant: 'destructive' });
            return;
        }

        const requestedAt = new Date().toISOString();

        const payload = {
            swap_requested: true,
            swap_requested_at: requestedAt,
            swap_requested_by_user_id: currentUserId || null,
            swap_requested_by_name: currentUserName,
            swap_requested_by_position: currentUserPosition,
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
            toast({ title: 'ส่งคำขอเปลี่ยนเวรไม่สำเร็จ', variant: 'destructive' });
            return;
        }

        toast({ title: 'ส่งคำขอเปลี่ยนเวรแล้ว', description: `รอ ${selected.name} ตอบตกลง` });
        setSwapDialogRecord(null);
        setSwapTargetUserId('');
        setSwapRequestNote('');
        fetchRecords();
    };

    const openRespondDialog = (record: DutyRecord) => {
        setRespondDialogRecord(record);
        setSwapResponseNote(record.swap_response_note || '');
    };

    const handleSwapResponse = async (decision: 'accepted' | 'rejected') => {
        if (!respondDialogRecord) return;

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
            toast({ title: 'บันทึกการตอบรับไม่สำเร็จ', variant: 'destructive' });
            return;
        }

        toast({
            title: decision === 'accepted' ? 'ตอบตกลงรับเปลี่ยนเวรแล้ว' : 'ปฏิเสธการรับเปลี่ยนเวรแล้ว',
        });
        setRespondDialogRecord(null);
        setSwapResponseNote('');
        fetchRecords();
    };

    const handleSubmitForApproval = async (record: DutyRecord) => {
        if (!canSubmitForApproval(record)) {
            toast({
                title: 'ยังไม่สามารถส่งอนุมัติได้',
                description: 'ต้องให้ผู้รับเปลี่ยนเวรตอบตกลงก่อน และข้อมูลผู้ปฏิบัติเวรสุดท้ายต้องครบถ้วน',
                variant: 'destructive',
            });
            return;
        }

        const { error } = await (supabase.from('duty_records' as any) as any)
            .update({ status: 'verified' })
            .eq('id', record.id);

        if (error) {
            toast({ title: 'ส่งอนุมัติไม่สำเร็จ', variant: 'destructive' });
            return;
        }

        toast({ title: 'ส่งบันทึกเวรเข้าอนุมัติตามลำดับแล้ว' });
        fetchRecords();
    };

    const filtered = records.filter(r => !filterMonth || r.duty_date?.startsWith(filterMonth));

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarCheck className="w-6 h-6 text-green-600" /> บันทึกเวรประจำวัน
                    </h1>
                    <p className="text-muted-foreground text-sm">รายงานเวร บันทึกเหตุการณ์ และจัดการคำขอเปลี่ยนเวร</p>
                </div>
                <Button onClick={openAdd} className="gap-2">
                    <Plus className="w-4 h-4" /> บันทึกเวร
                </Button>
            </div>

            <div className="flex gap-3 mb-4">
                <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
                <span className="text-sm text-muted-foreground self-center">{filtered.length} รายการ</span>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-muted-foreground">ยังไม่มีบันทึกเวร</p>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4">
                            {filtered.map((r) => {
                                const swapStatus = r.swap_response_status || (r.swap_requested ? 'pending' : 'not_required');
                                const finalName = r.final_duty_name || r.recorder_name;
                                const finalPosition = r.final_duty_position || r.recorder_position;

                                return (
                                    <Card key={r.id} className="border">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold text-base">
                                                            {new Date(r.duty_date).toLocaleDateString('th-TH')} • {r.duty_shift_label || SHIFT_MAP[r.duty_shift] || r.duty_shift}
                                                        </h3>
                                                        <Badge variant="outline">{STATUS_MAP[r.status] || r.status}</Badge>
                                                        <Badge variant={swapStatus === 'accepted' ? 'default' : 'outline'}>
                                                            {SWAP_STATUS_MAP[swapStatus] || swapStatus}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        ผู้บันทึกเวร: <span className="font-medium text-foreground">{r.recorder_name}</span>
                                                        {r.recorder_position ? ` (${r.recorder_position})` : ''}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        นักเรียนมา/ขาด: <span className="font-medium text-foreground">{r.students_present}/{r.students_absent}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        เหตุการณ์: <span className="text-foreground">{r.incidents || '-'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {canRequestSwap(r) && (
                                                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openSwapDialog(r)}>
                                                            <RefreshCcw className="w-4 h-4" />
                                                            เปลี่ยนเวร
                                                        </Button>
                                                    )}

                                                    {canRespondSwap(r) && (
                                                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => openRespondDialog(r)}>
                                                            <CheckCheck className="w-4 h-4" />
                                                            ตอบรับเปลี่ยนเวร
                                                        </Button>
                                                    )}

                                                    {canSubmitForApproval(r) && (
                                                        <Button size="sm" className="gap-2" onClick={() => handleSubmitForApproval(r)}>
                                                            <Send className="w-4 h-4" />
                                                            ส่งอนุมัติ
                                                        </Button>
                                                    )}

                                                    {r.status === 'verified' || r.status === 'approved' ? (
                                                        <span
                                                            className="text-xs text-muted-foreground px-2 self-center"
                                                            title={r.status === 'approved' ? 'อนุมัติแล้ว — ไม่สามารถแก้ไขหรือลบได้' : 'ตรวจสอบแล้ว — ไม่สามารถแก้ไขหรือลบได้'}
                                                        >
                                                            🔒 ล็อกแล้ว
                                                        </span>
                                                    ) : canModify(r) ? (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)} title="แก้ไข">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)} title="ลบ">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">เจ้าของเวรเดิม</p>
                                                    <p className="text-sm font-medium">{r.recorder_name}</p>
                                                    <p className="text-xs text-muted-foreground">{r.recorder_position || '-'}</p>
                                                </div>
                                                <div className="rounded-lg border bg-emerald-50 p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">ผู้ปฏิบัติเวรสุดท้าย</p>
                                                    <p className="text-sm font-medium text-emerald-900">{finalName || '-'}</p>
                                                    <p className="text-xs text-emerald-700">{finalPosition || '-'}</p>
                                                </div>
                                            </div>

                                            {r.swap_requested && (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge variant="outline">คำขอเปลี่ยนเวร</Badge>
                                                        <span className="text-sm text-amber-900">
                                                            {r.swap_requested_by_name || r.recorder_name} ขอเปลี่ยนเวรให้ {r.swap_target_name || '-'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-amber-900">
                                                        สถานะผู้รับเวร: <span className="font-semibold">{SWAP_STATUS_MAP[swapStatus] || swapStatus}</span>
                                                    </p>
                                                    {r.swap_target_position && (
                                                        <p className="text-xs text-amber-800">ผู้รับเปลี่ยนเวร: {r.swap_target_name} ({r.swap_target_position})</p>
                                                    )}
                                                    {r.swap_response_note && (
                                                        <p className="text-xs text-amber-800">หมายเหตุ: {r.swap_response_note}</p>
                                                    )}
                                                    <p className="text-xs text-amber-800">
                                                        {r.approval_ready
                                                            ? 'พร้อมส่งอนุมัติตามลำดับ'
                                                            : 'ยังส่งอนุมัติไม่ได้จนกว่าผู้รับเปลี่ยนเวรจะตอบตกลง'}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editRecord ? 'แก้ไขบันทึกเวร' : 'บันทึกเวรประจำวัน'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>วันที่ *</Label>
                                <Input type="date" value={form.duty_date} onChange={e => setForm(p => ({ ...p, duty_date: e.target.value }))} />
                            </div>
                            <div>
                                <Label>ช่วงเวร</Label>
                                <Select value={form.duty_shift} onValueChange={v => setForm(p => ({ ...p, duty_shift: v, duty_shift_label: `เวร${SHIFT_MAP[v]}` }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SHIFT_MAP).map(([k, v]) => <SelectItem key={k} value={k}>เวร{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>ผู้บันทึกเวร *</Label>
                            <Input
                                value={form.recorder_name}
                                readOnly={!editRecord}
                                onChange={e => setForm(p => ({ ...p, recorder_name: e.target.value }))}
                                placeholder="ชื่อผู้บันทึก"
                                className={!editRecord ? 'bg-muted cursor-not-allowed' : ''}
                            />
                            {form.recorder_position && (
                                <p className="text-xs text-muted-foreground mt-1">ตำแหน่ง: {form.recorder_position}</p>
                            )}
                            {!editRecord && currentUserName && (
                                <p className="text-xs text-muted-foreground mt-1">✅ ใช้ชื่อจากบัญชีที่ login</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>นักเรียนมา</Label>
                                <Input type="number" value={form.students_present} onChange={e => setForm(p => ({ ...p, students_present: +e.target.value }))} />
                            </div>
                            <div>
                                <Label>นักเรียนขาด</Label>
                                <Input type="number" value={form.students_absent} onChange={e => setForm(p => ({ ...p, students_absent: +e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <Label>เหตุการณ์ที่เกิดขึ้น</Label>
                            <Textarea value={form.incidents} onChange={e => setForm(p => ({ ...p, incidents: e.target.value }))} placeholder="บันทึกเหตุการณ์..." rows={2} />
                        </div>
                        <div>
                            <Label>การดำเนินการ</Label>
                            <Textarea value={form.actions_taken} onChange={e => setForm(p => ({ ...p, actions_taken: e.target.value }))} placeholder="การดำเนินการที่ทำ..." rows={2} />
                        </div>
                        <div>
                            <Label>หมายเหตุ</Label>
                            <Input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="หมายเหตุ" />
                        </div>
                        <div className="rounded-lg border border-dashed p-3 bg-muted/20 space-y-2">
                            <p className="text-sm font-medium">สถานะเปลี่ยนเวร</p>
                            <p className="text-xs text-muted-foreground">
                                หากมีการขอเปลี่ยนเวร ต้องใช้ปุ่ม “เปลี่ยนเวร” จากรายการบันทึก และรอผู้รับเวรตอบตกลงก่อน จึงจะกดส่งอนุมัติได้
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{SWAP_STATUS_MAP[form.swap_response_status] || form.swap_response_status}</Badge>
                                <Badge variant="outline">{form.approval_ready ? 'พร้อมส่งอนุมัติ' : 'ยังไม่พร้อมส่งอนุมัติ'}</Badge>
                            </div>
                        </div>
                        <div>
                            <Label>สถานะ</Label>
                            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                                        <SelectItem
                                            key={k}
                                            value={k}
                                            disabled={k === 'verified' && form.swap_requested && form.swap_response_status !== 'accepted'}
                                        >
                                            {v}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.swap_requested && form.swap_response_status !== 'accepted' && (
                                <p className="text-xs text-destructive mt-1">มีคำขอเปลี่ยนเวรค้างอยู่ จึงยังเปลี่ยนสถานะเป็น “ตรวจสอบแล้ว” ไม่ได้</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>{editRecord ? 'บันทึก' : 'เพิ่มบันทึก'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!swapDialogRecord} onOpenChange={(open) => !open && setSwapDialogRecord(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>เปลี่ยนเวร</DialogTitle>
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
                                placeholder="เช่น ขอเปลี่ยนเวรเนื่องจากติดราชการ / อบรม / ลาป่วย"
                                rows={3}
                            />
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            หลังส่งคำขอ ผู้รับเปลี่ยนเวรต้องตอบตกลงก่อน ระบบจึงจะอนุญาตให้ส่งอนุมัติตามลำดับ
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
                            <p className="text-xs text-muted-foreground">
                                ผู้รับเวรใหม่: {currentUserName}{currentUserPosition ? ` (${currentUserPosition})` : ''}
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

                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                            หากตอบตกลง ระบบจะแสดงชื่อคุณเป็น “ผู้ปฏิบัติเวรสุดท้าย” และปลดล็อกการส่งอนุมัติ
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
