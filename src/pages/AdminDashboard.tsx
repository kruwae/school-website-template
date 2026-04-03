import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/shared/AdminLayout';
import { NewsManagement } from '@/components/admin/news/NewsManagement';
import { SettingsManagement } from '@/components/admin/settings/SettingsManagement';
import { AdministratorsManagement } from '@/components/admin/administrators/AdministratorsManagement';
import { StaffManagement } from '@/components/admin/staff/StaffManagement';
import { DocumentsManagement } from '@/components/admin/documents/DocumentsManagement';
import { DutyManagement } from '@/components/admin/duty/DutyManagement';
import { LeaveManagement } from '@/components/admin/leave/LeaveManagement';
import { MaintenanceManagement } from '@/components/admin/maintenance/MaintenanceManagement';
import { AuditTeacherManagement } from '@/components/admin/audit/AuditTeacherManagement';
import { AuditCommitteeManagement } from '@/components/admin/audit/AuditCommitteeManagement';
import { DepartmentDocuments } from '@/components/admin/documents/DepartmentDocuments';
import { UserMenuControl } from '@/components/admin/users/UserMenuControl';
import { ProjectManagement } from '@/components/admin/projects/ProjectManagement';
import { BudgetDashboard } from '@/components/admin/projects/BudgetDashboard';
import { Card, CardContent } from '@/components/ui/card';
import {
    BookOpen, Building2, DollarSign, Users, GraduationCap,
    FileText, CalendarCheck, ClipboardList, Wrench, Star, Settings, Shield,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { usePermissions } from '@/hooks/usePermissions';

const DEPT_TABS: Record<string, { name: string; code: string; color: string; icon: any }> = {
    'dept-academic': { name: 'ฝ่ายวิชาการ', code: 'academic', color: 'bg-blue-500', icon: BookOpen },
    'dept-general': { name: 'ฝ่ายบริหารทั่วไป', code: 'general', color: 'bg-green-500', icon: Building2 },
    'dept-budget': { name: 'ฝ่ายงบประมาณ', code: 'budget', color: 'bg-yellow-500', icon: DollarSign },
    'dept-personnel': { name: 'ฝ่ายบริหารบุคคล', code: 'personnel', color: 'bg-purple-500', icon: Users },
    'dept-student': { name: 'ฝ่ายกิจการนักเรียน', code: 'student_affairs', color: 'bg-orange-500', icon: GraduationCap },
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    const currentUser = getCurrentUser();
    const { canSee } = usePermissions();

    const [stats, setStats] = useState({
        documents: 0, duty: 0, leave: 0, maintenance: 0, audit: 0,
        pendingLeave: 0, pendingMaint: 0,
    });
    const [loading, setLoading] = useState(true);

    // Guard: ต้อง login ก่อน
    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (!isLoggedIn) navigate('/admin');
    }, [navigate]);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const [docsRes, dutyRes, leaveRes, maintRes, auditRes, pendingLeaveRes, pendingMaintRes] = await Promise.all([
                supabase.from('documents' as any).select('id', { count: 'exact', head: true }),
                supabase.from('duty_records' as any).select('id', { count: 'exact', head: true }),
                supabase.from('leave_requests' as any).select('id', { count: 'exact', head: true }),
                supabase.from('maintenance_requests' as any).select('id', { count: 'exact', head: true }),
                supabase.from('audit_evaluatees' as any).select('id', { count: 'exact', head: true }),
                // รายการที่รออนุมัติ
                (supabase.from('leave_requests' as any) as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                (supabase.from('maintenance_requests' as any) as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            ]);
            setStats({
                documents: docsRes.count || 0,
                duty: dutyRes.count || 0,
                leave: leaveRes.count || 0,
                maintenance: maintRes.count || 0,
                audit: auditRes.count || 0,
                pendingLeave: pendingLeaveRes.count || 0,
                pendingMaint: pendingMaintRes.count || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = () => {
        // Department-specific document views
        if (DEPT_TABS[activeTab]) {
            const dept = DEPT_TABS[activeTab];
            return <DepartmentDocuments deptCode={dept.code} deptName={dept.name} color={dept.color} />;
        }

        switch (activeTab) {
            case 'news':               return <NewsManagement />;
            case 'documents':          return <DocumentsManagement />;
            case 'duty':               return <DutyManagement />;
            case 'leave':              return <LeaveManagement />;
            case 'maintenance':        return <MaintenanceManagement />;
            case 'audit-teacher':      return <AuditTeacherManagement />;
            case 'audit-committee':    return <AuditCommitteeManagement />;
            case 'staff':              return <StaffManagement />;
            case 'administrators':     return <AdministratorsManagement />;
            case 'settings':           return <SettingsManagement adminOnly={currentUser?.role !== 'admin'} />;
            case 'user-menu-control':  return <UserMenuControl />;
            case 'projects':           return <ProjectManagement />;
            case 'budget-dashboard':   return <BudgetDashboard />;

            case 'dashboard':
                return (
                    <div className="p-8">
                        {/* Welcome Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-foreground mb-1">
                                สวัสดี, {currentUser?.full_name || 'ผู้ใช้งาน'} 👋
                            </h1>
                            <p className="text-muted-foreground">
                                โรงเรียนโสตศึกษาจังหวัดสงขลา • ปีการศึกษา 2568
                            </p>
                        </div>

                        {/* Pending Alerts (เฉพาะ role ที่อนุมัติได้) */}
                        {(stats.pendingLeave > 0 || stats.pendingMaint > 0) &&
                            ['admin', 'director', 'deputy_director', 'dept_head'].includes(currentUser?.role || '') && (
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stats.pendingLeave > 0 && (
                                    <div
                                        className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
                                        onClick={() => navigate('/admin/dashboard?tab=leave')}
                                    >
                                        <span className="text-2xl">📋</span>
                                        <div>
                                            <p className="font-semibold text-amber-800">ใบลารออนุมัติ</p>
                                            <p className="text-sm text-amber-700">{stats.pendingLeave} รายการ รอการพิจารณา</p>
                                        </div>
                                    </div>
                                )}
                                {stats.pendingMaint > 0 && (
                                    <div
                                        className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors"
                                        onClick={() => navigate('/admin/dashboard?tab=maintenance')}
                                    >
                                        <span className="text-2xl">🔧</span>
                                        <div>
                                            <p className="font-semibold text-orange-800">แจ้งซ่อมรออนุมัติ</p>
                                            <p className="text-sm text-orange-700">{stats.pendingMaint} รายการ รอดำเนินการ</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Department Quick Access — กรองตาม permissions */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-4">5 ฝ่ายงาน</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(DEPT_TABS)
                                    .filter(([tabId]) => canSee(tabId))
                                    .map(([tabId, dept]) => (
                                        <Card
                                            key={tabId}
                                            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                                            onClick={() => navigate(`/admin/dashboard?tab=${tabId}`)}
                                        >
                                            <CardContent className="p-4 text-center">
                                                <div className={`w-12 h-12 rounded-xl ${dept.color} flex items-center justify-center mx-auto mb-3`}>
                                                    <dept.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-xs font-medium text-foreground leading-tight">{dept.name}</p>
                                            </CardContent>
                                        </Card>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-4">สรุปภาพรวม</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: 'เอกสารทั้งหมด', value: stats.documents, icon: FileText, color: 'bg-blue-500', tab: 'documents' },
                                    { label: 'บันทึกเวร', value: stats.duty, icon: CalendarCheck, color: 'bg-green-500', tab: 'duty' },
                                    { label: 'ใบลา', value: stats.leave, icon: ClipboardList, color: 'bg-purple-500', tab: 'leave' },
                                    { label: 'แจ้งซ่อม', value: stats.maintenance, icon: Wrench, color: 'bg-orange-500', tab: 'maintenance' },
                                    { label: 'ผู้รับการประเมิน', value: stats.audit, icon: Star, color: 'bg-pink-500', tab: 'audit-teacher' },
                                ]
                                    .filter(stat => canSee(stat.tab))
                                    .map((stat) => (
                                        <Card
                                            key={stat.tab}
                                            className="cursor-pointer hover:shadow-lg transition-shadow"
                                            onClick={() => navigate(`/admin/dashboard?tab=${stat.tab}`)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0`}>
                                                        <stat.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-foreground">{loading ? '-' : stat.value}</p>
                                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Quick Actions — กรองตาม permissions */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold mb-4">เมนูด่วน</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'บันทึกเวร', tab: 'duty', icon: CalendarCheck, desc: 'เพิ่มรายงานเวร' },
                                        { label: 'ยื่นใบลา', tab: 'leave', icon: ClipboardList, desc: 'ใบลาใหม่' },
                                        { label: 'แจ้งซ่อม', tab: 'maintenance', icon: Wrench, desc: 'แจ้งปัญหา' },
                                        { label: 'ประเมินครู', tab: 'audit-teacher', icon: Star, desc: 'กรอกประเมิน' },
                                        { label: 'จัดการสิทธิ์', tab: 'user-menu-control', icon: Shield, desc: 'admin เท่านั้น' },
                                    ]
                                        .filter(item => canSee(item.tab))
                                        .map((item) => (
                                            <button
                                                key={item.tab}
                                                onClick={() => navigate(`/admin/dashboard?tab=${item.tab}`)}
                                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-center"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <item.icon className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className="font-medium text-sm text-foreground">{item.label}</span>
                                                <span className="text-xs text-muted-foreground">{item.desc}</span>
                                            </button>
                                        ))
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return (
                    <div className="p-8">
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                    <Settings className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">ไม่พบหน้าที่ต้องการ</h3>
                                <p className="text-muted-foreground">กรุณาเลือกเมนูด้านซ้าย</p>
                            </CardContent>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <AdminLayout>
            {renderTabContent()}
        </AdminLayout>
    );
};

export default AdminDashboard;
