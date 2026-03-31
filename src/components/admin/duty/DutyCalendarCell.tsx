import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DutyCalendarItem {
    id: string;
    title: string;
    subtitle?: string;
    ownerName: string;
    finalDutyName?: string | null;
    finalDutyPosition?: string | null;
    statusLabel: string;
    swapResponseStatus?: string | null;
    approvalReady?: boolean;
    status?: string;
    notes?: string | null;
}

interface DutyCalendarCellProps {
    dateLabel: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    items: DutyCalendarItem[];
    onClick?: () => void;
}

const getItemTone = (item: DutyCalendarItem) => {
    if (item.status === 'recorded' || item.status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    if (item.swapResponseStatus === 'pending') return 'border-amber-200 bg-amber-50 text-amber-900';
    if (item.swapResponseStatus === 'accepted') return 'border-blue-200 bg-blue-50 text-blue-900';
    if (item.swapResponseStatus === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-900';
    if (item.approvalReady) return 'border-sky-200 bg-sky-50 text-sky-900';
    return 'border-border bg-background text-foreground';
};

export const DutyCalendarCell = ({ dateLabel, dayNumber, isCurrentMonth, isToday, items, onClick }: DutyCalendarCellProps) => {
    return (
        <Card
            className={cn(
                'min-h-[140px] rounded-xl border p-2 transition-colors',
                isCurrentMonth ? 'bg-background' : 'bg-muted/20 text-muted-foreground',
                isToday && 'ring-2 ring-primary/35',
                onClick && 'cursor-pointer hover:border-primary/40 hover:bg-muted/10'
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">{dateLabel}</div>
                    <div className={cn('text-lg font-semibold leading-none', isToday && 'text-primary')}>{dayNumber}</div>
                </div>
                {items.length > 0 && <Badge variant="outline" className="rounded-full">{items.length}</Badge>}
            </div>

            <div className="mt-2 space-y-2">
                {items.slice(0, 4).map(item => (
                    <div key={item.id} className={cn('rounded-lg border px-2 py-1.5 text-xs shadow-sm', getItemTone(item))}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold truncate">{item.title}</span>
                            <span className="shrink-0">{item.statusLabel}</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                            <p className="truncate">ผู้เข้าเวร: {item.ownerName}</p>
                            <p className="truncate">ผู้ปฏิบัติสุดท้าย: {item.finalDutyName || item.ownerName}</p>
                            {item.finalDutyPosition && <p className="truncate text-[11px] opacity-80">{item.finalDutyPosition}</p>}
                        </div>
                    </div>
                ))}
                {items.length > 4 && <div className="text-[11px] text-muted-foreground">+{items.length - 4} รายการเพิ่มเติม</div>}
            </div>
        </Card>
    );
};