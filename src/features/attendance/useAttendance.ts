import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, useViewerRole } from '@/features/auth/AuthProvider';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { useRoles } from '@/features/permissions/useRoles';
import {
  evaluateCheckIn,
  resolveAttendanceScope,
  toDateKey,
  type AttendanceAdjustmentRequest,
  type AttendanceRecord,
  type AttendanceScope,
  type CheckInEvaluation,
  type DateRange,
  type GpsReading,
} from '@/features/attendance/attendanceRules';
import {
  fetchAttendanceHistory,
  fetchOpenAttendanceRecord,
  fetchTodayAttendanceRecord,
  insertCheckIn,
  updateCheckOut,
} from '@/features/attendance/attendanceService';
import { GeolocationError, getCurrentCoordinates, readGeofence } from '@/features/attendance/attendanceGps';
import {
  clearOpenShiftMirror,
  readOpenShiftMirror,
  writeOpenShiftMirror,
} from '@/features/attendance/attendanceMirror';

const LOAD_ERROR = 'Không thể tải dữ liệu chấm công. Vui lòng thử lại.';
const CHECK_IN_ERROR = 'Không thể vào ca. Vui lòng thử lại.';
const CHECK_OUT_ERROR = 'Không thể ra ca. Vui lòng thử lại.';
const ADJUSTMENT_ERROR = 'Không thể gửi đề xuất. Vui lòng thử lại.';
const NO_EMPLOYEE_ERROR = 'Tài khoản này chưa liên kết hồ sơ nhân viên nên không thể chấm công.';
const NO_HOTEL_LOCATION_ERROR = 'Khách sạn chưa cấu hình vị trí. Vui lòng cập nhật trong Cấu hình khách sạn.';
const SCOPE_DESCRIPTIONS: Record<AttendanceScope['kind'], string> = {
  self: 'Chỉ hiển thị dữ liệu của bạn.',
  department: 'Hiển thị dữ liệu các bộ phận được phân công.',
  hotel: 'Hiển thị dữ liệu toàn khách sạn.',
};

export function useAttendance(range: DateRange) {
  const session = useSession();
  const { roleKey } = useViewerRole();
  const { settings } = useHotelSettings();
  const roles = useRoles();
  const { account, hotel } = session;
  const { systemUid, employeeCode } = account;
  const hotelId = hotel.id;

  const viewerRole = roles.data?.find((role) => role.key === roleKey) ?? null;
  const dataScope = viewerRole?.dataScope ?? null;
  const scopeDepartments = viewerRole?.departments.join('|') ?? '';
  const scope = useMemo(
    () =>
      dataScope === null
        ? null
        : resolveAttendanceScope(dataScope, scopeDepartments ? scopeDepartments.split('|') : [], { systemUid }),
    [dataScope, scopeDepartments, systemUid],
  );

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [openRecord, setOpenRecord] = useState<AttendanceRecord | null>(() =>
    readOpenShiftMirror(hotelId, systemUid),
  );
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [pendingCheckIn, setPendingCheckIn] = useState<{ evaluation: CheckInEvaluation; gps: GpsReading } | null>(
    null,
  );
  const [lastGps, setLastGps] = useState<GpsReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!scope) return;
    try {
      const todayKey = toDateKey(new Date());
      const [history, open, today] = await Promise.all([
        fetchAttendanceHistory(hotelId, scope, range),
        fetchOpenAttendanceRecord(hotelId, systemUid),
        fetchTodayAttendanceRecord(hotelId, systemUid, todayKey),
      ]);
      setRecords(history);
      setOpenRecord(open);
      setTodayRecord(today);
      if (open) writeOpenShiftMirror(open);
      else clearOpenShiftMirror(hotelId, systemUid);
      setError(null);
    } catch {
      setError(LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [scope, range, hotelId, systemUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const captureGeofence = useCallback(async (): Promise<GpsReading> => {
    if (settings.latitude === null || settings.longitude === null) throw new GeolocationError(NO_HOTEL_LOCATION_ERROR);
    const position = await getCurrentCoordinates();
    const reading = readGeofence(
      position,
      { latitude: settings.latitude, longitude: settings.longitude },
      settings.geofenceRadiusM,
    );
    setLastGps(reading);
    return reading;
  }, [settings]);

  const runAction = useCallback(
    async (action: () => Promise<void>, fallbackError: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await action();
      } catch (actionError) {
        setError(actionError instanceof GeolocationError ? actionError.message : fallbackError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const checkIn = useCallback(async () => {
    if (!employeeCode) {
      setError(NO_EMPLOYEE_ERROR);
      return;
    }
    await runAction(async () => {
      const gps = await captureGeofence();
      const evaluation = evaluateCheckIn(new Date());
      if (evaluation.timing !== 'on-time') {
        setPendingCheckIn({ evaluation, gps });
        return;
      }
      const record = await insertCheckIn({ hotelId, systemUid, employeeCode, evaluation, gps, adjustment: null });
      writeOpenShiftMirror(record);
      setOpenRecord(record);
      await refresh();
    }, CHECK_IN_ERROR);
  }, [employeeCode, runAction, captureGeofence, hotelId, systemUid, refresh]);

  const submitAdjustment = useCallback(
    async (request: AttendanceAdjustmentRequest): Promise<boolean> => {
      if (!pendingCheckIn || !employeeCode) return false;
      const { evaluation, gps } = pendingCheckIn;
      let submitted = false;
      await runAction(async () => {
        const record = await insertCheckIn({ hotelId, systemUid, employeeCode, evaluation, gps, adjustment: request });
        writeOpenShiftMirror(record);
        setPendingCheckIn(null);
        setOpenRecord(record);
        submitted = true;
        await refresh();
      }, ADJUSTMENT_ERROR);
      return submitted;
    },
    [pendingCheckIn, employeeCode, runAction, hotelId, systemUid, refresh],
  );

  const dismissAdjustment = useCallback(() => setPendingCheckIn(null), []);

  const checkOut = useCallback(async () => {
    if (!openRecord) return;
    const recordId = openRecord.id;
    await runAction(async () => {
      const gps = await captureGeofence();
      await updateCheckOut(recordId, new Date(), gps);
      clearOpenShiftMirror(hotelId, systemUid);
      setOpenRecord(null);
      await refresh();
    }, CHECK_OUT_ERROR);
  }, [openRecord, runAction, captureGeofence, hotelId, systemUid, refresh]);

  return {
    records,
    openRecord,
    todayRecord,
    pendingCheckIn,
    lastGps,
    isLoading,
    isSubmitting,
    error,
    canCheckIn: employeeCode !== null,
    hasHotelLocation: settings.latitude !== null && settings.longitude !== null,
    historyDescription: scope ? SCOPE_DESCRIPTIONS[scope.kind] : '',
    checkIn,
    checkOut,
    submitAdjustment,
    dismissAdjustment,
  };
}
