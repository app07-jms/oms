import { LATE_TOLERANCE_MINUTES } from '@/config/attendance';
import { normalizeSearchText } from '@/lib/text';
import {
  getCheckTiming,
  getWorkedMs,
  toDateKey,
  type AdjustmentStatus,
  type AttendanceRecord,
  type DateRange,
} from '@/features/attendance/attendanceRules';
import type { Employee, ScheduleEntry } from '@/features/schedule/scheduleRules';
import { getTimesheetStatus, type TimesheetStatus } from '@/features/timesheet/timesheetRules';

const HOUR_MS = 3_600_000;

export type OvertimeState = 'none' | 'pending' | 'approved' | 'rejected';

export interface PayrollAdjustment {
  id: string;
  attendanceRecordId: string;
  employeeCode: string;
  workDate: string;
  proposedCheckInAt: string;
  proposedCheckOutAt: string | null;
  reason: string;
  status: AdjustmentStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface ClosingRow {
  record: AttendanceRecord;
  employee: Employee | null;
  workedHours: number | null;
  otHours: number;
  otState: OvertimeState;
  creditedHours: number;
  isTimingIssue: boolean;
  status: TimesheetStatus;
  adjustments: PayrollAdjustment[];
  pendingAdjustment: PayrollAdjustment | null;
}

export interface ClosingKpis {
  creditedHours: number;
  timingIssueCount: number;
  approvedOtHours: number;
  pendingOtCount: number;
  pendingAdjustmentCount: number;
  offDays: number;
  pDays: number;
  upDays: number;
}

export interface LockSnapshot {
  employee_code: string;
  full_name: string;
  department: string;
  credited_hours: number;
  ot_hours: number;
  off_days: number;
  p_days: number;
  up_days: number;
}

export function toDateTimeInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeInputValue(value: string): string {
  return new Date(value).toISOString();
}

export function getCurrentPeriod(today: Date = new Date()): string {
  return toDateKey(today).slice(0, 7);
}

export function getPeriodRange(period: string): DateRange {
  const [year, month] = period.split('-').map(Number);
  return {
    from: `${period}-01`,
    to: toDateKey(new Date(year, month, 0)),
  };
}

export function formatCredit(hours: number, standardShiftHours: number): string {
  return `${(hours / standardShiftHours).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} công`;
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} giờ`;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupAdjustmentsByRecord(adjustments: PayrollAdjustment[]): Map<string, PayrollAdjustment[]> {
  const grouped = new Map<string, PayrollAdjustment[]>();
  for (const adjustment of adjustments) {
    const list = grouped.get(adjustment.attendanceRecordId) ?? [];
    list.push(adjustment);
    grouped.set(adjustment.attendanceRecordId, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return grouped;
}

export function buildClosingRows(
  records: AttendanceRecord[],
  employees: Employee[],
  adjustments: PayrollAdjustment[],
  standardShiftHours: number
): ClosingRow[] {
  const employeeByCode = new Map(employees.map((employee) => [employee.code, employee]));
  const adjustmentsByRecord = groupAdjustmentsByRecord(adjustments);

  return records
    .map((record) => {
      const workedMs = getWorkedMs(record);
      const workedHours = workedMs === null ? null : workedMs / HOUR_MS;
      const otHours = workedHours === null ? 0 : Math.max(0, workedHours - standardShiftHours);
      const otState: OvertimeState = otHours === 0 ? 'none' : (record.otStatus ?? 'pending');
      const creditedHours =
        workedHours === null
          ? 0
          : otState === 'pending' || otState === 'rejected'
            ? Math.min(workedHours, standardShiftHours)
            : workedHours;
      const { lateMinutes, earlyMinutes } = getCheckTiming(record);
      const recordAdjustments = adjustmentsByRecord.get(record.id) ?? [];

      return {
        record,
        employee: employeeByCode.get(record.employeeCode) ?? null,
        workedHours,
        otHours,
        otState,
        creditedHours,
        isTimingIssue: lateMinutes > LATE_TOLERANCE_MINUTES || (earlyMinutes ?? 0) > LATE_TOLERANCE_MINUTES,
        status: getTimesheetStatus(record),
        adjustments: recordAdjustments,
        pendingAdjustment: recordAdjustments.find((item) => item.status === 'pending') ?? null,
      };
    })
    .sort((a, b) => {
      if (a.record.workDate !== b.record.workDate) return a.record.workDate < b.record.workDate ? 1 : -1;
      return new Date(b.record.checkInAt).getTime() - new Date(a.record.checkInAt).getTime();
    });
}

export interface ClosingFilters {
  department: string;
  status: TimesheetStatus | 'all';
  search: string;
}

export const DEFAULT_CLOSING_FILTERS: ClosingFilters = { department: 'all', status: 'all', search: '' };

export function applyClosingFilters(
  rows: ClosingRow[],
  schedules: ScheduleEntry[],
  employees: Employee[],
  filters: ClosingFilters
): { rows: ClosingRow[]; schedules: ScheduleEntry[] } {
  const query = normalizeSearchText(filters.search);
  const inScopeCodes = new Set(
    employees
      .filter((employee) => {
        if (filters.department !== 'all' && employee.department !== filters.department) return false;
        if (!query) return true;
        return (
          normalizeSearchText(employee.fullName).includes(query) || normalizeSearchText(employee.code).includes(query)
        );
      })
      .map((employee) => employee.code)
  );

  return {
    rows: rows.filter(
      (row) =>
        inScopeCodes.has(row.record.employeeCode) && (filters.status === 'all' || row.status === filters.status)
    ),
    schedules: schedules.filter((entry) => inScopeCodes.has(entry.employeeCode)),
  };
}

function countShift(schedules: ScheduleEntry[], shiftCode: string, employeeCode?: string): number {
  return schedules.filter(
    (entry) => entry.shiftCode === shiftCode && (employeeCode === undefined || entry.employeeCode === employeeCode)
  ).length;
}

export function buildClosingKpis(rows: ClosingRow[], schedules: ScheduleEntry[]): ClosingKpis {
  return {
    creditedHours: rows.reduce((sum, row) => sum + row.creditedHours, 0),
    timingIssueCount: rows.filter((row) => row.isTimingIssue).length,
    approvedOtHours: rows.reduce((sum, row) => sum + (row.otState === 'approved' ? row.otHours : 0), 0),
    pendingOtCount: rows.filter((row) => row.otState === 'pending').length,
    pendingAdjustmentCount: rows.filter((row) => row.pendingAdjustment !== null).length,
    offDays: countShift(schedules, 'OFF'),
    pDays: countShift(schedules, 'P'),
    upDays: countShift(schedules, 'UP'),
  };
}

export function buildLockSnapshots(
  employees: Employee[],
  rows: ClosingRow[],
  schedules: ScheduleEntry[]
): LockSnapshot[] {
  return employees.map((employee) => {
    const employeeRows = rows.filter((row) => row.record.employeeCode === employee.code);
    return {
      employee_code: employee.code,
      full_name: employee.fullName,
      department: employee.department,
      credited_hours: roundHours(employeeRows.reduce((sum, row) => sum + row.creditedHours, 0)),
      ot_hours: roundHours(
        employeeRows.reduce((sum, row) => sum + (row.otState === 'approved' ? row.otHours : 0), 0)
      ),
      off_days: countShift(schedules, 'OFF', employee.code),
      p_days: countShift(schedules, 'P', employee.code),
      up_days: countShift(schedules, 'UP', employee.code),
    };
  });
}
