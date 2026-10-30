import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { toast } from '@/hooks/use-toast';
import { RoleFormDialog, type RoleFormValues } from '@/features/permissions/components/RoleFormDialog';
import {
  ROLE_TONE_BADGE_CLASS,
  type RoleSummary,
} from '@/features/permissions/permissionRules';
import { createRole, deleteRole, updateRoleDetails } from '@/features/permissions/permissionService';
import { useRoles } from '@/features/permissions/useRoles';

type RoleDialogState =
  | { kind: 'add' }
  | { kind: 'edit'; role: RoleSummary }
  | { kind: 'delete'; role: RoleSummary }
  | null;

const HEAD_CLASS = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C6670]';
const CELL_CLASS = 'px-4 py-3 align-middle text-sm text-[#1F2A30]';
const BADGE_BASE = 'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium';

export function RoleListTab() {
  const catalog = useRoles();
  const [dialog, setDialog] = useState<RoleDialogState>(null);
  const roles = catalog.data ?? [];

  function openDialog(next: NonNullable<RoleDialogState>) {
    catalog.clearActionError();
    setDialog(next);
  }

  function closeDialog() {
    catalog.clearActionError();
    setDialog(null);
  }

  async function handleAddOrEdit(values: RoleFormValues) {
    if (dialog?.kind === 'edit') {
      const role = dialog.role;
      const saved = await catalog.runAction(
        () => updateRoleDetails(role.key, { name: values.name, description: values.description }),
        'Không thể cập nhật vai trò. Vui lòng thử lại.',
      );
      if (!saved) return;
      toast({ title: 'Đã cập nhật vai trò', description: `Vai trò ${values.name} đã được lưu.` });
    } else {
      const saved = await catalog.runAction(
        () => createRole(values),
        'Không thể thêm vai trò. Vui lòng thử lại.',
      );
      if (!saved) return;
      toast({ title: 'Đã thêm vai trò', description: `Vai trò ${values.name} đã sẵn sàng cấu hình quyền.` });
    }
    setDialog(null);
  }

  async function handleDelete(role: RoleSummary) {
    const saved = await catalog.runAction(() => deleteRole(role.key), 'Không thể xóa vai trò. Vui lòng thử lại.');
    if (!saved) return;
    setDialog(null);
    toast({ title: 'Đã xóa vai trò', description: `Vai trò ${role.name} đã được xóa.` });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => openDialog({ kind: 'add' })}
          className="h-10 bg-[#4F7284] text-white shadow-sm transition-colors duration-200 hover:bg-[#406273]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm vai trò mới
        </Button>
      </div>

      {catalog.actionError && !dialog && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {catalog.actionError}
        </p>
      )}

      {catalog.isLoading && !catalog.data && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#5C6670]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách vai trò...
        </div>
      )}

      {catalog.loadError && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
          {catalog.loadError}
        </p>
      )}

      {catalog.data && (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th scope="col" className={HEAD_CLASS}>STT</th>
                  <th scope="col" className={HEAD_CLASS}>Tên vai trò</th>
                  <th scope="col" className={HEAD_CLASS}>Mô tả vai trò</th>
                  <th scope="col" className={HEAD_CLASS}>Số lượng người dùng</th>
                  <th scope="col" className={`${HEAD_CLASS} text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#5C6670]">
                      Chưa có vai trò nào.
                    </td>
                  </tr>
                )}
                {roles.map((role, index) => (
                  <tr key={role.key} className="transition-colors duration-150 hover:bg-[#F8FAFC]">
                    <td className={`${CELL_CLASS} text-[#5C6670]`}>{index + 1}</td>
                    <td className={CELL_CLASS}>
                      <span className={`${BADGE_BASE} ${ROLE_TONE_BADGE_CLASS[role.tone]}`}>{role.name}</span>
                    </td>
                    <td className={`${CELL_CLASS} max-w-md text-[#5C6670]`}>{role.description || '—'}</td>
                    <td className={CELL_CLASS}>{role.userCount} người</td>
                    <td className={CELL_CLASS}>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog({ kind: 'edit', role })}
                          disabled={catalog.isSaving}
                          className="h-8 border-[#E2E8F0] text-[#1F2A30]"
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Sửa tên/mô tả
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog({ kind: 'delete', role })}
                          disabled={catalog.isSaving}
                          className="h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Xóa vai trò
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(dialog?.kind === 'add' || dialog?.kind === 'edit') && (
        <RoleFormDialog
          role={dialog.kind === 'edit' ? dialog.role : null}
          existingNames={roles.map((role) => role.name)}
          isSaving={catalog.isSaving}
          errorMessage={catalog.actionError}
          onCancel={closeDialog}
          onSubmit={(values) => void handleAddOrEdit(values)}
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmActionDialog
          title={`Xóa vai trò ${dialog.role.name}?`}
          description={
            dialog.role.userCount > 0
              ? `Vai trò này đang có ${dialog.role.userCount} người dùng nên chưa thể xóa. Hãy chuyển họ sang vai trò khác trước.`
              : 'Quyền hạn đã cấu hình cho vai trò này cũng sẽ bị xóa.'
          }
          confirmLabel="Xóa vai trò"
          isPending={catalog.isSaving}
          errorMessage={catalog.actionError}
          onCancel={closeDialog}
          onConfirm={() => void handleDelete(dialog.role)}
        />
      )}
    </div>
  );
}
