import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    Shield, Users, RotateCcw, Save, Loader2, Plus, Pencil, Trash2, KeyRound,
} from 'lucide-react';
import { ALL_MENU_IDS, DEFAULT_ROLE_MENUS } from '@/hooks/usePermissions';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AppUser {
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    position?: string;
    email?: string;
    staff_id?: string;
    is_active: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
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

const MENU_LABELS: Record<string, string> = {
    dashboard: '📊 แดชบอร์ด',
    news: '📰 ประกาศ/ข่าวสาร',
    'dept-academic': '📚 ฝ่ายวิชาการ',
    'dept-general': '🏫 ฝ่ายบริหารทั่วไป',
    'dept-budget': '💰 ฝ่ายงบประมาณ',
    'dept-personnel': '👥 ฝ่ายบริหารบุคคล',
    'dept-student': '🎓 ฝ่ายกิจการนักเรียน',
    documents: '📁 คลังเอกสารทั้งหมด',
    duty: '📅 บันทึกเวร',
    leave: '📋 ใบลา',
    maintenance: '🔧 แจ้งซ่อม',
    'audit-teacher': '⭐ ประเมินครูพี่เลี้ยง',
    'audit-committee': '⚙️ ตั้งค่ากรรมการ',
    staff: '👤 บุคลากร',
    administrators: '🏛️ ผู้บริหาร',
    'user-menu-control': '🔒 จัดการสิทธิ์เมนู',
    settings: '⚙️ ตั้งค่าระบบ',
};

const MENU_GROUPS: { label: string; ids: string[] }[] = [
    { label: 'ภาพรวม', ids: ['dashboard', 'news'] },
    { label: '5 ฝ่ายงาน', ids: ['dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student'] },
    { label: 'งานประจำวัน', ids: ['documents', 'duty', 'leave', 'maintenance'] },
    { label: 'ระบบประเมิน', ids: ['audit-teacher', 'audit-committee'] },
    { label: 'ระบบ', ids: ['staff', 'administrators', 'user-menu-control', 'settings'] },
];

const EMPTY_FORM = {
    username: '',
    full_name: '',
    email: '',
    staff_id: '',
    position: '',
    role: 'teacher' as UserRole,
    password: '',
    is_active: true,
};

export const UserMenuControl = () => {
    const { toast } = useToast();
    const adminUser = getCurrentUser();

    const [users, setUsers] = useState<AppUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showUserDialog, setShowUserDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [userForm, setUserForm] = useState(EMPTY_FORM);
    const [savingUser, setSavingUser] = useState(false);

    const [resettingUserId, setResettingUserId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await (supabase.from('app_users' as any) as any)
            .select('id, username, full_name, role, position, email, staff_id, is_active')
            .order('role')
            .order('full_name');

        if (data) {
            setUsers(data as AppUser[]);
            if (!selectedUserId && data.length > 0) {
                setSelectedUserId(data[0].id);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!selectedUserId) return;
        const fetchOverrides = async () => {
            const { data } = await (supabase.from('user_menu_permissions' as any) as any)
                .select('menu_id, is_enabled')
                .eq('user_id', selectedUserId);

            const overrideMap: Record<string, boolean> = {};
            if (data) {
                for (const row of data) {
                    overrideMap[row.menu_id] = row.is_enabled;
                }
            }
            setOverrides(overrideMap);
        };
        fetchOverrides();
    }, [selectedUserId]);

    const selectedUser = users.find(u => u.id === selectedUserId);

    const nonAdminUsers = useMemo(
        () => users.filter(user => user.role !== 'admin'),
        [users],
    );

    const getCurrentState = (menuId: string): boolean => {
        if (Object.prototype.hasOwnProperty.call(overrides, menuId)) return overrides[menuId];
        const roleMenus = DEFAULT_ROLE_MENUS[(selectedUser?.role as UserRole) ?? 'teacher'];
        return roleMenus?.has(menuId) ?? false;
    };

    const isDefaultState = (menuId: string): boolean => {
        const roleMenus = DEFAULT_ROLE_MENUS[(selectedUser?.role as UserRole) ?? 'teacher'];
        return !Object.prototype.hasOwnProperty.call(overrides, menuId) || overrides[menuId] === (roleMenus?.has(menuId) ?? false);
    };

    const handleToggle = (menuId: string, val: boolean) => {
        setOverrides(prev => ({ ...prev, [menuId]: val }));
    };

    const handleSaveOverrides = async () => {
        if (!selectedUserId || !adminUser) return;
        setSaving(true);
        try {
            await (supabase.from('user_menu_permissions' as any) as any)
                .delete()
                .eq('user_id', selectedUserId);

            if (Object.keys(overrides).length > 0) {
                const rows = Object.entries(overrides).map(([menu_id, is_enabled]) => ({
                    user_id: selectedUserId,
                    menu_id,
                    is_enabled,
                    updated_by: adminUser.id,
                    updated_at: new Date().toISOString(),
                }));
                await (supabase.from('user_menu_permissions' as any) as any).insert(rows);
            }

            toast({ title: `บันทึกสิทธิ์ของ ${selectedUser?.full_name} สำเร็จ` });
        } catch (e) {
            toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleResetOverrides = () => {
        setOverrides({});
        toast({ title: 'รีเซ็ตเป็นค่าเริ่มต้นของ role แล้ว (ยังไม่ได้บันทึก)' });
    };

    const openCreateUser = () => {
        setEditingUser(null);
        setUserForm(EMPTY_FORM);
        setShowUserDialog(true);
    };

    const openEditUser = (user: AppUser) => {
        setEditingUser(user);
        setUserForm({
            username: user.username,
            full_name: user.full_name,
            email: user.email || '',
            staff_id: user.staff_id || '',
            position: user.position || '',
            role: user.role,
            password: '',
            is_active: user.is_active,
        });
        setShowUserDialog(true);
    };

    const handleSaveUser = async () => {
        if (!userForm.username.trim() || !userForm.full_name.trim()) {
            toast({ title: 'กรุณากรอก username และชื่อ-สกุล', variant: 'destructive' });
            return;
        }

        if (!editingUser && !userForm.password.trim()) {
            toast({ title: 'กรุณากำหนดรหัสผ่านเริ่มต้น', variant: 'destructive' });
            return;
        }

        setSavingUser(true);
        try {
            const basePayload: Record<string, any> = {
                username: userForm.username.trim(),
                full_name: userForm.full_name.trim(),
                email: userForm.email.trim() || null,
                staff_id: userForm.staff_id.trim() || null,
                position: userForm.position.trim() || null,
                role: userForm.role,
                is_active: userForm.is_active,
                updated_at: new Date().toISOString(),
            };

            if (userForm.password.trim()) {
                basePayload.password_hash = await hashPassword(userForm.password.trim());
            }

            if (editingUser) {
                const { error } = await (supabase.from('app_users' as any) as any)
                    .update(basePayload)
                    .eq('id', editingUser.id);

                if (error) throw error;
            } else {
                const { error } = await (supabase.from('app_users' as any) as any)
                    .insert([basePayload]);

                if (error) throw error;
            }

            toast({ title: editingUser ? 'อัปเดตผู้ใช้สำเร็จ' : 'สร้างผู้ใช้สำเร็จ' });
            setShowUserDialog(false);
            fetchUsers();
        } catch (error: any) {
            toast({
                title: 'บันทึกผู้ใช้ไม่สำเร็จ',
                description: error?.message || 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
                variant: 'destructive',
            });
        } finally {
            setSavingUser(false);
        }
    };

    const handleDeleteUser = async (user: AppUser) => {
        if (user.role === 'admin') {
            toast({ title: 'ไม่สามารถลบ admin ได้', variant: 'destructive' });
            return;
        }

        if (!confirm(`ต้องการลบผู้ใช้ ${user.full_name} ใช่หรือไม่?`)) return;

        try {
            await (supabase.from('user_menu_permissions' as any) as any)
                .delete()
                .eq('user_id', user.id);

            const { error } = await (supabase.from('app_users' as any) as any)
                .delete()
                .eq('id', user.id);

            if (error) throw error;

            if (selectedUserId === user.id) {
                setSelectedUserId('');
                setOverrides({});
            }

            toast({ title: 'ลบผู้ใช้สำเร็จ' });
            fetchUsers();
        } catch (error: any) {
            toast({
                title: 'ลบผู้ใช้ไม่สำเร็จ',
                description: error?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล',
                variant: 'destructive',
            });
        }
    };

    const handleResetPassword = async (user: AppUser) => {
        const newPassword = window.prompt(`กำหนดรหัสผ่านใหม่ให้ ${user.full_name}`, 'admin123');
        if (!newPassword?.trim()) return;

        setResettingUserId(user.id);
        try {
            const password_hash = await hashPassword(newPassword.trim());
            const { error } = await (supabase.from('app_users' as any) as any)
                .update({
                    password_hash,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            toast({ title: `รีเซ็ตรหัสผ่านของ ${user.full_name} สำเร็จ` });
        } catch (error: any) {
            toast({
                title: 'รีเซ็ตรหัสผ่านไม่สำเร็จ',
                description: error?.message || 'เกิดข้อผิดพลาดในการบันทึกรหัสผ่าน',
                variant: 'destructive',
            });
        } finally {
            setResettingUserId(null);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-600" /> จัดการผู้ใช้งานและสิทธิ์
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    เฉพาะ admin เท่านั้น • จัดการรายชื่อผู้ใช้ CRUD และกำหนดสิทธิ์เมนูรายบุคคล
                </p>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
                    <TabsTrigger value="permissions">สิทธิ์เมนู</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" /> รายชื่อผู้ใช้งานระบบ
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    สร้าง แก้ไข ลบ เปิด/ปิดการใช้งาน และรีเซ็ตรหัสผ่านผู้ใช้
                                </p>
                            </div>
                            <Button onClick={openCreateUser} className="gap-2">
                                <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            className="border rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold">{user.full_name}</p>
                                                    <Badge variant="outline">@{user.username}</Badge>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                                        {ROLE_LABELS[user.role] || user.role}
                                                    </span>
                                                    {!user.is_active && (
                                                        <Badge variant="destructive">ปิดใช้งาน</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {user.position || '—'}{user.email ? ` • ${user.email}` : ''}{user.staff_id ? ` • รหัสบุคลากร: ${user.staff_id}` : ''}
                                                </p>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEditUser(user)}>
                                                    <Pencil className="w-3.5 h-3.5" /> แก้ไข
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5"
                                                    disabled={resettingUserId === user.id}
                                                    onClick={() => handleResetPassword(user)}
                                                >
                                                    {resettingUserId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                                                    รีเซ็ตรหัสผ่าน
                                                </Button>
                                                {user.role !== 'admin' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="gap-1.5"
                                                        onClick={() => handleDeleteUser(user)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> ลบ
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="permissions">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4" /> รายชื่อผู้ใช้งาน
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {nonAdminUsers.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => setSelectedUserId(u.id)}
                                                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${selectedUserId === u.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{u.full_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{u.position}</p>
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                                                        {ROLE_LABELS[u.role] || u.role}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            {!selectedUser ? (
                                <CardContent className="p-12 text-center">
                                    <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                                    <p className="text-muted-foreground">เลือกผู้ใช้งานจากรายการด้านซ้าย</p>
                                </CardContent>
                            ) : (
                                <>
                                    <CardHeader className="pb-3 border-b">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">{selectedUser.full_name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{selectedUser.position}</p>
                                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[selectedUser.role]}`}>
                                                    {ROLE_LABELS[selectedUser.role]}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={handleResetOverrides} className="gap-1.5 text-xs h-8">
                                                    <RotateCcw className="w-3 h-3" /> รีเซ็ต
                                                </Button>
                                                <Button size="sm" onClick={handleSaveOverrides} disabled={saving} className="gap-1.5 text-xs h-8">
                                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                    บันทึก
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-muted-foreground mb-4">
                                            🔵 = เปิด (override) • 🔘 = ปิด (override) • ค่าเทา = ใช้ default ของ role
                                        </p>
                                        <div className="space-y-6">
                                            {MENU_GROUPS.map(group => (
                                                <div key={group.label}>
                                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                        {group.label}
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {group.ids
                                                            .filter(menuId => ALL_MENU_IDS.includes(menuId as any))
                                                            .map(menuId => {
                                                                const currentVal = getCurrentState(menuId);
                                                                const isDefault = isDefaultState(menuId);

                                                                return (
                                                                    <div
                                                                        key={menuId}
                                                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                                                                            isDefault ? 'bg-muted/30 border-border' : 'bg-blue-50 border-blue-200'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Label htmlFor={`menu-${menuId}`} className="text-sm cursor-pointer">
                                                                                {MENU_LABELS[menuId] || menuId}
                                                                            </Label>
                                                                            {!isDefault && (
                                                                                <Badge variant="outline" className="text-xs h-4 px-1 border-blue-300 text-blue-600">
                                                                                    override
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <Switch
                                                                            id={`menu-${menuId}`}
                                                                            checked={currentVal}
                                                                            onCheckedChange={(val) => handleToggle(menuId, val)}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Username *</Label>
                            <Input
                                value={userForm.username}
                                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="เช่น technician04"
                            />
                        </div>
                        <div>
                            <Label>ชื่อ-สกุล *</Label>
                            <Input
                                value={userForm.full_name}
                                onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                                placeholder="ชื่อผู้ใช้งาน"
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                value={userForm.email}
                                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="name@school.ac.th"
                            />
                        </div>
                        <div>
                            <Label>รหัสบุคลากร</Label>
                            <Input
                                value={userForm.staff_id}
                                onChange={(e) => setUserForm(prev => ({ ...prev, staff_id: e.target.value }))}
                                placeholder="STAFF001"
                            />
                        </div>
                        <div>
                            <Label>ตำแหน่ง</Label>
                            <Input
                                value={userForm.position}
                                onChange={(e) => setUserForm(prev => ({ ...prev, position: e.target.value }))}
                                placeholder="ช่างไฟฟ้า / ครูผู้สอน / เจ้าหน้าที่"
                            />
                        </div>
                        <div>
                            <Label>บทบาท</Label>
                            <Select value={userForm.role} onValueChange={(value: UserRole) => setUserForm(prev => ({ ...prev, role: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(ROLE_LABELS) as UserRole[]).map(roleKey => (
                                        <SelectItem key={roleKey} value={roleKey}>
                                            {ROLE_LABELS[roleKey]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>{editingUser ? 'รหัสผ่านใหม่ (เว้นว่างได้)' : 'รหัสผ่านเริ่มต้น *'}</Label>
                            <Input
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                placeholder={editingUser ? 'ใส่เมื่อต้องการเปลี่ยนรหัสผ่าน' : 'กำหนดรหัสผ่าน'}
                            />
                        </div>
                        <div className="flex items-center justify-between border rounded-lg px-3 py-2 mt-6">
                            <div>
                                <p className="text-sm font-medium">สถานะการใช้งาน</p>
                                <p className="text-xs text-muted-foreground">ปิดบัญชีได้โดยไม่ต้องลบข้อมูล</p>
                            </div>
                            <Switch
                                checked={userForm.is_active}
                                onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, is_active: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUserDialog(false)} disabled={savingUser}>ยกเลิก</Button>
                        <Button onClick={handleSaveUser} disabled={savingUser}>
                            {savingUser ? 'กำลังบันทึก...' : editingUser ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
