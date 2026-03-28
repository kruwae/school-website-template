import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, logout, type AppUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Upload, FileText, LogOut, User, Clock, CheckCircle2,
    Download, Trash2, AlertCircle, File, FilePlus, School,
    Loader2, ClipboardCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedDoc {
    id: string;
    title: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    status: string;
    created_at: string;
    document_type: string;
}

const DOC_TYPES = [
    { value: 'self_evaluation', label: 'แบบประเมินตนเอง' },
    { value: 'teaching_plan', label: 'แผนการจัดการเรียนรู้' },
    { value: 'work_evidence', label: 'หลักฐานการปฏิบัติงาน' },
    { value: 'other', label: 'เอกสารอื่นๆ' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700' },
    submitted: { label: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-700' },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'ส่งคืน', color: 'bg-red-100 text-red-700' },
};

const ROLE_LABEL: Record<string, string> = {
    assistant: 'ครูพี่เลี้ยง',
    temp_employee: 'ครูอัตราจ้าง',
    teacher: 'ครูผู้สอน',
    support_staff: 'บุคลากรสนับสนุน',
};

function formatBytes(bytes: number) {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

interface EvalStatus {
    totalCommittees: number;   // จำนวนกรรมการทั้งหมด
    submittedCount:  number;   // กรรมการที่กรอกแล้ว
    statusLoading:   boolean;
}

const EvaluateePortal = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<AppUser | null>(null);
    const [docs, setDocs] = useState<UploadedDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [docType, setDocType] = useState('self_evaluation');
    const [docTitle, setDocTitle] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [evalStatus, setEvalStatus] = useState<EvalStatus>({
        totalCommittees: 0, submittedCount: 0, statusLoading: true,
    });

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) { navigate('/admin'); return; }
        setUser(u);
        fetchMyDocs(u);
        fetchEvalStatus(u);
    }, [navigate]);

    /** ดึงสถานะการประเมิน (ไม่แสดงคะแนน — แค่บอกว่ากี่คนกรอกแล้ว) */
    const fetchEvalStatus = async (u: AppUser) => {
        setEvalStatus(s => ({ ...s, statusLoading: true }));
        try {
            // 1. หา evaluatee record ของ user นี้
            let evaluateeId: string | null = null;

            const { data: byUserId } = await (supabase.from('audit_evaluatees' as any) as any)
                .select('id')
                .eq('user_id', u.id)
                .eq('is_active', true)
                .limit(1);
            evaluateeId = byUserId?.[0]?.id ?? null;

            if (!evaluateeId) {
                // fallback: match ชื่อ
                const { data: byName } = await (supabase.from('audit_evaluatees' as any) as any)
                    .select('id')
                    .eq('name', u.full_name)
                    .eq('is_active', true)
                    .limit(1);
                evaluateeId = byName?.[0]?.id ?? null;
            }

            // 2. นับจำนวนกรรมการทั้งหมด (ปีปัจจุบัน)
            const { data: committees } = await (supabase.from('audit_committees' as any) as any)
                .select('id')
                .eq('academic_year', '2568')
                .eq('is_active', true);
            const totalCommittees = committees?.length ?? 0;

            // 3. นับว่ากรรมการกรอกไปแล้วกี่คน
            let submittedCount = 0;
            if (evaluateeId && totalCommittees > 0) {
                const { data: evals } = await (supabase.from('audit_evaluations' as any) as any)
                    .select('id')
                    .eq('evaluatee_id', evaluateeId)
                    .eq('is_submitted', true)
                    .eq('academic_year', '2568');
                submittedCount = evals?.length ?? 0;
            }

            setEvalStatus({ totalCommittees, submittedCount, statusLoading: false });
        } catch (e) {
            console.error('[fetchEvalStatus]', e);
            setEvalStatus(s => ({ ...s, statusLoading: false }));
        }
    };

    const fetchMyDocs = async (u: AppUser) => {
        setLoading(true);
        try {
            const { data } = await (supabase.from('documents' as any) as any)
                .select('id, title, file_url, file_name, file_type, file_size, status, created_at, document_type')
                .eq('uploader_user_id', u.id)
                .order('created_at', { ascending: false });
            if (data) setDocs(data as UploadedDoc[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        if (!user) return;
        if (!docTitle.trim()) {
            toast({ title: 'กรุณากรอกชื่อเอกสาร', variant: 'destructive' });
            return;
        }

        const maxSizeMB = 20;
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast({ title: `ไฟล์ใหญ่เกิน ${maxSizeMB}MB`, variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Upload to school-images bucket under evaluatee-docs folder
            const ext = file.name.split('.').pop();
            const fileName = `evaluatee-docs/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

            const { data: storageData, error: storageError } = await supabase.storage
                .from('school-images')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (storageError) throw storageError;
            setUploadProgress(70);

            const { data: { publicUrl } } = supabase.storage
                .from('school-images')
                .getPublicUrl(storageData.path);

            // Save document record
            const { error: dbError } = await (supabase.from('documents' as any) as any).insert([{
                title: docTitle.trim(),
                document_type: docType,
                file_url: publicUrl,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                uploader_id: user.id,        // TEXT column (legacy)
                uploader_user_id: user.id,   // UUID FK column (ROLE_PERMISSIONS_SETUP.sql)
                uploader_name: user.full_name,
                status: 'draft',
                academic_year: '2568',
            }]);

            if (dbError) throw dbError;
            setUploadProgress(100);

            toast({ title: 'อัปโหลดสำเร็จ', description: `"${docTitle}" บันทึกเรียบร้อยแล้ว` });
            setDocTitle('');
            fetchMyDocs(user);
        } catch (err: any) {
            console.error(err);
            toast({ title: 'อัปโหลดล้มเหลว', description: err.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (doc: UploadedDoc) => {
        if (!confirm(`ต้องการลบเอกสาร "${doc.title}" หรือไม่?`)) return;
        try {
            // Extract storage path from URL
            if (doc.file_url) {
                const urlParts = doc.file_url.split('/school-images/');
                if (urlParts[1]) {
                    await supabase.storage.from('school-images').remove([urlParts[1]]);
                }
            }
            await (supabase.from('documents' as any) as any).delete().eq('id', doc.id);
            toast({ title: 'ลบเอกสารสำเร็จ' });
            if (user) fetchMyDocs(user);
        } catch (err: any) {
            toast({ title: 'ลบไม่สำเร็จ', description: err.message, variant: 'destructive' });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    if (!user) return null;

    const approvedCount = docs.filter(d => d.status === 'approved').length;
    const pendingCount = docs.filter(d => d.status === 'draft' || d.status === 'submitted').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                            <School className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-gray-900">SodFlow Portal</h1>
                            <p className="text-xs text-gray-500">โรงเรียนโสตศึกษาจังหวัดสงขลา</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1.5">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">{user.full_name}</span>
                            <span className="text-xs text-blue-500">({ROLE_LABEL[user.role] || user.role})</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs h-8">
                            <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {/* Welcome */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <span className="text-2xl font-bold text-white">
                                {user.full_name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">สวัสดี คุณ{user.full_name}</h2>
                            <p className="text-gray-500 text-sm mt-0.5">
                                {ROLE_LABEL[user.role] || user.role} • ปีการศึกษา 2568
                            </p>
                            <div className="flex gap-3 mt-2">
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    ✅ อนุมัติแล้ว {approvedCount} ไฟล์
                                </span>
                                <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                    ⏳ รออนุมัติ {pendingCount} ไฟล์
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== สถานะการประเมิน ===== */}
                {(() => {
                    const { totalCommittees, submittedCount, statusLoading } = evalStatus;
                    const allDone = totalCommittees > 0 && submittedCount >= totalCommittees;
                    const inProgress = submittedCount > 0 && !allDone;
                    const notStarted = submittedCount === 0;

                    return (
                        <div className={`rounded-2xl p-5 border shadow-sm ${
                            allDone   ? 'bg-green-50  border-green-200' :
                            inProgress ? 'bg-blue-50   border-blue-200' :
                                         'bg-slate-50  border-slate-200'
                        }`}>
                            <div className="flex items-center gap-3">
                                {statusLoading ? (
                                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                                ) : allDone ? (
                                    <ClipboardCheck className="w-6 h-6 text-green-600" />
                                ) : (
                                    <Clock className="w-6 h-6 text-blue-500" />
                                )}
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${
                                        allDone ? 'text-green-800' : inProgress ? 'text-blue-800' : 'text-slate-600'
                                    }`}>
                                        {statusLoading ? 'กำลังตรวจสอบสถานะ...' :
                                         allDone     ? 'ประเมินเสร็จสิ้นแล้ว ✅' :
                                         inProgress  ? 'กำลังดำเนินการประเมิน...' :
                                                       'รอเริ่มการประเมิน'}
                                    </p>
                                    {!statusLoading && totalCommittees > 0 && (
                                        <p className={`text-xs mt-0.5 ${
                                            allDone ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                            คณะกรรมการกรอกคะแนนแล้ว {submittedCount} จาก {totalCommittees} ท่าน
                                        </p>
                                    )}
                                </div>
                                {/* Progress bar */}
                                {!statusLoading && totalCommittees > 0 && (
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${
                                            allDone ? 'text-green-700' : 'text-blue-700'
                                        }`}>
                                            {submittedCount}/{totalCommittees}
                                        </p>
                                        <div className="w-20 h-1.5 bg-white/60 rounded-full overflow-hidden mt-1">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    allDone ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${totalCommittees > 0 ? (submittedCount / totalCommittees) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {allDone && (
                                <p className="text-xs text-green-700 mt-3 pt-3 border-t border-green-200">
                                    คณะกรรมการประเมินครบทุกท่านแล้ว ทางโรงเรียนจะแจ้งผลการประเมินให้ทราบในโอกาสต่อไป
                                </p>
                            )}
                            {notStarted && !statusLoading && totalCommittees > 0 && (
                                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                                    คณะกรรมการยังไม่เริ่มประเมิน กรุณารอและเตรียมเอกสารให้ครบถ้วน
                                </p>
                            )}
                        </div>
                    );
                })()}

                {/* Upload Section */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FilePlus className="w-5 h-5 text-blue-600" />
                            อัปโหลดเอกสารประเมิน
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Document Type + Title */}
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">ประเภทเอกสาร</label>
                                <select
                                    value={docType}
                                    onChange={e => setDocType(e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {DOC_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                    ชื่อเอกสาร <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={docTitle}
                                    onChange={e => setDocTitle(e.target.value)}
                                    placeholder="เช่น แบบประเมินตนเอง ภาคเรียน 1/2568"
                                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Drop Zone */}
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                                ${isUploading ? 'pointer-events-none' : ''}`}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleFileDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />
                            {isUploading ? (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-blue-600 animate-bounce" />
                                    </div>
                                    <p className="text-sm font-medium text-blue-700">กำลังอัปโหลด... {uploadProgress}%</p>
                                    <div className="w-48 mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <Upload className="w-7 h-7 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        คลิกหรือลากไฟล์มาวาง
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        รองรับ PDF, Word, Excel, PowerPoint, รูปภาพ (สูงสุด 20MB)
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                                กรอกชื่อเอกสารก่อน แล้วจึงเลือกไฟล์อัปโหลด เอกสารจะส่งให้ผู้บริหารตรวจสอบ
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Document List */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            เอกสารของฉัน
                            <span className="ml-auto text-sm font-normal text-gray-400">{docs.length} ไฟล์</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
                        ) : docs.length === 0 ? (
                            <div className="py-12 text-center">
                                <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-400 text-sm">ยังไม่มีเอกสาร</p>
                                <p className="text-gray-300 text-xs mt-1">เริ่มอัปโหลดเอกสารแรกของคุณ</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {docs.map((doc) => {
                                    const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                                    const docTypeLabel = DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type;
                                    return (
                                        <div key={doc.id}
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-gray-400">{docTypeLabel}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-xs text-gray-400">{formatBytes(doc.file_size)}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <Clock className="w-3 h-3 text-gray-300" />
                                                    <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                                {doc.file_url && (
                                                    <a
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                                        title="ดาวน์โหลด"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {(doc.status === 'draft' || doc.status === 'rejected') && (
                                                    <button
                                                        onClick={() => handleDelete(doc)}
                                                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {doc.status === 'approved' && (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default EvaluateePortal;
