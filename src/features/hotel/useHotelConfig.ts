import { useCallback } from 'react';
import { useCatalogResource } from '@/hooks/useCatalogResource';
import { fetchHotelSettings } from '@/features/hotel/hotelService';

const LOAD_ERROR = 'Không thể tải cấu hình khách sạn.';

export function useHotelConfig(hotelId: string) {
  const load = useCallback(() => fetchHotelSettings(hotelId), [hotelId]);
  return useCatalogResource(load, LOAD_ERROR);
}
