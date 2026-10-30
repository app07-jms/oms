import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HotelSettings } from '@/features/hotel/hotelRules';

interface HotelSelectProps {
  hotels: HotelSettings[];
  value: string;
  onChange: (hotelId: string) => void;
}

export function HotelSelect({ hotels, value, onChange }: HotelSelectProps) {
  return (
    <div className="flex flex-col gap-2 sm:max-w-sm">
      <Label htmlFor="hotel-scope-select" className="text-sm font-medium text-[#1F2A30]">
        Khách sạn đang cấu hình
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="hotel-scope-select" className="h-10 border-[#E2E8F0] bg-white">
          <SelectValue placeholder="Chọn khách sạn" />
        </SelectTrigger>
        <SelectContent>
          {hotels.map((hotel) => (
            <SelectItem key={hotel.id} value={hotel.id}>
              {hotel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
