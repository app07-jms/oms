import { ADJUSTMENT_REASONS, LATE_TOLERANCE_MINUTES, SHIFTS, type AdjustmentReason } from '@/config/attendance';
import type { DataScope } from '@/features/permissions/permissionRules';

export type AdjustmentStatus = 'pending' | 'approved' | 'rejected';
export type OvertimeStatus = 'approved' | 'rejected';
export type GpsStatus = 'valid' | 'out-of-range';

export interface GpsReading {
  status: GpsStatus;
  distanceM: number;
}

export type AttendanceScope =
  | { kind: 'self'; systemUid: string }
  | { kind: 'department'; departments: string[] }
  | { kind: 'hotel' };

export interface AttendanceRecord {
  id: string;
  hotelId: string;
  appUserSystemUid: string;
  employeeCode: string;
  employeeName: string | null;
  shiftName: string;
  workDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  adjustmentStatus: AdjustmentStatus | null;
  adjustmentReason: AdjustmentReason | null;
  adjustmentNote: string | null;
  otStatus: OvertimeStatus | null;
  checkInGps: GpsReading | null;
  checkOutGps: GpsReading | null;
  updatedAt: string;
}

export interface AttendanceAdjustmentRequest {
  reason: AdjustmentReason;
  note: string;
}

export type ShiftConfig = (typeof SHIFTS)[keyof typeof SHIFTS];

export type CheckInTiming = 'on-time' | 'late' | 'early';

export interface CheckInEvaluation {
  checkInAt: Date;
  shift: ShiftConfig;
  scheduledStart: Date;
  deltaMinutes: number;
  timing: CheckInTiming;
}

export type AttendanceStatus = 'on-shift' | 'off-shift' | 'pending';

export type RangePreset = 'this-month' | 'last-month' | 'last-7-days' | 'all';

export interface DateRange {
  from: string | null;
  to: string | null;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveShiftForCheckIn(checkIn: Date) {
  const hour = checkIn.getHours();
  return hour >= 4 && hour < 18 ? SHIFTS.day : SHIFTS.night;
}

export function evaluateCheckIn(checkInAt: Date): CheckInEvaluation {
  const shift = resolveShiftForCheckIn(checkInAt);
  const crossedMidnight = shift === SHIFTS.night && checkInAt.getHours() < 12;
  const scheduledStart = new Date(
    checkInAt.getFullYear(),
    checkInAt.getMonth(),
    checkInAt.getDate() - (crossedMidnight ? 1 : 0),
    shift.startHour
  );
  const deltaMinutes = Math.round((checkInAt.getTime() - scheduledStart.getTime()) / MINUTE_MS);
  const timing: CheckInTiming =
    deltaMinutes > LATE_TOLERANCE_MINUTES ? 'late' : deltaMinutes < -LATE_TOLERANCE_MINUTES ? 'early' : 'on-time';
  return { checkInAt, shift, scheduledStart, deltaMinutes, timing };
}

export function getAdjustmentReasonLabel(reason: AdjustmentReason): string {
  return ADJUSTMENT_REASONS.find((item) => item.value === reason)?.label ?? reason;
}

export function getPresetRange(preset: RangePreset, today: Date = new Date()): DateRange {
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (preset) {
    case 'this-month':
      return {
        from: toDateKey(new Date(year, month, 1)),
        to: toDateKey(new Date(year, month + 1, 0)),
      };
    case 'last-month':
      return {
        from: toDateKey(new Date(year, month - 1, 1)),
        to: toDateKey(new Date(year, month, 0)),
      };
    case 'last-7-days':
      return {
        from: toDateKey(new Date(year, month, today.getDate() - 6)),
        to: toDateKey(today),
      };
    case 'all':
      return { from: null, to: null };
  }
}

export function matchRangePreset(range: DateRange, today: Date = new Date()): RangePreset | 'custom' {
  const presets: RangePreset[] = ['this-month', 'last-month', 'last-7-days', 'all'];
  const match = presets.find((preset) => {
    const presetRange = getPresetRange(preset, today);
    return presetRange.from === range.from && presetRange.to === range.to;
  });
  return match ?? 'custom';
}

export interface CheckTiming {
  lateMinutes: number;
  earlyMinutes: number | null;
}

export function getCheckTiming(record: AttendanceRecord): CheckTiming {
  const checkIn = new Date(record.checkInAt);
  const { scheduledStart, shift } = evaluateCheckIn(checkIn);
  const lateMinutes = Math.round((checkIn.getTime() - scheduledStart.getTime()) / MINUTE_MS);
  if (!record.checkOutAt) return { lateMinutes, earlyMinutes: null };

  const durationHours = (shift.endHour - shift.startHour + 24) % 24;
  const scheduledEnd = scheduledStart.getTime() + durationHours * HOUR_MS;
  const earlyMinutes = Math.round((scheduledEnd - new Date(record.checkOutAt).getTime()) / MINUTE_MS);
  return { lateMinutes, earlyMinutes };
}

export function getAttendanceStatus(record: AttendanceRecord): AttendanceStatus {
  if (record.adjustmentStatus === 'pending') return 'pending';
  if (!record.checkOutAt) return 'pending';
  if (record.adjustmentStatus === 'approved') return 'on-shift';
  if (record.adjustmentStatus === 'rejected') return 'off-shift';

  const { lateMinutes, earlyMinutes } = getCheckTiming(record);
  const isOffShift = lateMinutes > LATE_TOLERANCE_MINUTES || (earlyMinutes ?? 0) > LATE_TOLERANCE_MINUTES;
  return isOffShift ? 'off-shift' : 'on-shift';
}
export function getWorkedMs(record: AttendanceRecord): number | null {
  if (!record.checkOutAt) return null;
  return new Date(record.checkOutAt).getTime() - new Date(record.checkInAt).getTime();
}

export function formatWorkDate(workDate: string): string {
  const [year, month, day] = workDate.split('-');
  return `${day}/${month}/${year}`;
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function resolveAttendanceScope(
  dataScope: DataScope,
  departments: string[],
  self: { systemUid: string },
): AttendanceScope {
  if (dataScope === 'hotel') return { kind: 'hotel' };
  if (dataScope === 'department') return { kind: 'department', departments };
  return { kind: 'self', systemUid: self.systemUid };
}

export function formatElapsedClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function formatShiftHours(shift: { startHour: number; endHour: number }): string {
  const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
  return `${pad(shift.startHour)} - ${pad(shift.endHour)}`;
}

export function formatWorkedDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} giờ ${String(minutes).padStart(2, '0')} phút`;
}

