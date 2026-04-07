import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, ArrowLeft, School, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { login, getRedirectPath } from '@/lib/auth';
import { trackSchoolEvent, setUserRole } from '@/utils/analytics';

const ROLE_HINTS = [
  { role: 'admin', label: 'ผู้ดูแลระบบ', desc: 'เข้าถึงทุกฟีเจอร์', color: 'bg-red-100 text-red-700', icon: '🔑' },
  { role: 'director', label: 'ผู้อำนวยการ', desc: 'แดชบอร์ดและรายงาน', color: 'bg-blue-100 text-blue-700', icon: '👨‍💼' },
  { role: 'teacher', label: 'ครูผู้สอน', desc: 'อัปโหลดเอกสารตนเอง', color: 'bg-green-100 text-green-700', icon: '👨‍🏫' },
  { role: 'assistant', label: 'ครูพี่เลี้ยง / อัตราจ้าง', desc: 'อัปโหลดแบบประเมิน', color: 'bg-purple-100 text-purple-700', icon: '📋' },
];

const UniversalLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(username, password);

      if (user) {
        // Track successful login
        trackSchoolEvent.adminLogin();
        setUserRole(user.role);

        const redirectPath = getRedirectPath(user.role);
        console.log('[AdminLogin] login success:', {
          userId: user.id,
          username: user.username,
          role: user.role,
          redirectPath,
        });

        toast({
          title: `ยินดีต้อนรับ คุณ${user.full_name}`,
          description: `เข้าสู่ระบบในบทบาท: ${user.role}`,
        });
        navigate(redirectPath, { replace: true });
      } else {
        toast({
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">โรงเรียนโสตศึกษา</h1>
              <p className="text-blue-200 text-sm">จังหวัดสงขลา</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            ระบบจัดการ<br />เอกสารดิจิทัล
          </h2>
          <p className="text-blue-200 text-lg">
            SodFlow — ระบบบริหารงานครบวงจร<br />
            สำหรับบุคลากรทุกประเภท
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <p className="text-blue-300 text-sm font-medium mb-4">บทบาทที่รองรับ</p>
          {ROLE_HINTS.map((r) => (
            <div key={r.role} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-xl">{r.icon}</span>
              <div>
                <p className="text-white font-medium text-sm">{r.label}</p>
                <p className="text-blue-300 text-xs">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h2>
            <p className="text-gray-500 mt-1 text-sm">โรงเรียนโสตศึกษาจังหวัดสงขลา</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">ชื่อผู้ใช้งาน</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="กรอกชื่อผู้ใช้"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="กรอกรหัสผ่าน"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-medium text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : 'เข้าสู่ระบบ'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="space-y-1 text-xs text-amber-700 font-mono">
                  <div>ตรวจสอบว่า username ตรงกับข้อมูลในตาราง `app_users`</div>
                  <div>รหัสผ่านถูกตรวจด้วย `password_hash` (SHA-256)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalLogin;
