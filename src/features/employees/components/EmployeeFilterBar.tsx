import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FILTER_DEPARTMENTS,
  type AccountFilter,
  type EmployeeFilters,
} from '@/features/employees/employeeRules';

interface EmployeeFilterBarProps {
  filters: EmployeeFilters;
  onFiltersChange: (filters: EmployeeFilters) => void;
}

const ACCOUNT_OPTIONS: { value: AccountFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'linked', label: 'Đã có tài khoản' },
  { value: 'unlinked', label: 'Chưa tạo tài khoản' },
];

const selectTriggerClass = 'h-10 w-full border-[#E2E8F0] bg-white sm:w-[200px]';

export function EmployeeFilterBar({ filters, onFiltersChange }: EmployeeFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filters.department} onValueChange={(value) => onFiltersChange({ ...filters, department: value })}>
          <SelectTrigger aria-label="Bộ phận" className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả bộ phận</SelectItem>
            {FILTER_DEPARTMENTS.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.account}
          onValueChange={(value) => onFiltersChange({ ...filters, account: value as AccountFilter })}
        >
          <SelectTrigger aria-label="Trạng thái tài khoản" className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative w-full lg:w-[360px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6670]" />
        <Input
          type="search"
          aria-label="Tìm kiếm nhân viên"
          placeholder="Tìm kiếm theo tên, mã NV, SĐT, Email..."
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          className="h-10 border-[#E2E8F0] bg-white pl-9"
        />
      </div>
    </div>
  );
}
