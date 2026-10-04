'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Input from '@/components/form/input/InputField';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePagination } from '@/hooks/pagination';
import miningBlockService from '@/services/internal/mining-block';
import {
  MiningBlock,
  MiningBlockFilters,
} from '@/services/internal/mining-block/types';
import MiningBlockFormSidebar from './Sidebar';
import {
  hasRole,
  miningBlockActionRoles,
  miningBlockReadRoles,
} from '@/services/roles';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function MiningBlocksPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user || !hasRole(user?.role, miningBlockReadRoles)) {
    router.push('/');
  }

  const { offset, limit, paginate } = usePagination();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<MiningBlock | undefined>();
  const [deletingBlock, setDeletingBlock] = useState<MiningBlock | undefined>();
  const [filters, setFilters] = useState<MiningBlockFilters>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mining-blocks', { offset, limit, ...filters }],
    queryFn: () =>
      miningBlockService.getMiningBlocks({ offset, limit, ...filters }),
  });

  const hasActiveFilters =
    !!filters.search ||
    typeof filters.isActive === 'boolean' ||
    !!filters.layerNumber;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => miningBlockService.deleteMiningBlock(id),
    onSuccess: () => {
      toast.success('Блок амжилттай устгагдлаа');
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Блок устгахад алдаа гарлаа');
    },
  });

  const handleFiltersChange = (nextFilters: MiningBlockFilters) => {
    setFilters(nextFilters);
    paginate(1, limit);
  };

  const handleClearFilters = () => {
    handleFiltersChange({});
  };

  const handleEdit = (block: MiningBlock) => {
    setEditingBlock(block);
    setIsSidebarOpen(true);
  };

  const handleDelete = (block: MiningBlock) => {
    setDeletingBlock(block);
  };

  const handleSuccess = () => {
    refetch();
    setEditingBlock(undefined);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingBlock(undefined);
  };

  const columns = [
    TableColumn.text<MiningBlock>('name', 'Блокын нэр', 'name').build(),
    TableColumn.text<MiningBlock>(
      'layerNumber',
      'Талын зай',
      'layerNumber',
    ).build(),

    TableColumn.custom<MiningBlock>('coordinates', 'Байршил', (block) => {
      if (block.latitude && block.longitude) {
        const lat = parseFloat(block.latitude).toFixed(6);
        const lng = parseFloat(block.longitude).toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        return (
          <div className="flex items-center gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
              title="Google Maps дээр харах"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {lat}, {lng}
              </span>
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${lat}, ${lng}`);
                toast.success('GPS хаяг хуулагдлаа');
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Хуулах"
            >
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        );
      }
      return <span className="text-xs text-gray-400">-</span>;
    }).build(),

    TableColumn.custom<MiningBlock>('status', 'Төлөв', (block) => (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          block.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${block.isActive ? 'bg-green-600' : 'bg-gray-400'}`}
        ></span>
        {block.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
      </span>
    )).build(),
    TableColumn.custom<MiningBlock>('linkedPlanCount', 'Ашиглалт', (block) => {
      const linkedPlanCount = block.linkedPlanCount || 0;

      return linkedPlanCount > 0 ? (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          {linkedPlanCount} төлөвлөгөөтэй
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          Чөлөөтэй
        </span>
      );
    }).build(),
  ];

  const actions = [
    TableActions.edit<MiningBlock>(handleEdit),
    TableActions.delete<MiningBlock>(handleDelete),
  ];

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Блок ашиглалт"
        description="Тэсэлгээний блокын бүртгэл"
        actions={
          hasRole(user?.role, miningBlockActionRoles)
            ? {
                label: 'Блок нэмэх',
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
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <div className="md:col-span-2 xl:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Блокын нэр
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={filters.search || ''}
                  onChange={(e) =>
                    handleFiltersChange({
                      ...filters,
                      search: e.target.value || undefined,
                    })
                  }
                  placeholder="Блокын нэрээр хайх"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Төлөв
              </label>
              <Select
                value={
                  typeof filters.isActive === 'boolean'
                    ? filters.isActive
                      ? 'active'
                      : 'inactive'
                    : 'all'
                }
                onValueChange={(value) =>
                  handleFiltersChange({
                    ...filters,
                    isActive: value === 'all' ? undefined : value === 'active',
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Бүх төлөв" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүгд</SelectItem>
                  <SelectItem value="active">Идэвхтэй</SelectItem>
                  <SelectItem value="inactive">Идэвхгүй</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Талын зай
              </label>
              <Input
                value={filters.layerNumber || ''}
                onChange={(e) =>
                  handleFiltersChange({
                    ...filters,
                    layerNumber: e.target.value || undefined,
                  })
                }
                placeholder="Талын зайгаар шүүх"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Ашиглагдаж буй блокийг устгах боломжгүй. Идэвхгүй болгож болно.
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4" />
                Цэвэрлэх
              </Button>
            )}
          </div>
        </div>

        <DynamicTable<MiningBlock>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          actions={
            hasRole(user?.role, miningBlockActionRoles) ? actions : undefined
          }
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Блок олдсонгүй."
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

      <MiningBlockFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingBlock={editingBlock}
      />

      <ConfirmDialog
        open={!!deletingBlock}
        onOpenChange={() => setDeletingBlock(undefined)}
        title={
          (deletingBlock?.linkedPlanCount || 0) > 0
            ? 'Энэ блокийг устгах боломжгүй'
            : 'Блок устгах уу?'
        }
        description={
          (deletingBlock?.linkedPlanCount || 0) > 0
            ? `"${deletingBlock?.name || ''}" блок ${deletingBlock?.linkedPlanCount} төлөвлөгөөнд ашиглагдаж байна. Иймээс устгах боломжгүй, харин идэвхгүй болгож болно.`
            : `"${deletingBlock?.name || ''}" блокыг устгах үйлдлийг буцаах боломжгүй.`
        }
        variant={
          (deletingBlock?.linkedPlanCount || 0) > 0 ? 'default' : 'destructive'
        }
        confirmText={
          (deletingBlock?.linkedPlanCount || 0) > 0 ? 'Ойлголоо' : 'Устгах'
        }
        onConfirm={() => {
          if (deletingBlock && (deletingBlock.linkedPlanCount || 0) === 0) {
            deleteMutation.mutate(deletingBlock.id);
          }
          setDeletingBlock(undefined);
        }}
      />
    </div>
  );
}
