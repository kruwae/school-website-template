import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, File, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ประเภทไฟล์ที่รองรับ
const ACCEPTED_TYPES: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'image/gif': 'GIF',
    'text/plain': 'TXT',
};

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',');

// สีตามประเภทไฟล์
const FILE_COLOR: Record<string, string> = {
    PDF: 'text-red-500 bg-red-50',
    DOC: 'text-blue-500 bg-blue-50',
    DOCX: 'text-blue-500 bg-blue-50',
    XLS: 'text-green-600 bg-green-50',
    XLSX: 'text-green-600 bg-green-50',
    PPT: 'text-orange-500 bg-orange-50',
    PPTX: 'text-orange-500 bg-orange-50',
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface FileUploadResult {
    url: string;
    name: string;
    type: string;
    size: number;
}

interface FileUploadProps {
    onUploadComplete: (result: FileUploadResult) => void;
    currentFile?: { url: string; name: string };
    bucket?: string;
    folder?: string;
    maxSizeMB?: number;
    /** ถ้า false: แสดงไฟล์แบบ read-only — ไม่มีปุ่ม X และไม่อนุญาตเลือกไฟล์ใหม่ */
    canRemoveFile?: boolean;
}

export const FileUpload = ({
    onUploadComplete,
    currentFile,
    bucket = 'school-images',
    folder = 'documents',
    maxSizeMB = 20,
    canRemoveFile = true,
}: FileUploadProps) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(
        currentFile ? { url: currentFile.url, name: currentFile.name, type: '', size: 0 } : null
    );
    const [progress, setProgress] = useState(0);

    const getFileExt = (type: string, name: string) => {
        return ACCEPTED_TYPES[type] || name.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const processFile = useCallback(async (file: File) => {
        // ตรวจขนาด
        const sizeMB = file.size / 1024 / 1024;
        if (sizeMB > maxSizeMB) {
            toast({ title: `ไฟล์ใหญ่เกินไป`, description: `ขนาดสูงสุด ${maxSizeMB} MB`, variant: 'destructive' });
            return;
        }
        // ตรวจประเภท
        if (!ACCEPTED_TYPES[file.type] && !file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|webp|txt)$/i)) {
            toast({ title: 'ประเภทไฟล์ไม่รองรับ', description: 'กรุณาเลือก PDF, Word, Excel, PowerPoint หรือรูปภาพ', variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        setProgress(10);
        try {
            // สาเหตุที่อัปโหลดล้มเหลวคือ storage key มีอักขระภาษาไทย/อักขระพิเศษจากชื่อไฟล์เดิม
            // จึงสร้างชื่อไฟล์ใหม่ให้เป็น ASCII ล้วน และเก็บชื่อไฟล์จริงไว้แค่สำหรับแสดงผลในระบบ
            const originalExt = file.name.split('.').pop()?.toLowerCase();
            const mimeExt = ACCEPTED_TYPES[file.type]?.toLowerCase();
            const ext = (originalExt || mimeExt || 'bin').replace(/[^a-z0-9]/g, '') || 'bin';
            const safeFolder = folder
                .split('/')
                .map(part => part.replace(/[^a-zA-Z0-9_-]/g, '').trim())
                .filter(Boolean)
                .join('/');
            const filePath = `${safeFolder || 'documents'}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

            setProgress(30);
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type || 'application/octet-stream',
                });

            if (error) throw error;
            setProgress(80);

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

            const result: FileUploadResult = {
                url: publicUrl,
                name: file.name,
                type: file.type,
                size: file.size,
            };

            setUploadedFile(result);
            onUploadComplete(result);
            setProgress(100);
            toast({ title: 'อัปโหลดสำเร็จ ✅', description: file.name });
        } catch (err: any) {
            toast({ title: 'อัปโหลดล้มเหลว', description: err.message, variant: 'destructive' });
            setProgress(0);
        } finally {
            setIsUploading(false);
        }
    }, [bucket, folder, maxSizeMB, onUploadComplete, toast]);

    // Drag events
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const handleRemove = () => {
        setUploadedFile(null);
        setProgress(0);
        onUploadComplete({ url: '', name: '', type: '', size: 0 });
    };

    // แสดง preview ไฟล์ที่อัปโหลดแล้ว
    if (uploadedFile?.url) {
        const ext = ACCEPTED_TYPES[uploadedFile.type] || uploadedFile.name.split('.').pop()?.toUpperCase() || 'FILE';
        const colorClass = FILE_COLOR[ext] || 'text-gray-500 bg-gray-50';
        return (
            <div className="flex items-center gap-3 p-3 border-2 border-green-200 bg-green-50 rounded-xl">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${colorClass}`}>
                    {ext}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate max-w-xs">{uploadedFile.name || 'ไฟล์เอกสาร'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">อัปโหลดแล้ว</span>
                        {uploadedFile.size > 0 && (
                            <span className="text-xs text-muted-foreground">{formatBytes(uploadedFile.size)}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                        <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">ดู</a>
                    </Button>
                    {canRemoveFile && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleRemove}>
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_STRING}
                onChange={onInputChange}
                className="hidden"
            />
            <div
                onClick={() => canRemoveFile && !isUploading && fileInputRef.current?.click()}
                onDragOver={canRemoveFile ? onDragOver : undefined}
                onDragLeave={canRemoveFile ? onDragLeave : undefined}
                onDrop={canRemoveFile ? onDrop : undefined}
                className={`
                    relative w-full border-2 border-dashed rounded-xl transition-all
                    flex flex-col items-center justify-center py-8 px-4 text-center
                    ${canRemoveFile ? 'cursor-pointer' : 'cursor-default opacity-60'}
                    ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }
                    ${isUploading ? 'pointer-events-none' : ''}
                `}
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                        <p className="text-sm font-medium text-foreground">กำลังอัปโหลด...</p>
                        {/* Progress bar */}
                        <div className="w-48 h-1.5 bg-border rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                            isDragging ? 'bg-primary/10' : 'bg-secondary'
                        }`}>
                            {isDragging ? (
                                <FileText className="w-7 h-7 text-primary" />
                            ) : (
                                <Upload className="w-7 h-7 text-muted-foreground" />
                            )}
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                            {isDragging ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวาง หรือ คลิกเพื่อเลือก'}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), รูปภาพ
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            ขนาดสูงสุด {maxSizeMB} MB
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
