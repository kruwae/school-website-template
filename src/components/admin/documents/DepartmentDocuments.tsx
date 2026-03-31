import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download, Trash2, FolderOpen, Users, Lock } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileUpload, type FileUploadResult } from '@/components/admin/shared/FileUpload';
import { getCurrentUser } from '@/lib/auth';

interface Document {
    id: string;
    title: string;
    department_id: string;
    category_id: string;
    academic_year: string;
    status: string;
    file_url: string;
    file_name: string;
    uploader_name: string;
    uploader_user_id: string | null;
    description: string;
    created_at: string;
    document_categories?: { name: string };
}
interface Category { id: string; name: string; department_id: string; }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'ร่าง', variant: 'secondary' },
    submitted: { label: 'ส่งแล้ว', variant: 'default' },
    approved: { label: 'อนุมัติ', variant: 'default' },
    rejected: { label: 'ปฏิเสธ', variant: 'destructive' },
    archived: { label: 'เก็บถาวร', variant: 'outline' },
};

interface Props {
    deptCode: string;
    deptName: string;
    color: string;
}

export const DepartmentDocuments = ({ deptCode, deptName, color }: Props) => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const currentUserName = currentUser?.full_name || '';

    const canSeeAllDocuments = currentUser
        ? ['admin', 'director', 'deputy_director', 'dept_head'].includes(currentUser.role)
        : false;

    /** เจ้าของไฟล์หรือ admin เท่านั้นที่ลบได้ */
    const canDelete = (doc: Document): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        return doc.uploader_user_id === currentUser.id;
    };

    const [documents, setDocuments] = useState<Document[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [deptId, setDeptId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState('all');
    const [filterYear, setFilterYear] = useState('2568');
    const [showDialog, setShowDialog] = useState(false);
    const [editDoc, setEditDoc] = useState<Document | null>(null);
    const [form, setForm] = useState({
        title: '', category_id: '', academic_year: '2568',
        status: 'submitted', file_url: '', file_name: '', uploader_name: currentUserName, description: '',
    });

    useEffect(() => { fetchDeptAndDocs(); }, [deptCode, filterYear, filterCat]);

    const fetchDeptAndDocs = async () => {
        setLoading(true);
        try {
            const { data: deptData } = await (supabase.from('departments' as any) as any)
                .select('id').eq('code', deptCode).single();
            if (!deptData) return;
            const id = deptData.id;
            setDeptId(id);

            let docsQuery = (supabase.from('documents' as any) as any)
                .select('*, document_categories(name)')
                .eq('department_id', id)
                .order('created_at', { ascending: false });

            const [docsRes, catsRes] = await Promise.all([
                docsQuery,
                (supabase.from('document_categories' as any) as any)
                    .select('*').eq('department_id', id).order('order_position'),
            ]);

            let docs = docsRes.data || [];

            if (!canSeeAllDocuments) {
                docs = docs.filter((d: Document) => d.uploader_user_id === currentUser?.id);
            }

            setDocuments(docs);
            if (catsRes.data) setCategories(catsRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = useMemo(() => {
        return documents.filter(d => {
            const matchCat = filterCat === 'all' || d.category_id === filterCat;
            const matchYear = d.academic_year === filterYear || filterYear === 'all';
            return matchCat && matchYear;
        });
    }, [documents, filterCat, filterYear]);

    const openAdd = () => {
        setEditDoc(null);
        setForm({ title: '', category_id: '', academic_year: '2568', status: 'submitted', file_url: '', file_name: '', uploader_name: currentUserName, description: '' });
        setShowDialog(true);
    };

    const handleFileUploaded = (result: FileUploadResult) => {
        setForm(p => ({ ...p, file_url: result.url, file_name: result.name }));
    };

    const handleSave = async () => {
        if (!form.title) { toast({ title: 'กรุณากรอกชื่อเอกสาร', variant: 'destructive' }); return; }
        const payload: any = {
            ...form,
            department_id: deptId,
            uploader_user_id: editDoc ? editDoc.uploader_user_id : (currentUser?.id || null),
        };
        try {
            if (editDoc) {
                const { error } = await (supabase.from('documents' as any) as any)
                    .update(payload).eq('id', editDoc.id);
                if (error) throw error;
                toast({ title: 'อัปเดตสำเร็จ' });
            } else {
                const { error } = await (supabase.from('documents' as any) as any)
                    .insert([payload]);
                if (error) throw error;
                toast({ title: 'เพิ่มเอกสารสำเร็จ' });
            }
            setShowDialog(false);
            fetchDeptAndDocs();
        } catch (e: any) {
            console.error('[handleSave] error:', e);
            toast({ title: 'เกิดข้อผิดพลาด', description: e?.message || 'ไม่สามารถบันทึกได้', variant: 'destructive' });
        }
    };

    const handleDelete = async (doc: Document) => {
        if (!canDelete(doc)) {
            toast({ title: 'ไม่มีสิทธิ์ลบเอกสารนี้', description: 'เฉพาะเจ้าของไฟล์หรือ admin เท่านั้น', variant: 'destructive' });
            return;
        }
        if (!confirm('ต้องการลบเอกสารนี้?')) return;
        await (supabase.from('documents' as any) as any).delete().eq('id', doc.id);
        toast({ title: 'ลบสำเร็จ' });
        fetchDeptAndDocs();
    };

    const byCategory: Record<string, Document[]> = {};
    filtered.forEach(d => {
        const cat = (d.document_categories as any)?.name || 'ไม่ระบุหมวด';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(d);
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                        <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{deptName}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-muted-foreground">เอกสารและรายงาน</p>
                            {currentUser?.role === 'dept_head' && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                    <Users className="w-3 h-3" />
                                    กลุ่มงานของฉัน
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Button onClick={openAdd} className="gap-2">
                    <Plus className="w-4 h-4" /> เพิ่มเอกสาร
                </Button>
            </div>

            {!canSeeAllDocuments && (
                <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span>คุณเห็นเฉพาะเอกสารของคุณในฝ่ายนี้เท่านั้น</span>
                </div>
            )}

            <div className="flex gap-3 mb-6">
                <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="ทุกหมวด" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกหมวด</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทุกปี</SelectItem>
                        {['2568', '2567', '2566', '2565'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground self-center">{filtered.length} รายการ</span>
            </div>

            {loading ? (
                <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
            ) : Object.keys(byCategory).length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground">ยังไม่มีเอกสาร กดปุ่ม "เพิ่มเอกสาร" เพื่อเริ่มต้น</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(byCategory).map(([catName, docs]) => (
                        <Card key={catName}>
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${color}`} />
                                    {catName} ({docs.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="space-y-2">
                                    {docs.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.title}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.uploader_name || '-'} • {doc.academic_year}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge variant={STATUS_MAP[doc.status]?.variant || 'secondary'} className="text-xs">
                                                    {STATUS_MAP[doc.status]?.label || doc.status}
                                                </Badge>
                                                {doc.file_url && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="ดาวน์โหลด" onClick={() => window.open(doc.file_url, '_blank')}>
                                                        <Download className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete(doc) && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="ลบ" onClick={() => handleDelete(doc)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editDoc ? 'แก้ไขเอกสาร' : `เพิ่มเอกสาร — ${deptName}`}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>ชื่อเอกสาร *</Label>
                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="ชื่อเอกสาร" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>หมวดหมู่</Label>
                                <Select value={form.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>ปีการศึกษา</Label>
                                <Select value={form.academic_year} onValueChange={v => setForm(p => ({ ...p, academic_year: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['2568', '2567', '2566', '2565'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>ผู้อัปโหลด</Label>
                            <Input
                                value={form.uploader_name}
                                readOnly={!editDoc}
                                onChange={e => setForm(p => ({ ...p, uploader_name: e.target.value }))}
                                placeholder="ชื่อผู้อัปโหลด"
                                className={!editDoc ? 'bg-muted cursor-not-allowed' : ''}
                            />
                            {!editDoc && currentUserName && (
                                <p className="text-xs text-muted-foreground mt-1">✅ ใช้ชื่อจากบัญชีที่ login</p>
                            )}
                        </div>
                        <div>
                            <Label>ไฟล์เอกสาร</Label>
                            <FileUpload
                                onUploadComplete={handleFileUploaded}
                                currentFile={form.file_url ? { url: form.file_url, name: form.file_name || 'ไฟล์เอกสาร' } : undefined}
                                bucket="school-images"
                                folder="documents"
                                maxSizeMB={20}
                                canRemoveFile={!editDoc || canDelete(editDoc)}
                            />
                        </div>
                        <div>
                            <Label>สถานะ</Label>
                            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>หมายเหตุ</Label>
                            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>{editDoc ? 'บันทึก' : 'เพิ่ม'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};