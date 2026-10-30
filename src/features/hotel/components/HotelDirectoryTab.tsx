import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { toast } from '@/hooks/use-toast';
import { HotelSettingsCard } from '@/features/hotel/components/HotelSettingsCard';
import { HotelFormDialog } from '@/features/hotel/components/HotelFormDialog';
import type { HotelSettings } from '@/features/hotel/hotelRules';
import { deleteHotel } from '@/features/hotel/hotelService';

const DELETE_ERROR = 'Không thể xóa khách sạn. Vui lòng thử lại.';

interface HotelDirectoryTabProps {
  hotels: HotelSettings[];
  currentHotelId: string;
  onChanged: () => Promise<void>;
}

export function HotelDirectoryTab({ hotels, currentHotelId, onChanged }: HotelDirectoryTabProps) {
  const [formHotel, setFormHotel] = useState<HotelSettings | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HotelSettings | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setFormHotel(null);
    setIsFormOpen(true);
  }

  function openEdit(hotel: HotelSettings) {
    setFormHotel(hotel);
    setIsFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteHotel(deleteTarget.id);
      await onChanged();
      toast({ title: 'Đã xóa khách sạn.' });
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error && error.message ? error.message : DELETE_ERROR);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <HotelSettingsCard
      title="Danh sách khách sạn"
      description="Quản lý các khách sạn trong hệ thống. Mỗi khách sạn có cấu hình chấm công, module và bộ phận riêng."
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={openCreate}
            className="h-10 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách sạn mới
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[#5C6670]">Tên khách sạn</TableHead>
                <TableHead className="text-[#5C6670]">Địa chỉ</TableHead>
                <TableHead className="text-[#5C6670]">Mã viết tắt</TableHead>
                <TableHead className="text-right text-[#5C6670]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-[#5C6670]">
                    Chưa có khách sạn nào.
                  </TableCell>
                </TableRow>
              )}
              {hotels.map((hotel) => {
                const isCurrent = hotel.id === currentHotelId;
                return (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium text-[#1F2A30]">{hotel.name}</TableCell>
                    <TableCell className="text-[#1F2A30]">{hotel.address || '—'}</TableCell>
                    <TableCell className="font-mono text-[#1F2A30]">{hotel.idPrefix ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Sửa ${hotel.name}`}
                          onClick={() => openEdit(hotel)}
                          className="h-9 border-[#E2E8F0] text-[#1F2A30] transition-colors duration-200 hover:border-[#4F7284] hover:text-[#4F7284]"
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Xóa ${hotel.name}`}
                          disabled={isCurrent}
                          title={isCurrent ? 'Bạn đang đăng nhập tại khách sạn này' : undefined}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(hotel);
                          }}
                          className="h-9 border-[#E2E8F0] text-error transition-colors duration-200 hover:border-error hover:bg-error/5"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {isFormOpen && (
        <HotelFormDialog
          hotel={formHotel}
          onClose={() => setIsFormOpen(false)}
          onSaved={onChanged}
        />
      )}

      {deleteTarget && (
        <ConfirmActionDialog
          title="Xóa khách sạn?"
          description={`Khách sạn "${deleteTarget.name}" sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.`}
          confirmLabel="Xóa khách sạn"
          isPending={isDeleting}
          errorMessage={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </HotelSettingsCard>
  );
}
