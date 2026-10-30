import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { CURRENT_EMPLOYEE, SHIFTS } from '@/config/attendance';
import { distanceInMeters, type Coordinates } from '@/lib/geo';
import { formatShiftHours } from '@/features/attendance/attendanceRules';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { cn } from '@/lib/utils';

const METERS_PER_DEGREE_LATITUDE = 111_320;
const IN_RANGE_OFFSET_RATIO = 0.1;
const OUT_OF_RANGE_RADIUS_MULTIPLE = 3;

interface AttendanceContextPanelProps {
  isInRange: boolean;
  isDeviceValid: boolean;
}

function offsetNorth(center: Coordinates, meters: number): Coordinates {
  return { latitude: center.latitude + meters / METERS_PER_DEGREE_LATITUDE, longitude: center.longitude };
}

export function AttendanceContextPanel({ isInRange, isDeviceValid }: AttendanceContextPanelProps) {
  const { settings } = useHotelSettings();
  const initials = CURRENT_EMPLOYEE.fullName
    .split(' ')
    .slice(-2)
    .map((word) => word[0])
    .join('');

  const center =
    settings.latitude !== null && settings.longitude !== null
      ? { latitude: settings.latitude, longitude: settings.longitude }
      : null;
  const radius = settings.geofenceRadiusM;
  const simulatedPosition = center
    ? offsetNorth(center, isInRange ? radius * IN_RANGE_OFFSET_RATIO : radius * OUT_OF_RANGE_RADIUS_MULTIPLE)
    : null;
  const distance =
    center && simulatedPosition ? Math.round(distanceInMeters(center, simulatedPosition)) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{CURRENT_EMPLOYEE.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {CURRENT_EMPLOYEE.position} · {CURRENT_EMPLOYEE.department}
          </p>
          <p className="text-xs text-muted-foreground">Mã nhân viên: {CURRENT_EMPLOYEE.code}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-md border border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ca hôm nay</p>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-base font-semibold text-foreground">{SHIFTS.day.name}</p>
          <p className="text-sm tabular-nums text-muted-foreground">{formatShiftHours(SHIFTS.day)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <VerificationRow
          isValid={isInRange}
          validText="GPS: Hợp lệ"
          invalidText="GPS: Ngoài bán kính"
          detail={
            distance === null
              ? 'Chưa cấu hình vị trí khách sạn. Vui lòng cập nhật trong Cấu hình khách sạn.'
              : `Cách ${settings.name} khoảng ${distance} m (cho phép ${radius} m)`
          }
        />
        <VerificationRow
          isValid={isDeviceValid}
          validText="Thiết bị: Đã xác thực"
          invalidText="Thiết bị: Chưa xác thực"
        />
      </div>
    </div>
  );
}

interface VerificationRowProps {
  isValid: boolean;
  validText: string;
  invalidText: string;
  detail?: string;
}

function VerificationRow({ isValid, validText, invalidText, detail }: VerificationRowProps) {
  const Icon = isValid ? CheckCircle2 : TriangleAlert;

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isValid ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{isValid ? validText : invalidText}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}
