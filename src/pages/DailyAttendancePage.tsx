import { useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { AttendanceCheckCard } from '@/features/attendance/components/AttendanceCheckCard';
import { AttendanceFilterBar } from '@/features/attendance/components/AttendanceFilterBar';
import { AttendanceLogTable } from '@/features/attendance/components/AttendanceLogTable';
import { AdjustmentRequestDialog } from '@/features/attendance/components/AdjustmentRequestDialog';
import { getPresetRange, type AttendanceAdjustmentRequest, type DateRange } from '@/features/attendance/attendanceRules';
import { useAttendance } from '@/features/attendance/useAttendance';
import { toast } from '@/hooks/use-toast';

export function DailyAttendancePage() {
  const [range, setRange] = useState<DateRange>(() => getPresetRange('this-month'));
  const attendance = useAttendance(range);

  async function handleSubmitAdjustment(request: AttendanceAdjustmentRequest): Promise<boolean> {
    const submitted = await attendance.submitAdjustment(request);
    if (submitted) {
      toast({ title: 'Đã gửi đề xuất điều chỉnh ca cho Quản lý duyệt.' });
    }
    return submitted;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading groupTitle="Nhân sự" title="Chấm công hàng ngày" />

      <AttendanceCheckCard
        openRecord={attendance.openRecord}
        todayRecord={attendance.todayRecord}
        lastGps={attendance.lastGps}
        hasHotelLocation={attendance.hasHotelLocation}
        isLoading={attendance.isLoading}
        isSubmitting={attendance.isSubmitting}
        canCheckIn={attendance.canCheckIn}
        error={attendance.error}
        onCheckIn={attendance.checkIn}
        onCheckOut={attendance.checkOut}
      />

      <section className="rounded-lg border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Lịch sử chấm công</h2>
            <p className="text-sm text-muted-foreground">{attendance.historyDescription}</p>
          </div>
          <AttendanceFilterBar range={range} onRangeChange={setRange} />
        </div>
        <AttendanceLogTable records={attendance.records} isLoading={attendance.isLoading} />
      </section>

      {attendance.pendingCheckIn && (
        <AdjustmentRequestDialog
          evaluation={attendance.pendingCheckIn.evaluation}
          isSubmitting={attendance.isSubmitting}
          error={attendance.error}
          onSubmit={handleSubmitAdjustment}
          onCancel={attendance.dismissAdjustment}
        />
      )}
    </div>
  );
}
