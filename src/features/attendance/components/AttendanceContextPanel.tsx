import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { useSession } from '@/features/auth/AuthProvider';
import { formatShiftHours, resolveShiftForCheckIn, type GpsReading } from '@/features/attendance/attendanceRules';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { cn } from '@/lib/utils';

interface AttendanceContextPanelProps {
  lastGps: GpsReading | null;
  hasHotelLocation: boolean;
}

export function AttendanceContextPanel({ lastGps, hasHotelLocation }: AttendanceContextPanelProps) {
  const { account, hotel } = useSession();
  const { settings } = useHotelSettings();
  const shift = resolveShiftForCheckIn(new Date());
  const initials = account.fullName
    .split(' ')
    .slice(-2)
    .map((word) => word[0])
    .join('');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{account.fullName}</p>
          <p className="text-sm text-muted-foreground">{account.department ?? 'Chưa có bộ phận'}</p>
          <p className="text-xs text-muted-foreground">
            {account.employeeCode ? `Mã nhân viên: ${account.employeeCode}` : 'Chưa liên kết hồ sơ nhân viên'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-md border border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ca hôm nay</p>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-base font-semibold text-foreground">{shift.name}</p>
          <p className="text-sm tabular-nums text-muted-foreground">{formatShiftHours(shift)}</p>
        </div>
      </div>

      <GpsRow lastGps={lastGps} hasHotelLocation={hasHotelLocation} hotelName={hotel.name} radiusM={settings.geofenceRadiusM} />
    </div>
  );
}

interface GpsRowProps {
  lastGps: GpsReading | null;
  hasHotelLocation: boolean;
  hotelName: string;
  radiusM: number;
}

function GpsRow({ lastGps, hasHotelLocation, hotelName, radiusM }: GpsRowProps) {
  if (!hasHotelLocation) {
    return (
      <VerificationRow
        tone="warning"
        title="Vị trí: Chưa cấu hình"
        detail="Khách sạn chưa có tọa độ. Vui lòng cập nhật trong Cấu hình khách sạn."
      />
    );
  }
  if (!lastGps) {
    return (
      <VerificationRow
        tone="neutral"
        title="Vị trí: Chưa kiểm tra"
        detail={`Vị trí được kiểm tra khi vào và ra ca (bán kính ${radiusM} m quanh ${hotelName}).`}
      />
    );
  }
  const isValid = lastGps.status === 'valid';
  return (
    <VerificationRow
      tone={isValid ? 'success' : 'warning'}
      title={isValid ? 'Vị trí: Hợp lệ' : 'Vị trí: Ngoại lệ / Ngoài bán kính'}
      detail={`Cách ${hotelName} khoảng ${lastGps.distanceM} m (cho phép ${radiusM} m)`}
    />
  );
}

interface VerificationRowProps {
  tone: 'success' | 'warning' | 'neutral';
  title: string;
  detail: string;
}

function VerificationRow({ tone, title, detail }: VerificationRowProps) {
  const Icon = tone === 'success' ? CheckCircle2 : TriangleAlert;

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          tone === 'success' && 'bg-success/10 text-success',
          tone === 'warning' && 'bg-error/10 text-error',
          tone === 'neutral' && 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
