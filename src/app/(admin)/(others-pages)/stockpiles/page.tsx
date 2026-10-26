'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Layers, Plus, Power, PowerOff, Route as RouteIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoutesPanel from '../routes/RoutesPanel';
import routeService from '@/services/internal/routes';
import type { Route } from '@/services/internal/routes/types';
import { exportExcel } from '@/lib/fuel/export';
import { fetchAllPages } from '@/lib/export/fetch-all';
import { useExcelExport } from '@/lib/export/use-excel-export';
import DateRangeInputs, { type OptionalDateRange, type ShiftFilterValue } from '@/components/form/DateRangeInputs';
import { matchesCreated } from '@/lib/export/date-paged';
import { fetchPageWithDateFilter } from '@/lib/export/date-paged';

type StockpileTab = 'stockpiles' | 'routes';

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
  // Анхдагчаар зөвхөн идэвхтэй овоолго (идэвхгүй болгосон нь давхардахгүй).
  const [filters, setFilters] = useState<StockpileFilters>({ status: 'active' });
  const [dateRange, setDateRange] = useState<OptionalDateRange>({});
  const [shiftFilter, setShiftFilter] = useState<ShiftFilterValue>('');
  const [tab, setTab] = useState<StockpileTab>('stockpiles');

  // ?tab=routes (хуучин /routes холбоос энд шилжинэ).
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('tab');
    if (initial === 'routes') setTab('routes');
  }, []);

  const handleTabChange = (value: string) => {
    const next = value as StockpileTab;
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'routes') url.searchParams.set('tab', 'routes');
    else url.searchParams.delete('tab');
    window.history.replaceState(null, '', url.toString());
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stockpiles', { offset, limit, ...filters, dateRange, shiftFilter }],
    queryFn: () =>
      fetchPageWithDateFilter<Stockpile>({
        offset,
        limit,
        range: dateRange,
        shift: shiftFilter,
        getDate: (row) => row.createdAt,
        fetchPage: (pageOffset, pageLimit) =>
          stockpileService.getStockpiles({ offset: pageOffset, limit: pageLimit, ...filters }),
      }),
  });

  const hasActiveFilters =
    !!filters.type || !!filters.layerNumber || !!dateRange.from || !!dateRange.to || !!shiftFilter;

  // Овоолго (одоогийн шүүлтүүрээр) болон маршрутыг нэг файлд.
  const { isExporting, exportNow } = useExcelExport(async () => {
    const [stockpileRows, routeRows] = await Promise.all([
      fetchAllPages<Stockpile>((offset, limit) =>
        stockpileService.getStockpiles({ offset, limit, ...filters }),
      ).then((rows) => rows.filter((row) => matchesCreated(row.createdAt, dateRange, shiftFilter))),
      fetchAllPages<Route>((offset, limit) => routeService.getRoutes({ offset, limit })),
    ]);
    if (stockpileRows.length + routeRows.length > 0) {
      exportExcel('ovoolgo-marshrut', [
        {
          name: 'Овоолго',
          rows: stockpileRows,
          columns: [
            { header: 'Төрөл', value: (r: Stockpile) => StockpileTypeMap[r.type] ?? r.type, width: 18 },
            { header: 'Овоолгын дугаар', value: (r: Stockpile) => r.layerNumber, width: 16 },
            { header: 'Маршрут', value: (r: Stockpile) => r.routeCode ?? '', width: 14 },
            { header: 'Үүсгэсэн', value: (r: Stockpile) => r.createdAt?.slice(0, 10), width: 12 },
          ],
        },
        {
          name: 'Маршрут',
          rows: routeRows,
          columns: [
            { header: 'Код', value: (r: Route) => r.routeCode, width: 14 },
            { header: 'Тайлбар', value: (r: Route) => r.description ?? '', width: 40 },
            { header: 'Үүсгэсэн', value: (r: Route) => r.createdAt?.slice(0, 10), width: 12 },
          ],
        },
      ]);
    }
    return stockpileRows.length + routeRows.length;
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      stockpileService.updateStockpile({ id, isActive }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isActive ? 'Овоолгыг идэвхжүүллээ' : 'Овоолгыг идэвхгүй болголоо'
      );
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Төлөв солиход алдаа гарлаа');
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
    setDateRange({});
    setShiftFilter('');
    handleFilterChange({ status: 'active' });
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

    TableColumn.custom<Stockpile>('status', 'Төлөв', (stockpile) =>
      stockpile.deactivatedAt ? (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          Идэвхгүй
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Идэвхтэй
        </span>
      )
    ).build(),

    TableColumn.custom<Stockpile>('route', 'Маршрут', (stockpile) =>
      stockpile.routeCode ? (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          <RouteIcon className="h-3.5 w-3.5 text-gray-500" />
          {stockpile.routeCode}
        </span>
      ) : (
        <span className="text-xs text-gray-400">-</span>
      )
    ).build(),
  ];

  const actionRole = hasRole(user?.role, stockpileActionRoles);

  const actions = actionRole
    ? [
      TableActions.edit<Stockpile>(handleEdit),
      TableActions.custom<Stockpile>(
        <PowerOff className="h-4 w-4" />,
        handleDelete,
        {
          variant: 'danger',
          title: 'Идэвхгүй болгох',
          isDisabled: (stockpile) => Boolean(stockpile.deactivatedAt),
          isLoading: (stockpile) =>
            statusMutation.isPending && statusMutation.variables?.id === stockpile.id,
        }
      ),
      TableActions.custom<Stockpile>(
        <Power className="h-4 w-4" />,
        (stockpile) => statusMutation.mutate({ id: stockpile.id, isActive: true }),
        {
          variant: 'success',
          title: 'Идэвхжүүлэх',
          isDisabled: (stockpile) => !stockpile.deactivatedAt,
        }
      ),
    ]
    : undefined;

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Овоолго ба маршрут"
        description="Буулгах овоолго болон тээврийн маршрутын бүртгэл"
        onExport={exportNow}
        isExporting={isExporting}
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="stockpiles">
            <Layers />
            Овоолго
          </TabsTrigger>
          <TabsTrigger value="routes">
            <RouteIcon />
            Маршрут
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="mt-0">
          <RoutesPanel />
        </TabsContent>

        <TabsContent value="stockpiles" className="mt-0">

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="mb-3">
            <DateRangeInputs
              label="Бүртгэсэн огноо"
              value={dateRange}
              shift={shiftFilter}
              onShiftChange={(value) => {
                setShiftFilter(value);
                paginate(1, limit);
              }}
              onChange={(range) => {
                setDateRange(range);
                paginate(1, limit);
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_12rem_auto_auto] lg:items-center">
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
                options={[
                  { value: 'active', label: 'Идэвхтэй' },
                  { value: 'inactive', label: 'Идэвхгүй' },
                  { value: 'all', label: 'Бүгд' },
                ]}
                placeholder="Төлөв"
                value={filters.status ?? 'all'}
                onChange={(value) =>
                  handleFilterChange({
                    ...filters,
                    status:
                      value === 'active' || value === 'inactive' ? value : undefined,
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
                Цэвэрлэх
              </Button>
            ) : (
              <div />
            )}
            {actionRole ? (
              <Button
                size="sm"
                variant="primary"
                startIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsSidebarOpen(true)}
              >
                Овоолго нэмэх
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

        </TabsContent>
      </Tabs>

      <StockpileFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingMaterial={editingMaterial}
      />

      <ConfirmDialog
        open={!!deletingMaterial}
        onOpenChange={() => setDeletingMaterial(undefined)}
        title="Овоолгыг идэвхгүй болгох уу?"
        description={`"${deletingMaterial ? `${StockpileTypeMap[deletingMaterial.type]} ${deletingMaterial.layerNumber}` : ''}" овоолго өдрийн төлөвлөгөөнд сонгогдохоо болино. Хуучин рейс, тайлан хэвээр үлдэнэ. Дараа нь дахин идэвхжүүлж болно.`}
        variant="destructive"
        confirmText="Идэвхгүй болгох"
        cancelText="Болих"
        onConfirm={() => {
          if (deletingMaterial) {
            statusMutation.mutate({ id: deletingMaterial.id, isActive: false });
            setDeletingMaterial(undefined);
          }
        }}
      />
    </div>
  );
}
