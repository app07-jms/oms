import { useState } from 'react';
import { CheckCircle2, Download, Upload, X } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import type { ShiftCode } from '@/config/schedule';
import { ScheduleActionBar } from '@/features/schedule/components/ScheduleActionBar';
import { ScheduleGrid } from '@/features/schedule/components/ScheduleGrid';
import { ShiftDetailDialog } from '@/features/schedule/components/ShiftDetailDialog';
import { ImportScheduleDialog } from '@/features/schedule/components/ImportScheduleDialog';
import { downloadScheduleTemplate } from '@/features/schedule/scheduleExcel';
import { toDateKey } from '@/features/attendance/attendanceRules';
import {
  formatWeekRange,
  getWeekStart,
  type Employee,
  type ScheduleEntry,
} from '@/features/schedule/scheduleRules';
import { useWeeklySchedule } from '@/features/schedule/useWeeklySchedule';
import { useSession } from '@/features/auth/AuthProvider';

interface SelectedShift {
  employee: Employee;
  workDate: string;
  entry: ScheduleEntry;
}

export function WorkSchedulePage() {
  const schedule = useWeeklySchedule();
  const { account } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedShift | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function handleSelectEntry(employee: Employee, workDate: string, entry: ScheduleEntry) {
    setSelected({ employee, workDate, entry });
  }

  async function handleShiftChange(employeeCode: string, workDate: string, shiftCode: ShiftCode) {
    setActionError(null);
    try {
      await schedule.saveShift(employeeCode, workDate, shiftCode);
    } catch {
      setActionError('Không thể lưu ca làm việc. Vui lòng thử lại.');
    }
  }

  async function handleImported(count: number) {
    await schedule.reload();
    setImportedCount(count);
  }

  function handleDownloadTemplate() {
    const weekKey = toDateKey(schedule.weekStart);
    downloadScheduleTemplate(
      schedule.weekDates,
      schedule.employees,
      schedule.scheduleByKey,
      `lich-lam-viec-${weekKey}.xlsx`
    );
  }

  const hasLoadedData = schedule.employees.length > 0;
  const visibleCodes = new Set(schedule.visibleEmployees.map((employee) => employee.code));
  const visibleEntryCount = Array.from(schedule.scheduleByKey.values()).filter((entry) =>
    visibleCodes.has(entry.employeeCode)
  ).length;
  const isCurrentWeek = toDateKey(schedule.weekStart) === toDateKey(getWeekStart(new Date()));

  return (
    <div className="-mx-4 -my-6 flex min-h-full flex-col gap-6 bg-[#F4F7F6] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <PageHeading groupTitle="Nhân sự" title="Lịch làm việc" />
          <p className="text-sm text-[#5C6670]">Lập và quản lý lịch làm việc theo ca cho từng phòng ban</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="border-[#E2E8F0] bg-white">
            <Download className="h-4 w-4" />
            Tải file mẫu (.xlsx)
          </Button>
          <Button onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Nhập lịch (Excel)
          </Button>
        </div>
      </div>

      {importedCount !== null && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7] px-4 py-3 text-sm font-medium text-[#15803D]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Đã nhập {importedCount} mục lịch làm việc thành công.
          </span>
          <button
            type="button"
            onClick={() => setImportedCount(null)}
            aria-label="Đóng thông báo"
            className="rounded-md p-1 text-[#15803D] transition-colors hover:bg-[#BBF7D0]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ScheduleActionBar
        rangeLabel={formatWeekRange(schedule.weekStart)}
        summary={`${schedule.visibleEmployees.length} nhân viên • ${visibleEntryCount} mục lịch`}
        isCurrentWeek={isCurrentWeek}
        department={schedule.department}
        isEditing={isEditing}
        onPreviousWeek={() => schedule.shiftWeek(-7)}
        onNextWeek={() => schedule.shiftWeek(7)}
        onGoToCurrentWeek={schedule.goToCurrentWeek}
        onDepartmentChange={schedule.setDepartment}
        onToggleEditing={() => setIsEditing((current) => !current)}
      />

      {schedule.error && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {schedule.error}
        </p>
      )}

      {actionError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {actionError}
        </p>
      )}

      {schedule.isLoading && !hasLoadedData ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Đang tải lịch làm việc...</p>
      ) : (
        <ScheduleGrid
          weekDates={schedule.weekDates}
          employees={schedule.visibleEmployees}
          scheduleByKey={schedule.scheduleByKey}
          isEditing={isEditing}
          onSelectEntry={handleSelectEntry}
          onShiftChange={handleShiftChange}
        />
      )}

      {selected && (
        <ShiftDetailDialog
          key={`${selected.employee.code}|${selected.workDate}|${selected.entry.id}`}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          employee={selected.employee}
          workDate={selected.workDate}
          entry={selected.entry}
          isOwnSchedule={selected.employee.code === account.employeeCode}
          onChanged={schedule.reload}
        />
      )}

      <ImportScheduleDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        employees={schedule.employees}
        onImported={handleImported}
      />
    </div>
  );
}
