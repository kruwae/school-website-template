import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CalendarCheck, ClipboardList, Wrench, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickStats = [
  {
    label: 'เมนูใช้งานหลัก',
    value: '5',
    description: 'รายการเมนูด่วนที่ใช้งานบ่อยบนหน้าแรก',
    icon: FileText,
    color: 'bg-blue-500',
  },
  {
    label: 'รูปแบบการเข้าถึง',
    value: '24/7',
    description: 'เข้าถึงได้ทุกเวลาโดยไม่ต้องเข้าสู่ระบบ',
    icon: ArrowRight,
    color: 'bg-emerald-500',
  },
  {
    label: 'บริการสำคัญ',
    value: '100%',
    description: 'เมนูเชื่อมต่อไปยังบริการพื้นฐานของโรงเรียน',
    icon: CalendarCheck,
    color: 'bg-violet-500',
  },
  {
    label: 'พร้อมใช้งาน',
    value: 'มือถือ/เดสก์ท็อป',
    description: 'ออกแบบให้แสดงผลเหมาะสมกับทุกอุปกรณ์',
    icon: Star,
    color: 'bg-amber-500',
  },
];

const quickLinks = [
  {
    title: 'คลังเอกสาร',
    desc: 'ค้นหาและเข้าถึงเอกสารสำคัญของโรงเรียน',
    href: '/infographic/academic',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    title: 'บันทึกเวร',
    desc: 'ดูภาพรวมข้อมูลเวรและการปฏิบัติงาน',
    href: '/infographic/general-affairs',
    icon: CalendarCheck,
    color: 'text-emerald-600',
  },
  {
    title: 'ใบลา',
    desc: 'ติดตามการลาและสรุปภาพรวมการอนุมัติ',
    href: '/infographic/hr',
    icon: ClipboardList,
    color: 'text-purple-600',
  },
  {
    title: 'แจ้งซ่อม',
    desc: 'ดูสถิติการแจ้งซ่อมและงานดูแลอาคาร',
    href: '/infographic/general-affairs',
    icon: Wrench,
    color: 'text-orange-600',
  },
  {
    title: 'ประเมินครู',
    desc: 'ข้อมูลสรุปงานประเมินและพัฒนาวิชาชีพ',
    href: '/infographic/hr',
    icon: Star,
    color: 'text-yellow-600',
  },
];

const quickBars = [
  { label: 'เอกสารพร้อมค้นหา', value: '98%', bar: 'w-[98%]' },
  { label: 'การเข้าถึงหน้าเมนู', value: '100%', bar: 'w-[100%]' },
  { label: 'ความเร็วในการใช้งาน', value: '95%', bar: 'w-[95%]' },
  { label: 'รองรับมือถือ', value: '100%', bar: 'w-[100%]' },
];

const QuickMenuInfographic = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">ข้อมูลสรุปเมนูด่วน</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">เมนูด่วนและการเข้าถึงข้อมูล</h1>
            <p className="text-slate-100 max-w-3xl mx-auto text-lg">
              แสดงเมนูสำคัญที่เปิดให้เข้าถึงข้อมูลสาธารณะได้ทันที พร้อมสถิติการใช้งานและลิงก์ไปยังหน้าอินโฟกราฟิกของแต่ละส่วน
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {quickStats.map((stat) => (
                <Card key={stat.label} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                    <div className="font-semibold text-slate-800">{stat.label}</div>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-12">
              {quickLinks.map((link) => (
                <Card
                  key={link.title}
                  className="shadow-sm border-0 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                  onClick={() => navigate(link.href)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4`}>
                      <link.icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{link.title}</h2>
                    <p className="text-slate-600 leading-relaxed">{link.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-sm border-0 mb-12">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <ArrowRight className="w-5 h-5 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">ดัชนีการเข้าถึงเมนู</h2>
                </div>
                <div className="space-y-5">
                  {quickBars.map((chart) => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{chart.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{chart.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-slate-700 to-blue-600 ${chart.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3">สรุปภาพรวม</h2>
              <p className="text-slate-600 leading-relaxed">
                เมนูด่วนช่วยให้ผู้ใช้งานเข้าถึงข้อมูลสาธารณะและสถิติสำคัญของโรงเรียนได้รวดเร็ว
                รองรับทั้งหน้าจอมือถือและเดสก์ท็อป โดยไม่ต้องเข้าสู่ระบบก่อนใช้งาน
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default QuickMenuInfographic;
