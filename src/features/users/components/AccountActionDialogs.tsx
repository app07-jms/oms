import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  USER_ROLES,
  USER_ROLE_LABELS,
  employeeOptionLabel,
  isUserRole,
  type EmployeeOption,
  type UserAccountRow,
  type UserRole,
} from '@/features/users/userRules';

const fieldClass = 'h-10 border-[#E2E8F0] bg-white focus-visible:ring-[#4F7284]';

interface RoleDialogProps {
  account: UserAccountRow;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSave: (role: UserRole) => void;
}

export function RoleDialog({ account, isSaving, errorMessage, onCancel, onSave }: RoleDialogProps) {
  const [role, setRole] = useState<UserRole>(account.role);

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="border-[#E2E8F0] bg-white sm:max-w-md sm:rounded-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">Sửa vai trò</DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">
            Cập nhật vai trò cho tài khoản <span className="font-medium text-[#1F2A30]">{account.username}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-select" className="text-sm font-medium text-[#1F2A30]">
            Vai trò
          </Label>
          <Select
            value={role}
            onValueChange={(value) => {
              if (isUserRole(value)) setRole(value);
            }}
          >
            <SelectTrigger id="role-select" className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES.map((item) => (
                <SelectItem key={item} value={item}>
                  {USER_ROLE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
            {errorMessage}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving} className="border-[#E2E8F0] text-[#1F2A30]">
            Hủy
          </Button>
          <Button
            onClick={() => onSave(role)}
            disabled={isSaving}
            className="bg-[#4F7284] text-white hover:bg-[#406273]"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu vai trò
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LinkProfileDialogProps {
  account: UserAccountRow;
  unlinkedEmployees: EmployeeOption[];
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSave: (employeeSystemUid: string) => void;
}

export function LinkProfileDialog({
  account,
  unlinkedEmployees,
  isSaving,
  errorMessage,
  onCancel,
  onSave,
}: LinkProfileDialogProps) {
  const [employeeSystemUid, setEmployeeSystemUid] = useState('');
  const hasOptions = unlinkedEmployees.length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="border-[#E2E8F0] bg-white sm:max-w-lg sm:rounded-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">
            Liên kết tài khoản với Hồ sơ nhân viên
          </DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">
            Chọn hồ sơ nhân viên để liên kết với tài khoản <span className="font-medium text-[#1F2A30]">{account.username}</span>. Chỉ hiển thị hồ sơ chưa được liên kết.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="link-profile-select" className="text-sm font-medium text-[#1F2A30]">
            Hồ sơ nhân viên
          </Label>
          <Select value={employeeSystemUid} onValueChange={setEmployeeSystemUid} disabled={!hasOptions}>
            <SelectTrigger id="link-profile-select" className={fieldClass}>
              <SelectValue placeholder={hasOptions ? 'Chọn hồ sơ nhân viên' : 'Không còn hồ sơ trống'} />
            </SelectTrigger>
            <SelectContent>
              {unlinkedEmployees.map((employee) => (
                <SelectItem key={employee.systemUid} value={employee.systemUid}>
                  {employeeOptionLabel(employee)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
            {errorMessage}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving} className="border-[#E2E8F0] text-[#1F2A30]">
            Hủy
          </Button>
          <Button
            onClick={() => onSave(employeeSystemUid)}
            disabled={isSaving || !employeeSystemUid}
            className="bg-[#4F7284] text-white hover:bg-[#406273]"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận liên kết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
