'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import AddMiningSectionSidebar from '@/components/mining-section/addMiningSection';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { usePagination } from '@/hooks/pagination';
import { formatDateFull } from '@/lib/time-formatter';
import miningSectionService from '@/services/internal/mining-section';
import { MiningSection } from '@/services/internal/mining-section/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '../ui/alert/Alert';
import { TableActions } from '../ui/table/TableActions';
import { toast } from 'sonner';
import { useAuth } from '../AuthProvider';
import { hasRole, miningSectionActionRoles } from '@/services/roles';

export default function MiningSections() {
  const { user } = useAuth();

  const { offset, limit, paginate } = usePagination();
  const queryClient = useQueryClient();

  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);
  const [editingMiningSection, setEditingMiningSection] = useState<
    MiningSection | undefined
  >(undefined);
  const [deleteMiningSection, setDeleteMiningSection] =
    useState<MiningSection | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['miningSections', { offset, limit }],
    queryFn: () => miningSectionService.getMiningSections({ offset, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: miningSectionService.deleteMiningSection,
    onSuccess: () => {
      toast.success('Техник устгагдаа.');
      queryClient.invalidateQueries({ queryKey: ['miningSections'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });

  const dataSource = data?.data || [];
  const total = data?.totalCount || dataSource.length;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const columns = [
    TableColumn.text<MiningSection>('name', 'Нэр', 'name').build(),
    TableColumn.custom<MiningSection>(
      'createdAt',
      'Үүссэн огноо',
      (miningSection) => (
        <div className="space-y-0.5">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {formatDateFull(miningSection.createdAt)}
          </div>
        </div>
      )
    ).build(),
  ];

  const handleCloseSidebar = () => {
    setIsAddSidebarOpen(false);
  };

  const handleMiningSectionAdded = () => {
    refetch();
    setIsAddSidebarOpen(false);
  };

  const handleEdit = (miningSection: MiningSection) => {
    setEditingMiningSection(miningSection);
    setIsAddSidebarOpen(true);
  };

  const handleDelete = (miningSection: MiningSection) => {
    setDeleteMiningSection(miningSection);
  };

  const actionRole = hasRole(user?.role, miningSectionActionRoles);

  const actions = actionRole
    ? [
        TableActions.edit<MiningSection>(handleEdit),
        TableActions.delete<MiningSection>(handleDelete),
      ]
    : [];

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Уулын хэсэг бүртгэл"
        actions={
          actionRole
            ? {
                label: 'Нэмэх',
                onClick: () => setIsAddSidebarOpen(true),
                variant: 'primary',
              }
            : undefined
        }
      />

      <div className="space-y-4">
        <DynamicTable<MiningSection>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          isLoading={isLoading}
          rowKey="id"
          actions={actions}
          emptyMessage="Уулын хэсэг олдсонгүй"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(page) => paginate(page, limit)}
          isLoading={isLoading}
        />
      </div>

      <AddMiningSectionSidebar
        isOpen={isAddSidebarOpen}
        onClose={handleCloseSidebar}
        onMiningSectionAdded={handleMiningSectionAdded}
        editingMiningsection={editingMiningSection}
      />

      <ConfirmDialog
        open={!!deleteMiningSection}
        onOpenChange={() => setDeleteMiningSection(null)}
        title="Техникийг устгах уу?"
        description={`${deleteMiningSection?.name} техникийн төлөв 'Идэвхгүй' болно.`}
        onConfirm={() => {
          deleteMutation.mutate(deleteMiningSection!.id);
          setDeleteMiningSection(null);
        }}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
      />
    </div>
  );
}
