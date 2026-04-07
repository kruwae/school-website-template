import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Building2, CalendarCheck, ClipboardList, FileText, GraduationCap, LogIn, ShieldCheck, Star, Users, Wrench } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const departments = [
  { name: 'ฝ่ายวิชาการ', desc: 'QA, IEP, IIP, ITP, หลักสูตร', icon: BookOpen, color: 'bg-blue-500', tab: 'dept-academic' },
  { name: 'ฝ่ายบริหารทั่วไป', desc: 'อาคาร, เวร, แจ้งซ่อม', icon: Building2, color: 'bg-emerald-500', tab: 'dept-general' },
  { name: 'ฝ่ายงบประมาณ', desc: 'การเงิน, พัสดุ, แผนงาน', icon: Star, color: 'bg-amber-500', tab: 'dept-budget' },
  { name: 'ฝ่ายบริหารบุคคล', desc: 'ใบลา, PA, SAR', icon: Users, color: 'bg-violet-500', tab: 'dept-personnel' },
  { name: 'ฝ่ายกิจการนักเรียน', desc: 'กิจกรรม, ดูแลช่วยเหลือ, วินัย', icon: GraduationCap, color: 'bg-orange-500', tab: 'dept-student' },
];

const quickAccess = [
  { name: 'คลังเอกสาร', icon: FileText, tab: 'documents', color: 'text-blue-600' },
  { name: 'บันทึกเวร', icon: CalendarCheck, tab: 'duty', color: 'text-emerald-600' },
  { name: 'ใบลา', icon: ClipboardList, tab: 'leave', color: 'text-violet-600' },
  { name: 'แจ้งซ่อม', icon: Wrench, tab: 'maintenance', color: 'text-orange-600' },
  { name: 'ประเมินครู', icon: Star, tab: 'audit-teacher', color: 'text-amber-600' },
];

const previewItems = [
  { label: 'เอกสารวันนี้', value: '24', note: 'งานพร้อมอนุมัติ' },
  { label: 'คำขอรอดำเนินการ', value: '8', note: 'เวร / ใบลา / ซ่อมบำรุง' },
  { label: 'แจ้งซ่อมปิดแล้ว', value: '96%', note: 'งานซ่อมที่ตอบสนองเร็ว' },
];

const Index = () => {
  const navigate = useNavigate();
  const { settings } = useSchoolSettings();
  const currentUser = getCurrentUser();

  const schoolHighlights = useMemo(() => ([
    { title: 'ระบบงานเอกสารครบวงจร', detail: 'จัดการงานจากทุกฝ่ายในพื้นที่เดียว' },
    { title: 'รองรับงานติดตามผล', detail: 'ตรวจสอบสถานะเอกสารและงานที่ต้องอนุมัติได้ง่าย' },
    { title: 'โหมดสาธารณะพร้อมใช้งาน', detail: 'หน้าแรกเปิดดูข้อมูลสรุปได้โดยไม่ต้องเข้าสู่ระบบ' },
  ]), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-20">
        <HeroSection />

        <section className="section-padding">
          <div className="container-school">
            <div className="grid gap-6 md:grid-cols-3">
              {schoolHighlights.map((item) => (
                <Card key={item.title} className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <ShieldCheck className="w-10 h-10 text-primary mb-4" />
                    <h2 className="text-lg font-bold text-foreground mb-2">{item.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-secondary/40">
          <div className="container-school">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">ภาพรวมระบบ</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">แดชบอร์ดสรุปสำหรับบุคลากรและผู้เยี่ยมชม</h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                หน้านี้แสดงตัวอย่างข้อมูลสำคัญและทางลัดสู่การทำงานของโรงเรียน เพื่อให้ผู้ใช้เห็นภาพรวมของระบบก่อนเข้าสู่โหมดจัดการ
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="overflow-hidden border-border/60 shadow-lg">
                <CardContent className="p-0">
                  <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 to-accent/10 p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">สถานะผู้ใช้ปัจจุบัน</p>
                        <h3 className="text-xl font-bold">{currentUser ? `ยินดีต้อนรับ, ${currentUser.full_name ?? currentUser.username}` : 'ผู้เข้าชมทั่วไป'}</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground shadow-sm">
                        <span className={`h-2 w-2 rounded-full ${currentUser ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {currentUser ? 'เข้าสู่ระบบแล้ว' : 'ยังไม่ได้เข้าสู่ระบบ'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-6 sm:grid-cols-3">
                    {previewItems.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <div className="mt-2 text-3xl font-bold text-foreground">{item.value}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 pb-6">
                    <div className="rounded-2xl bg-muted/50 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">งานที่กำลังดำเนินการ</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          'ตรวจสอบเอกสารฝ่ายวิชาการรอบล่าสุด',
                          'ติดตามคำขอแจ้งซ่อมอุปกรณ์ในอาคารเรียน',
                          'สรุปรายงานเวรและการขาดลามาสายประจำสัปดาห์',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3 rounded-xl bg-background p-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                            <p className="text-sm text-muted-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm text-muted-foreground">ทางเข้าสู่ระบบ</p>
                        <h3 className="text-lg font-bold">จัดการข้อมูลและเอกสาร</h3>
                      </div>
                      <LogIn className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button className="w-full gap-2" onClick={() => navigate('/admin/dashboard')}>
                        <LogIn className="w-4 h-4" />
                        ไปยังแดชบอร์ดผู้ดูแล
                      </Button>
                      <Button
                        className="w-full h-14 text-lg font-semibold gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 border-0"
                        onClick={() => navigate('/admin')}
                      >
                        <LogIn className="w-5 h-5" />
                        เข้าสู่ระบบแอดมิน
                      </Button>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {currentUser ? 'คุณสามารถเข้าถึงเมนูจัดการตามสิทธิ์ของบัญชีที่ล็อกอินอยู่' : 'พื้นที่จัดการจะแสดงเมื่อเข้าสู่ระบบเท่านั้น'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold">เมนูด่วน</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {quickAccess.map((item) => (
                        <button
                          key={item.tab}
                          onClick={() => navigate(`/admin/dashboard?tab=${item.tab}`)}
                          className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-school">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">5 ฝ่ายงาน</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-foreground">ศูนย์รวมงานบริหารและการเรียนรู้ของโรงเรียน</h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto">
                เอกสารและข้อมูลจากทุกฝ่ายถูกรวบรวมไว้ในระบบเดียวเพื่อช่วยให้การทำงานสะดวกและตรวจสอบได้
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {departments.map((department) => (
                <Card
                  key={department.tab}
                  className="cursor-pointer border-border/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => navigate(`/admin/dashboard?tab=${department.tab}`)}
                >
                  <CardContent className="p-5 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${department.color} flex items-center justify-center mx-auto mb-3`}>
                      <department.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">{department.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{department.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-secondary/30">
          <div className="container-school">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">สรุปผู้ใช้งานและการเข้าถึง</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: 'ครูและบุคลากร', value: settings.stat_students, helper: settings.stat_students_label },
                      { label: 'ผู้เรียนต่อระดับ', value: settings.stat_university, helper: settings.stat_university_label },
                      { label: 'ปีแห่งความเชี่ยวชาญ', value: settings.stat_years, helper: settings.stat_years_label },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <div className="mt-2 text-2xl font-bold">{item.value}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">เกี่ยวกับระบบ</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    ระบบนี้ช่วยรวบรวมงานประกันคุณภาพการศึกษา งาน PA ของครู งาน SAR งานแผน IEP/IIP/ITP
                    บันทึกเวร รายงานเวรประจำวัน งานแจ้งซ่อม งานใบลา และระบบประเมินครูพี่เลี้ยง/ลูกจ้าง
                    โดยออกแบบให้รองรับการใช้งานของโรงเรียนได้ทั้งหน้าเผยแพร่สาธารณะและพื้นที่หลังบ้าน
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
