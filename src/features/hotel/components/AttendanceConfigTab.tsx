import { FormAlert, HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import { GeofenceHoursCard } from '@/features/hotel/components/GeofenceHoursCard';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { useHotelConfig } from '@/features/hotel/useHotelConfig';
import { ShiftsTab } from '@/features/settings/components/ShiftsTab';

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
    <div className="flex flex-col gap-6">
      <GeofenceHoursCard
        key={`${hotelId}-${settings.latitude ?? 'none'}-${settings.longitude ?? 'none'}-${settings.geofenceRadiusM}-${settings.standardShiftHours}`}
        hotelId={hotelId}
        settings={settings}
        canEdit={canEdit}
        onSaved={handleSaved}
      />
      <HotelSettingsCard
        title="Ca làm việc & Khung giờ"
        description="Danh mục ca dùng chung cho lịch làm việc, chấm công và tính giờ công."
      >
        {canEdit ? (
          <ShiftsTab />
        ) : (
          <p className="text-sm text-[#5C6670]">Chỉ Admin hoặc Super Admin mới quản lý được danh mục này.</p>
        )}
      </HotelSettingsCard>
    </div>
  );
}
