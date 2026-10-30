import type { AttendanceRecord } from '@/features/attendance/attendanceRules';

const KEY_PREFIX = 'oms.attendance.open';

function mirrorKey(hotelId: string, systemUid: string): string {
  return `${KEY_PREFIX}:${hotelId}:${systemUid}`;
}

export function readOpenShiftMirror(hotelId: string, systemUid: string): AttendanceRecord | null {
  try {
    const raw = window.localStorage.getItem(mirrorKey(hotelId, systemUid));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as AttendanceRecord;
    return typeof record.id === 'string' && typeof record.checkInAt === 'string' && record.checkOutAt === null
      ? record
      : null;
  } catch {
    return null;
  }
}

export function writeOpenShiftMirror(record: AttendanceRecord): void {
  window.localStorage.setItem(mirrorKey(record.hotelId, record.appUserSystemUid), JSON.stringify(record));
}

export function clearOpenShiftMirror(hotelId: string, systemUid: string): void {
  window.localStorage.removeItem(mirrorKey(hotelId, systemUid));
}
