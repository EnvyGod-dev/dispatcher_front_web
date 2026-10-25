'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthProvider';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Select from '@/components/form/Select';
import DateRangeInputs, { inDateRange, type OptionalDateRange } from '@/components/form/DateRangeInputs';
import DynamicTable from '@/components/tables/DynamicTable';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import equipmentShiftLogService from '@/services/internal/equipment-shift-log';
import {
  vehicleTypeLabels,
  vehicleTypeMap,
} from '@/services/internal/vehicle/types';
import ReasonSidebar from './ReasonSidebar';
import {
  isIdleCategory,
  reasonCategoryLabel,
  reasonCategoryOptions,
  type ReasonCategory,
  type ReasonRow,
} from './types';

const categoryBadgeClass: Record<ReasonCategory, string> = {
  technological_idle:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  technical_idle:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
  repair:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
};

export default function ReasonTypesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ReasonRow | undefined>();
  const [deletingReason, setDeletingReason] = useState<ReasonRow | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<ReasonCategory | 'all'>(
    'all',
  );
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<OptionalDateRange>({});

  const idleQuery = useQuery({
    queryKey: ['reason-types', 'idle'],
    queryFn: () => equipmentShiftLogService.getIdleReasonTypes(),
    enabled: !!user,
  });

  const repairQuery = useQuery({
    queryKey: ['reason-types', 'repair'],
    queryFn: () => equipmentShiftLogService.getRepairReasonTypes(),
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const refetch = () => {
    idleQuery.refetch();
    repairQuery.refetch();
    // Цаг бүртгэл, засварын маягтууд шинэ нэршлийг шууд харна.
    ['equipment-idle-reasons', 'equipment-repair-reasons', 'repair-reasons'].forEach(
      (key) => queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const rows = useMemo<ReasonRow[]>(
    () => [
      ...(idleQuery.data ?? []).map((reason) => ({
        ...reason,
        rowCategory: 'technological_idle' as const,
      })),
      ...(repairQuery.data ?? []).map((reason) => ({
        ...reason,
        rowCategory: reason.category ?? ('repair' as const),
      })),
    ],
    [idleQuery.data, repairQuery.data],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (categoryFilter !== 'all' && row.rowCategory !== categoryFilter) {
        return false;
      }

      // Техникийн төрөл хоосон бол бүх техникт хамаарна.
      if (
        vehicleTypeFilter !== 'all' &&
        row.vehicleTypes.length > 0 &&
        !row.vehicleTypes.includes(vehicleTypeFilter as never)
      ) {
        return false;
      }

      if (!inDateRange(row.createdAt, dateRange)) {
        return false;
      }

      return !query || row.name.toLowerCase().includes(query);
    });
  }, [rows, categoryFilter, vehicleTypeFilter, search, dateRange]);

  const deleteMutation = useMutation({
    mutationFn: (reason: ReasonRow) =>
      isIdleCategory(reason.rowCategory)
        ? equipmentShiftLogService.deleteIdleReasonType(reason.id)
        : equipmentShiftLogService.deleteRepairReasonType(reason.id),
    onSuccess: () => {
      toast.success('Амжилттай устгагдлаа');
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Устгахад алдаа гарлаа');
    },
  });

  const counts = useMemo(() => {
    const result: Record<ReasonCategory, number> = {
      technological_idle: 0,
      technical_idle: 0,
      repair: 0,
    };
    rows.forEach((row) => {
      result[row.rowCategory] += 1;
    });
    return result;
  }, [rows]);

  const columns = [
    TableColumn.custom<ReasonRow>('name', 'Нэр', (reason) => (
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {reason.name}
      </span>
    )).build(),

    TableColumn.custom<ReasonRow>('category', 'Ангилал', (reason) => (
      <Badge variant="outline" className={categoryBadgeClass[reason.rowCategory]}>
        {reasonCategoryLabel(reason.rowCategory)}
      </Badge>
    )).build(),

    TableColumn.custom<ReasonRow>('target', 'Хаана орох', (reason) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {isIdleCategory(reason.rowCategory) ? 'Цаг ашиглалт' : 'Засвар'}
      </span>
    )).build(),

    TableColumn.custom<ReasonRow>('vehicleTypes', 'Техникийн төрөл', (reason) =>
      reason.vehicleTypes.length === 0 ? (
        <span className="text-xs text-gray-400">Бүх техник</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {reason.vehicleTypes.map((type) => (
            <span
              key={type}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {vehicleTypeLabels[type] ?? type}
            </span>
          ))}
        </div>
      ),
    ).build(),
  ];

  const actions = canManage
    ? [
        TableActions.edit<ReasonRow>((reason) => {
          setEditingReason(reason);
          setIsSidebarOpen(true);
        }),
        TableActions.delete<ReasonRow>(
          (reason) => setDeletingReason(reason),
          'Delete',
          (reason) =>
            deleteMutation.isPending &&
            deleteMutation.variables?.id === reason.id,
        ),
      ]
    : undefined;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Сул зогсолт, засварын төрөл"
        description="Технологийн сул зогсолт цаг ашиглалт руу, техникийн сул зогсолт болон засварын төрөл засвар руу орно"
        actions={
          canManage
            ? {
                label: 'Төрөл нэмэх',
                onClick: () => {
                  setEditingReason(undefined);
                  setIsSidebarOpen(true);
                },
                variant: 'primary',
              }
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {reasonCategoryOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setCategoryFilter((current) =>
                current === option.value ? 'all' : option.value,
              )
            }
            className={`rounded-xl border px-4 py-3 text-left transition ${
              categoryFilter === option.value
                ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
            }`}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {option.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {option.hint}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {counts[option.value]}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-900">
        <div className="w-full">
          <DateRangeInputs label="Бүртгэсэн огноо" value={dateRange} onChange={setDateRange} />
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Нэрээр хайх..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
          />
        </div>
        <div className="min-w-[200px]">
          <Select
            value={categoryFilter}
            onChange={(value) =>
              setCategoryFilter((value || 'all') as ReasonCategory | 'all')
            }
            options={[
              { value: 'all', label: 'Бүх ангилал' },
              ...reasonCategoryOptions.map(({ value, label }) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
        <div className="min-w-[200px]">
          <Select
            value={vehicleTypeFilter}
            onChange={(value) => setVehicleTypeFilter(value || 'all')}
            options={[{ value: 'all', label: 'Бүх техник' }, ...vehicleTypeMap]}
          />
        </div>
      </div>

      <DynamicTable<ReasonRow>
        data={[filteredRows]}
        columns={columns}
        actions={actions}
        isLoading={idleQuery.isLoading || repairQuery.isLoading}
        rowKey={(reason) => `${reason.rowCategory}-${reason.id}`}
        emptyMessage="Бүртгэл олдсонгүй."
      />

      <ReasonSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setEditingReason(undefined);
        }}
        onSuccess={refetch}
        editingReason={editingReason}
      />

      <ConfirmDialog
        open={!!deletingReason}
        onOpenChange={() => setDeletingReason(undefined)}
        title="Устгах уу?"
        description={`"${deletingReason?.name ?? ''}" нэршлийг устгах уу? Өмнө бүртгэсэн цагийн мэдээлэл хэвээр үлдэнэ.`}
        variant="destructive"
        onConfirm={() => {
          if (deletingReason) {
            deleteMutation.mutate(deletingReason);
            setDeletingReason(undefined);
          }
        }}
        confirmText="Устгах"
        cancelText="Болих"
      />
    </div>
  );
}
