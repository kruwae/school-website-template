import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCog, Trash2, Edit2, AlertCircle } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Committee {
    id: string; name: string; role: string; role_label: string;
    weight_percent: number; order_position: number; academic_year: string;
}

const ROLES: Record<string, string> = {
    director: 'ผู้อำนวยการ', deputy_director: 'รองผู้อำนวยการ',
    dept_head: 'หัวหน้าฝ่าย', other: 'อื่นๆ',
};

export const AuditCommitteeManagement = () => {
    const { toast } = useToast();
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('2568');
    const [showDialog, setShowDialog] = useState(false);
    const [editItem, setEditItem] = useState<Committee | null>(null);
    const [form, setForm] = useState({
        name: '', role: 'director', role_label: 'ผอ.',
        weight_percent: 0, order_position: 1, academic_year: '2568',
    });

    useEffect(() => { fetchCommittees(); }, [filterYear]);

    const fetchCommittees = async () => {
        setLoading(true);
        try {
            const { data } = await (supabase.from('audit_committees' as any) as any)
                .select('*').eq('academic_year', filterYear).eq('is_active', true).order('order_position');
            if (data) setCommittees(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const totalWeight = committees.reduce((s, c) => s + Number(c.weight_percent), 0);
    const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: '', role: 'director', role_label: 'ผอ.', weight_percent: 0, order_position: committees.length + 1, academic_year: filterYear });
        setShowDialog(true);
    };
    const openEdit = (c: Committee) => {
        setEditItem(c);
        setForm({ name: c.name, role: c.role, role_label: c.role_label, weight_percent: c.weight_percent, order_position: c.order_position, academic_year: c.academic_year });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.name) { toast({ title: 'กรุณากรอกชื่อกรรมการ', variant: 'destructive' }); return; }
        // Check new total won't exceed 100
        const otherTotal = committees
            .filter(c => editItem ? c.id !== editItem.id : true)
            .reduce((s, c) => s + Number(c.weight_percent), 0);
        if (otherTotal + Number(form.weight_percent) > 100.01) {
            toast({ title: `น้ำหนักรวมเกิน 100% (รวม ${(otherTotal + Number(form.weight_percent)).toFixed(2)}%)`, variant: 'destructive' });
            return;
        }
        try {
            if (editItem) {
                await (supabase.from('audit_committees' as any) as any).update(form).eq('id', editItem.id);
                toast({ title: 'อัปเดตกรรมการสำเร็จ' });
            } else {
                await (supabase.from('audit_committees' as any) as any).insert([{ ...form, is_active: true }]);
                toast({ title: 'เพิ่มกรรมการสำเร็จ' });
            }
            setShowDialog(false);
            fetchCommittees();
        } catch (e) { toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' }); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบกรรมการนี้?')) return;
        await (supabase.from('audit_committees' as any) as any).update({ is_active: false }).eq('id', id);
        toast({ title: 'ลบสำเร็จ' });
        fetchCommittees();
    };

    // Templates
    const applyTemplate = async () => {
        if (!confirm('ใส่กรรมการตัวอย่าง 8 คน? (จะเพิ่มเฉพาะปีที่เลือก)')) return;
        const template = [
            { name: 'ผู้อำนวยการโรงเรียน', role: 'director', role_label: 'ผอ.', weight_percent: 50, order_position: 1 },
            { name: 'รองผู้อำนวยการฝ่ายวิชาการ', role: 'deputy_director', role_label: 'รองผอ.', weight_percent: 12.5, order_position: 2 },
            { name: 'รองผู้อำนวยการฝ่ายบริหาร', role: 'deputy_director', role_label: 'รองผอ.', weight_percent: 12.5, order_position: 3 },
            { name: 'หัวหน้าฝ่ายวิชาการ', role: 'dept_head', role_label: 'หัวหน้าฝ่าย', weight_percent: 6.25, order_position: 4 },
            { name: 'หัวหน้าฝ่ายบริหารทั่วไป', role: 'dept_head', role_label: 'หัวหน้าฝ่าย', weight_percent: 6.25, order_position: 5 },
            { name: 'หัวหน้าฝ่ายงบประมาณ', role: 'dept_head', role_label: 'หัวหน้าฝ่าย', weight_percent: 6.25, order_position: 6 },
            { name: 'หัวหน้าฝ่ายบริหารบุคคล', role: 'dept_head', role_label: 'หัวหน้าฝ่าย', weight_percent: 3.125, order_position: 7 },
            { name: 'หัวหน้าฝ่ายกิจการนักเรียน', role: 'dept_head', role_label: 'หัวหน้าฝ่าย', weight_percent: 3.125, order_position: 8 },
        ].map(t => ({ ...t, academic_year: filterYear, is_active: true }));
        await (supabase.from('audit_committees' as any) as any).insert(template);
        toast({ title: 'เพิ่มกรรมการตัวอย่างสำเร็จ' });
        fetchCommittees();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-indigo-600" /> ตั้งค่ากรรมการประเมิน
                    </h1>
                    <p className="text-muted-foreground text-sm">กำหนดรายชื่อและน้ำหนักกรรมการ (ต้องรวม = 100%)</p>
                </div>
                <div className="flex gap-2">
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{['2568', '2567', '2566'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={applyTemplate} className="text-xs">+ ชุดกรรมการตัวอย่าง</Button>
                    <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> เพิ่มกรรมการ</Button>
                </div>
            </div>

            {/* Weight Summary */}
            <Card className={`mb-6 ${isWeightValid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">น้ำหนักรวมทั้งหมด</p>
                            <p className={`text-2xl font-bold ${isWeightValid ? 'text-green-700' : 'text-orange-700'}`}>
                                {totalWeight.toFixed(3)}%
                            </p>
                        </div>
                        {!isWeightValid && (
                            <div className="flex items-center gap-2 text-orange-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">น้ำหนักต้องรวมกัน = 100%</span>
                            </div>
                        )}
                        {isWeightValid && (
                            <div className="text-green-700 font-medium text-sm">✓ น้ำหนักถูกต้อง</div>
                        )}
                    </div>
                    {/* Weight bar */}
                    <div className="mt-3 h-2 bg-white rounded-full overflow-hidden border">
                        <div className={`h-full rounded-full transition-all ${isWeightValid ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(totalWeight, 100)}%` }} />
                    </div>
                </CardContent>
            </Card>

            {/* Committee Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
                    ) : committees.length === 0 ? (
                        <div className="p-12 text-center">
                            <UserCog className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-muted-foreground">ยังไม่มีกรรมการ กดปุ่ม "ชุดกรรมการตัวอย่าง" เพื่อเริ่มต้น</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        {['ลำดับ', 'ชื่อกรรมการ', 'บทบาท', 'น้ำหนัก (%)', 'จัดการ'].map(h => (
                                            <th key={h} className="text-left p-3 text-sm font-medium text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {committees.map((c, i) => (
                                        <tr key={c.id} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                                            <td className="p-3 text-sm text-muted-foreground">{c.order_position}</td>
                                            <td className="p-3 text-sm font-medium">{c.name}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-xs">{c.role_label || ROLES[c.role]}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(c.weight_percent, 100)}%` }} />
                                                    </div>
                                                    <span className="text-sm font-bold">{Number(c.weight_percent).toFixed(3)}%</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t bg-muted/30">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-sm font-semibold text-right">รวม</td>
                                        <td className="p-3 text-sm font-bold text-indigo-700">{totalWeight.toFixed(3)}%</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editItem ? 'แก้ไขกรรมการ' : 'เพิ่มกรรมการ'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>ชื่อกรรมการ *</Label>
                            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อ-นามสกุล/ตำแหน่ง" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>บทบาท</Label>
                                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v, role_label: v === 'director' ? 'ผอ.' : v === 'deputy_director' ? 'รองผอ.' : 'หัวหน้าฝ่าย' }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>ป้ายชื่อย่อ</Label>
                                <Input value={form.role_label} onChange={e => setForm(p => ({ ...p, role_label: e.target.value }))} placeholder="ผอ. / รองผอ." />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>น้ำหนัก % <span className="text-muted-foreground text-xs">(เหลือ {(100 - committees.filter(c => !editItem || c.id !== editItem.id).reduce((s, c) => s + Number(c.weight_percent), 0)).toFixed(3)}%)</span></Label>
                                <Input type="number" min="0" max="100" step="0.001" value={form.weight_percent} onChange={e => setForm(p => ({ ...p, weight_percent: parseFloat(e.target.value) || 0 }))} />
                            </div>
                            <div>
                                <Label>ลำดับ</Label>
                                <Input type="number" min="1" value={form.order_position} onChange={e => setForm(p => ({ ...p, order_position: parseInt(e.target.value) || 1 }))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>{editItem ? 'บันทึก' : 'เพิ่ม'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
