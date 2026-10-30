import type { NavGroup } from '@/config/navigation';

export const HOTEL_MODULE_KEYS = ['workforce', 'warehouse', 'reception'] as const;
export type HotelModuleKey = (typeof HOTEL_MODULE_KEYS)[number];

export type HotelModules = Record<HotelModuleKey, boolean>;

export interface HotelSettings {
  id: string;
  name: string;
  address: string;
  idPrefix: string | null;
  systemHotelId: string | null;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusM: number;
  standardShiftHours: number;
  modules: HotelModules;
}

export const ID_PREFIX_PATTERN = /^[A-Z0-9]{2,10}$/;
const HASH_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const HASH_LENGTH = 8;

export const HOTEL_MANAGER_ROLE_KEYS: readonly string[] = ['super_admin', 'admin'];

export const GEOFENCE_RADIUS_RANGE = { min: 10, max: 1000 } as const;
export const STANDARD_SHIFT_HOURS_RANGE = { min: 1, max: 24 } as const;

export function normalizeIdPrefix(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

export function generateHotelHash(): string {
  const bytes = new Uint32Array(HASH_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => HASH_ALPHABET[byte % HASH_ALPHABET.length]).join('');
}

export function buildSystemHotelId(prefix: string, hash: string): string {
  return `${prefix}_Hotel${hash}`;
}

export function parseCoordinatePaste(text: string): { latitude: number; longitude: number } | null {
  const parts = text.split(/[,;\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function validateHotelInfo(input: { name: string; prefix: string; prefixLocked: boolean }): string | null {
  if (!input.name.trim()) return 'Vui lòng nhập tên khách sạn.';
  if (input.prefixLocked) return null;
  if (!ID_PREFIX_PATTERN.test(input.prefix)) {
    return 'Mã viết tắt gồm 2-10 ký tự chữ in hoa hoặc số, ví dụ JMS01.';
  }
  return null;
}

export function validateCoordinates(latitude: number | null, longitude: number | null): string | null {
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'Vui lòng nhập đủ vĩ độ và kinh độ.';
  }
  if (latitude < -90 || latitude > 90) return 'Vĩ độ phải nằm trong khoảng -90 đến 90.';
  if (longitude < -180 || longitude > 180) return 'Kinh độ phải nằm trong khoảng -180 đến 180.';
  return null;
}

export function validateGeofenceRadius(radius: number): string | null {
  if (!Number.isInteger(radius) || radius < GEOFENCE_RADIUS_RANGE.min || radius > GEOFENCE_RADIUS_RANGE.max) {
    return `Bán kính phải là số nguyên từ ${GEOFENCE_RADIUS_RANGE.min} đến ${GEOFENCE_RADIUS_RANGE.max} mét.`;
  }
  return null;
}

export function validateStandardShiftHours(hours: number): string | null {
  if (
    !Number.isFinite(hours) ||
    hours < STANDARD_SHIFT_HOURS_RANGE.min ||
    hours > STANDARD_SHIFT_HOURS_RANGE.max ||
    Math.round(hours * 2) !== hours * 2
  ) {
    return `Số giờ chuẩn phải từ ${STANDARD_SHIFT_HOURS_RANGE.min} đến ${STANDARD_SHIFT_HOURS_RANGE.max} giờ, làm tròn 0.5 giờ.`;
  }
  return null;
}

export function visibleNavigationGroups(groups: NavGroup[], modules: HotelModules): NavGroup[] {
  return groups.filter((group) => !group.moduleKey || modules[group.moduleKey]);
}
