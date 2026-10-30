import { Settings, Users, type LucideIcon } from 'lucide-react';
import type { HotelModuleKey } from '@/features/hotel/hotelRules';

export interface NavItem {
  title: string;
  path: string;
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
      { title: 'Chấm công hàng ngày', path: '/nhan-su/cham-cong-hang-ngay' },
      { title: 'Lịch làm việc', path: '/nhan-su/lich-lam-viec' },
      { title: 'Bảng chấm công', path: '/nhan-su/bang-cham-cong' },
      { title: 'Sổ phép', path: '/nhan-su/so-phep' },
      { title: 'Chốt công', path: '/nhan-su/chot-cong' },
      { title: 'Hồ sơ nhân viên', path: '/nhan-su/ho-so-nhan-vien' },
      { title: 'Cấu hình', path: '/nhan-su/cau-hinh' },
    ],
  },
  {
    id: 'he-thong',
    title: 'Hệ thống',
    icon: Settings,
    items: [
      { title: 'Người dùng', path: '/he-thong/nguoi-dung' },
      { title: 'Phân quyền vai trò', path: '/he-thong/phan-quyen-vai-tro' },
      { title: 'Cấu hình khách sạn', path: '/he-thong/cau-hinh-khach-san' },
    ],
  },
];
