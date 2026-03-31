import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, GraduationCap, ClipboardList, Award, LineChart } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const academicStats = [
  {
    label: 'แผนการเรียน',
    value: '6',
    description: 'หลักสูตรและแนวทางการเรียนรู้ที่เปิดสอน',
    icon: BookOpen,
    color: 'bg-blue-500',
  },
  {
    label: 'ครูและบุคลากร',
    value: '48',
    description: 'ทีมวิชาการและครูผู้สอนที่ดูแลนักเรียน',
    icon: Users,
    color: 'bg-emerald-500',
  },
  {
    label: 'ผลสัมฤทธิ์เฉลี่ย',
    value: '89%',
    description: 'ภาพรวมผลการเรียนรู้ของนักเรียนในปีล่าสุด',
    icon: LineChart,
    color: 'bg-indigo-500',
  },
  {
    label: 'ผลงานเด่น',
    value: '12',
    description: 'โครงงาน กิจกรรม และรางวัลด้านวิชาการ',
    icon: Award,
    color: 'bg-amber-500',
  },
];

const academicSections = [
  {
    title: 'งานประกันคุณภาพ',
    items: ['ติดตามตัวชี้วัด QA', 'สรุปรายงานประเมินตนเอง', 'เตรียมข้อมูลรับการประเมิน'],
  },
  {
    title: 'แผนการเรียนรู้',
    items: ['แผนสอนรายวิชา', 'แผนเสริมทักษะ', 'การสรุปผลการเรียน'],
  },
  {
    title: 'โครงการพิเศษ',
    items: ['IEP สำหรับผู้เรียนพิเศษ', 'IIP และ ITP', 'กิจกรรมยกระดับผลสัมฤทธิ์'],
  },
];

const academicCharts = [
  { label: 'แผนสอนส่งตรงเวลา', value: '96%', bar: 'w-[96%]' },
  { label: 'เอกสาร QA ครบถ้วน', value: '92%', bar: 'w-[92%]' },
  { label: 'กิจกรรมพัฒนาผู้เรียน', value: '88%', bar: 'w-[88%]' },
  { label: 'การใช้สื่อเทคโนโลยี', value: '84%', bar: 'w-[84%]' },
];

const AcademicInfographic = () => {
  const { settings } = useSchoolSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">ข้อมูลสรุปฝ่ายวิชาการ</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ภาพรวมงานวิชาการ</h1>
            <p className="text-blue-100 max-w-3xl mx-auto text-lg">
              แสดงข้อมูลสรุปการเรียนการสอน การประกันคุณภาพ และผลงานทางวิชาการของโรงเรียนในรูปแบบที่อ่านง่ายและเป็นสาธารณะ
            </p>
            <p className="text-blue-100/80 mt-4 text-sm">ปีการศึกษา {settings.academic_year}</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {academicStats.map((stat) => (
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
              {academicSections.map((section) => (
                <Card key={section.title} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
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
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">ตัวชี้วัดสำคัญแบบกราฟแท่ง</h2>
                </div>
                <div className="space-y-5">
                  {academicCharts.map((chart) => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{chart.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{chart.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 ${chart.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3">สรุปภาพรวม</h2>
              <p className="text-slate-600 leading-relaxed">
                ฝ่ายวิชาการมุ่งเน้นการพัฒนาคุณภาพการเรียนรู้ การจัดทำเอกสารหลักสูตร และการติดตามผลการเรียนอย่างต่อเนื่อง
                เพื่อสนับสนุนผู้เรียนให้ได้รับโอกาสทางการศึกษาที่เหมาะสมและมีคุณภาพสูงสุด
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AcademicInfographic;