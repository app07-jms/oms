import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NameFormDialogProps {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  initialName: string;
  validate: (name: string) => string | null;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

export function NameFormDialog({
  title,
  description,
  label,
  placeholder,
  initialName,
  validate,
  isSaving,
  errorMessage,
  onCancel,
  onSubmit,
}: NameFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validate(name);
    if (message) {
      setValidationError(message);
      return;
    }
    setValidationError(null);
    onSubmit(name.trim());
  }

  const shownError = validationError ?? errorMessage;

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="border-[#E2E8F0] bg-white sm:max-w-md sm:rounded-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">{title}</DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-name" className="text-sm font-medium text-[#1F2A30]">
              {label}
            </Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={placeholder}
              autoFocus
              autoComplete="off"
              className="h-10 border-[#E2E8F0] bg-white focus-visible:ring-[#4F7284]"
            />
          </div>

          {shownError && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
              {shownError}
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
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
