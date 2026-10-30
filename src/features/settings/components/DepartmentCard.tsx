import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Department, Position } from '@/features/settings/settingsRules';
import { cn } from '@/lib/utils';

interface DepartmentCardProps {
  department: Department;
  positions: Position[];
  isOpen: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onAddPosition: () => void;
  onEditDepartment: () => void;
  onDeleteDepartment: () => void;
  onEditPosition: (position: Position) => void;
  onDeletePosition: (position: Position) => void;
}

const ICON_BUTTON_CLASS = 'h-8 w-8 text-[#4F7284] hover:bg-[#4F7284]/10 hover:text-[#3F5C6C]';
const DELETE_BUTTON_CLASS = 'h-8 w-8 text-[#5C6670] hover:bg-error/10 hover:text-error';

export function DepartmentCard({
  department,
  positions,
  isOpen,
  isSaving,
  onToggle,
  onAddPosition,
  onEditDepartment,
  onDeleteDepartment,
  onEditPosition,
  onDeletePosition,
}: DepartmentCardProps) {
  const panelId = `department-panel-${department.id}`;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7284]"
        >
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[#5C6670] transition-transform duration-200', isOpen && 'rotate-180')}
          />
          <span className="text-base font-semibold text-[#1F2A30]">{department.name}</span>
          <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#5C6670]">
            {positions.length} chức vụ
          </span>
        </button>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddPosition}
            disabled={isSaving}
            className="h-8 text-[#4F7284] hover:bg-[#4F7284]/10 hover:text-[#3F5C6C]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm chức vụ
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Chỉnh sửa bộ phận ${department.name}`}
            onClick={onEditDepartment}
            disabled={isSaving}
            className={ICON_BUTTON_CLASS}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Xóa bộ phận ${department.name}`}
            onClick={onDeleteDepartment}
            disabled={isSaving}
            className={DELETE_BUTTON_CLASS}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div id={panelId} className="border-t border-[#E2E8F0] bg-white">
          {positions.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-[#5C6670]">Bộ phận này chưa có chức vụ nào.</p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {positions.map((position) => (
                <li
                  key={position.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors duration-150 hover:bg-[#F8FAFC]"
                >
                  <span className="text-sm font-medium text-[#1F2A30]">{position.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Chỉnh sửa chức vụ ${position.name}`}
                      onClick={() => onEditPosition(position)}
                      disabled={isSaving}
                      className={ICON_BUTTON_CLASS}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Xóa chức vụ ${position.name}`}
                      onClick={() => onDeletePosition(position)}
                      disabled={isSaving}
                      className={DELETE_BUTTON_CLASS}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
