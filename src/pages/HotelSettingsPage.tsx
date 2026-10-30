import { useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { cn } from '@/lib/utils';
import { useSession, useViewerRole } from '@/features/auth/AuthProvider';
import { SUPER_ADMIN_ROLE_KEY } from '@/features/permissions/permissionRules';
import { HOTEL_MANAGER_ROLE_KEYS } from '@/features/hotel/hotelRules';
import { listHotels } from '@/features/hotel/hotelService';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { useCatalogResource } from '@/hooks/useCatalogResource';
import { AttendanceConfigTab } from '@/features/hotel/components/AttendanceConfigTab';
import { FormAlert, HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import { HotelDirectoryTab } from '@/features/hotel/components/HotelDirectoryTab';
import { HotelModulesTab } from '@/features/hotel/components/HotelModulesTab';
import { HotelSelect } from '@/features/hotel/components/HotelSelect';
import { DepartmentsTab } from '@/features/settings/components/DepartmentsTab';

const DIRECTORY_LOAD_ERROR = 'Không thể tải danh sách khách sạn.';

type TabKey = 'hotels' | 'modules' | 'attendance' | 'departments';

const TABS: { key: TabKey; label: string; superAdminOnly: boolean }[] = [
  { key: 'hotels', label: 'Thông tin khách sạn', superAdminOnly: true },
  { key: 'modules', label: 'Phân quyền Module', superAdminOnly: true },
  { key: 'attendance', label: 'Cấu hình Chấm công', superAdminOnly: false },
  { key: 'departments', label: 'Bộ phận & Chức vụ', superAdminOnly: false },
];

export function HotelSettingsPage() {
  const activeRoleKey = useViewerRole().roleKey;
  const sessionHotelId = useSession().hotel.id;
  const { refresh: refreshSessionHotel } = useHotelSettings();
  const directory = useCatalogResource(listHotels, DIRECTORY_LOAD_ERROR);

  const isSuperAdmin = activeRoleKey === SUPER_ADMIN_ROLE_KEY;
  const canManageHotel = HOTEL_MANAGER_ROLE_KEYS.includes(activeRoleKey);
  const hotels = directory.data ?? [];

  const visibleTabs = TABS.filter((tab) => isSuperAdmin || !tab.superAdminOnly);
  const [requestedTab, setRequestedTab] = useState<TabKey>('hotels');
  const activeTab = visibleTabs.some((tab) => tab.key === requestedTab) ? requestedTab : visibleTabs[0].key;

  const [selectedHotelId, setSelectedHotelId] = useState(sessionHotelId);
  const scopedHotelId =
    isSuperAdmin && hotels.some((hotel) => hotel.id === selectedHotelId) ? selectedHotelId : sessionHotelId;

  async function handleDirectoryChanged() {
    await directory.refresh();
    await refreshSessionHotel();
  }

  return (
    <div className="-mx-4 -my-6 flex min-h-full flex-col gap-6 bg-white px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-1">
        <PageHeading groupTitle="Hệ thống" title="Cấu hình khách sạn" />
        <p className="text-sm text-[#5C6670]">
          Quản lý khách sạn, module tính năng, vị trí chấm công và danh mục bộ phận.
        </p>
      </div>

      <nav role="tablist" aria-label="Mục cấu hình khách sạn" className="flex gap-6 overflow-x-auto border-b border-[#E2E8F0]">
        {visibleTabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setRequestedTab(tab.key)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm transition-colors duration-200',
                isActive
                  ? 'border-[#4F7284] font-semibold text-[#4F7284]'
                  : 'border-transparent font-medium text-[#5C6670] hover:text-[#1F2A30]',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {!canManageHotel && (
        <p className="rounded-md border border-[#E2E8F0] bg-[#F7F9FA] px-4 py-3 text-sm text-[#5C6670]">
          Vai trò đang xem chỉ có quyền đọc. Chọn vai trò Admin hoặc Super Admin để chỉnh sửa.
        </p>
      )}

      {activeTab === 'hotels' && (
        <>
          {directory.loadError && <FormAlert message={directory.loadError} />}
          {directory.data && (
            <HotelDirectoryTab
              hotels={directory.data}
              currentHotelId={sessionHotelId}
              onChanged={handleDirectoryChanged}
            />
          )}
        </>
      )}

      {(activeTab === 'modules' || activeTab === 'attendance') && (
        <div className="flex flex-col gap-6">
          {isSuperAdmin && hotels.length > 0 && (
            <HotelSelect hotels={hotels} value={scopedHotelId} onChange={setSelectedHotelId} />
          )}
          {activeTab === 'modules' ? (
            <HotelModulesTab hotelId={scopedHotelId} canEdit={isSuperAdmin} />
          ) : (
            <AttendanceConfigTab hotelId={scopedHotelId} canEdit={canManageHotel} />
          )}
        </div>
      )}

      {activeTab === 'departments' && (
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
      )}
    </div>
  );
}
