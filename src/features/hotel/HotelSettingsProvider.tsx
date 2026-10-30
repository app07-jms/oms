import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/AuthProvider';
import { useCatalogResource } from '@/hooks/useCatalogResource';
import type { HotelSettings } from '@/features/hotel/hotelRules';
import { fetchHotelSettings } from '@/features/hotel/hotelService';

const LOAD_ERROR = 'Không thể tải cấu hình khách sạn.';

interface HotelSettingsContextValue {
  settings: HotelSettings;
  refresh: () => Promise<void>;
}

const HotelSettingsContext = createContext<HotelSettingsContextValue | null>(null);

export function HotelSettingsProvider({ children }: { children: ReactNode }) {
  const hotelId = useSession().hotel.id;
  const load = useCallback(() => fetchHotelSettings(hotelId), [hotelId]);
  const catalog = useCatalogResource(load, LOAD_ERROR);
  const settings = catalog.data;
  const refresh = catalog.refresh;
  const value = useMemo(() => (settings ? { settings, refresh } : null), [settings, refresh]);

  if (!value) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        {catalog.loadError ? (
          <>
            <p role="alert" className="text-sm text-error">
              {catalog.loadError}
            </p>
            <Button
              type="button"
              onClick={() => void refresh()}
              className="h-10 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[#5C6670]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải cấu hình khách sạn...
          </p>
        )}
      </div>
    );
  }

  return <HotelSettingsContext.Provider value={value}>{children}</HotelSettingsContext.Provider>;
}

export function useHotelSettings(): HotelSettingsContextValue {
  const context = useContext(HotelSettingsContext);
  if (!context) throw new Error('useHotelSettings must be used inside HotelSettingsProvider');
  return context;
}
