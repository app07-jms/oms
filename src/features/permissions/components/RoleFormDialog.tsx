import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ROLE_TONES,
  ROLE_TONE_LABELS,
  validateRoleName,
  type RoleSummary,
  type RoleTone,
} from '@/features/permissions/permissionRules';

const fieldClass = 'h-10 border-[#E2E8F0] bg-white focus-visible:ring-[#4F7284]';

export interface RoleFormValues {
  name: string;
  description: string;
  tone: RoleTone;
}

interface RoleFormDialogProps {
  role: RoleSummary | null;
  existingNames: string[];
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: RoleFormValues) => void;
}

export function RoleFormDialog({ role, existingNames, isSaving, errorMessage, onCancel, onSubmit }: RoleFormDialogProps) {
  const isEdit = role !== null;
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [tone, setTone] = useState<RoleTone>(role?.tone ?? 'slate');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateRoleName(name, existingNames, role?.name);
    if (message) {
      setValidationError(message);
      return;
    }
    setValidationError(null);
    onSubmit({ name: name.trim(), description: description.trim(), tone });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="border-[#E2E8F0] bg-white sm:max-w-lg sm:rounded-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">
            {isEdit ? 'Sửa tên và mô tả vai trò' : 'Thêm vai trò mới'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">
            Quyền hạn của vai trò được cấu hình ở tab Cấu hình phân quyền.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-name" className="text-sm font-medium text-[#1F2A30]">
                Tên vai trò
              </Label>
              <Input
                id="role-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="VD: Trưởng ca"
                maxLength={40}
                autoComplete="off"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-tone" className="text-sm font-medium text-[#1F2A30]">
                Màu hiển thị
              </Label>
              <Select value={tone} onValueChange={(value) => setTone(value as RoleTone)} disabled={isEdit}>
                <SelectTrigger id="role-tone" className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TONES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {ROLE_TONE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="role-description" className="text-sm font-medium text-[#1F2A30]">
                Mô tả vai trò
              </Label>
              <Input
                id="role-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn về phạm vi công việc"
                maxLength={160}
                className={fieldClass}
              />
            </div>
          </div>

          {(validationError || errorMessage) && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
              {validationError ?? errorMessage}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="border-[#E2E8F0] text-[#1F2A30]">
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#4F7284] text-white hover:bg-[#406273]">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm vai trò'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
