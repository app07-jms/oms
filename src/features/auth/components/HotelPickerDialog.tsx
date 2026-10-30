import { ChevronRight, Hotel } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { HotelRef } from '@/features/auth/authRules';

interface HotelPickerDialogProps {
  hotels: HotelRef[];
  onSelect: (hotel: HotelRef) => void;
  onCancel: () => void;
}

function secondaryLabel(hotel: HotelRef): string | null {
  if (hotel.address) return hotel.address;
  if (hotel.idPrefix) return `Mã: ${hotel.idPrefix}`;
  return null;
}

export function HotelPickerDialog({ hotels, onSelect, onCancel }: HotelPickerDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md border-[#E2E8F0] bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#0F172A]">Chọn khách sạn làm việc</DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            Bạn sẽ làm việc trên khách sạn đã chọn trong suốt phiên đăng nhập này.
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-2 space-y-2">
          {hotels.map((hotel) => (
            <li key={hotel.id}>
              <button
                type="button"
                onClick={() => onSelect(hotel)}
                className="group flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition-colors duration-200 hover:border-[#4F7284] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7284]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4F7284]/10 text-[#4F7284]">
                  <Hotel className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#0F172A]">{hotel.name}</span>
                  {secondaryLabel(hotel) ? (
                    <span className="block truncate text-xs text-[#64748B]">{secondaryLabel(hotel)}</span>
                  ) : null}
                </span>
                <ChevronRight className="h-4 w-4 text-[#94A3B8] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#4F7284]" aria-hidden="true" />

              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
