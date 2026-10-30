import type { GpsReading } from '@/features/attendance/attendanceRules';
import { distanceInMeters, type Coordinates } from '@/lib/geo';

const GEOLOCATION_TIMEOUT_MS = 15_000;

export class GeolocationError extends Error {}

export function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('Thiết bị không hỗ trợ định vị GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => reject(new GeolocationError('Không lấy được vị trí. Vui lòng cho phép truy cập vị trí và thử lại.')),
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
    );
  });
}

export function readGeofence(position: Coordinates, hotelCenter: Coordinates, radiusM: number): GpsReading {
  const distanceM = Math.round(distanceInMeters(hotelCenter, position));
  return { status: distanceM <= radiusM ? 'valid' : 'out-of-range', distanceM };
}
