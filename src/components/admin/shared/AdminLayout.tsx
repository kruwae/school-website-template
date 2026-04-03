import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Home,
    UserCheck,
    BookOpen,
    Building2,
    DollarSign,
    Users,
    GraduationCap,
    FileText,
    Wrench,
    CalendarCheck,
    ClipboardList,
    UserCog,
    Newspaper,
    Star,
    ChevronDown,
    ChevronRight,
    Shield,
    Loader2,
    Menu,
    Target,
} from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/usePermissions';
import schoolLogo from '@/assets/school-logo.svg';

interface AdminLayoutProps {
    children: ReactNode;
}

// role label ภาษาไทย
const ROLE_LABELS: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    director: 'ผู้อำนวยการ',
    deputy_director: 'รองผู้อำนวยการ',
    dept_head: 'หัวหน้าฝ่าย/งาน',
    teacher: 'ครูผู้สอน',
    support_staff: 'เจ้าหน้าที่',
    temp_employee: 'ครูอัตราจ้าง',
    assistant: 'ครูพี่เลี้ยง',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    director: 'bg-blue-100 text-blue-700',
    deputy_director: 'bg-indigo-100 text-indigo-700',
    dept_head: 'bg-purple-100 text-purple-700',
    teacher: 'bg-green-100 text-green-700',
    support_staff: 'bg-teal-100 text-teal-700',
    temp_employee: 'bg-orange-100 text-orange-700',
    assistant: 'bg-yellow-100 text-yellow-700',
};

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    path: string;
    color?: string;
}

interface MenuGroup {
    label: string;
    items: MenuItem[];
}

const allMenuGroups: MenuGroup[] = [
    {
        label: 'ภาพรวม',
        items: [
            { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/admin/dashboard' },
            { id: 'news', label: 'ประกาศ/ข่าวสาร', icon: Newspaper, path: '/admin/dashboard?tab=news' },
        ]
    },
    {
        label: '5 ฝ่ายงาน — เอกสาร',
        items: [
            { id: 'dept-academic', label: 'ฝ่ายวิชาการ', icon: BookOpen, path: '/admin/dashboard?tab=dept-academic', color: 'text-blue-500' },
            { id: 'dept-general', label: 'ฝ่ายบริหารทั่วไป', icon: Building2, path: '/admin/dashboard?tab=dept-general', color: 'text-green-500' },
            { id: 'dept-budget', label: 'ฝ่ายงบประมาณ', icon: DollarSign, path: '/admin/dashboard?tab=dept-budget', color: 'text-yellow-500' },
            { id: 'dept-personnel', label: 'ฝ่ายบริหารบุคคล', icon: Users, path: '/admin/dashboard?tab=dept-personnel', color: 'text-purple-500' },
            { id: 'dept-student', label: 'ฝ่ายกิจการนักเรียน', icon: GraduationCap, path: '/admin/dashboard?tab=dept-student', color: 'text-orange-500' },
        ]
    },
    {
        label: 'งานประจำวัน',
        items: [
            { id: 'documents', label: 'คลังเอกสารทั้งหมด', icon: FileText, path: '/admin/dashboard?tab=documents' },
            { id: 'projects', label: 'จัดการโครงการ', icon: Target, path: '/admin/dashboard?tab=projects' },
            { id: 'duty', label: 'บันทึกเวร', icon: CalendarCheck, path: '/admin/dashboard?tab=duty' },
            { id: 'leave', label: 'ใบลา', icon: ClipboardList, path: '/admin/dashboard?tab=leave' },
            { id: 'maintenance', label: 'แจ้งซ่อม', icon: Wrench, path: '/admin/dashboard?tab=maintenance' },
        ]
    },
    {
        label: 'ระบบประเมิน',
        items: [
            { id: 'audit-teacher', label: 'ประเมินครูพี่เลี้ยง/ลูกจ้าง', icon: Star, path: '/admin/dashboard?tab=audit-teacher' },
            { id: 'audit-committee', label: 'ตั้งค่ากรรมการ', icon: UserCog, path: '/admin/dashboard?tab=audit-committee' },
        ]
    },
    {
        label: 'ระบบ',
        items: [
            { id: 'staff', label: 'บุคลากร', icon: UserCheck, path: '/admin/dashboard?tab=staff' },
            { id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard?tab=administrators' },
            { id: 'user-menu-control', label: 'จัดการสิทธิ์เมนู', icon: Shield, path: '/admin/dashboard?tab=user-menu-control' },
            { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/dashboard?tab=settings' },
        ]
    },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'dashboard';
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('admin-sidebar-collapsed');
        return saved ? JSON.parse(saved) : {};
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const currentUser = getCurrentUser();
    const { canSee, loading: permLoading } = usePermissions();

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    useEffect(() => {
        localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
    }, [collapsed]);

    const toggleGroup = (label: string) => {
        setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => !prev);
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    // กรองเมนูตาม permissions
    const visibleGroups = allMenuGroups
        .map(group => ({
            ...group,
            items: group.items.filter(item => canSee(item.id)),
        }))
        .filter(group => group.items.length > 0);

    const roleBadge = currentUser?.role ? ROLE_LABELS[currentUser.role] || currentUser.role : 'ผู้ใช้งาน';
    const roleBadgeColor = currentUser?.role ? ROLE_COLORS[currentUser.role] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700';

    const renderSidebarContent = (closeOnNavigate: boolean) => (
        <>
            <div className="p-4 border-b border-border flex-shrink-0">
                <Link to="/" onClick={() => closeOnNavigate && setMobileMenuOpen(false)} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white shadow-md ring-2 ring-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img src={schoolLogo} alt="โลโก้โรงเรียน" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-primary text-xs leading-tight truncate">โรงเรียนโสตศึกษาจังหวัดสงขลา</h1>
                        <p className="text-xs text-muted-foreground truncate">ระบบจัดการข้อมูลโรงเรียน</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {permLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    visibleGroups.map((group) => (
                        <div key={group.label} className="mb-2">
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                                <span>{group.label}</span>
                                {collapsed[group.label] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {!collapsed[group.label] && (
                                <div className="mt-1 space-y-0.5">
                                    {group.items.map((item) => {
                                        const isActive = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    handleNavigate(item.path);
                                                    if (closeOnNavigate) setMobileMenuOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm text-left ${isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                                    }`}
                                            >
                                                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? '' : (item as any).color || ''}`} />
                                                <span className="truncate">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </nav>

            <div className="flex-shrink-0 p-3 border-t border-border bg-card">
                <div className="flex items-start gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{currentUser?.full_name || 'ผู้ใช้งาน'}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser?.username}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>
                            {roleBadge}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleNavigate('/admin/dashboard?tab=settings')}>
                        <Settings className="w-3 h-3 mr-1" />
                        บัญชี
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleNavigate('/')}>
                        <Home className="w-3 h-3 mr-1" />
                        หน้าเว็บ
                    </Button>
                    <Button variant="outline" size="sm" className="col-span-2 h-8" onClick={handleLogout}>
                        <LogOut className="w-3 h-3 mr-1" />
                        ออกจากระบบ
                    </Button>
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-secondary">
            {/* Mobile Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <span className="sr-only">เปิดเมนู</span>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
                        <SheetHeader className="sr-only">
                            <SheetTitle>เมนูผู้ดูแลระบบ</SheetTitle>
                        </SheetHeader>
                        <div className="flex h-full flex-col">{renderSidebarContent(true)}</div>
                    </SheetContent>
                </Sheet>
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-white shadow-md ring-2 ring-primary/15 flex items-center justify-center overflow-hidden">
                        <img src={schoolLogo} alt="โลโก้โรงเรียน" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight truncate">โรงเรียนโสตศึกษาจังหวัดสงขลา</p>
                        <p className="text-xs text-muted-foreground truncate">ระบบจัดการข้อมูลโรงเรียน</p>
                    </div>
                </Link>
            </div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-border bg-card shadow-lg z-40 lg:flex">
                {renderSidebarContent(false)}
            </aside>

            {/* Main Content */}
            <main className="min-h-screen lg:ml-64">
                {children}
            </main>
        </div>
    );
};
