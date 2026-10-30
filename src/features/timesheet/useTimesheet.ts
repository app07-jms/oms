import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decideAttendanceAdjustment,
  fetchAttendanceHistory,
} from '@/features/attendance/attendanceService';
import type { AttendanceRecord, DateRange } from '@/features/attendance/attendanceRules';
import { fetchEmployees } from '@/features/schedule/scheduleService';
import { useSession } from '@/features/auth/AuthProvider';
import type { Employee } from '@/features/schedule/scheduleRules';
import {
  buildTimesheetRows,
  filterTimesheetRows,
  getQuickRange,
  type QuickRangePreset,
  type TimesheetFilters,
  type TimesheetRow,
} from '@/features/timesheet/timesheetRules';

const DEFAULT_FILTERS: TimesheetFilters = { department: 'all', status: 'all', search: '' };

export function useTimesheet() {
  const [range, setRange] = useState<DateRange>(() => getQuickRange('this-month'));
  const [filters, setFilters] = useState<TimesheetFilters>(DEFAULT_FILTERS);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const hotelId = useSession().hotel.id;
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rows, employeeList] = await Promise.all([
        fetchAttendanceHistory(hotelId, { kind: 'hotel' }, range),
        fetchEmployees(),
      ]);
      setRecords(rows);
      setEmployees(employeeList);
      setLoadError(null);
    } catch {
      setLoadError('Không thể tải bảng chấm công. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const allRows = useMemo<TimesheetRow[]>(() => buildTimesheetRows(records, employees), [records, employees]);
  const rows = useMemo(() => filterTimesheetRows(allRows, filters), [allRows, filters]);
  const pendingRows = useMemo(() => rows.filter((row) => row.status === 'pending'), [rows]);

  const decide = useCallback(
    async (recordId: string, decision: 'approved' | 'rejected'): Promise<boolean> => {
      setDecidingId(recordId);
      setDecisionError(null);
      try {
        await decideAttendanceAdjustment(recordId, decision);
        await refresh();
        return true;
      } catch {
        setDecisionError('Không thể cập nhật đề xuất. Vui lòng thử lại.');
        return false;
      } finally {
        setDecidingId(null);
      }
    },
    [refresh]
  );

  const applyQuickRange = useCallback((preset: QuickRangePreset) => {
    setRange(getQuickRange(preset));
  }, []);

  return {
    range,
    setRange,
    applyQuickRange,
    filters,
    setFilters,
    rows,
    pendingRows,
    isLoading,
    loadError,
    decidingId,
    decisionError,
    decide,
  };
}
