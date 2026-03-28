import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Building2, DollarSign, Users, GraduationCap, FileText, CalendarCheck, ClipboardList, Wrench, Star, LogIn } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const departments = [
  { name: 'ฝ่ายวิชาการ', desc: 'QA, IEP, IIP, ITP, หลักสูตร', icon: BookOpen, color: 'bg-blue-500', tab: 'dept-academic' },
  { name: 'ฝ่ายบริหารทั่วไป', desc: 'อาคาร, เวร, แจ้งซ่อม', icon: Building2, color: 'bg-green-500', tab: 'dept-general' },
  { name: 'ฝ่ายงบประมาณ', desc: 'การเงิน, พัสดุ, แผนงาน', icon: DollarSign, color: 'bg-yellow-500', tab: 'dept-budget' },
  { name: 'ฝ่ายบริหารบุคคล', desc: 'ใบลา, PA, SAR', icon: Users, color: 'bg-purple-500', tab: 'dept-personnel' },
  { name: 'ฝ่ายกิจการนักเรียน', desc: 'กิจกรรม, IEP, วินัย', icon: GraduationCap, color: 'bg-orange-500', tab: 'dept-student' },
];

const quickAccess = [
  { name: 'คลังเอกสาร', icon: FileText, tab: 'documents', color: 'text-blue-600' },
  { name: 'บันทึกเวร', icon: CalendarCheck, tab: 'duty', color: 'text-green-600' },
  { name: 'ใบลา', icon: ClipboardList, tab: 'leave', color: 'text-purple-600' },
  { name: 'แจ้งซ่อม', icon: Wrench, tab: 'maintenance', color: 'text-orange-600' },
  { name: 'ประเมินครู', icon: Star, tab: 'audit-teacher', color: 'text-yellow-600' },
];

const Index = () => {
  const navigate = useNavigate();
  const { settings } = useSchoolSettings();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm animate-fade-in">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              ระบบจัดการเอกสาร ปีการศึกษา {settings.academic_year}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-slide-up">
              โรงเรียนโสตศึกษา<br /><span className="text-yellow-400">จังหวัดสงขลา</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              ระบบจัดการเอกสารครบวงจร แยกตาม 5 ฝ่ายงาน รองรับงานประกันคุณภาพ PA SAR IEP และงานบริหารโรงเรียนการศึกษาพิเศษ
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-bold gap-2 h-12 px-8"
                onClick={() => navigate('/admin/dashboard')}>
                <LogIn className="w-5 h-5" /> เข้าสู่ระบบจัดการ
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 h-12 px-8"
                onClick={() => navigate('/admin/dashboard?tab=documents')}>
                <FileText className="w-5 h-5 mr-2" /> คลังเอกสาร
              </Button>
            </div>
          </div>
        </section>

        {/* 5 Departments */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-800">5 ฝ่ายงาน</h2>
              <p className="text-slate-500 mt-1">เอกสารจากทุกฝ่ายงานในระบบเดียว</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {departments.map((d) => (
                <Card key={d.tab} className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 group"
                  onClick={() => navigate(`/admin/dashboard?tab=${d.tab}`)}>
                  <CardContent className="p-5 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${d.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <d.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 mb-1">{d.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Access */}
        <section className="py-12 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-8">เมนูด่วน</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {quickAccess.map((q) => (
                <button key={q.tab}
                  onClick={() => navigate(`/admin/dashboard?tab=${q.tab}`)}
                  className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group min-w-24">
                  <q.icon className={`w-7 h-7 ${q.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm font-medium text-slate-700">{q.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">เกี่ยวกับระบบ</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
              ระบบ SodFlow รวบรวมและจัดการเอกสารทั้งหมดของโรงเรียนโสตศึกษาจังหวัดสงขลา ครอบคลุมงานประกันคุณภาพการศึกษา
              งาน PA ของครู งาน SAR งานแผน IEP IIP ITP บันทึกเวร รายงานเวรประจำวัน งานแจ้งซ่อม งานใบลา
              และระบบประเมินครูพี่เลี้ยง/ลูกจ้าง
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
