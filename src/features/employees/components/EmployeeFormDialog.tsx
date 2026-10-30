import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS } from '@/config/schedule';
import { normalizeDraft, validateDraft, type EmployeeDraft } from '@/features/employees/employeeRules';

interface EmployeeFormDialogProps {
  mode: 'add' | 'edit';
  initialDraft: EmployeeDraft;
  takenCodes: Set<string>;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (draft: EmployeeDraft) => void;
}

const fieldClass = 'h-10 border-[#E2E8F0] bg-white focus-visible:ring-[#4F7284]';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-[#1F2A30]">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function EmployeeFormDialog({
  mode,
  initialDraft,
  takenCodes,
  isSaving,
  errorMessage,
  onCancel,
  onSubmit,
}: EmployeeFormDialogProps) {
  const [draft, setDraft] = useState<EmployeeDraft>(initialDraft);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  function update<K extends keyof EmployeeDraft>(key: K, value: EmployeeDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeDraft(draft);
    const message =
      validateDraft(normalized) ??
      (!isEdit && takenCodes.has(normalized.code) ? 'Mã NV này đã tồn tại trong danh sách.' : null);
    if (message) {
      setValidationError(message);
      return;
    }
    setValidationError(null);
    onSubmit(normalized);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E2E8F0] bg-white sm:max-w-2xl sm:rounded-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">
            {isEdit ? 'Chỉnh sửa hồ sơ nhân viên' : 'Thêm nhân viên mới'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">
            {isEdit
              ? 'Cập nhật thông tin hồ sơ. Mã NV dùng làm tên đăng nhập và không thể thay đổi.'
              : 'Nhập thông tin hồ sơ. Ở bước tiếp theo bạn sẽ chọn có tạo tài khoản đăng nhập hay không.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mã NV (Username)" htmlFor="employee-code">
              <Input
                id="employee-code"
                value={draft.code}
                disabled={isEdit}
                onChange={(event) => update('code', event.target.value)}
                placeholder="VD: NV010"
                autoComplete="off"
                className={fieldClass}
              />
            </Field>
            <Field label="Họ và tên" htmlFor="employee-full-name">
              <Input
                id="employee-full-name"
                value={draft.fullName}
                onChange={(event) => update('fullName', event.target.value)}
                placeholder="Nguyễn Văn A"
                className={fieldClass}
              />
            </Field>
            <Field label="Tên hiển thị" htmlFor="employee-display-name">
              <Input
                id="employee-display-name"
                value={draft.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                placeholder="Văn A"
                className={fieldClass}
              />
            </Field>
            <Field label="Bộ phận" htmlFor="employee-department">
              <Select value={draft.department} onValueChange={(value) => update('department', value)}>
                <SelectTrigger id="employee-department" className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Chức vụ" htmlFor="employee-position">
              <Input
                id="employee-position"
                value={draft.position}
                onChange={(event) => update('position', event.target.value)}
                placeholder="Nhân viên lễ tân"
                className={fieldClass}
              />
            </Field>
            <Field label="SĐT" htmlFor="employee-phone">
              <Input
                id="employee-phone"
                type="tel"
                value={draft.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="0900 000 000"
                className={fieldClass}
              />
            </Field>
            <Field label="Email" htmlFor="employee-email">
              <Input
                id="employee-email"
                type="email"
                value={draft.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="ten@khachsan.vn"
                className={fieldClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ngày thử việc" htmlFor="employee-probation-date">
                <Input
                  id="employee-probation-date"
                  type="date"
                  value={draft.probationDate}
                  onChange={(event) => update('probationDate', event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Ngày chính thức" htmlFor="employee-official-date">
                <Input
                  id="employee-official-date"
                  type="date"
                  value={draft.officialDate}
                  onChange={(event) => update('officialDate', event.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
          </div>

          {(validationError || errorMessage) && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
              {validationError ?? errorMessage}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="border-[#E2E8F0] text-[#1F2A30]"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#4F7284] text-white hover:bg-[#3F5C6C]">
              {isEdit ? 'Lưu thay đổi' : 'Tiếp tục'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
