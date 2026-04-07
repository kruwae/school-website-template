import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Search, FileText, DollarSign, Users, Calendar,
    CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Eye
} from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { trackSchoolEvent } from '@/utils/analytics';

interface Project {
    id: string;
    title: string;
    description: string;
    project_type: string;
    project_type_label: string;
    budget_source: string;
    budget_amount: number;
    budget_used: number;
    status: string;
    status_label: string;
    start_date: string;
    end_date: string;
    responsible_person_id: string;
    responsible_person_name: string;
    department_id: string;
    academic_year: string;
    objectives: string[];
    expected_outcomes: string;
    created_by_name: string;
    created_at: string;
    departments?: { name: string };
    project_team_members?: { user_name: string; role: string }[];
}

interface Department { id: string; name: string; code: string; }
interface AppUser { id: string; full_name: string; position: string; }

const PROJECT_TYPES = [
    { value: 'new', label: 'โครงการใหม่' },
    { value: 'continuing', label: 'โครงการต่อเนื่อง' },
];

const PROJECT_STATUSES = [
    { value: 'planning', label: 'วางแผน', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'approved', label: 'อนุมัติแล้ว', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'ดำเนินการ', color: 'bg-green-100 text-green-700' },
    { value: 'completed', label: 'เสร็จสิ้น', color: 'bg-purple-100 text-purple-700' },
    { value: 'cancelled', label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
];

const TEAM_ROLES = [
    { value: 'leader', label: 'หัวหน้าโครงการ' },
    { value: 'co_leader', label: 'รองหัวหน้า' },
    { value: 'member', label: 'สมาชิก' },
    { value: 'advisor', label: 'ที่ปรึกษา' },
];

export const ProjectManagement = () => {
    const { toast } = useToast();
    const currentUser = getCurrentUser();

    const [projects, setProjects] = useState<Project[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [appUsers, setAppUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterYear, setFilterYear] = useState('2568');

    // Dialogs
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({
        title: '',
        description: '',
        project_type: 'new',
        budget_source: '',
        budget_amount: '',
        status: 'planning',
        start_date: '',
        end_date: '',
        responsible_person_id: '',
        department_id: '',
        academic_year: '2568',
        objectives: [''],
        expected_outcomes: '',
    });

    // Team members form
    const [teamMembers, setTeamMembers] = useState<{ user_id: string; role: string }[]>([]);

    const canManageProjects = currentUser?.role === 'admin' || currentUser?.role === 'director';

    useEffect(() => {
        fetchAll();
    }, [filterYear]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [projectsRes, deptsRes, usersRes] = await Promise.all([
                supabase.from('projects')
                    .select(`
                        *,
                        departments(name),
                        project_team_members(user_name, role)
                    `)
                    .eq('academic_year', filterYear)
                    .order('created_at', { ascending: false }),
                supabase.from('departments').select('id,name,code').eq('is_active', true),
                supabase.from('app_users').select('id,full_name,position').eq('is_active', true),
            ]);

            if (projectsRes.data) setProjects(projectsRes.data);
            if (deptsRes.data) setDepartments(deptsRes.data);
            if (usersRes.data) setAppUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลได้', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase()) ||
                                project.description?.toLowerCase().includes(search.toLowerCase());
            const matchesDept = filterDept === 'all' || project.department_id === filterDept;
            const matchesType = filterType === 'all' || project.project_type === filterType;
            const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
            return matchesSearch && matchesDept && matchesType && matchesStatus;
        });
    }, [projects, search, filterDept, filterType, filterStatus]);

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            project_type: 'new',
            budget_source: '',
            budget_amount: '',
            status: 'planning',
            start_date: '',
            end_date: '',
            responsible_person_id: '',
            department_id: '',
            academic_year: '2568',
            objectives: [''],
            expected_outcomes: '',
        });
        setTeamMembers([]);
    };

    const openCreateDialog = () => {
        resetForm();
        setShowCreateDialog(true);
    };

    const openEditDialog = (project: Project) => {
        setForm({
            title: project.title,
            description: project.description || '',
            project_type: project.project_type,
            budget_source: project.budget_source || '',
            budget_amount: project.budget_amount?.toString() || '',
            status: project.status,
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            responsible_person_id: project.responsible_person_id || '',
            department_id: project.department_id,
            academic_year: project.academic_year,
            objectives: project.objectives || [''],
            expected_outcomes: project.expected_outcomes || '',
        });
        setSelectedProject(project);
        setShowEditDialog(true);
    };

    const openViewDialog = (project: Project) => {
        setSelectedProject(project);
        setShowViewDialog(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast({ title: 'กรุณากรอกชื่อโครงการ', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const responsiblePerson = form.responsible_person_id ? appUsers.find(u => u.id === form.responsible_person_id) : null;
            const projectData = {
                ...form,
                budget_amount: form.budget_amount ? parseFloat(form.budget_amount) : null,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                responsible_person_name: responsiblePerson ? responsiblePerson.full_name : '',
                created_by_id: currentUser?.id,
                created_by_name: currentUser?.full_name,
                objectives: form.objectives.filter(obj => obj.trim()),
            };

            let result;
            if (showEditDialog && selectedProject) {
                result = await supabase
                    .from('projects')
                    .update(projectData)
                    .eq('id', selectedProject.id);
            } else {
                result = await supabase
                    .from('projects')
                    .insert([projectData]);
            }

            if (result.error) throw result.error;

            // Track analytics
            if (showEditDialog && selectedProject) {
                trackSchoolEvent.projectUpdate(selectedProject.id, form.title);
            } else {
                // For new project, we need to get the created project ID
                const { data: newProject } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('title', form.title)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (newProject) {
                    trackSchoolEvent.projectCreate(newProject.id, form.title);
                }
            }

            // Handle team members
            if (showEditDialog && selectedProject) {
                // Remove existing team members
                await supabase
                    .from('project_team_members')
                    .delete()
                    .eq('project_id', selectedProject.id);

                // Add new team members
                if (teamMembers.length > 0) {
                    const teamData = teamMembers.map(member => {
                        const user = appUsers.find(u => u.id === member.user_id);
                        return {
                            project_id: selectedProject.id,
                            user_id: member.user_id,
                            user_name: user?.full_name || '',
                            role: member.role,
                        };
                    });
                    await supabase.from('project_team_members').insert(teamData);
                }
            }

            toast({ title: showEditDialog ? 'แก้ไขโครงการสำเร็จ' : 'สร้างโครงการสำเร็จ' });
            setShowCreateDialog(false);
            setShowEditDialog(false);
            fetchAll();
        } catch (error) {
            console.error('Error saving project:', error);
            toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกโครงการได้', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm('ต้องการลบโครงการนี้?')) return;

        console.log('Attempting to delete project:', projectId);
        console.log('Current user:', currentUser);
        console.log('Can manage projects:', canManageProjects);

        try {
            // Check if user has permission first
            if (!canManageProjects) {
                throw new Error('ไม่มีสิทธิ์ในการลบโครงการ เฉพาะผู้ดูแลระบบหรือผู้อำนวยการเท่านั้น');
            }

            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            console.log('Delete result - error:', error);

            if (error) {
                // If RLS blocks it, provide helpful error message
                if (error.message.includes('row-level security') || error.code === '42501') {
                    throw new Error('ระบบป้องกันข้อมูลไม่允許การลบนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อปรับสิทธิ์');
                }
                throw error;
            }

            // Track successful deletion
            const deletedProject = projects.find(p => p.id === projectId);
            if (deletedProject) {
                trackSchoolEvent.projectUpdate(projectId, deletedProject.title); // Using update event for delete tracking
            }

            toast({ title: 'ลบโครงการสำเร็จ' });
            fetchAll();
        } catch (error) {
            console.error('Error deleting project:', error);
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถลบโครงการได้',
                variant: 'destructive'
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusInfo = PROJECT_STATUSES.find(s => s.value === status);
        return statusInfo ? (
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        ) : <Badge variant="outline">{status}</Badge>;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        ระบบจัดการโครงการ
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        จัดการโครงการต่างๆ ของโรงเรียน
                    </p>
                </div>
                {canManageProjects && (
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="w-4 h-4" />
                        สร้างโครงการใหม่
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <Label>ค้นหา</Label>
                            <Input
                                placeholder="ชื่อโครงการ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>ฝ่ายงาน</Label>
                            <Select value={filterDept} onValueChange={setFilterDept}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>ประเภท</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    {PROJECT_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>สถานะ</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    {PROJECT_STATUSES.map(status => (
                                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>ปีการศึกษา</Label>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['2568', '2567', '2566'].map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Projects List */}
            {loading ? (
                <div className="p-12 text-center text-muted-foreground">
                    กำลังโหลดข้อมูล...
                </div>
            ) : filteredProjects.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground">ไม่พบโครงการ</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredProjects.map(project => (
                        <Card key={project.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{project.title}</h3>
                                            {getStatusBadge(project.status)}
                                            <Badge variant="outline">
                                                {PROJECT_TYPES.find(t => t.value === project.project_type)?.label}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm mb-3">
                                            {project.description}
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">ผู้รับผิดชอบ:</span>
                                                <p className="font-medium">{project.responsible_person_name || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">งบประมาณ:</span>
                                                <p className="font-medium">
                                                    {project.budget_amount ? formatCurrency(project.budget_amount) : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">ระยะเวลา:</span>
                                                <p className="font-medium">
                                                    {project.start_date || project.end_date
                                                        ? `${project.start_date ? new Date(project.start_date).toLocaleDateString('th-TH') : ''}${project.start_date && project.end_date ? ' - ' : ''}${project.end_date ? new Date(project.end_date).toLocaleDateString('th-TH') : ''}`
                                                        : '-'
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">ฝ่ายงาน:</span>
                                                <p className="font-medium">{project.departments?.name || '-'}</p>
                                            </div>
                                        </div>
                                        {project.project_team_members && project.project_team_members.length > 0 && (
                                            <div className="mt-3">
                                                <span className="text-muted-foreground text-sm">ทีมงาน:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {project.project_team_members.map((member, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {member.user_name} ({TEAM_ROLES.find(r => r.value === member.role)?.label})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openViewDialog(project)}
                                            className="gap-1"
                                        >
                                            <Eye className="w-3 h-3" />
                                            ดู
                                        </Button>
                                        {canManageProjects && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEditDialog(project)}
                                                    className="gap-1"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                    แก้ไข
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(project.id)}
                                                    className="gap-1 text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    ลบ
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Project Dialog */}
            <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
                if (!open) {
                    setShowCreateDialog(false);
                    setShowEditDialog(false);
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {showCreateDialog ? 'สร้างโครงการใหม่' : 'แก้ไขโครงการ'}
                        </DialogTitle>
                        <DialogDescription>
                            กรอกรายละเอียดของโครงการ
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>ชื่อโครงการ *</Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="ชื่อโครงการ"
                                />
                            </div>
                            <div>
                                <Label>ประเภทโครงการ</Label>
                                <Select
                                    value={form.project_type}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, project_type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROJECT_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>คำอธิบาย</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="รายละเอียดของโครงการ"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>แหล่งงบประมาณ</Label>
                                <Input
                                    value={form.budget_source}
                                    onChange={(e) => setForm(prev => ({ ...prev, budget_source: e.target.value }))}
                                    placeholder="เช่น งบประมาณแผ่นดิน"
                                />
                            </div>
                            <div>
                                <Label>จำนวนงบประมาณ (บาท)</Label>
                                <Input
                                    type="number"
                                    value={form.budget_amount}
                                    onChange={(e) => setForm(prev => ({ ...prev, budget_amount: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>สถานะ</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROJECT_STATUSES.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>วันที่เริ่ม</Label>
                                <Input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>วันที่สิ้นสุด</Label>
                                <Input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>ผู้รับผิดชอบ</Label>
                                <Select
                                    value={form.responsible_person_id}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, responsible_person_id: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {appUsers.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.full_name} {user.position ? `(${user.position})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>ฝ่ายงาน</Label>
                                <Select
                                    value={form.department_id}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, department_id: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกฝ่ายงาน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>วัตถุประสงค์</Label>
                            {form.objectives.map((objective, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <Input
                                        value={objective}
                                        onChange={(e) => {
                                            const newObjectives = [...form.objectives];
                                            newObjectives[index] = e.target.value;
                                            setForm(prev => ({ ...prev, objectives: newObjectives }));
                                        }}
                                        placeholder={`วัตถุประสงค์ที่ ${index + 1}`}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newObjectives = form.objectives.filter((_, i) => i !== index);
                                            setForm(prev => ({ ...prev, objectives: newObjectives }));
                                        }}
                                        disabled={form.objectives.length === 1}
                                    >
                                        ลบ
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setForm(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))}
                            >
                                เพิ่มวัตถุประสงค์
                            </Button>
                        </div>

                        <div>
                            <Label>ผลลัพธ์ที่คาดหวัง</Label>
                            <Textarea
                                value={form.expected_outcomes}
                                onChange={(e) => setForm(prev => ({ ...prev, expected_outcomes: e.target.value }))}
                                placeholder="ผลลัพธ์ที่คาดว่าจะได้รับ"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCreateDialog(false);
                                setShowEditDialog(false);
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'กำลังบันทึก...' : (showCreateDialog ? 'สร้างโครงการ' : 'บันทึกการแก้ไข')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Project Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {selectedProject?.title}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedProject && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">ข้อมูลทั่วไป</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-muted-foreground">ประเภท:</span> {PROJECT_TYPES.find(t => t.value === selectedProject.project_type)?.label}</p>
                                        <p><span className="text-muted-foreground">สถานะ:</span> {getStatusBadge(selectedProject.status)}</p>
                                        <p><span className="text-muted-foreground">ผู้รับผิดชอบ:</span> {selectedProject.responsible_person_name || '-'}</p>
                                        <p><span className="text-muted-foreground">ฝ่ายงาน:</span> {selectedProject.departments?.name || '-'}</p>
                                        <p><span className="text-muted-foreground">ปีการศึกษา:</span> {selectedProject.academic_year}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">งบประมาณและระยะเวลา</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-muted-foreground">แหล่งงบ:</span> {selectedProject.budget_source || '-'}</p>
                                        <p><span className="text-muted-foreground">จำนวนงบ:</span> {selectedProject.budget_amount ? formatCurrency(selectedProject.budget_amount) : '-'}</p>
                                        <p><span className="text-muted-foreground">ใช้งบไปแล้ว:</span> {selectedProject.budget_used ? formatCurrency(selectedProject.budget_used) : '-'}</p>
                                        <p><span className="text-muted-foreground">วันที่เริ่ม:</span> {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('th-TH') : '-'}</p>
                                        <p><span className="text-muted-foreground">วันที่สิ้นสุด:</span> {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString('th-TH') : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">คำอธิบาย</h3>
                                <p className="text-sm text-muted-foreground">{selectedProject.description || '-'}</p>
                            </div>

                            {selectedProject.objectives && selectedProject.objectives.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">วัตถุประสงค์</h3>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {selectedProject.objectives.map((obj, idx) => (
                                            <li key={idx}>{obj}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-2">ผลลัพธ์ที่คาดหวัง</h3>
                                <p className="text-sm text-muted-foreground">{selectedProject.expected_outcomes || '-'}</p>
                            </div>

                            {selectedProject.project_team_members && selectedProject.project_team_members.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">ทีมงาน</h3>
                                    <div className="space-y-2">
                                        {selectedProject.project_team_members.map((member, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span>{member.user_name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {TEAM_ROLES.find(r => r.value === member.role)?.label}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                            ปิด
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};