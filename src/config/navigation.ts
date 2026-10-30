import { Settings, Users, type LucideIcon } from 'lucide-react';
import type { HotelModuleKey } from '@/features/hotel/hotelRules';
import type { FeatureKey, PermissionGrid } from '@/features/permissions/permissionRules';

export interface NavItem {
  title: string;
  path: string;
  featureKey: FeatureKey;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  moduleKey?: HotelModuleKey;
}

export const navigationGroups: NavGroup[] = [
  {
    id: 'nhan-su',
    title: 'Nhân sự',
    icon: Users,
    moduleKey: 'workforce',
    items: [
      { title: 'Chấm công hàng ngày', path: '/nhan-su/cham-cong-hang-ngay', featureKey: 'attendance' },
      { title: 'Lịch làm việc', path: '/nhan-su/lich-lam-viec', featureKey: 'schedule' },
      { title: 'Bảng chấm công', path: '/nhan-su/bang-cham-cong', featureKey: 'timesheet' },
      { title: 'Sổ phép', path: '/nhan-su/so-phep', featureKey: 'leave' },
      { title: 'Chốt công', path: '/nhan-su/chot-cong', featureKey: 'closing' },
      { title: 'Hồ sơ nhân viên', path: '/nhan-su/ho-so-nhan-vien', featureKey: 'employees' },
      { title: 'Cấu hình', path: '/nhan-su/cau-hinh', featureKey: 'system' },
    ],
  },
  {
    id: 'he-thong',
    title: 'Hệ thống',
    icon: Settings,
    items: [
      { title: 'Người dùng', path: '/he-thong/nguoi-dung', featureKey: 'system' },
      { title: 'Phân quyền vai trò', path: '/he-thong/phan-quyen-vai-tro', featureKey: 'system' },
      { title: 'Cấu hình khách sạn', path: '/he-thong/cau-hinh-khach-san', featureKey: 'system' },
    ],
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return navigationGroups.flatMap((group) => group.items).find((item) => item.path === pathname);
}

export function visibleNavigationForPermissions(groups: NavGroup[], grid: PermissionGrid): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => grid[item.featureKey].view) }))
    .filter((group) => group.items.length > 0);
}
