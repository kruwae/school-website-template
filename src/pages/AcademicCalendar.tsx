import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Clock, MapPin, BookOpen, GraduationCap, Trophy, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const semesters = [
  { id: '1', label: 'ภาคเรียนที่ 1' },
  { id: '2', label: 'ภาคเรียนที่ 2' },
];

// Map database categories to display types
const eventTypes = {
  academic: { label: 'วิชาการ', color: 'bg-blue-500', icon: BookOpen },
  sports: { label: 'กีฬา', color: 'bg-green-500', icon: Trophy },
  cultural: { label: 'วัฒนธรรม', color: 'bg-purple-500', icon: GraduationCap },
  general: { label: 'ทั่วไป', color: 'bg-orange-500', icon: Users },
};

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  category: string | null;
  image_url?: string | null;
}

const AcademicCalendar = () => {
  const [activeSemester, setActiveSemester] = useState('1');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSchoolSettings();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await (supabase.from('events' as any) as any)
        .select('id, title, description, event_date, event_time, location, category, image_url')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      const normalizedEvents = Array.isArray(data)
        ? data.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description ?? null,
            event_date: event.event_date ?? null,
            event_time: event.event_time ?? null,
            location: event.location ?? null,
            category: event.category ?? null,
            image_url: event.image_url ?? null,
          })) as Event[]
        : [];

      if (error) throw error;
      setEvents(normalizedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group events by semester based on date
  const getEventsBySemester = (semester: string) => {
    const currentYear = new Date().getFullYear();

    return events.filter(event => {
      const eventDate = new Date(event.event_date || Date.now());
      const month = eventDate.getMonth() + 1; // 1-12

      if (semester === '1') {
        // Semester 1: May (5) - September (9)
        return month >= 5 && month <= 9;
      } else {
        // Semester 2: November (11) - March (3)
        return month >= 11 || month <= 3;
      }
    });
  };

  const semesterEvents = getEventsBySemester(activeSemester);
  const filteredEvents = selectedType
    ? semesterEvents.filter(e => e.category === selectedType)
    : semesterEvents;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="container-school text-center">
          <Badge className="mb-4 bg-accent/20 text-accent border-0">ปฏิทินการศึกษา</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-card mb-4">
            ปฏิทินการศึกษา {settings.academic_year}
          </h1>
          <p className="text-card/80 text-lg max-w-2xl mx-auto">
            กำหนดการสำคัญตลอดปีการศึกษาของโรงเรียนโสตศึกษา
          </p>
        </div>
      </section>

      {/* Calendar Content */}
      <section className="py-16">
        <div className="container-school">
          {/* Event Type Legend */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="rounded-full"
            >
              ทั้งหมด
            </Button>
            {Object.entries(eventTypes).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(key)}
                className="rounded-full gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${value.color}`} />
                {value.label}
              </Button>
            ))}
          </div>

          {/* Semester Tabs */}
          <Tabs value={activeSemester} onValueChange={setActiveSemester} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              {semesters.map((sem) => (
                <TabsTrigger key={sem.id} value={sem.id} className="text-base">
                  {sem.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {semesters.map((sem) => (
              <TabsContent key={sem.id} value={sem.id}>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">ยังไม่มีกิจกรรมในภาคเรียนนี้</h3>
                    <p className="text-muted-foreground">
                      โปรดติดตามกิจกรรมใหม่ ๆ ที่จะมีขึ้น
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

                    {/* Events */}
                    <div className="space-y-6">
                      {filteredEvents.map((event) => {
                        const eventTypeKey = (event.category || 'general') as keyof typeof eventTypes;
                        const eventType = eventTypes[eventTypeKey] || eventTypes.general;
                        const Icon = eventType.icon;

                        return (
                          <div key={event.id} className="relative flex gap-6">
                            {/* Timeline Dot */}
                            <div className="hidden md:flex flex-shrink-0 w-16 items-start justify-center pt-6">
                              <div className={`w-4 h-4 rounded-full ${eventType.color} ring-4 ring-background`} />
                            </div>

                            {/* Event Card */}
                            <Card className="flex-1 hover:shadow-lg transition-shadow">
                              <CardContent className="p-0">
                                {/* Event Image */}
                                {event.image_url && (
                                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                                    <img
                                      src={event.image_url}
                                      alt={event.title}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                      onClick={() => window.open(event.image_url!, '_blank')}
                                    />
                                  </div>
                                )}

                                <div className="p-6">
                                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${eventType.color} flex items-center justify-center flex-shrink-0`}>
                                      <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {eventType.label}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {formatDate(event.event_date)}
                                        </span>
                                      </div>
                                      <h3 className="text-lg font-bold text-foreground mb-2">
                                        {event.title}
                                      </h3>
                                      {event.description && (
                                        <p className="text-muted-foreground mb-4">
                                          {event.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        {event.event_time && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {event.event_time} น.
                                          </span>
                                        )}
                                        {event.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {event.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Download Calendar */}
          <div className="text-center mt-12 space-y-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (settings.academic_calendar_url) {
                  window.open(settings.academic_calendar_url, '_blank');
                }
              }}
              disabled={!settings.academic_calendar_url}
            >
              <Calendar className="w-4 h-4" />
              ดาวน์โหลดปฏิทินการศึกษา (PDF)
            </Button>
            <div>
              <Link to="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  กลับหน้าหลัก
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AcademicCalendar;
