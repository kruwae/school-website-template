import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock3, MapPin, Wrench } from 'lucide-react';
import {
  getCompletedMaintenanceRequestsPublic,
  type PublicMaintenanceRequest,
} from '@/lib/queries/maintenance';

const formatDate = (value?: string | null) => {
  if (!value) return 'ไม่ระบุวันที่';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ระบุวันที่';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDisplayTitle = (item: PublicMaintenanceRequest) => {
  return item.subject || item.title || 'รายการซ่อมเสร็จสิ้น';
};

export const CompletedRepairsSection = () => {
  const [items, setItems] = useState<PublicMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompletedRepairs = async () => {
      setLoading(true);
      try {
        const data = await getCompletedMaintenanceRequestsPublic(4);
        setItems(data);
      } catch (error) {
        console.warn('CompletedRepairsSection load error:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCompletedRepairs();
  }, []);

  return (
    <section className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ระบบซ่อมบำรุงสาธารณะ
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              งานซ่อมที่เสร็จสิ้นแล้ว
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              แสดงรายการซ่อมที่ปิดงานเรียบร้อยแล้ว เพื่อให้ชุมชนโรงเรียนเห็นความคืบหน้าโดยไม่ต้องเข้าสู่ระบบ
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            อัปเดตล่าสุดตามข้อมูลในระบบ
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <>
              {[0, 1].map((index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-6 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                      <div className="h-4 w-2/3 rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <Card key={item.id} className="overflow-hidden border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Wrench className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-700 shadow">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          เสร็จสิ้นแล้ว
                        </Badge>
                        {item.location && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.location}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {getDisplayTitle(item)}
                        </h3>
                        {item.summary && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {item.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          ปิดงาน: {formatDate(item.completed_at || item.updated_at)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          สถานะ: {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed lg:col-span-2">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium text-foreground">ยังไม่มีรายการซ่อมที่ปิดงาน</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  เมื่อมีงานซ่อมที่เสร็จสิ้น ระบบจะนำมาแสดงที่นี่แบบสาธารณะ
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};