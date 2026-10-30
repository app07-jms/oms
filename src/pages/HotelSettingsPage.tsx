import { PageHeading } from '@/components/layout/PageHeading';
import { useViewerRole } from '@/features/auth/AuthProvider';
import { SUPER_ADMIN_ROLE_KEY } from '@/features/permissions/permissionRules';
import { HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import { HotelInfoCard } from '@/features/hotel/components/HotelInfoCard';
import { ModuleAccessCard } from '@/features/hotel/components/ModuleAccessCard';
import { GeofenceHoursCard } from '@/features/hotel/components/GeofenceHoursCard';
import { HOTEL_MANAGER_ROLE_KEYS } from '@/features/hotel/hotelRules';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { DepartmentsTab } from '@/features/settings/components/DepartmentsTab';

export function HotelSettingsPage() {
  const activeRoleKey = useViewerRole().roleKey;
  const { settings, refresh } = useHotelSettings();

  const isSuperAdmin = activeRoleKey === SUPER_ADMIN_ROLE_KEY;
  const canManageHotel = HOTEL_MANAGER_ROLE_KEYS.includes(activeRoleKey);

  return (
    <div className="-mx-4 -my-6 flex min-h-full flex-col gap-6 bg-white px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-1">
        <PageHeading groupTitle="Hệ thống" title="Cấu hình khách sạn" />
        <p className="text-sm text-[#5C6670]">
          Thông tin khách sạn, module tính năng, vị trí chấm công và danh mục bộ phận.
        </p>
      </div>

      {!canManageHotel && (
        <p className="rounded-md border border-[#E2E8F0] bg-[#F7F9FA] px-4 py-3 text-sm text-[#5C6670]">
          Vai trò đang xem chỉ có quyền đọc. Chọn vai trò Admin hoặc Super Admin để chỉnh sửa.
        </p>
      )}

      <HotelInfoCard
        key={`${settings.systemHotelId ?? 'new'}-${settings.name}`}
        settings={settings}
        canEdit={canManageHotel}
        onSaved={refresh}
      />
      <ModuleAccessCard modules={settings.modules} canEdit={isSuperAdmin} onSaved={refresh} />
      <GeofenceHoursCard
        key={`${settings.latitude ?? 'none'}-${settings.longitude ?? 'none'}-${settings.geofenceRadiusM}-${settings.standardShiftHours}`}
        settings={settings}
        canEdit={canManageHotel}
        onSaved={refresh}
      />

      <HotelSettingsCard
        title="Danh mục bộ phận và chức vụ"
        description="Bộ phận và chức vụ dùng để phân loại nhân viên, tạo hồ sơ và phân quyền theo bộ phận."
      >
        {canManageHotel ? (
          <DepartmentsTab />
        ) : (
          <p className="text-sm text-[#5C6670]">Chỉ Admin hoặc Super Admin mới quản lý được danh mục này.</p>
        )}
      </HotelSettingsCard>
    </div>
  );
}
