import { useState } from 'react';
import { BedDouble, Users, Warehouse, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { FormAlert, HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import type { HotelModuleKey, HotelModules } from '@/features/hotel/hotelRules';
import { saveHotelSettings } from '@/features/hotel/hotelService';

const SAVE_ERROR = 'Không thể cập nhật module. Vui lòng thử lại.';

interface ModuleDefinition {
  key: HotelModuleKey;
  title: string;
  description: string;
  icon: LucideIcon;
  comingSoon: boolean;
}

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: 'workforce',
    title: 'Nhân sự & Chấm công',
    description: 'Chấm công, lịch làm việc, bảng chấm công, sổ phép và chốt công.',
    icon: Users,
    comingSoon: false,
  },
  {
    key: 'warehouse',
    title: 'Quản lý Kho',
    description: 'Theo dõi vật tư, kho hàng và phiếu nhập xuất.',
    icon: Warehouse,
    comingSoon: true,
  },
  {
    key: 'reception',
    title: 'Lễ tân & Đặt phòng',
    description: 'Quản lý đặt phòng, check-in và check-out.',
    icon: BedDouble,
    comingSoon: true,
  },
];

interface ModuleAccessCardProps {
  modules: HotelModules;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}

export function ModuleAccessCard({ modules, canEdit, onSaved }: ModuleAccessCardProps) {
  const [pendingKey, setPendingKey] = useState<HotelModuleKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(key: HotelModuleKey, enabled: boolean) {
    setPendingKey(key);
    setError(null);
    try {
      await saveHotelSettings({ modules: { [key]: enabled } });
      await onSaved();
      toast({ title: enabled ? 'Đã bật module.' : 'Đã tắt module.' });
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message ? saveError.message : SAVE_ERROR);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <HotelSettingsCard
      title="Module tính năng"
      description="Chỉ Super Admin mới có quyền bật/tắt các module tính năng cho khách sạn. Module đang tắt sẽ ẩn các mục tương ứng trên thanh menu."
    >
      {error && <FormAlert message={error} />}

      <ul className="flex flex-col divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0]">
        {MODULE_DEFINITIONS.map((module) => {
          const Icon = module.icon;
          const isDisabled = !canEdit || module.comingSoon || pendingKey !== null;
          return (
            <li key={module.key} className="flex items-center gap-4 px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4F7284]/10 text-[#4F7284]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#1F2A30]">{module.title}</p>
                  {module.comingSoon && (
                    <Badge variant="outline" className="border-[#E2E8F0] bg-[#F7F9FA] text-[#5C6670]">
                      Sắp ra mắt
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[#5C6670]">{module.description}</p>
              </div>
              <Switch
                aria-label={`Bật ${module.title}`}
                checked={modules[module.key]}
                disabled={isDisabled}
                onCheckedChange={(checked) => handleToggle(module.key, checked)}
                className="data-[state=checked]:bg-[#4F7284]"
              />
            </li>
          );
        })}
      </ul>

      {!canEdit && (
        <p className="text-xs text-[#5C6670]">Bạn cần quyền Super Admin để thay đổi module.</p>
      )}
    </HotelSettingsCard>
  );
}
