import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, RotateCcw, Save, Loader2 } from 'lucide-react';
import { ALL_MENU_IDS, DEFAULT_ROLE_MENUS, type MenuId } from '@/hooks/usePermissions';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';

interface AppUser {
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    position?: string;
    is_active: boolean;
}

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

const MENU_LABELS: Record<string, string> = {
    'dashboard': '📊 แดชบอร์ด',
    'news': '📰 ประกาศ/ข่าวสาร',
    'dept-academic': '📚 ฝ่ายวิชาการ',
    'dept-general': '🏫 ฝ่ายบริหารทั่วไป',
    'dept-budget': '💰 ฝ่ายงบประมาณ',
    'dept-personnel': '👥 ฝ่ายบริหารบุคคล',
    'dept-student': '🎓 ฝ่ายกิจการนักเรียน',
    'documents': '📁 คลังเอกสารทั้งหมด',
    'duty': '📅 บันทึกเวร',
    'leave': '📋 ใบลา',
    'maintenance': '🔧 แจ้งซ่อม',
    'audit-teacher': '⭐ ประเมินครูพี่เลี้ยง',
    'audit-committee': '⚙️ ตั้งค่ากรรมการ',
    'staff': '👤 บุคลากร',
    'administrators': '🏛️ ผู้บริหาร',
    'user-menu-control': '🔒 จัดการสิทธิ์เมนู',
    'settings': '⚙️ ตั้งค่าระบบ',
};

const MENU_GROUPS: { label: string; ids: string[] }[] = [
    { label: 'ภาพรวม', ids: ['dashboard', 'news'] },
    { label: '5 ฝ่ายงาน', ids: ['dept-academic', 'dept-general', 'dept-budget', 'dept-personnel', 'dept-student'] },
    { label: 'งานประจำวัน', ids: ['documents', 'duty', 'leave', 'maintenance'] },
    { label: 'ระบบประเมิน', ids: ['audit-teacher', 'audit-committee'] },
    { label: 'ระบบ', ids: ['staff', 'administrators', 'user-menu-control', 'settings'] },
];

export const UserMenuControl = () => {
    const { toast } = useToast();
    const adminUser = getCurrentUser();

    const [users, setUsers] = useState<AppUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // โหลดรายชื่อ users ทั้งหมด (ยกเว้น admin)
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data } = await (supabase.from('app_users' as any) as any)
                .select('id, username, full_name, role, position, is_active')
                .neq('role', 'admin')
                .order('role')
                .order('full_name');
            if (data) setUsers(data as AppUser[]);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    // โหลด overrides ของ user ที่เลือก
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

    // ค่าปัจจุบัน: default role + override
    const getCurrentState = (menuId: string): boolean => {
        if (overrides.hasOwnProperty(menuId)) return overrides[menuId];
        const roleMenus = DEFAULT_ROLE_MENUS[(selectedUser?.role as UserRole) ?? 'teacher'];
        return roleMenus?.has(menuId) ?? false;
    };

    const isDefaultState = (menuId: string): boolean => {
        const roleMenus = DEFAULT_ROLE_MENUS[(selectedUser?.role as UserRole) ?? 'teacher'];
        return !overrides.hasOwnProperty(menuId) || overrides[menuId] === (roleMenus?.has(menuId) ?? false);
    };

    const handleToggle = (menuId: string, val: boolean) => {
        setOverrides(prev => ({ ...prev, [menuId]: val }));
    };

    const handleSave = async () => {
        if (!selectedUserId || !adminUser) return;
        setSaving(true);
        try {
            // ลบ overrides เก่า แล้ว insert ใหม่ทั้งหมด
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

    const handleReset = () => {
        setOverrides({});
        toast({ title: 'รีเซ็ตเป็นค่าเริ่มต้นของ role แล้ว (ยังไม่ได้บันทึก)' });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-600" /> จัดการสิทธิ์เมนูรายบุคคล
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    เฉพาะ admin เท่านั้น • การตั้งค่านี้จะ override สิทธิ์เริ่มต้นของแต่ละ role
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* รายชื่อ Users */}
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
                                {users.map(u => (
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

                {/* Panel จัดการเมนู */}
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
                                        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs h-8">
                                            <RotateCcw className="w-3 h-3" /> รีเซ็ต
                                        </Button>
                                        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs h-8">
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
                                                {group.ids.map(menuId => {
                                                    const currentVal = getCurrentState(menuId);
                                                    const isDefault = isDefaultState(menuId);
                                                    return (
                                                        <div key={menuId}
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
        </div>
    );
};
