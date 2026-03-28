import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Wrench, Trash2, Edit2, AlertTriangle, CheckCircle2,
    Camera, Image, ExternalLink, Eye
} from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { getCurrentUser } from '@/lib/auth';
import { usePermissions } from '@/hooks/usePermissions';

interface MaintenanceRequest {
    id: string; title: string; location: string; room_number: string;
    description: string; priority: string; status: string; reported_by: string;
    reporter_phone: string; assigned_to: string; completion_notes: string;
    created_at: string;
    image_before: string | null;
    image_during: string | null;
    image_after:  string | null;
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
    low:    { label: 'ต่ำ',      color: 'bg-gray-100 text-gray-700' },
    normal: { label: 'ปกติ',     color: 'bg-blue-100 text-blue-700' },
    high:   { label: 'สูง',      color: 'bg-orange-100 text-orange-700' },
    urgent: { label: 'เร่งด่วน', color: 'bg-red-100 text-red-700' },
};
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending:      { label: 'รอดำเนินการ',       variant: 'secondary' },
    acknowledged: { label: 'รับเรื่องแล้ว',      variant: 'default' },
    in_progress:  { label: 'กำลังดำเนินการ',    variant: 'default' },
    completed:    { label: 'เสร็จสิ้น',          variant: 'outline' },
    cancelled:    { label: 'ยกเลิก',             variant: 'destructive' },
};

// ─── helper: แสดงรูปขนาดย่อพร้อม link ─────────────────────────────────────
const ThumbLink = ({ url, label }: { url: string | null; label: string }) => {
    if (!url) return <span className="text-xs text-muted-foreground">ยังไม่มี</span>;
    return (
        <a
            href={url} target="_blank" rel="noopener noreferrer"
            className="block group relative w-20 h-14 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
            title={`ดูภาพ${label}`}
        >
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-white" />
            </div>
        </a>
    );
};

export const MaintenanceManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const { canApprove, role } = usePermissions();
    const currentUserName = currentUser?.full_name || '';
    const isAdmin = role === 'admin';

    /**
     * canModify rules:
     * - completed/cancelled → เฉพาะ admin เท่านั้น (เจ้าหน้าที่ที่แจ้งและ director ก็ไม่ได้)
     * - pending/acknowledged/in_progress → เจ้าของ หรือ admin/director/deputy_director
     */
    const canModify = (r: MaintenanceRequest): boolean => {
        if (!currentUser) return false;
        if (r.status === 'completed' || r.status === 'cancelled') return isAdmin;
        if (role === 'admin' || role === 'director' || role === 'deputy_director') return true;
        return r.reported_by === currentUserName;
    };

    const [records, setRecords] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showDialog, setShowDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewRecord, setViewRecord] = useState<MaintenanceRequest | null>(null);
    const [editRecord, setEditRecord] = useState<MaintenanceRequest | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', location: '', room_number: '', description: '',
        priority: 'normal', status: 'pending', reported_by: currentUserName,
        reporter_phone: '', assigned_to: '', completion_notes: '',
        image_before: '', image_during: '', image_after: '',
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
        setForm({
            title: '', location: '', room_number: '', description: '',
            priority: 'normal', status: 'pending', reported_by: currentUserName,
            reporter_phone: '', assigned_to: '', completion_notes: '',
            image_before: '', image_during: '', image_after: '',
        });
        setShowDialog(true);
    };

    const openEdit = (r: MaintenanceRequest) => {
        setEditRecord(r);
        setForm({
            title: r.title, location: r.location || '', room_number: r.room_number || '',
            description: r.description, priority: r.priority, status: r.status,
            reported_by: r.reported_by, reporter_phone: r.reporter_phone || '',
            assigned_to: r.assigned_to || '', completion_notes: r.completion_notes || '',
            image_before: r.image_before || '',
            image_during: r.image_during || '',
            image_after:  r.image_after  || '',
        });
        setShowDialog(true);
    };

    const approveRecord = async (id: string, newStatus: string) => {
        await (supabase.from('maintenance_requests' as any) as any)
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        const label = STATUS_MAP[newStatus]?.label || newStatus;
        toast({ title: `อัปเดตสถานะ: ${label}` });
        fetchRecords();
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.reported_by.trim()) {
            toast({ title: 'กรุณากรอกหัวข้อและชื่อผู้แจ้ง', variant: 'destructive' });
            return;
        }
        if (!form.description.trim()) {
            toast({ title: 'กรุณากรอกรายละเอียดปัญหา', variant: 'destructive' });
            return;
        }

        const payload = {
            title: form.title.trim(),
            location: form.location.trim() || null,
            room_number: form.room_number.trim() || null,
            description: form.description.trim(),
            priority: form.priority,
            status: editRecord ? form.status : 'pending',
            reported_by: form.reported_by.trim(),
            reporter_phone: form.reporter_phone.trim() || null,
            assigned_to: form.assigned_to.trim() || null,
            completion_notes: form.completion_notes.trim() || null,
            image_before: form.image_before || null,
            image_during: form.image_during || null,
            image_after: form.image_after || null,
        };

        setSaving(true);
        try {
            let result;
            if (editRecord) {
                result = await (supabase.from('maintenance_requests' as any) as any)
                    .update(payload)
                    .eq('id', editRecord.id);
            } else {
                result = await (supabase.from('maintenance_requests' as any) as any)
                    .insert([payload]);
            }

            if (result?.error) {
                console.error('[maintenance] save error:', result.error);
                toast({
                    title: editRecord ? 'อัปเดตรายการไม่สำเร็จ' : 'แจ้งซ่อมไม่สำเร็จ',
                    description: result.error.message,
                    variant: 'destructive',
                });
                return;
            }

            toast({ title: editRecord ? 'อัปเดตสำเร็จ ✅' : 'แจ้งซ่อมสำเร็จ ✅' });
            setShowDialog(false);
            fetchRecords();
        } catch (e: any) {
            console.error('[maintenance] unexpected save error:', e);
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: e?.message || 'ไม่สามารถบันทึกรายการแจ้งซ่อมได้',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบรายการนี้?')) return;
        await (supabase.from('maintenance_requests' as any) as any).delete().eq('id', id);
        toast({ title: 'ลบสำเร็จ' });
        fetchRecords();
    };

    const pendingCount = records.filter(r => r.status === 'pending').length;
    const urgentCount  = records.filter(r => r.priority === 'urgent' && r.status !== 'completed').length;

    // ── helper: count images in a record ──────────────────────────────────
    const imageCount = (r: MaintenanceRequest) =>
        [r.image_before, r.image_during, r.image_after].filter(Boolean).length;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-orange-600" /> ระบบแจ้งซ่อม
                    </h1>
                    <p className="text-muted-foreground text-sm">แจ้งซ่อมอาคารและครุภัณฑ์ พร้อมติดตามภาพประกอบ 3 ระยะ</p>
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
                                        {imageCount(r) > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                <Camera className="w-3 h-3" /> {imageCount(r)} ภาพ
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-sm">{r.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        📍 {r.location || '–'}{r.room_number && ` ห้อง ${r.room_number}`}
                                        {r.reported_by && <> • <span className="font-medium">แจ้งโดย:</span> {r.reported_by}</>}
                                        {r.assigned_to && ` • ผู้รับผิดชอบ: ${r.assigned_to}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.description}</p>

                                    {/* ภาพย่อ 3 ระยะ */}
                                    {imageCount(r) > 0 && (
                                        <div className="flex items-center gap-3 mt-2">
                                            {r.image_before && (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <ThumbLink url={r.image_before} label="ก่อนซ่อม" />
                                                    <span className="text-[10px] text-muted-foreground">ก่อนซ่อม</span>
                                                </div>
                                            )}
                                            {r.image_during && (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <ThumbLink url={r.image_during} label="ระหว่างดำเนินการ" />
                                                    <span className="text-[10px] text-muted-foreground">ระหว่างซ่อม</span>
                                                </div>
                                            )}
                                            {r.image_after && (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <ThumbLink url={r.image_after} label="หลังซ่อม" />
                                                    <span className="text-[10px] text-muted-foreground">หลังซ่อม</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-1 flex-shrink-0 items-start">
                                    {/* ปุ่มดูรายละเอียด */}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="ดูรายละเอียด"
                                        onClick={() => { setViewRecord(r); setShowViewDialog(true); }}>
                                        <Eye className="w-3.5 h-3.5" />
                                    </Button>

                                    {/* ปุ่มอนุมัติสำหรับหัวหน้า/ผอ. */}
                                    {canApprove() && r.status === 'pending' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="รับเรื่อง"
                                            onClick={() => approveRecord(r.id, 'acknowledged')}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    {canApprove() && r.status === 'acknowledged' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600" title="กำลังดำเนินการ"
                                            onClick={() => approveRecord(r.id, 'in_progress')}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    {canApprove() && r.status === 'in_progress' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="เสร็จสิ้น"
                                            onClick={() => approveRecord(r.id, 'completed')}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}

                                    {/* ปุ่มแก้ไข/ลบ ตามกฎสิทธิ์ */}
                                    {(r.status === 'completed' || r.status === 'cancelled') && !isAdmin ? (
                                        <span className="text-xs text-muted-foreground px-1" title="เสร็จสิ้นแล้ว — เฉพาะ admin แก้ไขได้">🔒</span>
                                    ) : canModify(r) ? (
                                        <>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" title="แก้ไข" onClick={() => openEdit(r)}>
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="ลบ" onClick={() => handleDelete(r.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground px-2" title="เฉพาะผู้แจ้งหรือผู้บริหารเท่านั้น">–</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ─────────────── View Detail Dialog ─────────────── */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-orange-600" />
                            รายละเอียดการแจ้งซ่อม
                        </DialogTitle>
                    </DialogHeader>
                    {viewRecord && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div><span className="text-muted-foreground block text-xs">หัวข้อ</span><span className="font-medium">{viewRecord.title}</span></div>
                                <div><span className="text-muted-foreground block text-xs">สถานะ</span>
                                    <Badge variant={STATUS_MAP[viewRecord.status]?.variant}>{STATUS_MAP[viewRecord.status]?.label}</Badge>
                                </div>
                                <div><span className="text-muted-foreground block text-xs">สถานที่</span><span>{viewRecord.location || '–'}{viewRecord.room_number && ` ห้อง ${viewRecord.room_number}`}</span></div>
                                <div><span className="text-muted-foreground block text-xs">ความเร่งด่วน</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_MAP[viewRecord.priority]?.color}`}>{PRIORITY_MAP[viewRecord.priority]?.label}</span>
                                </div>
                                <div><span className="text-muted-foreground block text-xs">ผู้แจ้ง</span><span>{viewRecord.reported_by}</span></div>
                                <div><span className="text-muted-foreground block text-xs">ผู้รับผิดชอบ</span><span>{viewRecord.assigned_to || '–'}</span></div>
                            </div>
                            {viewRecord.description && (
                                <div><span className="text-muted-foreground block text-xs mb-1">รายละเอียดปัญหา</span>
                                    <p className="text-sm bg-muted/30 rounded-lg p-2">{viewRecord.description}</p>
                                </div>
                            )}
                            {viewRecord.completion_notes && (
                                <div><span className="text-muted-foreground block text-xs mb-1">บันทึกการซ่อม</span>
                                    <p className="text-sm bg-green-50 border border-green-200 rounded-lg p-2 text-green-800">{viewRecord.completion_notes}</p>
                                </div>
                            )}

                            {/* ภาพ 3 ระยะ */}
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
                                    <Image className="w-3.5 h-3.5" /> ภาพประกอบ 3 ระยะ
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { url: viewRecord.image_before, label: '🔴 ก่อนซ่อม', desc: 'สภาพปัญหา' },
                                        { url: viewRecord.image_during, label: '🟡 ระหว่างซ่อม', desc: 'เจ้าหน้าที่ดำเนินการ' },
                                        { url: viewRecord.image_after,  label: '🟢 หลังซ่อม', desc: 'เสร็จสิ้น' },
                                    ].map(({ url, label, desc }) => (
                                        <div key={label} className="text-center">
                                            <p className="text-xs font-medium mb-1">{label}</p>
                                            <p className="text-[10px] text-muted-foreground mb-2">{desc}</p>
                                            {url ? (
                                                <a href={url} target="_blank" rel="noopener noreferrer"
                                                    className="block group relative rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors aspect-square">
                                                    <img src={url} alt={label} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink className="w-5 h-5 text-white" />
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="aspect-square rounded-lg bg-muted/30 border-2 border-dashed border-border flex items-center justify-center">
                                                    <Camera className="w-6 h-6 text-muted-foreground/40" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>ปิด</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─────────────── Edit / Add Dialog ─────────────── */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editRecord ? 'แก้ไขรายการซ่อม' : 'แจ้งซ่อม'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">

                        {/* ── ข้อมูลพื้นฐาน ── */}
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

                        {/* ── ภาพ 3 ระยะ ── */}
                        <div className="border-t pt-4">
                            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-orange-500" /> ภาพประกอบ 3 ระยะ
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                {/* ภาพก่อนซ่อม */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                                        <Label className="text-xs font-semibold text-red-700">ก่อนซ่อม</Label>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-2">รูปแสดงสภาพปัญหา</p>
                                    <ImageUpload
                                        bucket="school-images"
                                        folder="maintenance/before"
                                        compressionPreset="thumbnail"
                                        currentImage={form.image_before}
                                        onUploadComplete={url => setForm(p => ({ ...p, image_before: url }))}
                                    />
                                </div>

                                {/* ภาพระหว่างซ่อม */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0" />
                                        <Label className="text-xs font-semibold text-yellow-700">ระหว่างซ่อม</Label>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-2">รูปเจ้าหน้าที่ดำเนินการ</p>
                                    <ImageUpload
                                        bucket="school-images"
                                        folder="maintenance/during"
                                        compressionPreset="thumbnail"
                                        currentImage={form.image_during}
                                        onUploadComplete={url => setForm(p => ({ ...p, image_during: url }))}
                                    />
                                </div>

                                {/* ภาพหลังซ่อม */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                                        <Label className="text-xs font-semibold text-green-700">หลังซ่อม</Label>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-2">รูปยืนยันความเรียบร้อย</p>
                                    <ImageUpload
                                        bucket="school-images"
                                        folder="maintenance/after"
                                        compressionPreset="thumbnail"
                                        currentImage={form.image_after}
                                        onUploadComplete={url => setForm(p => ({ ...p, image_after: url }))}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                💡 อัปโหลดภาพตามขั้นตอน — ก่อนซ่อมโดยผู้แจ้ง · ระหว่างซ่อมโดยช่าง · หลังซ่อมเป็นหลักฐานปิดงาน
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'กำลังบันทึก...' : editRecord ? 'บันทึก' : 'ส่งแจ้งซ่อม'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
