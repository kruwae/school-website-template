import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarCheck, Trash2, Edit2 } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
}

const SHIFT_MAP: Record<string, string> = {
    morning: 'เช้า', afternoon: 'บ่าย', evening: 'เย็น', overnight: 'ค้างคืน',
};
const STATUS_MAP: Record<string, string> = {
    recorded: 'บันทึกแล้ว', verified: 'ตรวจสอบแล้ว', approved: 'อนุมัติแล้ว',
};

export const DutyManagement = () => {
    const { toast } = useToast();
    const { staffList } = useStaffList();
    const [records, setRecords] = useState<DutyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editRecord, setEditRecord] = useState<DutyRecord | null>(null);
    const [form, setForm] = useState({
        duty_date: new Date().toISOString().split('T')[0],
        duty_shift: 'morning',
        duty_shift_label: 'เวรเช้า',
        recorder_name: '',
        recorder_position: '',
        students_present: 0,
        students_absent: 0,
        incidents: '',
        actions_taken: '',
        remarks: '',
        status: 'recorded',
    });

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data } = await (supabase.from('duty_records' as any) as any)
                .select('*').order('duty_date', { ascending: false }).limit(100);
            if (data) setRecords(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openAdd = () => {
        setEditRecord(null);
        setForm({
            duty_date: new Date().toISOString().split('T')[0],
            duty_shift: 'morning', duty_shift_label: 'เวรเช้า',
            recorder_name: '', recorder_position: '',
            students_present: 0, students_absent: 0,
            incidents: '', actions_taken: '', remarks: '', status: 'recorded',
        });
        setShowDialog(true);
    };

    const openEdit = (r: DutyRecord) => {
        setEditRecord(r);
        setForm({
            duty_date: r.duty_date, duty_shift: r.duty_shift, duty_shift_label: r.duty_shift_label || '',
            recorder_name: r.recorder_name, recorder_position: r.recorder_position || '',
            students_present: r.students_present || 0, students_absent: r.students_absent || 0,
            incidents: r.incidents || '', actions_taken: r.actions_taken || '',
            remarks: r.remarks || '', status: r.status,
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.recorder_name) { toast({ title: 'กรุณากรอกชื่อผู้บันทึก', variant: 'destructive' }); return; }
        try {
            if (editRecord) {
                await (supabase.from('duty_records' as any) as any).update(form).eq('id', editRecord.id);
                toast({ title: 'อัปเดตบันทึกเวรสำเร็จ' });
            } else {
                await (supabase.from('duty_records' as any) as any).insert([form]);
                toast({ title: 'บันทึกเวรสำเร็จ' });
            }
            setShowDialog(false);
            fetchRecords();
        } catch (e) { toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' }); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบบันทึกเวรนี้?')) return;
        await (supabase.from('duty_records' as any) as any).delete().eq('id', id);
        toast({ title: 'ลบสำเร็จ' });
        fetchRecords();
    };

    const filtered = records.filter(r => !filterMonth || r.duty_date?.startsWith(filterMonth));

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarCheck className="w-6 h-6 text-green-600" /> บันทึกเวรประจำวัน
                    </h1>
                    <p className="text-muted-foreground text-sm">รายงานเวรและบันทึกเหตุการณ์</p>
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">วันที่</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ช่วงเวร</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ผู้บันทึก</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">นร.มา/ขาด</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">เหตุการณ์</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">สถานะ</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r, i) => (
                                        <tr key={r.id} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                                            <td className="p-3 text-sm font-medium">{new Date(r.duty_date).toLocaleDateString('th-TH')}</td>
                                            <td className="p-3 text-sm">{r.duty_shift_label || SHIFT_MAP[r.duty_shift] || r.duty_shift}</td>
                                            <td className="p-3 text-sm">{r.recorder_name}</td>
                                            <td className="p-3 text-sm">{r.students_present}/{r.students_absent}</td>
                                            <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">{r.incidents || '-'}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-xs">{STATUS_MAP[r.status] || r.status}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
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
                            <Select
                                value={form.recorder_name}
                                onValueChange={(v) => {
                                    const found = staffList.find(s => s.name === v);
                                    setForm(p => ({ ...p, recorder_name: v, recorder_position: found?.position || p.recorder_position }));
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="เลือกผู้บันทึก" /></SelectTrigger>
                                <SelectContent>
                                    {staffList.map(s => (
                                        <SelectItem key={s.id} value={s.name}>
                                            {s.name} — {s.position}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.recorder_position && (
                                <p className="text-xs text-muted-foreground mt-1">ตำแหน่ง: {form.recorder_position}</p>
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
                        <div>
                            <Label>สถานะ</Label>
                            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>{editRecord ? 'บันทึก' : 'เพิ่มบันทึก'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
