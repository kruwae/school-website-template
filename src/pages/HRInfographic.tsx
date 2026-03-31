import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, CalendarClock, Users, FileCheck, Shield, LineChart } from 'lucide-react';

const hrStats = [
  {
    label: 'บุคลากรทั้งหมด',
    value: '86',
    description: 'ครูและบุคลากรทางการศึกษาที่ปฏิบัติงานในโรงเรียน',
    icon: Users,
    color: 'bg-violet-500',
  },
  {
    label: 'คำขอลา',
    value: '214',
    description: 'จำนวนคำขอและกระบวนการอนุมัติที่ดำเนินการ',
    icon: CalendarClock,
    color: 'bg-fuchsia-500',
  },
  {
    label: 'เอกสารประเมิน',
    value: '97%',
    description: 'สัดส่วนเอกสารประเมินและบันทึกที่ครบถ้วน',
    icon: FileCheck,
    color: 'bg-indigo-500',
  },
  {
    label: 'ความพึงพอใจ',
    value: '92%',
    description: 'ผลสำรวจความพึงพอใจต่อการบริหารงานบุคคล',
    icon: BadgeCheck,
    color: 'bg-purple-500',
  },
];

const hrSections = [
  {
    title: 'การบริหารบุคลากร',
    items: ['จัดเก็บข้อมูลบุคลากร', 'ติดตามการปฏิบัติงาน', 'ประสานงานการพัฒนาศักยภาพ'],
  },
  {
    title: 'งานด้านสวัสดิการและลา',
    items: ['รับคำขอลาและอนุมัติ', 'ติดตามสถิติการลา', 'ดูแลข้อมูลสวัสดิการพื้นฐาน'],
  },
  {
    title: 'การประเมินและพัฒนา',
    items: ['สรุป PA และ SAR', 'ติดตามรอบประเมิน', 'จัดเตรียมข้อมูลพัฒนาวิชาชีพ'],
  },
];

const hrBars = [
  { label: 'ความครบถ้วนข้อมูลบุคลากร', value: '98%', bar: 'w-[98%]' },
  { label: 'การอนุมัติคำขอได้ตามเวลา', value: '94%', bar: 'w-[94%]' },
  { label: 'การจัดเก็บเอกสารประเมิน', value: '96%', bar: 'w-[96%]' },
  { label: 'การพัฒนาบุคลากร', value: '89%', bar: 'w-[89%]' },
];

const HRInfographic = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">ข้อมูลสรุปฝ่ายบริหารบุคคล</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ภาพรวมงานบริหารบุคคล</h1>
            <p className="text-violet-100 max-w-3xl mx-auto text-lg">
              แสดงข้อมูลบุคลากร การลา การประเมิน และการพัฒนางานบุคคลในรูปแบบอินโฟกราฟิกสาธารณะ
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {hrStats.map((stat) => (
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
              {hrSections.map((section) => (
                <Card key={section.title} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
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
                  <Shield className="w-5 h-5 text-violet-600" />
                  <h2 className="text-xl font-bold text-slate-900">ดัชนีการบริหารงานบุคคล</h2>
                </div>
                <div className="space-y-5">
                  {hrBars.map((chart) => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{chart.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{chart.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 ${chart.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3">สรุปภาพรวม</h2>
              <p className="text-slate-600 leading-relaxed">
                ฝ่ายบริหารบุคคลมุ่งเน้นการดูแลบุคลากรให้มีข้อมูลครบถ้วน สนับสนุนการลางาน การประเมินผล และการพัฒนาศักยภาพอย่างต่อเนื่อง
                เพื่อสร้างระบบงานบุคคลที่เป็นระเบียบ โปร่งใส และเอื้อต่อการทำงานของทั้งองค์กร
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HRInfographic;
