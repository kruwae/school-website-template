import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ShieldCheck, Wrench, ClipboardCheck, Route, ThermometerSun } from 'lucide-react';

const generalStats = [
  {
    label: 'งานดูแลอาคาร',
    value: '18',
    description: 'รายการตรวจเช็กอาคารและพื้นที่บริการสาธารณะ',
    icon: Building2,
    color: 'bg-green-500',
  },
  {
    label: 'งานความปลอดภัย',
    value: '24',
    description: 'มาตรการและกิจกรรมด้านความปลอดภัยในโรงเรียน',
    icon: ShieldCheck,
    color: 'bg-emerald-500',
  },
  {
    label: 'แจ้งซ่อมที่ปิดงานแล้ว',
    value: '91%',
    description: 'สัดส่วนงานแจ้งซ่อมที่ดำเนินการแล้วเสร็จ',
    icon: Wrench,
    color: 'bg-lime-500',
  },
  {
    label: 'บันทึกเวรประจำวัน',
    value: '365',
    description: 'การบันทึกเวรและการดูแลความเรียบร้อยตลอดปี',
    icon: ClipboardCheck,
    color: 'bg-teal-500',
  },
];

const generalSections = [
  {
    title: 'อาคารสถานที่',
    items: ['ตรวจสภาพพื้นที่ใช้งาน', 'ดูแลห้องเรียนและห้องปฏิบัติการ', 'ปรับปรุงพื้นที่ให้เอื้อต่อผู้เรียน'],
  },
  {
    title: 'งานความปลอดภัย',
    items: ['แผนเฝ้าระวังเหตุฉุกเฉิน', 'การซ้อมอพยพ', 'ติดตามอุปกรณ์ความปลอดภัย'],
  },
  {
    title: 'ระบบงานบริการ',
    items: ['รับแจ้งซ่อมออนไลน์', 'ประสานงานภายในอาคาร', 'สนับสนุนกิจกรรมของโรงเรียน'],
  },
];

const flowBars = [
  { label: 'แจ้งเหตุ/แจ้งซ่อม', value: '98%', bar: 'w-[98%]' },
  { label: 'งานเวรและตรวจพื้นที่', value: '94%', bar: 'w-[94%]' },
  { label: 'ความพร้อมใช้งานอาคาร', value: '90%', bar: 'w-[90%]' },
  { label: 'การตอบสนองภายในเวลา', value: '87%', bar: 'w-[87%]' },
];

const GeneralAffairsInfographic = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">ข้อมูลสรุปฝ่ายบริหารทั่วไป</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ภาพรวมงานบริหารทั่วไป</h1>
            <p className="text-emerald-100 max-w-3xl mx-auto text-lg">
              รวบรวมข้อมูลการดูแลอาคารสถานที่ ความปลอดภัย และบริการสนับสนุนต่าง ๆ ของโรงเรียนในรูปแบบอินโฟกราฟิกสาธารณะ
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {generalStats.map((stat) => (
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
              {generalSections.map((section) => (
                <Card key={section.title} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
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
                  <Route className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">สรุปการดำเนินงานแบบกราฟแท่ง</h2>
                </div>
                <div className="space-y-5">
                  {flowBars.map((chart) => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{chart.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{chart.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 ${chart.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3">สรุปภาพรวม</h2>
              <p className="text-slate-600 leading-relaxed">
                ฝ่ายบริหารทั่วไปมุ่งเน้นการดูแลอาคารสถานที่ ความปลอดภัย และงานบริการสนับสนุนที่ช่วยให้การเรียนรู้ดำเนินไปอย่างเรียบร้อย
                พร้อมตอบสนองต่อเหตุแจ้งซ่อมและการใช้งานพื้นที่ของทุกคนในโรงเรียน
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GeneralAffairsInfographic;