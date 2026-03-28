import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardList, Trash2, Edit2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
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

interface LeaveRequest {
    id: string;
    requester_name: string;
    requester_position: string;
    leave_type: string;
    leave_type_label: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    substitute_name: string;
    status: string;
    approved_by: string;
    academic_year: string;
    created_at: string;
    departments?: { name: string };
}

interface AppUser {
    id: string;
    full_name: string;
    position?: string;
    role: string;
}

const LEAVE_TYPES: Record<string, string> = {
    sick: 'ลาป่วย', personal: 'ลากิจ', vacation: 'ลาพักร้อน',
    maternity: 'ลาคลอด', ordination: 'ลาบวช', other: 'อื่นๆ',
};
const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color?: string }> = {
    pending: { label: 'รอหัวหน้างาน', variant: 'secondary' },
    supervisor_approved: { label: 'ผ่านหัวหน้างาน → รอหัวหน้าฝ่าย', variant: 'secondary', color: 'bg-blue-100 text-blue-700' },
    dept_head_approved: { label: 'ผ่านหัวหน้าฝ่าย → รอผอ.', variant: 'secondary', color: 'bg-indigo-100 text-indigo-700' },
    approved: { label: 'อนุมัติแล้ว', variant: 'default' },
    rejected: { label: 'ไม่อนุมัติ', variant: 'destructive' },
    cancelled: { label: 'ยกเลิก', variant: 'outline' },
};

const EMPTY_FORM = {
    requester_name: '', requester_position: '', department_id: '',
    leave_type: 'sick', leave_type_label: 'ลาป่วย',
    start_date: '', end_date: '', total_days: 1,
    reason: '', substitute_name: '', status: 'pending',
    approved_by: '', academic_year: '2568',
};

export const LeaveManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const { canApprove, role } = usePermissions();
    const currentUserName = currentUser?.full_name || '';
    const currentUserPosition = (currentUser as any)?.position || '';

    // เจ้าของบัตร (requester) หรือ admin/director สามารถแก้ไข/ลบได้
    // → ยกเว้น: หากสถานะเป็น 'approved' (ผอ./รองผอ. อนุมัติแล้ว) → ล็อคทุกคน
    const canModify = (r: LeaveRequest): boolean => {
        if (r.status === 'approved') return false;  // อนุมัติสุดท้ายแล้ว — ห้ามแก้ไข/ลบทุกคน
        if (!currentUser) return false;
        if (role === 'admin' || role === 'director' || role === 'deputy_director') return true;
        return r.requester_name === currentUserName;
    };

    // สถานะที่แต่ละ role สามารถเปลี่ยนได้ (เมื่อแก้ไข)
    const allowedStatusesForRole = (r: LeaveRequest | null): string[] => {
        // เจ้าของใบลา → ห้ามเปลี่ยนสถานะ
        if (!r || r.requester_name === currentUserName) return [];
        if (role === 'dept_head') {
            if (r.status === 'pending') return ['pending', 'supervisor_approved', 'rejected'];
            return [];
        }
        if (role === 'deputy_director') {
            if (r.status === 'supervisor_approved') return ['supervisor_approved', 'dept_head_approved', 'rejected'];
            return [];
        }
        if (role === 'director' || role === 'admin') {
            if (r.status === 'dept_head_approved') return ['dept_head_approved', 'approved', 'rejected'];
            return [];
        }
        return [];  // teacher / support_staff / etc → ไม่สามารถเปลี่ยนสถานะ
    };

    const [records, setRecords] = useState<LeaveRequest[]>([]);
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [appUsers, setAppUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showDialog, setShowDialog] = useState(false);
    const [editRecord, setEditRecord] = useState<LeaveRequest | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [leaveRes, deptRes, usersRes] = await Promise.all([
                (supabase.from('leave_requests' as any) as any)
                    .select('*, departments(name)')
                    .order('created_at', { ascending: false }),
                (supabase.from('departments' as any) as any)
                    .select('id,name')
                    .eq('is_active', true),
                (supabase.from('app_users' as any) as any)
                    .select('id,full_name,position,role')
                    .eq('is_active', true)
                    .order('full_name'),
            ]);
            if (leaveRes.error) console.error('[leave] fetch error:', leaveRes.error);
            if (leaveRes.data) setRecords(leaveRes.data);
            if (deptRes.data) setDepartments(deptRes.data);
            if (usersRes.data) setAppUsers(usersRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = records.filter(r => {
        return (filterStatus === 'all' || r.status === filterStatus) &&
            (filterType === 'all' || r.leave_type === filterType);
    });

    const openAdd = () => {
        setEditRecord(null);
        setForm({
            ...EMPTY_FORM,
            requester_name: currentUserName,
            requester_position: currentUserPosition,
        });
        setShowDialog(true);
    };

    const openEdit = (r: LeaveRequest) => {
        setEditRecord(r);
        setForm({
            requester_name: r.requester_name,
            requester_position: r.requester_position || '',
            department_id: (r as any).department_id || '',
            leave_type: r.leave_type,
            leave_type_label: r.leave_type_label || LEAVE_TYPES[r.leave_type],
            start_date: r.start_date,
            end_date: r.end_date,
            total_days: r.total_days || 1,
            reason: r.reason,
            substitute_name: r.substitute_name || '',
            status: r.status,
            approved_by: r.approved_by || '',
            academic_year: r.academic_year || '2568',
        });
        setShowDialog(true);
    };

    const calcDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.round(diff / 86400000) + 1;
    };

    const handleSave = async () => {
        if (!form.requester_name) {
            toast({ title: 'กรุณากรอกชื่อผู้ยื่นลา', variant: 'destructive' });
            return;
        }
        if (!form.start_date || !form.end_date) {
            toast({ title: 'กรุณาระบุวันที่ลา', variant: 'destructive' });
            return;
        }
        if (!form.reason.trim()) {
            toast({ title: 'กรุณาระบุเหตุผลการลา', variant: 'destructive' });
            return;
        }

        // Build clean payload — only columns that exist in leave_requests table
        const payload: Record<string, any> = {
            requester_name:   form.requester_name,
            requester_position: form.requester_position || null,
            department_id:    form.department_id || null,
            leave_type:       form.leave_type,
            leave_type_label: LEAVE_TYPES[form.leave_type],
            start_date:       form.start_date,
            end_date:         form.end_date,
            total_days:       calcDays(form.start_date, form.end_date),
            reason:           form.reason,
            substitute_name:  form.substitute_name || null,
            status:           form.status,
            approved_by:      form.approved_by || null,
            academic_year:    form.academic_year,
        };

        setSaving(true);
        try {
            let result;
            if (editRecord) {
                result = await (supabase.from('leave_requests' as any) as any)
                    .update(payload)
                    .eq('id', editRecord.id);
            } else {
                // ใหม่ — force status = pending
                payload.status = 'pending';
                result = await (supabase.from('leave_requests' as any) as any)
                    .insert([payload]);
            }

            if (result.error) {
                console.error('[leave] save error:', result.error);
                toast({
                    title: 'บันทึกไม่สำเร็จ',
                    description: result.error.message,
                    variant: 'destructive',
                });
                return;
            }

            toast({ title: editRecord ? 'อัปเดตใบลาสำเร็จ ✅' : 'ยื่นใบลาสำเร็จ ✅' });
            setShowDialog(false);
            fetchAll();
        } catch (e: any) {
            console.error('[leave] unexpected error:', e);
            toast({ title: 'เกิดข้อผิดพลาด', description: e?.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        const approvedBy = currentUser?.full_name || '';
        const { error } = await (supabase.from('leave_requests' as any) as any)
            .update({ status, approved_by: approvedBy, approved_at: new Date().toISOString() })
            .eq('id', id);
        if (error) {
            toast({ title: 'อัปเดตสถานะไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }
        const label = STATUS_STYLES[status]?.label || status;
        toast({ title: `อัปเดตสถานะ: ${label}` });
        fetchAll();
    };

    const approveAsSupervisor = (id: string) => updateStatus(id, 'supervisor_approved');
    const approveAsDeptHead   = (id: string) => updateStatus(id, 'dept_head_approved');
    const approveAsFinal      = (id: string) => updateStatus(id, 'approved');
    const rejectLeave         = (id: string) => updateStatus(id, 'rejected');

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบใบลานี้?')) return;
        const { error } = await (supabase.from('leave_requests' as any) as any).delete().eq('id', id);
        if (error) { toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'ลบสำเร็จ' });
        fetchAll();
    };

    // ชื่อผู้ใช้ทั้งหมด ยกเว้นตัวเอง (สำหรับผู้ทำหน้าที่แทน)
    const substituteOptions = appUsers.filter(u => u.full_name !== currentUserName);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-purple-600" /> ระบบใบลา
                    </h1>
                    <p className="text-muted-foreground text-sm">บันทึกและอนุมัติใบลาบุคลากร</p>
                </div>
                <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> ยื่นใบลา</Button>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                {Object.entries(STATUS_STYLES).map(([k, v]) => (
                    <Card key={k} className="cursor-pointer" onClick={() => setFilterStatus(k === filterStatus ? 'all' : k)}>
                        <CardContent className="p-3 text-center">
                            <p className="text-xl font-bold">{records.filter(r => r.status === k).length}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{v.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-3 mb-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกสถานะ</SelectItem>
                        {Object.entries(STATUS_STYLES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="ทุกประเภท" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกประเภท</SelectItem>
                        {Object.entries(LEAVE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground self-center">{filtered.length} รายการ</span>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-muted-foreground">ไม่มีใบลา</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        {['ผู้ยื่นลา', 'ประเภทลา', 'วันที่ลา', 'จำนวนวัน', 'ผู้ทำหน้าที่แทน', 'สถานะ', 'จัดการ'].map(h => (
                                            <th key={h} className="text-left p-3 text-sm font-medium text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r, i) => (
                                        <tr key={r.id} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                                            <td className="p-3 text-sm font-medium">
                                                <div>{r.requester_name}</div>
                                                <div className="text-xs text-muted-foreground">{r.requester_position}</div>
                                            </td>
                                            <td className="p-3 text-sm">{r.leave_type_label || LEAVE_TYPES[r.leave_type]}</td>
                                            <td className="p-3 text-sm">
                                                {r.start_date && new Date(r.start_date).toLocaleDateString('th-TH')}
                                                {r.end_date && r.start_date !== r.end_date && ` - ${new Date(r.end_date).toLocaleDateString('th-TH')}`}
                                            </td>
                                            <td className="p-3 text-sm text-center">{r.total_days} วัน</td>
                                            <td className="p-3 text-sm text-muted-foreground">{r.substitute_name || '-'}</td>
                                            <td className="p-3">
                                                <Badge variant={STATUS_STYLES[r.status]?.variant || 'secondary'}>
                                                    {STATUS_STYLES[r.status]?.label || r.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    {canApprove() && r.status === 'pending' && role === 'dept_head' && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="อนุมัติ (หัวหน้างาน)" onClick={() => approveAsSupervisor(r.id)}>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {canApprove() && r.status === 'supervisor_approved' && role === 'dept_head' && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600" title="อนุมัติ (หัวหน้าฝ่าย)" onClick={() => approveAsDeptHead(r.id)}>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {canApprove() && r.status === 'dept_head_approved' && (role === 'deputy_director' || role === 'director' || role === 'admin') && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="อนุมัติ (ผอ.)" onClick={() => approveAsFinal(r.id)}>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {canApprove() && !['approved', 'rejected', 'cancelled'].includes(r.status) && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => rejectLeave(r.id)} title="ไม่อนุมัติ">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {/* แง่ lock icon เมื่ออนุมัติสุดท้ายแล้ว */}
                                                    {r.status === 'approved' ? (
                                                        <span className="text-xs text-muted-foreground px-1 flex items-center gap-0.5" title="อนุมัติแล้ว — ไม่สามารถแก้ไขหรือลบได้">
                                                            🔒
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)} disabled={!canModify(r)} title={canModify(r) ? 'แก้ไข' : 'เฉพาะเจ้าของใบลาเท่านั้น'}>
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)} disabled={!canModify(r)} title={canModify(r) ? 'ลบ' : 'เฉพาะเจ้าของใบลาเท่านั้น'}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ────────── Dialog ────────── */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editRecord ? 'แก้ไขใบลา' : 'ยื่นใบลา'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">

                        {/* ชื่อผู้ยื่นลา — readOnly เมื่อสร้างใหม่ */}
                        <div>
                            <Label>ชื่อผู้ยื่นลา *</Label>
                            <Input
                                value={form.requester_name}
                                readOnly={!editRecord}
                                onChange={e => setForm(p => ({ ...p, requester_name: e.target.value }))}
                                placeholder="ชื่อผู้ยื่นลา"
                                className={!editRecord ? 'bg-muted cursor-not-allowed' : ''}
                            />
                            {!editRecord && currentUserName && (
                                <p className="text-xs text-green-600 mt-1">✅ ใช้ชื่อจากบัญชีที่ login</p>
                            )}
                        </div>

                        {/* ประเภทลา */}
                        <div>
                            <Label>ประเภทลา</Label>
                            <Select value={form.leave_type} onValueChange={v => setForm(p => ({ ...p, leave_type: v, leave_type_label: LEAVE_TYPES[v] }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(LEAVE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* วันที่ */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>วันที่เริ่ม *</Label>
                                <Input type="date" value={form.start_date}
                                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value, total_days: calcDays(e.target.value, p.end_date) }))} />
                            </div>
                            <div>
                                <Label>วันที่สิ้นสุด *</Label>
                                <Input type="date" value={form.end_date}
                                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value, total_days: calcDays(p.start_date, e.target.value) }))} />
                            </div>
                        </div>
                        {form.start_date && form.end_date && (
                            <p className="text-xs text-muted-foreground -mt-1">
                                รวม {calcDays(form.start_date, form.end_date)} วัน
                            </p>
                        )}

                        {/* เหตุผล */}
                        <div>
                            <Label>เหตุผล *</Label>
                            <Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={2} />
                        </div>

                        {/* ผู้ทำหน้าที่แทน — Select จาก app_users */}
                        <div>
                            <Label>ผู้ทำหน้าที่แทน</Label>
                            <Select
                                value={form.substitute_name || '__none__'}
                                onValueChange={v => setForm(p => ({ ...p, substitute_name: v === '__none__' ? '' : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="— ไม่ระบุ —" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">— ไม่ระบุ —</SelectItem>
                                    {substituteOptions.map(u => (
                                        <SelectItem key={u.id} value={u.full_name}>
                                            {u.full_name}{u.position ? ` (${u.position})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ─── สถานะ ─────────────────────────────────────── */}
                        {editRecord && (() => {
                            const allowed = allowedStatusesForRole(editRecord);
                            if (allowed.length === 0) {
                                // ผู้ยื่นลา หรือ role ที่ไม่มีสิทธิ์ → แสดงสถานะอ่านอย่างเดียว
                                return (
                                    <div>
                                        <Label>สถานะปัจจุบัน</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant={STATUS_STYLES[form.status]?.variant || 'secondary'}>
                                                {STATUS_STYLES[form.status]?.label || form.status}
                                            </Badge>
                                            {editRecord?.requester_name === currentUserName && (
                                                <span className="text-xs text-muted-foreground">
                                                    (เจ้าของใบลาไม่สามารถเปลี่ยนสถานะได้)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            // ผู้อนุมัติ → เลือกเฉพาะสถานะที่อนุญาต
                            return (
                                <div>
                                    <Label>อนุมัติ / เปลี่ยนสถานะ</Label>
                                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allowed.map(k => (
                                                <SelectItem key={k} value={k}>
                                                    {STATUS_STYLES[k]?.label || k}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        🔐 สิทธิ์อนุมัติ: {role}
                                    </p>
                                </div>
                            );
                        })()}
                        {!editRecord && (
                            <p className="text-xs text-muted-foreground">สถานะเริ่มต้น: รอหัวหน้างานอนุมัติ</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'กำลังบันทึก...' : editRecord ? 'บันทึก' : 'ยื่นลา'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
