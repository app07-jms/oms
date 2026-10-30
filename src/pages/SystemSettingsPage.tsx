import { PageHeading } from '@/components/layout/PageHeading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepartmentsTab } from '@/features/settings/components/DepartmentsTab';
import { ShiftsTab } from '@/features/settings/components/ShiftsTab';

export function SystemSettingsPage() {
  return (
    <div className="-mx-4 -my-6 flex min-h-full flex-col gap-6 bg-white px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-1">
        <PageHeading groupTitle="Nhân sự" title="Cấu hình hệ thống" />
        <p className="text-sm text-[#5C6670]">
          Thiết lập danh mục bộ phận, chức vụ và cấu hình khung giờ các ca làm việc dùng chung toàn hệ thống.
        </p>
      </div>

      <Tabs defaultValue="departments" className="flex flex-col gap-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-[#E2E8F0] bg-transparent p-0">
          <TabsTrigger
            value="departments"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-[#5C6670] shadow-none transition-colors duration-200 data-[state=active]:border-[#4F7284] data-[state=active]:bg-transparent data-[state=active]:text-[#4F7284] data-[state=active]:shadow-none"
          >
            Bộ phận & Chức vụ
          </TabsTrigger>
          <TabsTrigger
            value="shifts"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-[#5C6670] shadow-none transition-colors duration-200 data-[state=active]:border-[#4F7284] data-[state=active]:bg-transparent data-[state=active]:text-[#4F7284] data-[state=active]:shadow-none"
          >
            Ca làm việc & Khung giờ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-0">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="shifts" className="mt-0">
          <ShiftsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
