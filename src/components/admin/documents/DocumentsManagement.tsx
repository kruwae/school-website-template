import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Download, Trash2, Eye, Edit2, Lock } from 'lucide-react';
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
    uploader_user_id: string | null;
    description: string;
    created_at: string;
    departments?: { name: string; color: string };
    document_categories?: { name: string };
}

interface Department { id: string; name: string; code: string; color: string; }
interface Category { id: string; name: string; department_id: string; }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft:    { label: 'ร่าง',     variant: 'secondary' },
    submitted:{ label: 'ส่งแล้ว',  variant: 'default' },
    approved: { label: 'อนุมัติ',  variant: 'default' },
    rejected: { label: 'ปฏิเสธ',   variant: 'destructive' },
    archived: { label: 'เก็บถาวร', variant: 'outline' },
};

export const DocumentsManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const currentUserName = currentUser?.full_name || '';

    /** หัวหน้า/ผู้บริหารเห็นทั้งหมด, สมาชิกทั่วไปเห็นเฉพาะเอกสารของตน */
    const canSeeAllDocuments = currentUser
        ? ['admin', 'director', 'deputy_director', 'dept_head'].includes(currentUser.role)
        : false;

    /** เฉพาะ role = admin เท่านั้นที่มีสิทธิ์เต็ม (เพิ่ม/แก้ไข/ลบ) */
    const isAdmin = currentUser?.role === 'admin';

    const [documents, setDocuments] = useState<Document[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Dialog สำหรับ admin (เพิ่ม/แก้ไข)
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editDoc, setEditDoc] = useState<Document | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', department_id: '', category_id: '', academic_year: '2568',
        status: 'draft', file_url: '', file_name: '', uploader_name: currentUserName, description: '',
    });

    // Dialog สำหรับดูรายละเอียด (ทุก role)
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewDoc, setViewDoc] = useState<Document | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [docsRes, deptsRes, catsRes] = await Promise.all([
                (supabase.from('documents' as any) as any)
                    .select('*, departments(name,color), document_categories(name)')
                    .order('created_at', { ascending: false }),
                (supabase.from('departments' as any) as any)
                    .select('*').eq('is_active', true).order('order_position'),
                (supabase.from('document_categories' as any) as any)
                    .select('*').order('order_position'),
            ]);
            if (docsRes.data) setDocuments(docsRes.data as Document[]);
            if (deptsRes.data) setDepartments(deptsRes.data as Department[]);
            if (catsRes.data) setCategories(catsRes.data as Category[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const visibleDocuments = useMemo(() => {
        if (canSeeAllDocuments) {
            return documents;
        }
        if (!currentUser) {
            return [];
        }
        return documents.filter((doc) => doc.uploader_user_id === currentUser.id);
    }, [canSeeAllDocuments, currentUser, documents]);

    const filteredDocs = visibleDocuments.filter(d => {
        const matchSearch = !search
            || d.title.toLowerCase().includes(search.toLowerCase())
            || d.uploader_name?.toLowerCase().includes(search.toLowerCase());
        const matchDept   = filterDept   === 'all' || d.department_id === filterDept;
        const matchYear   = filterYear   === 'all' || d.academic_year === filterYear;
        const matchStatus = filterStatus === 'all' || d.status === filterStatus;
        return matchSearch && matchDept && matchYear && matchStatus;
    });

    // ─── Admin actions ────────────────────────────────────────────────
    const openAdd = () => {
        if (!isAdmin) return;
        setEditDoc(null);
        setForm({ title: '', department_id: '', category_id: '', academic_year: '2568', status: 'draft', file_url: '', file_name: '', uploader_name: currentUserName, description: '' });
        setShowEditDialog(true);
    };

    const openEdit = (doc: Document) => {
        if (!isAdmin) return;
        setEditDoc(doc);
        setForm({
            title: doc.title, department_id: doc.department_id || '',
            category_id: doc.category_id || '', academic_year: doc.academic_year || '2568',
            status: doc.status, file_url: doc.file_url || '', file_name: doc.file_name || '',
            uploader_name: doc.uploader_name || '', description: doc.description || '',
        });
        setShowEditDialog(true);
    };

    const handleFileUploaded = (result: FileUploadResult) => {
        setForm(p => ({ ...p, file_url: result.url, file_name: result.name }));
    };

    const handleSave = async () => {
        if (!isAdmin) return;
        if (!form.title) { toast({ title: 'กรุณากรอกชื่อเอกสาร', variant: 'destructive' }); return; }
        const payload: any = {
            ...form,
            uploader_user_id: editDoc
                ? (editDoc as any).uploader_user_id
                : (currentUser?.id || null),
        };
        setSaving(true);
        try {
            let result;
            if (editDoc) {
                result = await (supabase.from('documents' as any) as any).update(payload).eq('id', editDoc.id);
            } else {
                result = await (supabase.from('documents' as any) as any).insert([payload]);
            }
            if (result.error) {
                toast({ title: 'บันทึกไม่สำเร็จ', description: result.error.message, variant: 'destructive' });
                return;
            }
            toast({ title: editDoc ? 'อัปเดตเอกสารสำเร็จ ✅' : 'เพิ่มเอกสารสำเร็จ ✅' });
            setShowEditDialog(false);
            fetchAll();
        } catch (e: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: e?.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (doc: Document) => {
        if (!isAdmin) return;
        if (!confirm(`ต้องการลบเอกสาร "${doc.title}"?`)) return;
        const { error } = await (supabase.from('documents' as any) as any).delete().eq('id', doc.id);
        if (error) { toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'ลบเอกสารสำเร็จ' });
        fetchAll();
    };

    // ─── View-only action (ทุก role) ─────────────────────────────────
    const openView = (doc: Document) => {
        setViewDoc(doc);
        setShowViewDialog(true);
    };

    const filteredCategories = categories.filter(c => !form.department_id || c.department_id === form.department_id);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" /> คลังเอกสารทั้งหมด
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {isAdmin || canSeeAllDocuments
                            ? 'จัดการเอกสารของทุกฝ่ายงาน'
                            : 'ดูและดาวน์โหลดเฉพาะเอกสารของคุณ'}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={openAdd} className="gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มเอกสาร
                    </Button>
                )}
            </div>

            {/* Permission Banner */}
            {!canSeeAllDocuments && (
                <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span>คุณมีสิทธิ์ <strong>ดูและดาวน์โหลด</strong>เฉพาะเอกสารของตัวเอง การแก้ไขหรือลบสงวนไว้สำหรับผู้ดูแลระบบ</span>
                </div>
            )}

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

            {/* Document Table */}
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
                                        {['ชื่อเอกสาร', 'ฝ่าย', 'หมวดหมู่', 'ปีการศึกษา', 'ผู้อัปโหลด', 'สถานะ', 'จัดการ'].map(h => (
                                            <th key={h} className="text-left p-3 text-sm font-medium text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map((doc, i) => (
                                        <tr key={doc.id} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                    <span className="font-medium text-sm">{doc.title}</span>
                                                </div>
                                                {doc.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 ml-6 truncate max-w-xs">{doc.description}</p>
                                                )}
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
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-blue-600" title="ดูรายละเอียด"
                                                        onClick={() => openView(doc)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>

                                                    {doc.file_url && (
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-7 w-7 text-green-600" title="ดาวน์โหลด"
                                                            onClick={() => window.open(doc.file_url, '_blank')}
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}

                                                    {isAdmin && (
                                                        <>
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                className="h-7 w-7" title="แก้ไข"
                                                                onClick={() => openEdit(doc)}
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                className="h-7 w-7 text-destructive" title="ลบ"
                                                                onClick={() => handleDelete(doc)}
                                                            >
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

            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            รายละเอียดเอกสาร
                        </DialogTitle>
                    </DialogHeader>
                    {viewDoc && (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground col-span-1">ชื่อเอกสาร</span>
                                <span className="font-medium col-span-2">{viewDoc.title}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">ฝ่ายงาน</span>
                                <span className="col-span-2">{(viewDoc.departments as any)?.name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">หมวดหมู่</span>
                                <span className="col-span-2">{(viewDoc.document_categories as any)?.name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">ปีการศึกษา</span>
                                <span className="col-span-2">{viewDoc.academic_year}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">ผู้อัปโหลด</span>
                                <span className="col-span-2">{viewDoc.uploader_name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">สถานะ</span>
                                <span className="col-span-2">
                                    <Badge variant={STATUS_MAP[viewDoc.status]?.variant || 'secondary'}>
                                        {STATUS_MAP[viewDoc.status]?.label || viewDoc.status}
                                    </Badge>
                                </span>
                            </div>
                            {viewDoc.description && (
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-muted-foreground">หมายเหตุ</span>
                                    <span className="col-span-2">{viewDoc.description}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">วันที่อัปโหลด</span>
                                <span className="col-span-2">
                                    {new Date(viewDoc.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>ปิด</Button>
                        {viewDoc?.file_url && (
                            <Button onClick={() => window.open(viewDoc.file_url, '_blank')} className="gap-2">
                                <Download className="w-4 h-4" /> ดาวน์โหลด
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isAdmin && (
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
                                    <p className="text-xs text-green-600 mt-1">✅ ใช้ชื่อจากบัญชีที่ login</p>
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
                                    canRemoveFile={true}
                                />
                            </div>
                            <div>
                                <Label>หมายเหตุ</Label>
                                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม" rows={2} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>ยกเลิก</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'กำลังบันทึก...' : editDoc ? 'บันทึก' : 'เพิ่ม'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};