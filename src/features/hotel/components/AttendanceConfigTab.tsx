import { FormAlert } from '@/features/hotel/components/HotelSettingsCard';
import { GeofenceHoursCard } from '@/features/hotel/components/GeofenceHoursCard';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { useHotelConfig } from '@/features/hotel/useHotelConfig';

interface AttendanceConfigTabProps {
  hotelId: string;
  canEdit: boolean;
}

export function AttendanceConfigTab({ hotelId, canEdit }: AttendanceConfigTabProps) {
  const config = useHotelConfig(hotelId);
  const { refresh: refreshSessionHotel } = useHotelSettings();

  if (!config.data) {
    return config.loadError ? (
      <FormAlert message={config.loadError} />
    ) : (
      <p className="text-sm text-[#5C6670]">Đang tải cấu hình chấm công...</p>
    );
  }

  const settings = config.data;

  async function handleSaved() {
    await config.refresh();
    await refreshSessionHotel();
  }

  return (
    <GeofenceHoursCard
      key={`${hotelId}-${settings.latitude ?? 'none'}-${settings.longitude ?? 'none'}-${settings.geofenceRadiusM}-${settings.standardShiftHours}`}
      hotelId={hotelId}
      settings={settings}
      canEdit={canEdit}
      onSaved={handleSaved}
    />
  );
}
