import { useState, type ClipboardEvent } from 'react';
import { Loader2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { FormAlert, HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import {
  parseCoordinatePaste,
  validateCoordinates,
  validateGeofenceRadius,
  validateStandardShiftHours,
  type HotelSettings,
} from '@/features/hotel/hotelRules';
import { saveHotelSettings } from '@/features/hotel/hotelService';

const SAVE_ERROR = 'Không thể lưu cấu hình GPS và giờ làm chuẩn.';
const LOCATE_UNSUPPORTED = 'Trình duyệt không hỗ trợ lấy vị trí hiện tại.';
const LOCATE_FAILED = 'Không lấy được vị trí. Hãy kiểm tra quyền truy cập vị trí của trình duyệt.';
const QUICK_SHIFT_HOURS = [7, 8, 9] as const;
const COORDINATE_DECIMALS = 6;

interface GeofenceHoursCardProps {
  settings: HotelSettings;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}

function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return Number(trimmed.replace(',', '.'));
}

export function GeofenceHoursCard({ settings, canEdit, onSaved }: GeofenceHoursCardProps) {
  const [latitude, setLatitude] = useState(settings.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(settings.longitude?.toString() ?? '');
  const [radius, setRadius] = useState(String(settings.geofenceRadiusM));
  const [shiftHours, setShiftHours] = useState(settings.standardShiftHours.toFixed(1));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const isBusy = isSaving || isLocating;

  function handleCoordinatePaste(event: ClipboardEvent<HTMLInputElement>) {
    const parsed = parseCoordinatePaste(event.clipboardData.getData('text'));
    if (!parsed) return;
    event.preventDefault();
    setLatitude(String(parsed.latitude));
    setLongitude(String(parsed.longitude));
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setError(LOCATE_UNSUPPORTED);
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(COORDINATE_DECIMALS));
        setLongitude(position.coords.longitude.toFixed(COORDINATE_DECIMALS));
        setIsLocating(false);
      },
      () => {
        setError(LOCATE_FAILED);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  async function handleSave() {
    const parsedLatitude = parseDecimal(latitude);
    const parsedLongitude = parseDecimal(longitude);
    const parsedRadius = Number(radius);
    const parsedHours = parseDecimal(shiftHours);

    const validation =
      validateCoordinates(parsedLatitude, parsedLongitude) ??
      validateGeofenceRadius(parsedRadius) ??
      validateStandardShiftHours(parsedHours ?? Number.NaN);
    if (validation || parsedLatitude === null || parsedLongitude === null || parsedHours === null) {
      setError(validation ?? SAVE_ERROR);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveHotelSettings({
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        geofenceRadiusM: parsedRadius,
        standardShiftHours: parsedHours,
      });
      await onSaved();
      toast({ title: 'Đã lưu cấu hình GPS và giờ làm chuẩn.' });
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message ? saveError.message : SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <HotelSettingsCard
      title="Vị trí GPS và giờ làm chuẩn"
      description="Nhân viên chỉ được chấm công khi nằm trong bán kính cho phép quanh khách sạn. Số giờ chuẩn quyết định phần giờ vượt được tính OT khi chốt công."
      footer={
        canEdit && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isBusy}
            className="h-10 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu cấu hình GPS
          </Button>
        )
      }
    >
      {error && <FormAlert message={error} />}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#1F2A30]">Tọa độ khách sạn</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleLocateMe}
            disabled={!canEdit || isBusy}
            className="h-9 w-fit border-[#4F7284] text-[#4F7284] transition-colors duration-200 hover:bg-[#4F7284]/10"
          >
            {isLocating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="mr-2 h-4 w-4" />
            )}
            Lấy vị trí hiện tại
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-latitude" className="text-sm font-medium text-[#1F2A30]">
              Vĩ độ (Latitude)
            </Label>
            <Input
              id="hotel-latitude"
              inputMode="decimal"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              onPaste={handleCoordinatePaste}
              disabled={!canEdit || isBusy}
              placeholder="VD: 10.776889"
              className="h-10 border-[#E2E8F0] bg-white font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-longitude" className="text-sm font-medium text-[#1F2A30]">
              Kinh độ (Longitude)
            </Label>
            <Input
              id="hotel-longitude"
              inputMode="decimal"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              onPaste={handleCoordinatePaste}
              disabled={!canEdit || isBusy}
              placeholder="VD: 106.700806"
              className="h-10 border-[#E2E8F0] bg-white font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-radius" className="text-sm font-medium text-[#1F2A30]">
              Bán kính cho phép (mét)
            </Label>
            <Input
              id="hotel-radius"
              type="number"
              min={10}
              max={1000}
              step={1}
              value={radius}
              onChange={(event) => setRadius(event.target.value)}
              disabled={!canEdit || isBusy}
              className="h-10 border-[#E2E8F0] bg-white"
            />
          </div>
        </div>
        <p className="text-xs text-[#5C6670]">
          Dán nguyên cặp tọa độ dạng "10.776889, 106.700806" vào ô vĩ độ hoặc kinh độ để điền cả hai.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-6">
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="hotel-shift-hours" className="text-sm font-medium text-[#1F2A30]">
            Số giờ làm chuẩn trong ngày (để tính OT)
          </Label>
          <Input
            id="hotel-shift-hours"
            type="number"
            min={1}
            max={24}
            step={0.5}
            value={shiftHours}
            onChange={(event) => setShiftHours(event.target.value)}
            disabled={!canEdit || isBusy}
            className="h-10 border-[#E2E8F0] bg-white tabular-nums"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn nhanh số giờ chuẩn">
          {QUICK_SHIFT_HOURS.map((hours) => (
            <Button
              key={hours}
              type="button"
              variant="outline"
              size="sm"
              disabled={!canEdit || isBusy}
              onClick={() => setShiftHours(hours.toFixed(1))}
              className="border-[#E2E8F0] text-[#1F2A30] transition-colors duration-200 hover:border-[#4F7284] hover:text-[#4F7284]"
            >
              {hours.toFixed(1)} giờ
            </Button>
          ))}
        </div>
        <p className="text-xs text-[#5C6670]">
          Giờ làm vượt số giờ chuẩn sẽ được ghi nhận là OT khi chốt công. Giá trị từ 1 đến 24 giờ, làm tròn 0.5 giờ.
        </p>
      </div>
    </HotelSettingsCard>
  );
}
