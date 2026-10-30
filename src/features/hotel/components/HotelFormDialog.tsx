import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { FormAlert } from '@/features/hotel/components/HotelSettingsCard';
import { normalizeIdPrefix, validateHotelInfo, type HotelSettings } from '@/features/hotel/hotelRules';
import { createHotel, updateHotelInfo } from '@/features/hotel/hotelService';

const SAVE_ERROR = 'Không thể lưu khách sạn. Vui lòng thử lại.';

interface HotelFormDialogProps {
  hotel: HotelSettings | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function HotelFormDialog({ hotel, onClose, onSaved }: HotelFormDialogProps) {
  const isEditing = hotel !== null;
  const [name, setName] = useState(hotel?.name ?? '');
  const [address, setAddress] = useState(hotel?.address ?? '');
  const [prefix, setPrefix] = useState(hotel?.idPrefix ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const validation = validateHotelInfo({ name, prefix, prefixLocked: isEditing });
    if (validation) {
      setError(validation);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (hotel) {
        await updateHotelInfo(hotel.id, { name, address });
      } else {
        await createHotel({ name, address, idPrefix: prefix });
      }
      await onSaved();
      toast({ title: isEditing ? 'Đã cập nhật khách sạn.' : 'Đã thêm khách sạn mới.' });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message ? saveError.message : SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="border-[#E2E8F0] bg-white sm:max-w-lg sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1F2A30]">
            {isEditing ? 'Sửa thông tin khách sạn' : 'Thêm khách sạn mới'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#5C6670]">
            {isEditing
              ? 'Cập nhật tên và địa chỉ hiển thị. Mã viết tắt không thể thay đổi sau khi tạo.'
              : 'Nhập tên, địa chỉ và mã viết tắt. Mã viết tắt sẽ là tiền tố cho mã nhân viên của khách sạn.'}
          </DialogDescription>
        </DialogHeader>

        {error && <FormAlert message={error} />}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-form-name" className="text-sm font-medium text-[#1F2A30]">
              Tên khách sạn
            </Label>
            <Input
              id="hotel-form-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
              placeholder="VD: Khách sạn Jenius"
              className="h-10 border-[#E2E8F0] bg-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-form-address" className="text-sm font-medium text-[#1F2A30]">
              Địa chỉ
            </Label>
            <Input
              id="hotel-form-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              disabled={isSaving}
              placeholder="Số nhà, đường, quận, thành phố"
              className="h-10 border-[#E2E8F0] bg-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-form-prefix" className="flex items-center gap-2 text-sm font-medium text-[#1F2A30]">
              Mã viết tắt
              {isEditing && <Lock className="h-3.5 w-3.5 text-[#5C6670]" aria-label="Đã khóa" />}
            </Label>
            <Input
              id="hotel-form-prefix"
              value={prefix}
              onChange={(event) => setPrefix(normalizeIdPrefix(event.target.value))}
              disabled={isSaving || isEditing}
              maxLength={10}
              placeholder="VD: JMS01"
              className="h-10 border-[#E2E8F0] bg-white font-mono uppercase"
            />
            <p className="text-xs text-[#5C6670]">Chỉ gồm chữ in hoa và số, từ 2 đến 10 ký tự.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 border-[#E2E8F0] text-[#1F2A30]"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Lưu thay đổi' : 'Thêm khách sạn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
