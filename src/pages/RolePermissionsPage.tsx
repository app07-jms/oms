import { PageHeading } from '@/components/layout/PageHeading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleListTab } from '@/features/permissions/components/RoleListTab';
import { RolePermissionTab } from '@/features/permissions/components/RolePermissionTab';

const TAB_TRIGGER_CLASS =
  'rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-[#5C6670] shadow-none transition-colors duration-200 data-[state=active]:border-[#4F7284] data-[state=active]:bg-transparent data-[state=active]:text-[#4F7284] data-[state=active]:shadow-none';

export function RolePermissionsPage() {
  return (
    <div className="-mx-4 -my-6 flex min-h-full flex-col gap-6 bg-white px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-1">
        <PageHeading groupTitle="Hệ thống" title="Phân quyền vai trò" />
        <p className="text-sm text-[#5C6670]">
          Quản lý danh sách vai trò và cấu hình quyền xem, chỉnh sửa, duyệt, xóa cho từng tính năng.
        </p>
      </div>

      <Tabs defaultValue="roles" className="flex flex-col gap-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-[#E2E8F0] bg-transparent p-0">
          <TabsTrigger value="roles" className={TAB_TRIGGER_CLASS}>
            Danh sách vai trò
          </TabsTrigger>
          <TabsTrigger value="permissions" className={TAB_TRIGGER_CLASS}>
            Cấu hình phân quyền
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-0">
          <RoleListTab />
        </TabsContent>
        <TabsContent value="permissions" className="mt-0">
          <RolePermissionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
