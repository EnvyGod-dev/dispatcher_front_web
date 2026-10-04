'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import AddVehicleOrganizationSidebar from '@/components/vehicle-organization/addVehicleOrgSidebar';
import { usePagination } from '@/hooks/pagination';
import vehicleOrganizationService from '@/services/internal/vehicle-organization';
import { VehicleOrganization } from '@/services/internal/vehicle-organization/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function VehicleOrganizations() {
  const { offset, limit, paginate } = usePagination();
  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);
  const [editingVehicleOrg, setEditingVehicleOrg] = useState<
    VehicleOrganization | undefined
  >();
  const [deleteOrg, setDeleteOrg] = useState<VehicleOrganization | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vehicleOrganizations', { offset, limit }],
    queryFn: () =>
      vehicleOrganizationService.getVehicleOrganizations({ offset, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      vehicleOrganizationService.deleteVehicleOrganization(id),
    onSuccess: () => {
      toast.success('Байгууллага амжилттай устгагдлаа');
      refetch();
    },
    onError: (x) => {
      toast.error(x.message || 'Байгууллага устгахад алдаа гарлаа');
    },
  });

  const dataSource = data?.data || [];
  const total = data?.totalCount || dataSource.length;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleCloseSidebar = () => {
    setIsAddSidebarOpen(false);
  };

  const handleVehicleOrgAdded = () => {
    refetch();
    setIsAddSidebarOpen(false);
  };

  const handleEdit = (vehicleOrg: VehicleOrganization) => {
    setEditingVehicleOrg(vehicleOrg);
    setIsAddSidebarOpen(true);
  };

  const handleDelete = (vehicleOrg: VehicleOrganization) => {
    setDeleteOrg(vehicleOrg);
  };

  const actions = [
    TableActions.edit<VehicleOrganization>(handleEdit),
    TableActions.delete<VehicleOrganization>(handleDelete),
  ];

  const columns = [
    TableColumn.text<VehicleOrganization>('name', 'Нэр', 'name').build(),
    TableColumn.text<VehicleOrganization>(
      'vehicleCount',
      'Нийт техникийн тоо',
      'vehicleCount'
    ).build(),
  ];

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Туслан гүйцэтгэгч компани бүртгэл"
        actions={{
          label: 'Нэмэх',
          onClick: () => setIsAddSidebarOpen(true),
          variant: 'primary',
        }}
      />

      <div className="space-y-4">
        <DynamicTable<VehicleOrganization>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="No vehicles found"
          actions={actions}
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

      <AddVehicleOrganizationSidebar
        isOpen={isAddSidebarOpen}
        onClose={handleCloseSidebar}
        onVehicleOrganizationAdded={handleVehicleOrgAdded}
        editingOrg={editingVehicleOrg}
      />

      <ConfirmDialog
        open={!!deleteOrg}
        onOpenChange={() => setDeleteOrg(null)}
        title="Туслан гүйцэтгэх компанийг устгахдаа итгэлтэй байна уу?"
        description="Тус өгөгдлийг дахин сэргээх боломжгүй болно."
        onConfirm={() => {
          deleteMutation.mutate(deleteOrg!.id);
          setDeleteOrg(null);
        }}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
      />
    </div>
  );
}
