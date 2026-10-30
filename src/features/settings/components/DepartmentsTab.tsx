import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useDepartmentCatalog } from '@/features/settings/useDepartmentCatalog';
import {
  validateDepartmentName,
  validatePositionName,
  type Department,
  type Position,
} from '@/features/settings/settingsRules';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { DepartmentCard } from '@/features/settings/components/DepartmentCard';
import { NameFormDialog } from '@/features/settings/components/NameFormDialog';

type DepartmentDialog =
  | { kind: 'add-department' }
  | { kind: 'edit-department'; department: Department }
  | { kind: 'delete-department'; department: Department }
  | { kind: 'add-position'; department: Department }
  | { kind: 'edit-position'; department: Department; position: Position }
  | { kind: 'delete-position'; department: Department; position: Position };

export function DepartmentsTab() {
  const catalog = useDepartmentCatalog();
  const [dialog, setDialog] = useState<DepartmentDialog | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  function open(next: DepartmentDialog) {
    catalog.clearActionError();
    setDialog(next);
  }

  function toggle(departmentId: string) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  }

  async function finish(saved: Promise<boolean>, message: string) {
    if (!(await saved)) return;
    setDialog(null);
    toast({ title: message });
  }

  function renderDialog(current: DepartmentDialog) {
    switch (current.kind) {
      case 'add-department':
        return (
          <NameFormDialog
            title="Thêm bộ phận mới"
            description="Bộ phận mới sẽ xuất hiện trong danh sách và có thể gán cho nhân viên."
            label="Tên bộ phận"
            placeholder="VD: Kỹ thuật"
            initialName=""
            validate={validateDepartmentName}
            isSaving={catalog.isSaving}
            errorMessage={catalog.actionError}
            onCancel={() => setDialog(null)}
            onSubmit={(name) => finish(catalog.addDepartment(name), 'Đã thêm bộ phận.')}
          />
        );
      case 'edit-department':
        return (
          <NameFormDialog
            title="Chỉnh sửa bộ phận"
            description="Đổi tên bộ phận. Không thể đổi khi đang có nhân viên thuộc bộ phận này."
            label="Tên bộ phận"
            placeholder="Tên bộ phận"
            initialName={current.department.name}
            validate={validateDepartmentName}
            isSaving={catalog.isSaving}
            errorMessage={catalog.actionError}
            onCancel={() => setDialog(null)}
            onSubmit={(name) =>
              finish(catalog.editDepartment(current.department, name), 'Đã cập nhật bộ phận.')
            }
          />
        );
      case 'delete-department':
        return (
          <ConfirmActionDialog
            title="Xóa bộ phận?"
            description={`Bộ phận ${current.department.name} và toàn bộ chức vụ thuộc bộ phận sẽ bị xóa. Không thể xóa khi còn nhân viên thuộc bộ phận này.`}
            confirmLabel="Xóa bộ phận"
            isPending={catalog.isSaving}
            errorMessage={catalog.actionError}
            onCancel={() => setDialog(null)}
            onConfirm={() => finish(catalog.removeDepartment(current.department), 'Đã xóa bộ phận.')}
          />
        );
      case 'add-position':
        return (
          <NameFormDialog
            title="Thêm chức vụ"
            description={`Chức vụ mới sẽ được thêm vào bộ phận ${current.department.name}.`}
            label="Tên chức vụ"
            placeholder="VD: Nhân viên Lễ tân"
            initialName=""
            validate={validatePositionName}
            isSaving={catalog.isSaving}
            errorMessage={catalog.actionError}
            onCancel={() => setDialog(null)}
            onSubmit={(name) => finish(catalog.addPosition(current.department, name), 'Đã thêm chức vụ.')}
          />
        );
      case 'edit-position':
        return (
          <NameFormDialog
            title="Chỉnh sửa chức vụ"
            description={`Chức vụ thuộc bộ phận ${current.department.name}. Không thể đổi khi đang có nhân viên giữ chức vụ này.`}
            label="Tên chức vụ"
            placeholder="Tên chức vụ"
            initialName={current.position.name}
            validate={validatePositionName}
            isSaving={catalog.isSaving}
            errorMessage={catalog.actionError}
            onCancel={() => setDialog(null)}
            onSubmit={(name) =>
              finish(catalog.editPosition(current.department, current.position, name), 'Đã cập nhật chức vụ.')
            }
          />
        );
      case 'delete-position':
        return (
          <ConfirmActionDialog
            title="Xóa chức vụ?"
            description={`Chức vụ ${current.position.name} sẽ bị xóa khỏi bộ phận ${current.department.name}. Không thể xóa khi còn nhân viên giữ chức vụ này.`}
            confirmLabel="Xóa chức vụ"
            isPending={catalog.isSaving}
            errorMessage={catalog.actionError}
            onCancel={() => setDialog(null)}
            onConfirm={() =>
              finish(catalog.removePosition(current.department, current.position), 'Đã xóa chức vụ.')
            }
          />
        );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5C6670]">
          Mỗi bộ phận có danh sách chức vụ riêng. Chức vụ được dùng khi tạo hồ sơ nhân viên.
        </p>
        <Button
          type="button"
          onClick={() => open({ kind: 'add-department' })}
          disabled={catalog.isLoading}
          className="h-10 shrink-0 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm bộ phận mới
        </Button>
      </div>

      {catalog.loadError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {catalog.loadError}
        </p>
      )}
      {!dialog && catalog.actionError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {catalog.actionError}
        </p>
      )}

      {catalog.isLoading && catalog.departments.length === 0 && (
        <p className="py-10 text-center text-sm text-[#5C6670]">Đang tải danh mục bộ phận...</p>
      )}
      {!catalog.isLoading && !catalog.loadError && catalog.departments.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#E2E8F0] bg-white py-10 text-center text-sm text-[#5C6670]">
          Chưa có bộ phận nào. Hãy thêm bộ phận đầu tiên.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {catalog.departments.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            positions={catalog.positionsOf(department)}
            isOpen={!collapsedIds.has(department.id)}
            isSaving={catalog.isSaving}
            onToggle={() => toggle(department.id)}
            onAddPosition={() => open({ kind: 'add-position', department })}
            onEditDepartment={() => open({ kind: 'edit-department', department })}
            onDeleteDepartment={() => open({ kind: 'delete-department', department })}
            onEditPosition={(position) => open({ kind: 'edit-position', department, position })}
            onDeletePosition={(position) => open({ kind: 'delete-position', department, position })}
          />
        ))}
      </div>

      {dialog && renderDialog(dialog)}
    </div>
  );
}
