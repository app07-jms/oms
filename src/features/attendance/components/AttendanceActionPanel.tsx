import { LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatClockTime,
  formatElapsedClock,
  formatWorkedDuration,
  getWorkedMs,
  type AttendanceRecord,
} from '@/features/attendance/attendanceRules';
import { cn } from '@/lib/utils';

interface AttendanceActionPanelProps {
  openRecord: AttendanceRecord | null;
  todayRecord: AttendanceRecord | null;
  isLoading: boolean;
  isSubmitting: boolean;
  canCheckIn: boolean;
  error: string | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceActionPanel({
  openRecord,
  todayRecord,
  isLoading,
  isSubmitting,
  canCheckIn,
  error,
  onCheckIn,
  onCheckOut,
}: AttendanceActionPanelProps) {
  const now = useNow();
  const completedRecord = !openRecord && todayRecord?.checkOutAt ? todayRecord : null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-5xl font-semibold tabular-nums tracking-tight text-foreground">
          {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </p>
        <p className="text-sm capitalize text-muted-foreground">
          {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải trạng thái ca...</p>
      ) : openRecord ? (
        <ActiveShift record={openRecord} now={now} />
      ) : completedRecord ? (
        <CompletedShift record={completedRecord} />
      ) : (
        <IdleShift />
      )}

      {!isLoading && !completedRecord && (
        <Button
          size="lg"
          disabled={isSubmitting || (!openRecord && !canCheckIn)}
          onClick={openRecord ? onCheckOut : onCheckIn}
          className={cn(
            'h-16 w-full max-w-xs gap-3 rounded-lg text-lg font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]',
            openRecord ? 'bg-pending hover:bg-pending/90' : 'bg-success hover:bg-success/90',
          )}
        >
          {openRecord ? <LogOut className="h-6 w-6" aria-hidden="true" /> : <LogIn className="h-6 w-6" aria-hidden="true" />}
          {isSubmitting ? 'Đang xác định vị trí...' : openRecord ? 'Ra ca' : 'Vào ca'}
        </Button>
      )}

      {!canCheckIn && (
        <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm font-medium text-error">
          Tài khoản này chưa liên kết hồ sơ nhân viên nên không thể chấm công.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function ActiveShift({ record, now }: { record: AttendanceRecord; now: Date }) {
  const elapsed = now.getTime() - new Date(record.checkInAt).getTime();
  return (
    <div className="flex flex-col items-center gap-3">
      <Badge className="border-transparent bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary">
        Đang trong ca
      </Badge>
      <p className="text-3xl font-semibold tabular-nums text-foreground">{formatElapsedClock(elapsed)}</p>
      <p className="text-sm text-muted-foreground">Đã vào ca lúc {formatClockTime(record.checkInAt)}</p>
    </div>
  );
}

function CompletedShift({ record }: { record: AttendanceRecord }) {
  const workedMs = getWorkedMs(record);
  return (
    <div className="flex flex-col items-center gap-3">
      <Badge className="border-transparent bg-success/10 px-4 py-1.5 text-sm text-success hover:bg-success/10">
        Đã hoàn thành ca
      </Badge>
      <p className="text-base font-semibold text-foreground">
        {workedMs === null ? '—' : formatWorkedDuration(workedMs)}
      </p>
      <p className="text-sm text-muted-foreground">
        Vào ca {formatClockTime(record.checkInAt)} · Ra ca {record.checkOutAt ? formatClockTime(record.checkOutAt) : '—'}
      </p>
    </div>
  );
}

function IdleShift() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Badge className="border-transparent bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-muted">
        Chưa vào ca
      </Badge>
      <p className="text-sm text-muted-foreground">Nhấn "Vào ca" khi bắt đầu ca làm việc. Vị trí của bạn sẽ được kiểm tra.</p>
    </div>
  );
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);
  return now;
}
