import { Navigate } from 'react-router-dom';
import { navigationGroups, visibleNavigationForPermissions } from '@/config/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { visibleNavigationGroups } from '@/features/hotel/hotelRules';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';

export function HomeRedirect() {
  const { settings } = useHotelSettings();
  const { permissions } = useAuth();
  if (!permissions) return null;

  const groups = visibleNavigationForPermissions(visibleNavigationGroups(navigationGroups, settings.modules), permissions);
  const firstItem = groups[0]?.items[0];
  if (!firstItem) {
    return (
      <p className="py-16 text-center text-sm text-[#64748B]">
        Tài khoản của bạn chưa có quyền truy cập chức năng nào. Vui lòng liên hệ quản trị viên.
      </p>
    );
  }
  return <Navigate to={firstItem.path} replace />;
}
