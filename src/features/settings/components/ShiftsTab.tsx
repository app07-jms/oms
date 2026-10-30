import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useShiftTypes } from '@/features/settings/useShiftTypes';
import {
  createEmptyShiftDraft,
  shiftDraftFromType,
  type ShiftDraft,
  type ShiftType,
} from '@/features/settings/settingsRules';
import { ConfirmDeleteDialog } from '@/features/settings/components/ConfirmDeleteDialog';
import { ShiftFormDialog } from '@/features/settings/components/ShiftFormDialog';
import { ShiftTable } from '@/features/settings/components/ShiftTable';

type ShiftDialog = { mode: 'add' } | { mode: 'edit'; shift: ShiftType } | { mode: 'delete'; shift: ShiftType };

export function ShiftsTab() {
  const shifts = useShiftTypes();
  const [dialog, setDialog] = useState<ShiftDialog | null>(null);
  const takenCodes = useMemo(() => new Set(shifts.shifts.map((shift) => shift.code)), [shifts.shifts]);

  function open(next: ShiftDialog) {
    shifts.clearActionError();
    setDialog(next);
  }

  async function handleSave(current: { mode: 'add' } | { mode: 'edit'; shift: ShiftType }, draft: ShiftDraft) {
    const saved =
      current.mode === 'add'
        ? await shifts.addShift(draft)
        : await shifts.editShift(current.shift.code, draft);
    if (!saved) return;
    setDialog(null);
    toast({ title: current.mode === 'add' ? 'Đã thêm ca làm việc.' : 'Đã cập nhật ca làm việc.' });
  }

  async function handleDelete(shift: ShiftType) {
    const deleted = await shifts.removeShift(shift.code);
    if (!deleted) return;
    setDialog(null);
    toast({ title: 'Đã xóa ca làm việc.' });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5C6670]">
          Khung giờ dùng chung cho lịch làm việc, chấm công và tính giờ công.
        </p>
        <Button
          type="button"
          onClick={() => open({ mode: 'add' })}
          disabled={shifts.isLoading}
          className="h-10 shrink-0 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm ca làm việc
        </Button>
      </div>

      {shifts.loadError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {shifts.loadError}
        </p>
      )}
      {!dialog && shifts.actionError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {shifts.actionError}
        </p>
      )}

      <ShiftTable
        rows={shifts.shifts}
        isLoading={shifts.isLoading}
        isSaving={shifts.isSaving}
        onEdit={(shift) => open({ mode: 'edit', shift })}
        onDelete={(shift) => open({ mode: 'delete', shift })}
      />

      {dialog && (dialog.mode === 'delete' ? (
        <ConfirmDeleteDialog
          title="Xóa ca làm việc?"
          description={`Ca ${dialog.shift.name} (${dialog.shift.code}) sẽ bị xóa khỏi danh mục. Không thể xóa khi ca đang được dùng trong lịch làm việc.`}
          confirmLabel="Xóa ca"
          isDeleting={shifts.isSaving}
          errorMessage={shifts.actionError}
          onCancel={() => setDialog(null)}
          onConfirm={() => handleDelete(dialog.shift)}
        />
      ) : (
        <ShiftFormDialog
          mode={dialog.mode}
          initialDraft={dialog.mode === 'edit' ? shiftDraftFromType(dialog.shift) : createEmptyShiftDraft()}
          takenCodes={takenCodes}
          isSaving={shifts.isSaving}
          errorMessage={shifts.actionError}
          onCancel={() => setDialog(null)}
          onSubmit={(draft) => handleSave(dialog, draft)}
        />
      ))}
    </div>
  );
}
