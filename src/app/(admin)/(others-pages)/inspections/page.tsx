'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthProvider';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import InspectionSidebar from '@/components/inspection/InspectionSidebar';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { usePagination } from '@/hooks/pagination';
import { formatDateFull } from '@/lib/time-formatter';
import inspectionService from '@/services/internal/inspection';
import { Inspection } from '@/services/internal/inspection/types';
import {
  VehicleType,
  vehicleTypeLabels,
  vehicleTypeMap,
} from '@/services/internal/vehicle/types';
import { hasRole, inspectionActionRoles } from '@/services/roles';

export default function InspectionsPage() {
  const { user } = useAuth();
  const { offset, limit, paginate } = usePagination();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<
    Inspection | undefined
  >();
  const [filterVehicleType, setFilterVehicleType] = useState<
    VehicleType | undefined
  >();
  const [deletingInspection, setDeletingInspection] = useState<
    Inspection | undefined
  >(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'inspections',
      { offset, limit, vehicleType: filterVehicleType },
    ],
    queryFn: () =>
      inspectionService.getInspections({
        offset,
        limit,
        vehicleType: filterVehicleType,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inspectionService.deleteInspection(id),
    onSuccess: () => {
      refetch();
      toast.success('Үзлэг амжилттай устгагдлаа');
      refetch();
    },
    onError: () => {
      toast.error('Үзлэг устгахад алдаа гарлаа');
    },
  });

  const handleEdit = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setIsSidebarOpen(true);
  };

  const handleDelete = (inspection: Inspection) => {
    setDeletingInspection(inspection);
  };

  const handleSuccess = () => {
    refetch();
    setEditingInspection(undefined);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingInspection(undefined);
  };

  const columns = [
    TableColumn.custom<Inspection>('type', 'Төрөл', (inspection) => {
      if (inspection.type) {
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {inspection.type}
          </span>
        );
      }
      return <span className="text-xs text-gray-400">-</span>;
    }).build(),
    TableColumn.text<Inspection>('name', 'Нэр', 'name').build(),
    TableColumn.custom<Inspection>(
      'vehicleType',
      'Техникийн төрөл',
      (inspection) => {
        const colors = {
          truck:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          excavator:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          loader:
            'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
          dozer:
            'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
          dump: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          light_vehicle:
            'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
          special_purpose:
            'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
          grader:
            'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
        };

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[inspection.vehicleType]}`}
          >
            {vehicleTypeLabels[inspection.vehicleType]}
          </span>
        );
      }
    ).build(),

    TableColumn.custom<Inspection>(
      'createdAt',
      'Үүссэн огноо',
      (inspection) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDateFull(inspection.createdAt)}
        </span>
      )
    ).build(),
  ];

  const actions = hasRole(user?.role, inspectionActionRoles)
    ? [
        TableActions.edit<Inspection>(handleEdit),
        TableActions.delete<Inspection>(handleDelete),
      ]
    : [];

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Үзлэгийн жагсаалт"
        description="Оператор ээлж эхлэхээс өмнө шалгах үзлэгийн жагсаалт"
        actions={
          hasRole(user?.role, inspectionActionRoles)
            ? {
                label: 'Үзлэг нэмэх',
                onClick: () => setIsSidebarOpen(true),
                variant: 'primary',
                icon: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                ),
              }
            : undefined
        }
      />

      {/* Filter */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Техникийн төрөл:
          </label>
          <Select
            className="w-48"
            placeholder="Бүгд"
            allowClear
            value={filterVehicleType}
            onChange={(value) => {
              setFilterVehicleType(value as VehicleType | undefined);
              paginate(1, limit);
            }}
            options={vehicleTypeMap}
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Нийт:{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {total}
          </span>{' '}
          үзлэг
        </div>
      </div>

      <div className="space-y-4">
        <DynamicTable<Inspection>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Үзлэгийн жагсаалт олдсонгүй."
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

      <InspectionSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingInspection={editingInspection}
      />

      <ConfirmDialog
        open={!!deletingInspection}
        onOpenChange={() => setDeletingInspection(undefined)}
        title="Үзлэгийг устгахдаа итгэлтэй байна уу?"
        description=""
        onConfirm={() => {
          deleteMutation.mutate(deletingInspection!.id);
          setDeletingInspection(undefined);
        }}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
      />
    </div>
  );
}
