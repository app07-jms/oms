import { AttendanceActionPanel } from '@/features/attendance/components/AttendanceActionPanel';
import { AttendanceContextPanel } from '@/features/attendance/components/AttendanceContextPanel';
import type { AttendanceRecord, GpsReading } from '@/features/attendance/attendanceRules';

interface AttendanceCheckCardProps {
  openRecord: AttendanceRecord | null;
  todayRecord: AttendanceRecord | null;
  lastGps: GpsReading | null;
  hasHotelLocation: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  canCheckIn: boolean;
  error: string | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceCheckCard({ lastGps, hasHotelLocation, ...actionProps }: AttendanceCheckCardProps) {
  return (
    <section className="grid overflow-hidden rounded-lg border border-border bg-background shadow-sm lg:grid-cols-2">
      <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
        <AttendanceContextPanel lastGps={lastGps} hasHotelLocation={hasHotelLocation} />
      </div>
      <div className="p-6 sm:p-8">
        <AttendanceActionPanel {...actionProps} />
      </div>
    </section>
  );
}
