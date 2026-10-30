import { useCallback } from 'react';
import { useCatalogResource } from '@/features/settings/useCatalogResource';
import { deleteShiftType, fetchShiftTypes, insertShiftType, updateShiftType } from '@/features/settings/settingsService';
import type { ShiftDraft } from '@/features/settings/settingsRules';

const LOAD_ERROR = 'Không thể tải danh sách ca làm việc. Vui lòng thử lại.';

export function useShiftTypes() {
  const load = useCallback(fetchShiftTypes, []);
  const resource = useCatalogResource(load, LOAD_ERROR);
  const shifts = resource.data ?? [];

  function addShift(draft: ShiftDraft) {
    const nextSortOrder = Math.max(0, ...shifts.map((shift) => shift.sortOrder)) + 1;
    return resource.runAction(() => insertShiftType(draft, nextSortOrder), 'Không thể thêm ca làm việc.');
  }

  function editShift(code: string, draft: ShiftDraft) {
    return resource.runAction(() => updateShiftType(code, draft), 'Không thể cập nhật ca làm việc.');
  }

  function removeShift(code: string) {
    return resource.runAction(() => deleteShiftType(code), 'Không thể xóa ca làm việc.');
  }

  return {
    shifts,
    isLoading: resource.isLoading,
    loadError: resource.loadError,
    isSaving: resource.isSaving,
    actionError: resource.actionError,
    clearActionError: resource.clearActionError,
    addShift,
    editShift,
    removeShift,
  };
}
