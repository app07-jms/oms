import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  formatClockTime,
  formatWorkDate,
  formatWorkedDuration,
  getAttendanceStatus,
  getWorkedMs,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/features/attendance/attendanceRules';
import { cn } from '@/lib/utils';

interface AttendanceLogTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
}

const STATUS_LABELS: Record<AttendanceStatus, { label: string; className: string }> = {
  'on-shift': { label: 'Đúng ca', className: 'bg-success/10 text-success' },
  'off-shift': { label: 'Lệch ca', className: 'bg-error/10 text-error' },
  pending: { label: 'Chờ duyệt', className: 'bg-pending/10 text-pending' },
};

export function AttendanceLogTable({ records, isLoading }: AttendanceLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground">Nhân viên</TableHead>
            <TableHead className="text-muted-foreground">Ngày</TableHead>
            <TableHead className="text-muted-foreground">Ca</TableHead>
            <TableHead className="text-muted-foreground">Vào ca</TableHead>
            <TableHead className="text-muted-foreground">Ra ca</TableHead>
            <TableHead className="text-muted-foreground">Tổng giờ</TableHead>
            <TableHead className="text-muted-foreground">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                Đang tải dữ liệu chấm công...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && records.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                Chưa có dữ liệu chấm công trong khoảng thời gian này.
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            records.map((record) => {
              const status = STATUS_LABELS[getAttendanceStatus(record)];
              const workedMs = getWorkedMs(record);
              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{record.employeeName}</span>
                      <span className="text-xs text-muted-foreground">{record.employeeCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{formatWorkDate(record.workDate)}</TableCell>
                  <TableCell className="text-foreground">{record.shiftName}</TableCell>
                  <TableCell className="tabular-nums text-foreground">{formatClockTime(record.checkInAt)}</TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {record.checkOutAt ? formatClockTime(record.checkOutAt) : '—'}
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {workedMs === null ? '—' : formatWorkedDuration(workedMs)}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('border-transparent hover:bg-transparent', status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
