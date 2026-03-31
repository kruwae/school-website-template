import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Banknote, Boxes, PieChart, FileSpreadsheet, Target, TrendingUp } from 'lucide-react';

const budgetStats = [
  {
    label: 'งบประมาณประจำปี',
    value: '42.5M',
    description: 'กรอบงบประมาณที่จัดสรรสำหรับการดำเนินงานของโรงเรียน',
    icon: Banknote,
    color: 'bg-amber-500',
  },
  {
    label: 'รายการจัดซื้อ',
    value: '128',
    description: 'จำนวนรายการพัสดุและจัดซื้อจัดจ้างที่ดำเนินการ',
    icon: Boxes,
    color: 'bg-orange-500',
  },
  {
    label: 'การเบิกจ่าย',
    value: '93%',
    description: 'สัดส่วนการใช้จ่ายตามแผนงานที่ดำเนินการแล้ว',
    icon: TrendingUp,
    color: 'bg-emerald-500',
  },
  {
    label: 'รายงานการเงิน',
    value: '12',
    description: 'รายงานสรุปการเงินและการติดตามงบประมาณรายไตรมาส',
    icon: FileSpreadsheet,
    color: 'bg-yellow-500',
  },
];

const budgetSections = [
  {
    title: 'การวางแผนงบประมาณ',
    items: ['จัดทำแผนใช้จ่ายประจำปี', 'ติดตามงบประมาณตามโครงการ', 'วิเคราะห์ผลการใช้จ่าย'],
  },
  {
    title: 'งานพัสดุและจัดซื้อ',
    items: ['จัดซื้อครุภัณฑ์และวัสดุ', 'ตรวจรับและบันทึกพัสดุ', 'ควบคุมครุภัณฑ์ประจำโรงเรียน'],
  },
  {
    title: 'ติดตามผลการดำเนินงาน',
    items: ['สรุปผลการเบิกจ่าย', 'เปรียบเทียบแผนกับผลจริง', 'จัดทำข้อเสนอเพื่อพัฒนา'],
  },
];

const budgetBars = [
  { label: 'งบดำเนินงาน', value: '95%', bar: 'w-[95%]' },
  { label: 'งบลงทุน', value: '88%', bar: 'w-[88%]' },
  { label: 'งบพัสดุ', value: '91%', bar: 'w-[91%]' },
  { label: 'การติดตามเอกสาร', value: '97%', bar: 'w-[97%]' },
];

const BudgetInfographic = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">ข้อมูลสรุปฝ่ายงบประมาณ</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ภาพรวมงานงบประมาณ</h1>
            <p className="text-amber-100 max-w-3xl mx-auto text-lg">
              สรุปข้อมูลงบประมาณ การจัดซื้อจัดจ้าง และการติดตามผลการใช้จ่ายในรูปแบบอินโฟกราฟิกสาธารณะ
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {budgetStats.map((stat) => (
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
              {budgetSections.map((section) => (
                <Card key={section.title} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
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
                  <PieChart className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-bold text-slate-900">สัดส่วนการดำเนินงาน</h2>
                </div>
                <div className="space-y-5">
                  {budgetBars.map((chart) => (
                    <div key={chart.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{chart.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{chart.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 ${chart.bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3">สรุปภาพรวม</h2>
              <p className="text-slate-600 leading-relaxed">
                ฝ่ายงบประมาณดูแลการวางแผนการเงิน การจัดซื้อพัสดุ และการติดตามผลการใช้จ่ายให้สอดคล้องกับแผนพัฒนาคุณภาพของโรงเรียน
                เพื่อให้การดำเนินงานมีความโปร่งใส ตรวจสอบได้ และใช้ทรัพยากรอย่างคุ้มค่า
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BudgetInfographic;
