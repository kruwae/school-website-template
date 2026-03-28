import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Star, Trash2, ClipboardEdit, ChevronDown, ChevronUp,
    FileText, Download, ExternalLink, FolderOpen, AlertCircle
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// ---- หัวข้อประเมิน ----
const EVAL_ITEMS = [
    { key: 'score_1_1', group: 'องค์ประกอบที่ 1: ความรู้', label: '1.1 ความรู้ในกฎระเบียบที่เกี่ยวข้อง' },
    { key: 'score_1_2', group: 'องค์ประกอบที่ 1: ความรู้', label: '1.2 ความรู้ในหลักวิชาเฉพาะด้าน' },
    { key: 'score_2_1', group: 'องค์ประกอบที่ 2: ความสามารถ', label: '2.1 คุณภาพของงาน' },
    { key: 'score_2_2', group: 'องค์ประกอบที่ 2: ความสามารถ', label: '2.2 ปริมาณงาน' },
    { key: 'score_3_1', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.1 การรักษาวินัย' },
    { key: 'score_3_2', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.2 ความอุตสาหะ' },
    { key: 'score_3_3', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.3 ความรับผิดชอบ' },
    { key: 'score_3_4', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.4 ความมีมนุษยสัมพันธ์' },
    { key: 'score_3_5', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.5 ความซื่อสัตย์' },
    { key: 'score_3_6', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.6 ศีลธรรมจรรยาและขนบธรรมเนียม' },
    { key: 'score_3_7', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.7 เสียสละและอุทิศเวลาให้ราชการ' },
    { key: 'score_3_8', group: 'องค์ประกอบที่ 3: ความประพฤติ', label: '3.8 ความสนใจพัฒนาตนเอง' },
];

const DOC_TYPE_LABELS: Record<string, string> = {
    self_evaluation: 'แบบประเมินตนเอง',
    teaching_plan:   'แผนการจัดการเรียนรู้',
    work_evidence:   'หลักฐานการปฏิบัติงาน',
    other:           'เอกสารอื่นๆ',
};

interface Evaluatee {
    id: string; name: string; position: string; position_type: string;
    academic_year: string; user_id?: string; departments?: { name: string };
}
interface Committee {
    id: string; name: string; role: string; role_label: string;
    weight_percent: number; order_position: number;
}
interface Evaluation {
    id: string; evaluatee_id: string; committee_id: string; academic_year: string;
    is_submitted: boolean; remarks: string;
    [key: string]: any;
}
interface EvaluateeDoc {
    id: string; title: string; file_url: string; file_name: string;
    file_type: string; file_size: number; document_type: string;
    status: string; created_at: string;
}

const POSITION_TYPES: Record<string, string> = {
    assistant: 'ครูพี่เลี้ยง', permanent_employee: 'ลูกจ้างประจำ',
    temp_employee: 'ลูกจ้างชั่วคราว', other: 'อื่นๆ',
};

const computeWeightedScore = (evaluations: Evaluation[], committees: Committee[]) => {
    const totalWeight = committees.reduce((s, c) => s + c.weight_percent, 0);
    if (totalWeight === 0) return 0;
    let weightedSum = 0;
    for (const c of committees) {
        const ev = evaluations.find(e => e.committee_id === c.id && e.is_submitted);
        if (ev) {
            const avg = EVAL_ITEMS.reduce((s, item) => s + (parseFloat(ev[item.key]) || 0), 0) / EVAL_ITEMS.length;
            weightedSum += avg * (c.weight_percent / totalWeight);
        }
    }
    return Math.round(weightedSum * 100) / 100;
};

const gradeLabel = (score: number) => {
    if (score >= 90) return { grade: 'ดีเด่น',   color: 'text-green-600' };
    if (score >= 80) return { grade: 'ดีมาก',    color: 'text-blue-600' };
    if (score >= 70) return { grade: 'ดี',        color: 'text-indigo-600' };
    if (score >= 60) return { grade: 'พอใช้',     color: 'text-yellow-600' };
    return             { grade: 'ปรับปรุง', color: 'text-red-600' };
};

function formatBytes(b: number) {
    if (!b) return '-';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

export const AuditTeacherManagement = () => {
    const { toast } = useToast();
    const [evaluatees, setEvaluatees] = useState<Evaluatee[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('2568');

    // Dialogs
    const [showAddEval, setShowAddEval] = useState(false);
    const [showScoreDialog, setShowScoreDialog] = useState(false);
    const [selectedEvaluatee, setSelectedEvaluatee] = useState<Evaluatee | null>(null);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    // Forms
    const [addForm, setAddForm] = useState({
        name: '', position: '', position_type: 'assistant',
        department_id: '', academic_year: '2568', user_id: '',
    });
    const [scoreForm, setScoreForm] = useState<Record<string, number>>({});
    const [remarksForm, setRemarksForm] = useState('');

    // Evaluatee documents (for committee to review before scoring)
    const [evalueeDocs, setEvalueeDocs] = useState<EvaluateeDoc[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [appUsers, setAppUsers] = useState<{ id: string; full_name: string; username: string }[]>([]);

    useEffect(() => { fetchAll(); }, [filterYear]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [evaleeRes, comRes, evRes, deptRes, usersRes] = await Promise.all([
                (supabase.from('audit_evaluatees' as any) as any)
                    .select('*, departments(name)')
                    .eq('is_active', true).order('created_at'),
                (supabase.from('audit_committees' as any) as any)
                    .select('*').eq('academic_year', filterYear)
                    .eq('is_active', true).order('order_position'),
                (supabase.from('audit_evaluations' as any) as any)
                    .select('*').eq('academic_year', filterYear),
                (supabase.from('departments' as any) as any)
                    .select('id,name').eq('is_active', true),
                (supabase.from('app_users' as any) as any)
                    .select('id,full_name,username').eq('is_active', true),
            ]);
            if (evaleeRes.data) setEvaluatees(evaleeRes.data);
            if (comRes.data)   setCommittees(comRes.data);
            if (evRes.data)    setEvaluations(evRes.data);
            if (deptRes.data)  setDepartments(deptRes.data);
            if (usersRes.data) setAppUsers(usersRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    /** Fetch documents submitted by this evaluatee (matched by user_id) */
    const fetchEvalueeDocs = async (evaluatee: Evaluatee) => {
        setDocsLoading(true);
        setEvalueeDocs([]);
        try {
            if (!evaluatee.user_id) {
                // Try to match by name from app_users
                const matched = appUsers.find(u => u.full_name === evaluatee.name);
                if (!matched) { setDocsLoading(false); return; }

                const { data } = await (supabase.from('documents' as any) as any)
                    .select('id,title,file_url,file_name,file_type,file_size,document_type,status,created_at')
                    .eq('uploader_id', matched.id)
                    .order('created_at', { ascending: false });
                if (data) setEvalueeDocs(data as EvaluateeDoc[]);
            } else {
                const { data } = await (supabase.from('documents' as any) as any)
                    .select('id,title,file_url,file_name,file_type,file_size,document_type,status,created_at')
                    .eq('uploader_id', evaluatee.user_id)
                    .order('created_at', { ascending: false });
                if (data) setEvalueeDocs(data as EvaluateeDoc[]);
            }
        } catch (e) { console.error(e); }
        finally { setDocsLoading(false); }
    };

    const handleAddEvaluatee = async () => {
        if (!addForm.name) { toast({ title: 'กรุณากรอกชื่อ', variant: 'destructive' }); return; }
        const payload: any = { ...addForm };
        if (!payload.user_id) delete payload.user_id;
        await (supabase.from('audit_evaluatees' as any) as any).insert([payload]);
        toast({ title: 'เพิ่มผู้ถูกประเมินสำเร็จ' });
        setShowAddEval(false);
        fetchAll();
    };

    const handleDeleteEvaluatee = async (id: string) => {
        if (!confirm('ต้องการลบผู้ถูกประเมินนี้?')) return;
        await (supabase.from('audit_evaluatees' as any) as any).update({ is_active: false }).eq('id', id);
        toast({ title: 'ลบสำเร็จ' });
        fetchAll();
    };

    const openScoreDialog = async (eva: Evaluatee, committeeId: string) => {
        setSelectedEvaluatee(eva);
        setSelectedCommitteeId(committeeId);
        const existing = evaluations.find(e => e.evaluatee_id === eva.id && e.committee_id === committeeId);
        const initialScores: Record<string, number> = {};
        EVAL_ITEMS.forEach(item => { initialScores[item.key] = existing ? parseFloat(existing[item.key]) || 0 : 0; });
        setScoreForm(initialScores);
        setRemarksForm(existing?.remarks || '');
        setShowScoreDialog(true);
        // Fetch their documents in parallel
        await fetchEvalueeDocs(eva);
    };

    const handleSaveScore = async () => {
        if (!selectedEvaluatee || !selectedCommitteeId) return;
        const existing = evaluations.find(e =>
            e.evaluatee_id === selectedEvaluatee.id && e.committee_id === selectedCommitteeId
        );
        const payload = {
            evaluatee_id: selectedEvaluatee.id,
            committee_id: selectedCommitteeId,
            academic_year: filterYear,
            ...scoreForm,
            remarks: remarksForm,
            is_submitted: true,
            submitted_at: new Date().toISOString(),
        };
        try {
            if (existing) {
                await (supabase.from('audit_evaluations' as any) as any).update(payload).eq('id', existing.id);
            } else {
                await (supabase.from('audit_evaluations' as any) as any).insert([payload]);
            }
            toast({ title: 'บันทึกคะแนนสำเร็จ' });
            setShowScoreDialog(false);
            fetchAll();
        } catch (e) {
            toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    const itemGroups = EVAL_ITEMS.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof EVAL_ITEMS>);

    const totalCommitteeWeight = committees.reduce((s, c) => s + c.weight_percent, 0);
    const currentAvgScore = Object.values(scoreForm).reduce((s, v) => s + v, 0) / EVAL_ITEMS.length;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" /> ระบบประเมินครูพี่เลี้ยง/ลูกจ้าง
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        3 องค์ประกอบ 10 หัวข้อ • {committees.length} กรรมการ • น้ำหนักรวม {totalCommitteeWeight}%
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{['2568', '2567', '2566'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={() => setShowAddEval(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มผู้รับการประเมิน
                    </Button>
                </div>
            </div>

            {/* Committee summary */}
            {committees.length > 0 && (
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">กรรมการประเมิน {filterYear}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {committees.map(c => (
                                <div key={c.id} className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-sm">
                                    <span>{c.name}</span>
                                    <Badge variant="outline" className="text-xs ml-1">{c.weight_percent}%</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Evaluatee list */}
            {loading ? (
                <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
            ) : evaluatees.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground">ยังไม่มีผู้รับการประเมิน กดปุ่ม "เพิ่มผู้รับการประเมิน"</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {evaluatees.map(eva => {
                        const myEvals = evaluations.filter(e => e.evaluatee_id === eva.id);
                        const submittedCount = myEvals.filter(e => e.is_submitted).length;
                        const weightedScore = computeWeightedScore(myEvals, committees);
                        const grade = gradeLabel(weightedScore);
                        const isExpanded = expanded === eva.id;

                        return (
                            <Card key={eva.id} className="overflow-hidden">
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
                                    onClick={() => setExpanded(isExpanded ? null : eva.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                            <Star className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{eva.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {POSITION_TYPES[eva.position_type] || eva.position_type} • {eva.position}
                                                {(eva.departments as any)?.name && ` • ${(eva.departments as any).name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{submittedCount}/{committees.length} กรรมการ</p>
                                            {submittedCount > 0 && (
                                                <p className={`text-sm font-bold ${grade.color}`}>
                                                    {weightedScore.toFixed(1)} — {grade.grade}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                                onClick={() => handleDeleteEvaluatee(eva.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t px-4 pb-4">
                                        <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">คะแนนจากกรรมการ</p>
                                        <div className="space-y-2">
                                            {committees.map(c => {
                                                const ev = myEvals.find(e => e.committee_id === c.id);
                                                const submitted = ev?.is_submitted;
                                                const avgScore = submitted
                                                    ? EVAL_ITEMS.reduce((s, item) => s + (parseFloat(ev[item.key]) || 0), 0) / EVAL_ITEMS.length
                                                    : null;
                                                const g = avgScore !== null ? gradeLabel(avgScore) : null;
                                                return (
                                                    <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                                                        <div>
                                                            <span className="text-sm">{c.name}</span>
                                                            <Badge variant="outline" className="ml-2 text-xs">{c.weight_percent}%</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {submitted && g ? (
                                                                <span className={`text-sm font-medium ${g.color}`}>
                                                                    {(avgScore!).toFixed(1)} — {g.grade}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">ยังไม่กรอก</span>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant={submitted ? 'outline' : 'default'}
                                                                className="h-7 text-xs gap-1"
                                                                onClick={() => openScoreDialog(eva, c.id)}
                                                            >
                                                                <ClipboardEdit className="w-3 h-3" />
                                                                {submitted ? 'แก้ไข' : 'กรอกคะแนน'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {submittedCount > 0 && (
                                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <p className="text-sm font-semibold text-yellow-800">
                                                    ผลรวมถ่วงน้ำหนัก:{' '}
                                                    <span className={gradeLabel(weightedScore).color}>
                                                        {weightedScore.toFixed(2)} คะแนน — {gradeLabel(weightedScore).grade}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-yellow-600">
                                                    {submittedCount} จาก {committees.length} กรรมการกรอกแล้ว
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ===== Add Evaluatee Dialog ===== */}
            <Dialog open={showAddEval} onOpenChange={setShowAddEval}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>เพิ่มผู้รับการประเมิน</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        {/* Link to app_user */}
                        <div>
                            <Label>บัญชีผู้ใช้ในระบบ (ถ้ามี)</Label>
                            <Select
                                value={addForm.user_id}
                                onValueChange={v => {
                                    const u = appUsers.find(u => u.id === v);
                                    setAddForm(p => ({ ...p, user_id: v, name: u?.full_name || p.name }));
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="เลือกผู้ใช้จากระบบ (ไม่บังคับ)" /></SelectTrigger>
                                <SelectContent>
                                    {appUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.full_name} ({u.username})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                เลือกเพื่อระบบดึงเอกสารที่บุคคลนั้นอัปโหลดมาแสดงให้กรรมการดูก่อนประเมิน
                            </p>
                        </div>
                        <div>
                            <Label>ชื่อ-สกุล *</Label>
                            <Input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>ประเภท</Label>
                                <Select value={addForm.position_type} onValueChange={v => setAddForm(p => ({ ...p, position_type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(POSITION_TYPES).map(([k, v]) =>
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>ตำแหน่ง</Label>
                                <Input value={addForm.position} onChange={e => setAddForm(p => ({ ...p, position: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>ฝ่ายงาน</Label>
                                <Select value={addForm.department_id} onValueChange={v => setAddForm(p => ({ ...p, department_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="เลือกฝ่าย" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>ปีการศึกษา</Label>
                                <Select value={addForm.academic_year} onValueChange={v => setAddForm(p => ({ ...p, academic_year: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{['2568', '2567', '2566'].map(y =>
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    )}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddEval(false)}>ยกเลิก</Button>
                        <Button onClick={handleAddEvaluatee}>เพิ่ม</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Score Input Dialog (with Documents Panel) ===== */}
            <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
                <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base">กรอกคะแนนประเมิน</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {selectedEvaluatee?.name} • {committees.find(c => c.id === selectedCommitteeId)?.name}
                        </p>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* ---- Left: Evaluatee Documents ---- */}
                        <div className="lg:border-r lg:pr-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-800">เอกสารหลักฐานของผู้รับการประเมิน</h3>
                            </div>

                            {docsLoading ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    กำลังโหลดเอกสาร...
                                </div>
                            ) : evalueeDocs.length === 0 ? (
                                <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm text-muted-foreground">ยังไม่มีเอกสาร</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ผู้รับการประเมินต้องอัปโหลดเอกสารผ่าน Portal ก่อน
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {evalueeDocs.map(doc => (
                                        <div key={doc.id}
                                            className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 leading-tight">{doc.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                                                    {doc.file_size ? ` • ${formatBytes(doc.file_size)}` : ''}
                                                    {` • ${formatDate(doc.created_at)}`}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                                                        ${doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                          doc.status === 'draft'    ? 'bg-yellow-100 text-yellow-700' :
                                                                                      'bg-blue-100 text-blue-700'}`}>
                                                        {doc.status === 'approved' ? 'อนุมัติแล้ว' :
                                                         doc.status === 'draft'    ? 'รออนุมัติ' : doc.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {doc.file_url && (
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors flex-shrink-0"
                                                    title="เปิดเอกสาร"
                                                    onClick={e => e.stopPropagation()}>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-700">
                                    💡 คลิก <ExternalLink className="w-3 h-3 inline" /> เพื่อเปิดอ่านเอกสาร ก่อนให้คะแนนประเมิน
                                </p>
                            </div>
                        </div>

                        {/* ---- Right: Score Form ---- */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <ClipboardEdit className="w-4 h-4 text-yellow-600" />
                                <h3 className="text-sm font-semibold text-gray-800">แบบกรอกคะแนน (0–100)</h3>
                            </div>
                            {Object.entries(itemGroups).map(([groupName, items]) => (
                                <div key={groupName}>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1 border-b">
                                        {groupName}
                                    </h4>
                                    <div className="space-y-2">
                                        {items.map(item => (
                                            <div key={item.key}
                                                className="flex items-center justify-between gap-3 p-2 bg-muted/30 rounded-lg">
                                                <label className="text-xs flex-1 leading-tight">{item.label}</label>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <Input
                                                        type="number" min="0" max="100" step="0.5"
                                                        value={scoreForm[item.key] || 0}
                                                        onChange={e => setScoreForm(p => ({
                                                            ...p, [item.key]: parseFloat(e.target.value) || 0
                                                        }))}
                                                        className="w-18 text-center h-8 text-sm"
                                                    />
                                                    <span className="text-xs text-muted-foreground w-8">/100</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div>
                                <Label className="text-xs">ข้อเสนอแนะ</Label>
                                <Textarea
                                    value={remarksForm}
                                    onChange={e => setRemarksForm(e.target.value)}
                                    rows={2}
                                    placeholder="ข้อเสนอแนะ/ความเห็นของกรรมการ"
                                    className="text-sm"
                                />
                            </div>

                            {/* Score summary */}
                            <div className={`p-3 rounded-lg border ${
                                currentAvgScore >= 80 ? 'bg-green-50 border-green-200' :
                                currentAvgScore >= 60 ? 'bg-blue-50 border-blue-200' :
                                'bg-orange-50 border-orange-200'
                            }`}>
                                <p className="text-sm font-semibold">
                                    คะแนนเฉลี่ยครั้งนี้:{' '}
                                    <span className={gradeLabel(currentAvgScore).color}>
                                        {currentAvgScore.toFixed(2)} — {gradeLabel(currentAvgScore).grade}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setShowScoreDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSaveScore}>บันทึกคะแนน</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
