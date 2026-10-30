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

interface ConfirmActionDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  errorMessage: string | null;
  tone?: 'danger' | 'primary';
  onCancel: () => void;
  onConfirm: () => void;
}

const CONFIRM_TONE_CLASS = {
  danger: 'bg-error text-white hover:bg-error/90',
  primary: 'bg-[#4F7284] text-white hover:bg-[#406273]',
} as const;

export function ConfirmActionDialog({
  title,
  description,
  confirmLabel,
  isPending,
  errorMessage,
  tone = 'danger',
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && !isPending && onCancel()}>
      <AlertDialogContent className="border-[#E2E8F0] bg-white sm:rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-[#1F2A30]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#5C6670]">{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
            {errorMessage}
          </p>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isPending} className="border-[#E2E8F0] text-[#1F2A30]">
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className={CONFIRM_TONE_CLASS[tone]}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
