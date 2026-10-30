import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { EmployeeProfile } from '@/features/employees/employeeRules';

interface EmployeeDeleteDialogProps {
  profile: EmployeeProfile;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EmployeeDeleteDialog({ profile, isDeleting, errorMessage, onCancel, onConfirm }: EmployeeDeleteDialogProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <AlertDialogContent className="border-[#E2E8F0] bg-white sm:rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-[#1F2A30]">Xóa hồ sơ nhân viên?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#5C6670]">
            Hồ sơ của {profile.fullName} ({profile.code}) sẽ bị xóa khỏi danh sách. Thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
            {errorMessage}
          </p>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isDeleting} className="border-[#E2E8F0] text-[#1F2A30]">
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-error text-white hover:bg-error/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa nhân viên
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
