import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CalendarDays, ShieldAlert, Activity, Trophy, ClipboardList } from 'lucide-react';

const studentStats = [
  {
    label: 'จำนวนนักเรียน',
    value: '1,240',
    description: 'นักเรียนทุกระดับชั้นในระบบโรงเรียน',
    icon: Users,
    color: 'bg-orange-500',
  },
  {
    label: 'กิจกรรมพัฒนา',
    value: '76',
    description: 'กิจกรรมเสริมทักษะและพัฒนาศักยภาพผู้เรียน',
    icon: CalendarDays,
    color: 'bg-amber-500',
  },
  {
    label: 'งานวินัยและดูแล',
    value: '98%',
    description: 'อัตราการติดตามดูแลและการช่วยเหลือนักเรียนอย่างต่อเนื่อง',
    icon: ShieldAlert,
    color: 'bg-rose-500',
  },
  {
    label: 'รางวัลและผลงาน',
    value: '54',
    description: 'ผลงานและรางวัลที่นักเรียนได้รับในรอบปี',
    icon: Trophy,
    color: 'bg-yellow-500',
  },
];

const studentSections = [
  {
    title: 'การดูแลนักเรียน',
    items: ['ติดตามพฤติกรรมนักเรียน', 'ดูแลความปลอดภัยและสวัสดิภาพ', 'ประสานงานผู้ปกครอง'],
  },
  {
    title: 'กิจกรรมพัฒนาผู้เรียน',
    items: ['กิจกรรมชมรมและชุมนุม', 'กิจกรรมสร้างทักษะชีวิต', 'ส่งเสริมการเรียนรู้นอกห้องเรียน'],
  },
  {
    title: 'ระบบสนับสนุนพิเศษ',
    items: ['ดูแลนักเรียน IEP', 'ประสานงานด้านความช่วยเหลือ', 'ติดตามการเข้าเรียนและการมีส่วนร่วม'],
  },
];

const studentBars = [
  { label: 'การเข้าร่วมกิจกรรม', value: '95%', bar: 'w-[95%]' },
  { label: 'การติดตามความประพฤติ', value: '93%', bar: 'w-[93%]' },
  { label: 'นักเรียนได้รับการดูแลครบถ้วน', value: '97%', bar: 'w-[97%]' },
  { label: 'การสื่อสารกับผู้ปกครอง', value: '90%', bar: 'w-[90%]' },
];

const StudentAffairsInfographic = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-orange-900 via-rose-800 to-amber-900 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">ข้อมูลสรุปฝ่ายกิจการนักเรียน</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ภาพรวมงานกิจการนักเรียน</h1>
            <p className="text-orange-100 max-w-3xl mx-auto text-lg">
              สรุปข้อมูลการดูแลนักเรียน กิจกรรมพัฒนา และงานสนับสนุนผู้เรียนในรูปแบบอินโฟกราฟิกสาธารณะ
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {studentStats.map((stat) => (
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
              {studentSections.map((section) => (
                <Card key={section.title} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-sm border-0 mb-12">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <h2 className="text-xl font-bold text-slate-900">ตัวชี้วัดการพัฒนาผู้เรียน</h2>
                </div>
                <div className="space-y-5">
                  {studentBars.map((chart) => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{chart.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{chart.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 ${chart.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3">สรุปภาพรวม</h2>
              <p className="text-slate-600 leading-relaxed">
                ฝ่ายกิจการนักเรียนให้ความสำคัญกับการดูแล พัฒนา และส่งเสริมศักยภาพของผู้เรียนในทุกมิติ
                ทั้งด้านพฤติกรรม ความปลอดภัย กิจกรรมเสริมทักษะ และการประสานงานกับผู้ปกครองเพื่อให้ผู้เรียนเติบโตอย่างเหมาะสม
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudentAffairsInfographic;
