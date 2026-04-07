import { useMemo } from 'react';
import { ChevronRight, Play, School, ShieldCheck, Users, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import heroImage from '@/assets/hero-school.jpg';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();

  const stats = [
    { icon: Users, value: settings.stat_students, label: settings.stat_students_label },
    { icon: Award, value: settings.stat_university, label: settings.stat_university_label },
    { icon: BookOpen, value: settings.stat_years, label: settings.stat_years_label },
  ];

  const highlights = useMemo(() => ([
    'ข้อมูลสรุปสำหรับผู้บริหารและบุคลากร',
    'หน้าแรกสาธารณะพร้อมสถิติและภาพรวมระบบ',
    'เข้าถึงการจัดการเอกสารและเวิร์กโฟลว์ได้รวดเร็ว',
  ]), []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={settings.school_name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-slate-900/70" />
      </div>

      <div className="relative z-10 container-school py-24 sm:py-28 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {settings.hero_badge}
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {settings.hero_title_1}
              <br />
              <span className="text-accent">{settings.hero_title_2}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {settings.school_description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Button
                onClick={() => navigate('/enrollment')}
                size="lg"
                className="gap-2 h-14 bg-accent px-8 font-semibold text-accent-foreground hover:bg-accent/90"
              >
                สมัครเรียน
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => scrollToSection('#about')}
                size="lg"
                variant="heroOutline"
                className="gap-2 h-14 px-8"
              >
                <Play className="w-5 h-5" />
                เรียนรู้เพิ่มเติม
              </Button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-md">
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-accent" />
                  <div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
                  <div className="text-xs leading-5 text-white/70 sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <School className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Public dashboard preview</p>
                    <h2 className="text-xl font-bold text-foreground">ภาพรวมระบบโรงเรียน</h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'เอกสาร', value: '128' },
                    { label: 'แจ้งซ่อม', value: '12' },
                    { label: 'เวรวันนี้', value: '04' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-muted/60 p-4">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <div className="mt-2 text-2xl font-bold text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
