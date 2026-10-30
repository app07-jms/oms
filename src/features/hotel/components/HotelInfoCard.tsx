import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { FormAlert, HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import {
  buildSystemHotelId,
  generateHotelHash,
  normalizeIdPrefix,
  validateHotelInfo,
  type HotelSettings,
} from '@/features/hotel/hotelRules';
import { saveHotelSettings } from '@/features/hotel/hotelService';

const SAVE_ERROR = 'Không thể lưu thông tin khách sạn.';
const HASH_PLACEHOLDER = '········';

interface HotelInfoCardProps {
  settings: HotelSettings;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}

export function HotelInfoCard({ settings, canEdit, onSaved }: HotelInfoCardProps) {
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [prefix, setPrefix] = useState(settings.idPrefix ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const prefixLocked = settings.systemHotelId !== null;
  const isDirty =
    name !== settings.name || address !== settings.address || (!prefixLocked && prefix !== '');
  const previewId = prefixLocked
    ? settings.systemHotelId
    : `${prefix || 'PREFIX'}_Hotel${HASH_PLACEHOLDER}`;

  async function handleSave() {
    const validation = validateHotelInfo({ name, prefix, prefixLocked });
    if (validation) {
      setError(validation);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (prefixLocked) {
        await saveHotelSettings({ name, address });
      } else {
        const systemHotelId = buildSystemHotelId(prefix, generateHotelHash());
        await saveHotelSettings({ name, address, idPrefix: prefix, systemHotelId });
      }
      await onSaved();
      toast({ title: 'Đã lưu thông tin khách sạn.' });
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message ? saveError.message : SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <HotelSettingsCard
      title="Thông tin khách sạn"
      description="Tên và địa chỉ hiển thị trên hệ thống. Mã khách sạn được tạo một lần và không thể thay đổi sau khi lưu."
      footer={
        canEdit && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="h-10 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thông tin
          </Button>
        )
      }
    >
      {error && <FormAlert message={error} />}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="hotel-name" className="text-sm font-medium text-[#1F2A30]">
            Tên khách sạn
          </Label>
          <Input
            id="hotel-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canEdit || isSaving}
            placeholder="VD: Khách sạn Jenius"
            className="h-10 border-[#E2E8F0] bg-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="hotel-prefix" className="flex items-center gap-2 text-sm font-medium text-[#1F2A30]">
            Mã viết tắt
            {prefixLocked && <Lock className="h-3.5 w-3.5 text-[#5C6670]" aria-label="Đã khóa" />}
          </Label>
          <Input
            id="hotel-prefix"
            value={prefix}
            onChange={(event) => setPrefix(normalizeIdPrefix(event.target.value))}
            disabled={!canEdit || isSaving || prefixLocked}
            maxLength={10}
            placeholder="VD: JMS01"
            className="h-10 border-[#E2E8F0] bg-white font-mono uppercase"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="hotel-address" className="text-sm font-medium text-[#1F2A30]">
            Địa chỉ
          </Label>
          <Input
            id="hotel-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={!canEdit || isSaving}
            placeholder="Số nhà, đường, quận, thành phố"
            className="h-10 border-[#E2E8F0] bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-[#E2E8F0] bg-[#F7F9FA] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#5C6670]">Mã định danh hệ thống</p>
        <p className="break-all font-mono text-base font-semibold text-[#1F2A30]">{previewId}</p>
        <p className="text-xs leading-relaxed text-[#5C6670]">
          {prefixLocked
            ? 'Mã này là tiền tố cố định cho mã nhân viên của khách sạn.'
            : 'Mã gồm mã viết tắt, "_Hotel" và 8 ký tự ngẫu nhiên. Mã ngẫu nhiên được tạo khi bạn lưu lần đầu.'}
        </p>
      </div>
    </HotelSettingsCard>
  );
}
