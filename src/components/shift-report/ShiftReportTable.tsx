'use client';

import { useAuth } from '@/components/AuthProvider';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableActions } from '@/components/ui/table/TableActions';
import { usePagination } from '@/hooks/pagination';
import {
  ExportFormat,
  ExportType,
  ShiftReportExportService,
} from '@/services/export/shiftReportExport';
import miningBlockService from '@/services/internal/mining-block';
import shiftReportService from '@/services/internal/shift-report';
import vehicleOrganizationService from '@/services/internal/vehicle-organization';
import type {
  ShiftInspectionReportFilters,
  ShiftReport,
  ShiftReportFilters,
} from '@/services/internal/shift-report/types';
import stockpileService from '@/services/internal/stockpile';
import { hasRole, stockpileActionRoles } from '@/services/roles';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { DownloadIcon, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import ShiftCreateDialog from '../../app/(admin)/(others-pages)/shift-report/components/ShiftCreateDialog';
import {
  useMutationToastMessages,
  useShiftReportInvalidation,
} from '../../app/(admin)/(others-pages)/shift-report/hooks/useShiftReportMutations';
import { useShiftReportColumns } from '../../app/(admin)/(others-pages)/shift-report/hooks/useShiftReportColumns';
import { shiftReportKeys } from '../../app/(admin)/(others-pages)/shift-report/queryKeys';
import ShiftEditModal from '../../app/(admin)/(others-pages)/shift-report/ShiftEditModal';
import ShiftExpandedRow from '../../app/(admin)/(others-pages)/shift-report/ShiftExpandedRow';
import PageBreadcrumb from '../common/PageBreadCrumb';
import ShiftReportFilter from './ShiftReportFilter';
import ShiftInspectionReportTab from './ShiftInspectionReportTab';
import ShiftReportKpiCard from './ShiftReportKpiCard';

const getUbDateOnlyString = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : undefined;
};

export default function ShiftReportTable() {
  const { user } = useAuth();
  const canEdit = hasRole(user?.role, stockpileActionRoles);
  const { offset, limit, paginate } = usePagination({ initialPageSize: 50 });
  const invalidateShiftReport = useShiftReportInvalidation();
  const messages = useMutationToastMessages();

  const [filters, setFilters] = useState<ShiftReportFilters>({});
  const [inspectionFilters, setInspectionFilters] =
    useState<ShiftInspectionReportFilters>({
      operationalDate: getUbDateOnlyString(),
      shiftType: undefined,
      inspectionState: 'all',
    });
  const [editingShift, setEditingShift] = useState<ShiftReport | null>(null);
  const [deleteShift, setDeleteShift] = useState<ShiftReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'general' | 'inspection'>('general');

  const { availableColumns, visibleColumns, setVisibleColumns, getColumns } =
    useShiftReportColumns();

  const handleFiltersChange = (newFilters: ShiftReportFilters) => {
    setFilters(newFilters);
    paginate(1, limit);
  };

  const filterQuery = useQuery({
    queryKey: ['shift-report-filter-options'],
    queryFn: async () => {
      const [miningBlocksData, stockpilesData, vehicleOrganizationsData] =
        await Promise.all([
          miningBlockService.getMiningBlocks({ limit: 100, offset: 0 }),
          stockpileService.getStockpiles({ limit: 100, offset: 0 }),
          vehicleOrganizationService.getVehicleOrganizations({ offset: 0, limit: 500 }),
        ]);
      return {
        miningBlocks: miningBlocksData.data,
        stockpiles: stockpilesData.data,
        vehicleOrganizations: vehicleOrganizationsData.data,
      };
    },
    staleTime: 60000,
  });

  const listQuery = useQuery({
    queryKey: shiftReportKeys.list({ ...filters, limit, offset }),
    queryFn: () => shiftReportService.getShiftsReport({ ...filters, limit, offset }),
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });




  const createShiftMutation = useMutation({
    mutationFn: shiftReportService.createShift,
    onSuccess: async () => {
      messages.onShiftCreated();
      await invalidateShiftReport();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ээлж бүртгэхэд алдаа гарлаа');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (shiftId: string) => shiftReportService.deleteShift(shiftId),
    onSuccess: async () => {
      messages.onShiftDeleted();
      await invalidateShiftReport();
      setDeleteShift(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ээлж устгахад алдаа гарлаа');
    },
  });

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setFilters((prev) => ({ ...prev, sortColumn: column, sortOrder: order }));
    paginate(1, limit);
  };

  const shifts = listQuery.data?.data || [];
  const totalCount = listQuery.data?.totalCount || 0;
  const columns = getColumns();
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  const actions = canEdit
    ? [
      TableActions.edit<ShiftReport>((shift) => setEditingShift(shift)),
      TableActions.delete<ShiftReport>((shift) => setDeleteShift(shift)),
    ]
    : [TableActions.edit<ShiftReport>((shift) => setEditingShift(shift))];

  const headerActions = useMemo(() => {
    const items: Array<{
      label: string;
      onClick: () => void;
      variant: 'primary' | 'secondary';
      icon: ReactNode;
    }> = [
        {
          label: 'Экспорт',
          onClick: () => setIsExportDialogOpen(true),
          variant: 'secondary',
          icon: <DownloadIcon />,
        },
      ];

    if (canEdit) {
      items.unshift({
        label: 'Ээлж нэмэх',
        onClick: () => setIsCreateDialogOpen(true),
        variant: 'primary',
        icon: <Plus />,
      });
    }

    return items;
  }, [canEdit]);

  const handleExportConfirm = async (type: ExportType) => {
    try {
      setIsExporting(true);

      if (type === 'worklogs') {
        await ShiftReportExportService.exportWorkLogs('xlsx', filters);
        toast.success('Рейсийн тайлан амжилттай татагдлаа');
      } else if (type === 'shift-inspections') {
        const allInspectionRows = await shiftReportService.getShiftInspectionReport({
          ...inspectionFilters,
          offset: 0,
        });
        await ShiftReportExportService.exportShiftInspections(allInspectionRows.data, {
          format: 'xlsx',
        });
        toast.success('Үзлэгийн тайлан амжилттай татагдлаа');
      } else {
        await handleExport(type, 'xlsx');
      }
    } catch {
      toast.error('Файл татахад алдаа гарлаа');
    } finally {
      setIsExporting(false);
      setIsExportDialogOpen(false);
    }
  };

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    const allDataResponse = await shiftReportService.getShiftsReport({
      ...filters,
      offset: 0,
    });
    const allShifts = allDataResponse.data || [];

    if (type === 'shifts') {
      ShiftReportExportService.exportShifts(allShifts, visibleColumns, format);
      toast.success(`${allShifts.length} ээлжийн тайлан амжилттай татагдлаа`);
      return;
    }

    await ShiftReportExportService.exportWorkLogs('xlsx', filters);
    toast.success('Рейсийн тайлан амжилттай татагдлаа');
  };

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Ээлжийн тайлан" actions={headerActions} />

      <Tabs
        value={activeReportTab}
        onValueChange={(v) => setActiveReportTab(v as 'general' | 'inspection')}
      >
        <TabsList>
          <TabsTrigger value="general">Ээлжийн тайлан</TabsTrigger>
          <TabsTrigger value="inspection">Ээлжийн тайлан (үзлэгээр)</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <ShiftReportKpiCard
            filters={{
              status: filters.status,
              shiftType: filters.shiftType,
              operationalDate: filters.operationalDate,
              startDate: filters.startDate,
              endDate: filters.endDate,
              driverId: filters.driverId,
              driverName: filters.driverName,
              vehicleId: filters.vehicleId,
              vehicleOrganizationId: filters.vehicleOrganizationId,
              vehicleCode: filters.vehicleCode,
              stockpileId: filters.stockpileId,
              miningBlockId: filters.miningBlockId,
            }}
          />

          {/* Шүүлт */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <ShiftReportFilter
              filters={filters}
              onFiltersChange={handleFiltersChange}
              miningBlocks={filterQuery.data?.miningBlocks || []}
              stockpiles={filterQuery.data?.stockpiles || []}
              vehicleOrganizations={filterQuery.data?.vehicleOrganizations || []}
              isLoading={listQuery.isLoading || filterQuery.isLoading}
              availableColumns={availableColumns}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
            />
          </div>

          {/* Хүснэгт */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <DynamicTable<ShiftReport>
              indexOffset={offset}
              data={[shifts]}
              columns={columns}
              actions={actions}
              isLoading={listQuery.isLoading}
              rowKey="id"
              emptyMessage="Ээлжийн мэдээлэл олдсонгүй."
              expandedRowRender={(shift) => <ShiftExpandedRow shift={shift} />}
              wrapText={true}
              sortColumn={filters.sortColumn}
              sortOrder={filters.sortOrder}
              onSort={handleSort}
              rowClassName={(_, groupIndex) =>
                groupIndex % 2 !== 0
                  ? 'bg-gray-50/50 dark:bg-gray-800/20'
                  : ''
              }
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalCount}
            limit={limit}
            onPageChange={(page) => paginate(page, limit)}
            isLoading={listQuery.isLoading}
          />
        </TabsContent>

        <TabsContent value="inspection">
          <ShiftInspectionReportTab
            onFiltersChange={setInspectionFilters}
            vehicleOrganizations={filterQuery.data?.vehicleOrganizations || []}
          />
        </TabsContent>
      </Tabs>

      {editingShift && (
        <ShiftEditModal
          isOpen={!!editingShift}
          onClose={() => setEditingShift(null)}
          shift={editingShift}
          onSuccess={async () => {
            await invalidateShiftReport({ shiftId: editingShift.id });
          }}
        />
      )}

      <ShiftCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={async (payload) => {
          await createShiftMutation.mutateAsync(payload);
        }}
        isPending={createShiftMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteShift}
        onOpenChange={() => setDeleteShift(null)}
        title="Ээлжийг устгах уу?"
        description="Ээлжтэй холбоотой үзлэг болон Рейсүүд мөн устахыг анхаарна уу."
        onConfirm={() => deleteShift && deleteMutation.mutate(deleteShift.id)}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
      />

      {/* Export dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Экспорт хийх</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ямар төрлийн тайлан татах вэ?
          </p>

          <div className="flex flex-col gap-2">
            {[
              {
                type: 'shifts' as ExportType,
                title: 'Ээлжийн тайлан',
                desc: 'Ээлжүүдийн ерөнхий мэдээлэл',
              },
              {
                type: 'worklogs' as ExportType,
                title: 'Рейсийн тайлан',
                desc: 'Бүх рейсүүдийн дэлгэрэнгүй мэдээлэл',
              },
              {
                type: 'shift-inspections' as ExportType,
                title: 'Үзлэгийн тайлан',
                desc: 'Идэвхтэй үзлэгийн шүүлтээр нэг мөрт нэг ээлжийн тайлан',
              },
            ].map(({ type, title, desc }) => (
              <button
                key={type}
                onClick={() => handleExportConfirm(type)}
                disabled={isExporting}
                className="flex flex-col items-start gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {isExporting ? 'Татаж байна...' : title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
            >
              Цуцлах
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}