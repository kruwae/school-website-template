import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Download, Trash2, Eye } from 'lucide-react';
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
    file_type: string;
    uploader_name: string;
    description: string;
    created_at: string;
    departments?: { name: string; color: string };
    document_categories?: { name: string };
}

interface Department { id: string; name: string; code: string; color: string; }
interface Category { id: string; name: string; department_id: string; }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'ร่าง', variant: 'secondary' },
    submitted: { label: 'ส่งแล้ว', variant: 'default' },
    approved: { label: 'อนุมัติ', variant: 'default' },
    rejected: { label: 'ปฏิเสธ', variant: 'destructive' },
    archived: { label: 'เก็บถาวร', variant: 'outline' },
};

export const DocumentsManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const currentUserName = currentUser?.full_name || '';

    const [documents, setDocuments] = useState<Document[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showDialog, setShowDialog] = useState(false);
    const [editDoc, setEditDoc] = useState<Document | null>(null);
    const [form, setForm] = useState({
        title: '', department_id: '', category_id: '', academic_year: '2568',
        status: 'draft', file_url: '', file_name: '', uploader_name: currentUserName, description: '',
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [docsRes, deptsRes, catsRes] = await Promise.all([
                supabase.from('documents' as any).select('*, departments(name,color), document_categories(name)').order('created_at', { ascending: false }),
                supabase.from('departments' as any).select('*').eq('is_active', true).order('order_position'),
                supabase.from('document_categories' as any).select('*').order('order_position'),
            ]);
            if (docsRes.data) setDocuments(docsRes.data as Document[]);
            if (deptsRes.data) setDepartments(deptsRes.data as Department[]);
            if (catsRes.data) setCategories(catsRes.data as Category[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredDocs = documents.filter(d => {
        const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.uploader_name?.toLowerCase().includes(search.toLowerCase());
        const matchDept = filterDept === 'all' || d.department_id === filterDept;
        const matchYear = filterYear === 'all' || d.academic_year === filterYear;
        const matchStatus = filterStatus === 'all' || d.status === filterStatus;
        return matchSearch && matchDept && matchYear && matchStatus;
    });

    const openAdd = () => {
        setEditDoc(null);
        // auto-fill ผู้อัปโหลดจาก session
        setForm({ title: '', department_id: '', category_id: '', academic_year: '2568', status: 'draft', file_url: '', file_name: '', uploader_name: currentUserName, description: '' });
        setShowDialog(true);
    };

    const handleFileUploaded = (result: FileUploadResult) => {
        setForm(p => ({
            ...p,
            file_url: result.url,
            file_name: result.name,
        }));
    };

    const openEdit = (doc: Document) => {
        setEditDoc(doc);
        setForm({ title: doc.title, department_id: doc.department_id || '', category_id: doc.category_id || '', academic_year: doc.academic_year || '2568', status: doc.status, file_url: doc.file_url || '', file_name: doc.file_name || '', uploader_name: doc.uploader_name || '', description: doc.description || '' });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.title) { toast({ title: 'กรุณากรอกชื่อเอกสาร', variant: 'destructive' }); return; }
        try {
            if (editDoc) {
                await (supabase.from('documents' as any) as any).update(form).eq('id', editDoc.id);
                toast({ title: 'อัปเดตเอกสารสำเร็จ' });
            } else {
                await (supabase.from('documents' as any) as any).insert([form]);
                toast({ title: 'เพิ่มเอกสารสำเร็จ' });
            }
            setShowDialog(false);
            fetchAll();
        } catch (e) { toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' }); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบเอกสารนี้?')) return;
        try {
            await (supabase.from('documents' as any) as any).delete().eq('id', id);
            toast({ title: 'ลบเอกสารสำเร็จ' });
            fetchAll();
        } catch (e) { toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' }); }
    };

    const filteredCategories = categories.filter(c => !form.department_id || c.department_id === form.department_id);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">คลังเอกสารทั้งหมด</h1>
                    <p className="text-muted-foreground text-sm">จัดการเอกสารของทุกฝ่ายงาน</p>
                </div>
                <Button onClick={openAdd} className="gap-2">
                    <Plus className="w-4 h-4" /> เพิ่มเอกสาร
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="ค้นหาเอกสาร..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Select value={filterDept} onValueChange={setFilterDept}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="ทุกฝ่าย" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกฝ่าย</SelectItem>
                                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="w-32"><SelectValue placeholder="ปีการศึกษา" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกปี</SelectItem>
                                {['2568', '2567', '2566', '2565'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-32"><SelectValue placeholder="สถานะ" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกสถานะ</SelectItem>
                                {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">{filteredDocs.length} รายการ</span>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">กำลังโหลด...</div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">ยังไม่มีเอกสาร</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ชื่อเอกสาร</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ฝ่าย</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">หมวดหมู่</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ปีการศึกษา</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ผู้อัปโหลด</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">สถานะ</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map((doc, i) => (
                                        <tr key={doc.id} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-medium text-sm">{doc.title}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">{(doc.departments as any)?.name || '-'}</td>
                                            <td className="p-3 text-sm text-muted-foreground">{(doc.document_categories as any)?.name || '-'}</td>
                                            <td className="p-3 text-sm">{doc.academic_year}</td>
                                            <td className="p-3 text-sm text-muted-foreground">{doc.uploader_name || '-'}</td>
                                            <td className="p-3">
                                                <Badge variant={STATUS_MAP[doc.status]?.variant || 'secondary'}>
                                                    {STATUS_MAP[doc.status]?.label || doc.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    {doc.file_url && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(doc.file_url, '_blank')}>
                                                            <Download className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}>
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)}>
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

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editDoc ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>ชื่อเอกสาร *</Label>
                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="ชื่อเอกสาร" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>ฝ่ายงาน</Label>
                                <Select value={form.department_id} onValueChange={v => setForm(p => ({ ...p, department_id: v, category_id: '' }))}>
                                    <SelectTrigger><SelectValue placeholder="เลือกฝ่าย" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>หมวดหมู่</Label>
                                <Select value={form.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="เลือกหมวด" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>ปีการศึกษา</Label>
                                <Select value={form.academic_year} onValueChange={v => setForm(p => ({ ...p, academic_year: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['2568', '2567', '2566', '2565'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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
                            />
                        </div>
                        <div>
                            <Label>หมายเหตุ</Label>
                            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม" rows={2} />
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
