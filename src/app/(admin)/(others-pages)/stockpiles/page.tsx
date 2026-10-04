'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import Button from '@/components/ui/button/Button';
import { usePagination } from '@/hooks/pagination';
import stockpileService from '@/services/internal/stockpile';
import {
  Stockpile,
  StockpileFilters,
  stockpileTypeMap,
} from '@/services/internal/stockpile/types';
import StockpileFormSidebar from './Sidebar';
import { formatDate } from '@/lib/time-formatter';
import { useAuth } from '@/components/AuthProvider';
import { hasRole, stockpileActionRoles } from '@/services/roles';

const StockpileTypeMap: Record<string, string> = {
  coal: 'Нүүрс',
  soil: 'Хөрс',
  engineering: 'Инженерийн ажил',
  common: 'Дундын ажил',
  internal: 'Дотоод ажил',
  unproductive: 'Бүтээлгүй ажил',
  blast: 'Тэсэлгээний нурал',
  humus: 'Шимт хөрс',
};

export default function MaterialPage() {
  const { user } = useAuth();

  const { offset, limit, paginate } = usePagination();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<
    Stockpile | undefined
  >();
  const [deletingMaterial, setDeletingMaterial] = useState<
    Stockpile | undefined
  >();
  const [filters, setFilters] = useState<StockpileFilters>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stockpiles', { offset, limit, ...filters }],
    queryFn: () => stockpileService.getStockpiles({ offset, limit, ...filters }),
  });

  const hasActiveFilters = !!filters.type || !!filters.layerNumber;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockpileService.deleteStockpile(id),
    onSuccess: () => {
      toast.success('Овоолго амжилттай устгагдлаа');
      refetch();
    },
    onError: () => {
      toast.error('Овоолго устгахад алдаа гарлаа');
    },
  });

  const handleEdit = (material: Stockpile) => {
    setEditingMaterial(material);
    setIsSidebarOpen(true);
  };

  const handleDelete = (material: Stockpile) => {
    setDeletingMaterial(material);
  };

  const handleFilterChange = useCallback(
    (nextFilters: StockpileFilters) => {
      setFilters(nextFilters);
      paginate(1, limit);
    },
    [limit, paginate]
  );

  const handleClearFilters = useCallback(() => {
    handleFilterChange({});
  }, [handleFilterChange]);

  const handleSuccess = () => {
    refetch();
    setEditingMaterial(undefined);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingMaterial(undefined);
  };

  const columns = [
    TableColumn.custom<Stockpile>('createdAt', 'Огноо', (stockpile) => {
      return (
        <p className="text-gray-700 text-theme-sm dark:text-white/90">
          {formatDate(stockpile.createdAt)}
        </p>
      );
    }).build(),

    TableColumn.custom<Stockpile>('type', 'Төрөл', (stockpile) => {
      const colors: Record<string, string> = {
        soil: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        coal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
        engineering: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        common: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        internal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        unproductive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        blast: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
        humus: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      };
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[stockpile.type]}`}
        >
          {StockpileTypeMap[stockpile.type]}
        </span>
      );
    }).build(),

    TableColumn.text<Stockpile>(
      'layerNumber',
      'Овоолгын дугаар',
      'layerNumber'
    ).build(),
  ];

  const actionRole = hasRole(user?.role, stockpileActionRoles);

  const actions = actionRole
    ? [
      TableActions.edit<Stockpile>(handleEdit),
      TableActions.delete<Stockpile>(handleDelete),
    ]
    : undefined;

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Бүртгэлтэй овоолгын жагсаалт"
        actions={
          actionRole
            ? {
              label: 'Овоолго нэмэх',
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

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-center">
            <div>
              <Input
                type="text"
                placeholder="Овоолгын дугаараар шүүх"
                value={filters.layerNumber || ''}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    layerNumber: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div>
              <Select
                options={stockpileTypeMap}
                placeholder="Төрөл сонгох"
                value={filters.type || undefined}
                onChange={(value) =>
                  handleFilterChange({
                    ...filters,
                    type: value ? (value as StockpileFilters['type']) : undefined,
                  })
                }
              />
            </div>
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>

        <DynamicTable<Stockpile>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Үүсгэсэн овоолго олдсонгүй"
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

      <StockpileFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingMaterial={editingMaterial}
      />

      <ConfirmDialog
        open={!!deletingMaterial}
        onOpenChange={() => setDeletingMaterial(undefined)}
        title="Овоолго устгах уу?"
        description={`"${deletingMaterial ? StockpileTypeMap[deletingMaterial.type] : ''}" овоолгыг устгах үйлдлийг буцаах боломжгүй.`}
        variant="destructive"
        onConfirm={() => {
          if (deletingMaterial) {
            deleteMutation.mutate(deletingMaterial.id);
            setDeletingMaterial(undefined);
          }
        }}
      />
    </div>
  );
}
