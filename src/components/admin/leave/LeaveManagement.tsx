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

export const LeaveManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const { canApprove, role } = usePermissions();
    const currentUserName = currentUser?.full_name || '';
    const currentUserPosition = (currentUser as any)?.position || '';
    const [records, setRecords] = useState<LeaveRequest[]>([]);
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showDialog, setShowDialog] = useState(false);
    const [editRecord, setEditRecord] = useState<LeaveRequest | null>(null);
    const [form, setForm] = useState({
        requester_name: currentUserName, requester_position: currentUserPosition, department_id: '',
        leave_type: 'sick', leave_type_label: 'ลาป่วย',
        start_date: '', end_date: '', total_days: 1,
        reason: '', substitute_name: '', status: 'pending',
        approved_by: '', academic_year: '2568',
    });


    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [leaveRes, deptRes] = await Promise.all([
                (supabase.from('leave_requests' as any) as any).select('*, departments(name)').order('created_at', { ascending: false }),
                (supabase.from('departments' as any) as any).select('id,name').eq('is_active', true),
            ]);
            if (leaveRes.data) setRecords(leaveRes.data);
            if (deptRes.data) setDepartments(deptRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = records.filter(r => {
        return (filterStatus === 'all' || r.status === filterStatus) &&
            (filterType === 'all' || r.leave_type === filterType);
    });

    const openAdd = () => {
        setEditRecord(null);
        setForm({ requester_name: '', requester_position: '', department_id: '', leave_type: 'sick', leave_type_label: 'ลาป่วย', start_date: '', end_date: '', total_days: 1, reason: '', substitute_name: '', status: 'pending', approved_by: '', academic_year: '2568' });
        setShowDialog(true);
    };

    const openEdit = (r: LeaveRequest) => {
        setEditRecord(r);
        setForm({
            requester_name: r.requester_name, requester_position: r.requester_position || '',
            department_id: (r as any).department_id || '', leave_type: r.leave_type,
            leave_type_label: r.leave_type_label || LEAVE_TYPES[r.leave_type],
            start_date: r.start_date, end_date: r.end_date, total_days: r.total_days || 1,
            reason: r.reason, substitute_name: r.substitute_name || '',
            status: r.status, approved_by: r.approved_by || '', academic_year: r.academic_year || '2568',
        });
        setShowDialog(true);
    };

    const calcDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.round(diff / 86400000) + 1;
    };

    const handleSave = async () => {
        if (!form.requester_name) { toast({ title: 'กรุณากรอกชื่อผู้ยื่นลา', variant: 'destructive' }); return; }
        const payload = { ...form, leave_type_label: LEAVE_TYPES[form.leave_type], total_days: calcDays(form.start_date, form.end_date) };
        try {
            if (editRecord) {
                await (supabase.from('leave_requests' as any) as any).update(payload).eq('id', editRecord.id);
                toast({ title: 'อัปเดตใบลาสำเร็จ' });
            } else {
                await (supabase.from('leave_requests' as any) as any).insert([payload]);
                toast({ title: 'ยื่นใบลาสำเร็จ' });
            }
            setShowDialog(false);
            fetchAll();
        } catch (e) { toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' }); }
    };

    const updateStatus = async (id: string, status: string) => {
        const approvedBy = currentUser?.full_name || '';
        await (supabase.from('leave_requests' as any) as any)
            .update({ status, approved_by: approvedBy, approved_at: new Date().toISOString() })
            .eq('id', id);
        const label = STATUS_STYLES[status]?.label || status;
        toast({ title: `อัปเดตสถานะ: ${label}` });
        fetchAll();
    };

    /** หัวหน้างาน อนุมัติขั้นที่ 1 */
    const approveAsSupervisor = (id: string) => updateStatus(id, 'supervisor_approved');
    /** หัวหน้าฝ่าย อนุมัติขั้นที่ 2 */
    const approveAsDeptHead = (id: string) => updateStatus(id, 'dept_head_approved');
    /** รองผอ./ผอ. อนุมัติขั้นสุดท้าย */
    const approveAsFinal = (id: string) => updateStatus(id, 'approved');
    const rejectLeave = (id: string) => updateStatus(id, 'rejected');

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบใบลานี้?')) return;
        await (supabase.from('leave_requests' as any) as any).delete().eq('id', id);
        toast({ title: 'ลบสำเร็จ' });
        fetchAll();
    };

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
            <div className="grid grid-cols-4 gap-3 mb-4">
                {Object.entries(STATUS_STYLES).map(([k, v]) => (
                    <Card key={k} className="cursor-pointer" onClick={() => setFilterStatus(k === filterStatus ? 'all' : k)}>
                        <CardContent className="p-3 text-center">
                            <p className="text-xl font-bold">{records.filter(r => r.status === k).length}</p>
                            <p className="text-xs text-muted-foreground">{v.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-3 mb-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
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
                                        {['ผู้ยื่นลา', 'ประเภทลา', 'วันที่ลา', 'จำนวนวัน', 'เหตุผล', 'สถานะ', 'จัดการ'].map(h => (
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
                                            <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">{r.reason}</td>
                                            <td className="p-3">
                                                <Badge variant={STATUS_STYLES[r.status]?.variant || 'secondary'}>
                                                    {STATUS_STYLES[r.status]?.label || r.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    {/* หัวหน้างาน สามารถอนุมัติขั้นที่ 1 */}
                                                    {canApprove() && r.status === 'pending' && role === 'dept_head' && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="อนุมัติ (หัวหน้างาน)" onClick={() => approveAsSupervisor(r.id)}>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {/* หัวหน้าฝ่าย อนุมัติขั้นที่ 2 */}
                                                    {canApprove() && r.status === 'supervisor_approved' && role === 'dept_head' && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600" title="อนุมัติ (หัวหน้าฝ่าย)" onClick={() => approveAsDeptHead(r.id)}>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {/* รองผอ./ผอ. อนุมัติขั้นสุดท้าย */}
                                                    {canApprove() && (r.status === 'dept_head_approved') && (role === 'deputy_director' || role === 'director' || role === 'admin') && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="อนุมัติ (ผอ.)" onClick={() => approveAsFinal(r.id)}>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {/* ปฏิเสธ */}
                                                    {canApprove() && !['approved','rejected','cancelled'].includes(r.status) && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => rejectLeave(r.id)} title="ไม่อนุมัติ">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
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

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editRecord ? 'แก้ไขใบลา' : 'ยื่นใบลา'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>ชื่อผู้ยื่นลา *</Label>
                            {/* Auto-fill จาก session — readonly เมื่อเพิ่มใหม่ */}
                            <Input
                                value={form.requester_name}
                                readOnly={!editRecord}
                                onChange={e => setForm(p => ({ ...p, requester_name: e.target.value }))}
                                placeholder="ชื่อผู้ยื่นลา"
                                className={!editRecord ? 'bg-muted cursor-not-allowed' : ''}
                            />
                            {!editRecord && currentUserName && (
                                <p className="text-xs text-muted-foreground mt-1">✅ ใช้ชื่อจากบัญชีที่ login</p>
                            )}
                        </div>
                        <div>
                            <Label>ประเภทลา</Label>
                            <Select value={form.leave_type} onValueChange={v => setForm(p => ({ ...p, leave_type: v, leave_type_label: LEAVE_TYPES[v] }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(LEAVE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>วันที่เริ่ม</Label>
                                <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value, total_days: calcDays(e.target.value, p.end_date) }))} />
                            </div>
                            <div>
                                <Label>วันที่สิ้นสุด</Label>
                                <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value, total_days: calcDays(p.start_date, e.target.value) }))} />
                            </div>
                        </div>
                        <div>
                            <Label>เหตุผล *</Label>
                            <Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={2} />
                        </div>
                        <div>
                            <Label>ผู้ทำหน้าที่แทน</Label>
                            <Input value={form.substitute_name} onChange={e => setForm(p => ({ ...p, substitute_name: e.target.value }))} />
                        </div>
                        <div>
                            <Label>สถานะ</Label>
                            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))} disabled={!editRecord}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(STATUS_STYLES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                            </Select>
                            {!editRecord && <p className="text-xs text-muted-foreground mt-1">สถานะเริ่มต้น: รอหัวหน้างานอนุมัติ</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>{editRecord ? 'บันทึก' : 'ยื่นลา'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
