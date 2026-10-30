export const SHIFTS = {
  day: { name: 'Ca sáng', startHour: 8, endHour: 17 },
  night: { name: 'Ca đêm', startHour: 22, endHour: 6 },
} as const;

export const LATE_TOLERANCE_MINUTES = 15;

export const ADJUSTMENT_REASONS = [
  { value: 'late-with-reason', label: 'Đi trễ có lý do' },
  { value: 'extra-shift', label: 'Tăng cường ca khác' },
  { value: 'shift-swap', label: 'Hoán đổi ca' },
  { value: 'other', label: 'Khác' },
] as const;

export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]['value'];
