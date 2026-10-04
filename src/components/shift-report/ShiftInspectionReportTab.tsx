'use client';

import DatePicker from '@/components/form/date-picker';
import Select from '@/components/form/Select';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import Badge from '@/components/ui/badge/Badge';
import { Button } from '@/components/ui/button';
import { usePagination } from '@/hooks/pagination';
import { formatDateFull } from '@/lib/time-formatter';
import { ShiftReportExportService } from '@/services/export/shiftReportExport';
import employeeService from '@/services/internal/employee';
import type { Employee } from '@/services/internal/employee/type';
import shiftReportService from '@/services/internal/shift-report';
import type {
  ShiftInspectionReportFilters,
  ShiftInspectionReportRow,
} from '@/services/internal/shift-report/types';
import type { VehicleOrganization } from '@/services/internal/vehicle-organization/types';
import vehicleService from '@/services/internal/vehicle';
import type { Vehicle, VehicleType } from '@/services/internal/vehicle/types';
import {
  vehicleTypeLabels,
  vehicleTypeMap,
} from '@/services/internal/vehicle/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const H = ({ children }: { children: React.ReactNode }) => (
  <span className="font-extrabold text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-tight text-[10px] uppercase tracking-tight block text-center">
    {children}
  </span>
);

const inspectionStateOptions = [
  { value: 'all', label: 'Бүгд' },
  { value: 'done', label: 'Үзлэг хийсэн' },
  { value: 'not_done', label: 'Үзлэг хийгдээгүй' },
  { value: 'has_issue', label: 'Аюултай' },
] as const;

const shiftTypeOptions = [
  { value: 'all', label: 'Бүх ээлж' },
  { value: 'day', label: 'Өдрийн ээлж' },
  { value: 'night', label: 'Шөнийн ээлж' },
] as const;

const UB_TIMEZONE = 'Asia/Ulaanbaatar';

const getDateOnlyParts = (date: Date, timeZone = UB_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) return undefined;
  return { year, month, day };
};

const toOperationalDateString = (date: Date) => {
  const parts = getDateOnlyParts(date);
  if (!parts) return undefined;
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const parseDateOnlyToLocalDate = (value: string) =>
  new Date(`${value}T00:00:00`);

const getDefaultOperationalDate = () => toOperationalDateString(new Date());

const getInspectionResult = (row: ShiftInspectionReportRow) => {
  if (!row.hasInspection) {
    return { label: 'Хийгдээгүй', color: 'light' as const };
  }

  const parts: string[] = [];
  if (row.issueCount > 0) parts.push('Аюултай');
  if (row.needsInspectionCount > 0) parts.push('Анхаарах');

  if (parts.length === 0) {
    return { label: 'Хэвийн', color: 'success' as const };
  }

  return {
    label: parts.join(', '),
    color: row.issueCount > 0 ? ('error' as const) : ('warning' as const),
  };
};

type Props = {
  onFiltersChange: (filters: ShiftInspectionReportFilters) => void;
  vehicleOrganizations: VehicleOrganization[];
};

export default function ShiftInspectionReportTab({
  onFiltersChange,
  vehicleOrganizations,
}: Props) {
  const router = useRouter();
  const { offset, limit, paginate } = usePagination({ initialPageSize: 50 });
  const [driver, setDriver] = useState<Employee | undefined>(undefined);
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
  const [vehicleOrganization, setVehicleOrganization] = useState<VehicleOrganization | undefined>(undefined);

  const [filters, setFilters] = useState<ShiftInspectionReportFilters>({
    operationalDate: getDefaultOperationalDate(),
    shiftType: undefined,
    inspectionState: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const { data, isLoading } = useQuery({
    queryKey: ['shift-inspection-report', { ...filters, offset, limit }],
    queryFn: () =>
      shiftReportService.getShiftInspectionReport({ ...filters, offset, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['shift-inspection-filter-employees'],
    queryFn: () => employeeService.getEmployees({ offset: 0, limit: 300 }),
    staleTime: 60000,
  });

  const { data: vehiclesData, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['shift-inspection-filter-vehicles'],
    queryFn: () => vehicleService.getVehicles({ offset: 0, limit: 500 }),
    staleTime: 60000,
  });

  const rows = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);
  const users = usersData?.data || [];
  const vehicles = vehiclesData?.data || [];

  const handleFilterChange = <K extends keyof ShiftInspectionReportFilters>(
    key: K,
    value: ShiftInspectionReportFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    paginate(1, limit);
  };

  const columns = useMemo(
    () => [
      {
        key: 'operationalDate',
        header: <H>Огноо / Ээлж</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div className="space-y-1 text-center">
            <div className="text-xs whitespace-nowrap">{row.operationalDate || '-'}</div>
            <Badge color={row.shiftType === 'day' ? 'warning' : 'info'} size="sm">
              {row.shiftType === 'day' ? 'Өдөр' : 'Шөнө'}
            </Badge>
          </div>
        ),
      },
      {
        key: 'driver',
        header: <H>Оператор</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div style={{ maxWidth: '140px', wordBreak: 'break-word' }}>
            <div className="font-medium text-xs">
              {row.driverFirstName} {row.driverLastName}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {row.driverPosition || '-'}
            </div>
          </div>
        ),
      },
      {
        key: 'vehicle',
        header: <H>Техник</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div>
            <div className="font-medium text-xs whitespace-nowrap">{row.vehicleCode}</div>
            <div className="text-[10px] text-muted-foreground">
              {row.vehicleName} · {vehicleTypeLabels[row.vehicleType]}
            </div>
          </div>
        ),
      },
      {
        key: 'shiftStatus',
        header: <H>Ээлжийн төлөв</H> as any,
        render: (row: ShiftInspectionReportRow) => {
          const color =
            row.shiftStatus === 'completed'
              ? 'success'
              : row.shiftStatus === 'started'
                ? 'primary'
                : 'light';
          return (
            <div className="flex justify-center">
              <Badge color={color} size="sm">
                {row.shiftStatus === 'completed'
                  ? 'Дууссан'
                  : row.shiftStatus === 'started'
                    ? 'Эхэлсэн'
                    : 'Цуцлагдсан'}
              </Badge>
            </div>
          );
        },
      },
      {
        key: 'hasInspection',
        header: <H>Үзлэг</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div className="flex justify-center">
            <Badge color={row.hasInspection ? 'success' : 'light'} size="sm">
              {row.hasInspection ? 'Тийм' : 'Үгүй'}
            </Badge>
          </div>
        ),
      },
      {
        key: 'inspectionResult',
        header: <H>Үр дүн</H> as any,
        render: (row: ShiftInspectionReportRow) => {
          const result = getInspectionResult(row);
          return (
            <div className="flex justify-center">
              <Badge color={result.color} size="sm">
                {result.label}
              </Badge>
            </div>
          );
        },
      },
      {
        key: 'issueInspectionNames',
        header: <H>Тэмдэглэл</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div
            className="whitespace-normal break-words text-xs leading-5"
            style={{ maxWidth: '260px', wordBreak: 'break-word' }}
            title={row.issueInspectionNames || '-'}
          >
            {row.issueInspectionNames || '-'}
          </div>
        ),
      },
      {
        key: 'counts',
        header: <H>Техникийн үзлэг</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div className="space-y-0.5 text-[10px] text-muted-foreground text-center">
            <div>Хэвийн: {row.normalCount}</div>
            <div>Аюултай: {row.issueCount}</div>
            <div>Анхаарах: {row.needsInspectionCount}</div>
          </div>
        ),
      },
      {
        key: 'shiftTime',
        header: <H>Ээлжийн цаг</H> as any,
        render: (row: ShiftInspectionReportRow) => (
          <div className="text-[10px] text-center whitespace-nowrap">
            <div>{formatDateFull(row.shiftStart)}</div>
            <div className="text-muted-foreground">
              {row.shiftEnd ? formatDateFull(row.shiftEnd) : '-'}
            </div>
          </div>
        ),
      },
      {
        key: 'details',
        header: <H>Дэлгэрэнгүй</H> as any,
        className:
          'sticky right-0 z-10 border-l border-border bg-background text-center shadow-[-12px_0_16px_-12px_rgba(15,23,42,0.28)]',
        headerClassName:
          'sticky right-0 z-30 border-l border-border bg-background text-center shadow-[-12px_0_16px_-12px_rgba(15,23,42,0.55)]',
        render: (row: ShiftInspectionReportRow) => (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                router.push(`/shift-report/inspection/${row.shiftId}`)
              }
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Дэлгэрэнгүй харах"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [router]
  );

  const handleVehicleTypeChange = (value: string) => {
    const nextVehicleType = (value || undefined) as VehicleType | undefined;
    if (vehicle && nextVehicleType && vehicle.type !== nextVehicleType) {
      setVehicle(undefined);
      handleFilterChange('vehicleId', undefined);
    }
    handleFilterChange('vehicleType', nextVehicleType);
  };

  const filterSummary = useMemo(() => {
    const summary = [
      `Ээлжийн огноо: ${filters.operationalDate || '-'}`,
      `Ээлжийн төрөл: ${filters.shiftType === 'day'
        ? 'Өдрийн ээлж'
        : filters.shiftType === 'night'
          ? 'Шөнийн ээлж'
          : 'Бүх ээлж'
      }`,
      `Үзлэгийн төлөв: ${inspectionStateOptions.find(
        (option) => option.value === filters.inspectionState
      )?.label || 'Бүгд'
      }`,
    ];

    if (vehicleOrganization) summary.push(`Компани: ${vehicleOrganization.name}`);
    if (driver) summary.push(`Оператор: ${driver.firstName} ${driver.lastName}`);
    if (filters.vehicleType) summary.push(`Техникийн төрөл: ${vehicleTypeLabels[filters.vehicleType]}`);
    if (vehicle) summary.push(`Техник: ${vehicle.code} - ${vehicle.name}`);

    return summary;
  }, [driver, filters, vehicle, vehicleOrganization]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const allRows = await shiftReportService.getShiftInspectionReport({
        ...filters,
        offset: 0,
      });

      if (allRows.data.length === 0) {
        toast.error('Экспорт хийх үзлэгийн тайлан олдсонгүй');
        return;
      }

      await ShiftReportExportService.exportShiftInspections(allRows.data, {
        format: 'xlsx',
        filterSummary,
      });
      toast.success('Үзлэгийн тайлан Excel файлаар амжилттай татагдлаа');
    } catch {
      toast.error('Үзлэгийн тайлан татахад алдаа гарлаа');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ээлжийн огноо</label>
            <DatePicker
              id="inspection-operational-date"
              placeholder="Огноо сонгох"
              mode="single"
              defaultDate={
                filters.operationalDate
                  ? parseDateOnlyToLocalDate(filters.operationalDate)
                  : undefined
              }
              onChange={(dates) =>
                handleFilterChange(
                  'operationalDate',
                  dates?.[0] ? toOperationalDateString(dates[0]) : undefined
                )
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ээлжийн төрөл</label>
            <Select
              value={filters.shiftType || ''}
              onChange={(value) =>
                handleFilterChange(
                  'shiftType',
                  value === 'all' || value === ''
                    ? undefined
                    : (value as 'day' | 'night')
                )
              }
              placeholder="Бүх ээлж"
              options={shiftTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Үзлэгийн төлөв</label>
            <Select
              value={filters.inspectionState || 'all'}
              onChange={(value) =>
                handleFilterChange(
                  'inspectionState',
                  value as ShiftInspectionReportFilters['inspectionState']
                )
              }
              options={inspectionStateOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Компани</label>
            <Select
              value={filters.vehicleOrganizationId || ''}
              onChange={(value) => {
                handleFilterChange('vehicleOrganizationId', value || undefined);
                setVehicleOrganization(
                  vehicleOrganizations.find((item) => item.id === value)
                );
              }}
              placeholder="Бүгд"
              options={vehicleOrganizations.map((item) => ({
                value: item.id,
                label: item.name,
                keywords: [item.name],
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Оператор</label>
            <Select
              value={filters.driverId || ''}
              onChange={(value) => {
                handleFilterChange('driverId', value || undefined);
                setDriver(users.find((item) => item.id === value));
              }}
              placeholder="Бүгд"
              disabled={isUsersLoading}
              options={users.map((item) => ({
                value: item.id,
                label: `${item.firstName} ${item.lastName}`,
                keywords: [item.firstName, item.lastName],
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Техникийн төрөл</label>
            <Select
              value={filters.vehicleType || ''}
              onChange={handleVehicleTypeChange}
              placeholder="Бүгд"
              options={vehicleTypeMap.map((item) => ({
                value: item.value,
                label: item.label,
                keywords: [item.label, item.value],
              }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Техник</label>
            <Select
              value={filters.vehicleId || ''}
              onChange={(value) => {
                handleFilterChange('vehicleId', value || undefined);
                const selectedVehicle = vehicles.find((item) => item.id === value);
                setVehicle(selectedVehicle);
                handleFilterChange('vehicleType', selectedVehicle?.type);
              }}
              placeholder="Бүгд"
              disabled={isVehiclesLoading}
              options={vehicles.map((item) => ({
                value: item.id,
                label: `${item.code} - ${item.name}`,
                keywords: [item.code, item.name, item.vehicleNumber],
              }))}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Идэвхтэй шүүлт:</span>
            <span>{filters.operationalDate || '-'}</span>
            <span>•</span>
            <span>
              {filters.shiftType === 'day'
                ? 'Өдрийн ээлж'
                : filters.shiftType === 'night'
                  ? 'Шөнийн ээлж'
                  : 'Бүх ээлж'}
            </span>
            <span>•</span>
            <span>
              {inspectionStateOptions.find(
                (option) => option.value === filters.inspectionState
              )?.label}
            </span>
            {driver && (
              <>
                <span>•</span>
                <span>{driver.firstName} {driver.lastName}</span>
              </>
            )}
            {vehicleOrganization && (
              <>
                <span>•</span>
                <span>{vehicleOrganization.name}</span>
              </>
            )}
            {filters.vehicleType && (
              <>
                <span>•</span>
                <span>{vehicleTypeLabels[filters.vehicleType]}</span>
              </>
            )}
            {vehicle && (
              <>
                <span>•</span>
                <span>{vehicle.code} - {vehicle.name}</span>
              </>
            )}
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="gap-2 self-start lg:self-auto"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Excel бэлдэж байна...' : 'Excel татах'}
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border bg-background shadow-sm">
        <DynamicTable<ShiftInspectionReportRow>
          indexOffset={offset}
          data={[rows]}
          columns={columns}
          isLoading={isLoading}
          rowKey="shiftId"
          emptyMessage="Үзлэгийн тайлан олдсонгүй."
          wrapText
          rowClassName={(_, groupIndex) =>
            groupIndex % 2 !== 0 ? 'bg-gray-50 dark:bg-white/[0.02]' : ''
          }
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={totalCount}
        limit={limit}
        onPageChange={(page) => paginate(page, limit)}
        isLoading={isLoading}
      />
    </div>
  );
}