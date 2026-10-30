import { FormAlert } from '@/features/hotel/components/HotelSettingsCard';
import { ModuleAccessCard } from '@/features/hotel/components/ModuleAccessCard';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { useHotelConfig } from '@/features/hotel/useHotelConfig';

interface HotelModulesTabProps {
  hotelId: string;
  canEdit: boolean;
}

export function HotelModulesTab({ hotelId, canEdit }: HotelModulesTabProps) {
  const config = useHotelConfig(hotelId);
  const { refresh: refreshSessionHotel } = useHotelSettings();

  if (!config.data) {
    return config.loadError ? (
      <FormAlert message={config.loadError} />
    ) : (
      <p className="text-sm text-[#5C6670]">Đang tải cấu hình module...</p>
    );
  }

  async function handleSaved() {
    await config.refresh();
    await refreshSessionHotel();
  }

  return (
    <ModuleAccessCard
      key={hotelId}
      hotelId={hotelId}
      modules={config.data.modules}
      canEdit={canEdit}
      onSaved={handleSaved}
    />
  );
}
