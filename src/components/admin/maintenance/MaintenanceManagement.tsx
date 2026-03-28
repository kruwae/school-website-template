import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Wrench, Trash2, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { usePermissions, CAN_APPROVE_ROLES } from '@/hooks/usePermissions';

interface MaintenanceRequest {
    id: string; title: string; location: string; room_number: string;
    description: string; priority: string; status: string; reported_by: string;
    reporter_phone: string; assigned_to: string; completion_notes: string;
    created_at: string;
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
    low: { label: 'ต่ำ', color: 'bg-gray-100 text-gray-700' },
    normal: { label: 'ปกติ', color: 'bg-blue-100 text-blue-700' },
    high: { label: 'สูง', color: 'bg-orange-100 text-orange-700' },
    urgent: { label: 'เร่งด่วน', color: 'bg-red-100 text-red-700' },
};
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'รอดำเนินการ', variant: 'secondary' },
    acknowledged: { label: 'รับเรื่องแล้ว', variant: 'default' },
    in_progress: { label: 'กำลังดำเนินการ', variant: 'default' },
    completed: { label: 'เสร็จสิ้น', variant: 'outline' },
    cancelled: { label: 'ยกเลิก', variant: 'destructive' },
};

export const MaintenanceManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const { canApprove } = usePermissions();
    const currentUserName = currentUser?.full_name || '';

    const [records, setRecords] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showDialog, setShowDialog] = useState(false);
    const [editRecord, setEditRecord] = useState<MaintenanceRequest | null>(null);
    const [form, setForm] = useState({
        title: '', location: '', room_number: '', description: '',
        priority: 'normal', status: 'pending', reported_by: currentUserName,
        reporter_phone: '', assigned_to: '', completion_notes: '',
    });

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data } = await (supabase.from('maintenance_requests' as any) as any)
                .select('*').order('created_at', { ascending: false });
            if (data) setRecords(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = records.filter(r =>
        (filterStatus === 'all' || r.status === filterStatus) &&
        (filterPriority === 'all' || r.priority === filterPriority)
    );

    const openAdd = () => {
        setEditRecord(null);
        // Auto-fill ผู้แจ้งจาก session
        setForm({ title: '', location: '', room_number: '', description: '', priority: 'normal', status: 'pending', reported_by: currentUserName, reporter_phone: '', assigned_to: '', completion_notes: '' });
        setShowDialog(true);
    };

    const approveRecord = async (id: string, newStatus: string) => {
        await (supabase.from('maintenance_requests' as any) as any)
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        const label = newStatus === 'acknowledged' ? 'รับเรื่องแล้ว' :
                      newStatus === 'in_progress' ? 'กำลังดำเนินการ' :
                      newStatus === 'completed' ? 'เสร็จสิ้น' : newStatus;
        toast({ title: `อัปเดตสถานะ: ${label}` });
        fetchRecords();
    };

    const openEdit = (r: MaintenanceRequest) => {
        setEditRecord(r);
        setForm({ title: r.title, location: r.location || '', room_number: r.room_number || '', description: r.description, priority: r.priority, status: r.status, reported_by: r.reported_by, reporter_phone: r.reporter_phone || '', assigned_to: r.assigned_to || '', completion_notes: r.completion_notes || '' });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.reported_by) { toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' }); return; }
        try {
            if (editRecord) {
                await (supabase.from('maintenance_requests' as any) as any).update(form).eq('id', editRecord.id);
                toast({ title: 'อัปเดตสำเร็จ' });
            } else {
                await (supabase.from('maintenance_requests' as any) as any).insert([form]);
                toast({ title: 'แจ้งซ่อมสำเร็จ' });
            }
            setShowDialog(false);
            fetchRecords();
        } catch (e) { toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' }); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบรายการนี้?')) return;
        await (supabase.from('maintenance_requests' as any) as any).delete().eq('id', id);
        toast({ title: 'ลบสำเร็จ' });
        fetchRecords();
    };

    const pendingCount = records.filter(r => r.status === 'pending').length;
    const urgentCount = records.filter(r => r.priority === 'urgent' && r.status !== 'completed').length;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-orange-600" /> ระบบแจ้งซ่อม
                    </h1>
                    <p className="text-muted-foreground text-sm">แจ้งซ่อมอาคารและครุภัณฑ์ของโรงเรียน</p>
                </div>
                <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> แจ้งซ่อม</Button>
            </div>

            {urgentCount > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">มีรายการเร่งด่วน {urgentCount} รายการที่ยังไม่เสร็จ</span>
                </div>
            )}

            <div className="flex gap-3 mb-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกสถานะ</SelectItem>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="ทุกความเร่งด่วน" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกระดับ</SelectItem>
                        {Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground self-center">{filtered.length} รายการ • รอ {pendingCount}</span>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
                ) : filtered.length === 0 ? (
                    <Card><CardContent className="p-12 text-center">
                        <Wrench className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground">ไม่มีรายการแจ้งซ่อม</p>
                    </CardContent></Card>
                ) : filtered.map((r) => (
                    <Card key={r.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_MAP[r.priority]?.color}`}>
                                            {PRIORITY_MAP[r.priority]?.label}
                                        </span>
                                        <Badge variant={STATUS_MAP[r.status]?.variant}>{STATUS_MAP[r.status]?.label || r.status}</Badge>
                                    </div>
                                    <h3 className="font-semibold text-sm">{r.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        📍 {r.location || '–'}{r.room_number && ` ห้อง ${r.room_number}`}
                                        {r.reported_by && <> • <span className="font-medium">แจ้งโดย:</span> {r.reported_by}</>}
                                        {r.assigned_to && ` • ผู้รับผิดชอบ: ${r.assigned_to}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    {/* ปุ่มอนุมัติสำหรับหัวหน้า/ผอ. */}
                                    {canApprove() && r.status === 'pending' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="รับเรื่อง"
                                            onClick={() => approveRecord(r.id, 'acknowledged')}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    {canApprove() && r.status === 'acknowledged' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="เสร็จสิ้น"
                                            onClick={() => approveRecord(r.id, 'completed')}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editRecord ? 'แก้ไขรายการซ่อม' : 'แจ้งซ่อม'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>หัวข้อ *</Label>
                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="เช่น ไฟฟ้าขัดข้อง ห้องน้ำอุดตัน" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>สถานที่</Label>
                                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="อาคาร/บริเวณ" />
                            </div>
                            <div>
                                <Label>หมายเลขห้อง</Label>
                                <Input value={form.room_number} onChange={e => setForm(p => ({ ...p, room_number: e.target.value }))} placeholder="ห้อง xxx" />
                            </div>
                        </div>
                        <div>
                            <Label>รายละเอียดปัญหา *</Label>
                            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="อธิบายปัญหาที่พบ..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>ความเร่งด่วน</Label>
                                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>สถานะ</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>ผู้แจ้ง *</Label>
                            {/* Auto-fill จาก session — readonly เมื่อเพิ่มใหม่ */}
                            <Input
                                value={form.reported_by}
                                readOnly={!editRecord}
                                onChange={e => setForm(p => ({ ...p, reported_by: e.target.value }))}
                                placeholder="ชื่อผู้แจ้ง"
                                className={!editRecord ? 'bg-muted cursor-not-allowed' : ''}
                            />
                            {!editRecord && currentUserName && (
                                <p className="text-xs text-muted-foreground mt-1">✅ ใช้ชื่อจากบัญชีที่ login</p>
                            )}
                        </div>
                            <div>
                                <Label>ผู้รับผิดชอบ</Label>
                                <Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <Label>บันทึกการซ่อม</Label>
                            <Input value={form.completion_notes} onChange={e => setForm(p => ({ ...p, completion_notes: e.target.value }))} placeholder="ผลการดำเนินการ..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>{editRecord ? 'บันทึก' : 'ส่งแจ้งซ่อม'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
