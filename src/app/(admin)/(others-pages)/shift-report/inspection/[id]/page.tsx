'use client';

import VehicleInspectionTable from '@/components/inspection/VehicleInspectionTable';
import Select from '@/components/form/Select';
import WorkLogsTable from '@/components/shift-report/WorklogTable';
import ShiftStatusBadge from '@/components/shift-report/ShiftStatusBadge';
import ShiftTypeBadge from '@/components/shift-report/ShiftType';
import { Button } from '@/components/ui/button';
import { formatDateFull } from '@/lib/time-formatter';
import type { InspectionStatus } from '@/services/internal/inspection/types';
import shiftReportService from '@/services/internal/shift-report';
import { vehicleTypeLabels } from '@/services/internal/vehicle/types';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  Factory,
  Gauge,
  NotebookPen,
  Truck,
  User,
} from 'lucide-react';
import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const inspectionStatusOptions = [
  { value: 'all', label: 'Бүгд' },
  { value: 'normal', label: 'Хэвийн' },
  { value: 'needs_inspection', label: 'Анхаарах' },
  { value: 'issue', label: 'Аюултай' },
] as const;

function formatNumber(value: string | null | undefined, suffix?: string) {
  if (!value) {
    return '-';
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return suffix ? `${value} ${suffix}` : value;
  }

  const formatted = parsed.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });

  return suffix ? `${formatted} ${suffix}` : formatted;
}

export default function ShiftInspectionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState<
    'all' | InspectionStatus
  >('all');

  const { data, isLoading } = useQuery({
    queryKey: ['shift-inspection-detail', id],
    queryFn: () => shiftReportService.getShiftDetail({ shiftId: id }),
    staleTime: 30000,
  });

  const shift = data?.shift;
  const inspections = data?.inspections || [];
  const workLogs = data?.workLogs || [];
  const totalProduction =
    Number(shift?.coalProduct || 0) + Number(shift?.soilProduct || 0);
  const issueCount = inspections.filter(
    (item) => item.status === 'issue'
  ).length;
  const needsInspectionCount = inspections.filter(
    (item) => item.status === 'needs_inspection'
  ).length;
  const normalCount = inspections.filter(
    (item) => item.status === 'normal'
  ).length;
  const filteredInspections = useMemo(
    () =>
      inspectionStatusFilter === 'all'
        ? inspections
        : inspections.filter((item) => item.status === inspectionStatusFilter),
    [inspectionStatusFilter, inspections]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-base text-muted-foreground">
        Дэлгэрэнгүй мэдээлэл ачааллаж байна...
      </div>
    );
  }

  if (!data || !shift) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Button>
        <div className="rounded-xl border bg-background p-8 text-center text-base text-muted-foreground">
          Ээлжийн дэлгэрэнгүй мэдээлэл олдсонгүй.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Button>
      </div>

      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Ээлжийн үзлэгийн дэлгэрэнгүй
              </h1>
              <ShiftTypeBadge type={shift.shiftType} />
              <ShiftStatusBadge status={shift.status} />
            </div>
            <div className="text-base text-muted-foreground">
              {shift.operationalDate || '-'}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Оператор
              </div>
              <div className="text-lg font-medium text-foreground">
                {shift.driver
                  ? `${shift.driver.firstName} ${shift.driver.lastName}`
                  : '-'}
              </div>
              <div className="text-base text-muted-foreground">
                {shift.driver?.position || '-'}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Truck className="h-4 w-4" />
                Техник
              </div>
              <div className="text-lg font-medium text-foreground">
                {shift.vehicle?.code || '-'}
              </div>
              <div className="text-base text-muted-foreground">
                {shift.vehicle
                  ? `${shift.vehicle.name} · ${vehicleTypeLabels[shift.vehicle.type]}`
                  : '-'}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Factory className="h-4 w-4" />
                Бүтээл
              </div>
              <div className="text-lg font-medium text-foreground">
                {formatNumber(String(totalProduction), 'm3')}
              </div>
              <div className="text-base text-muted-foreground">
                Нүүрс: {formatNumber(shift.coalProduct, 'm3')} · Хөрс:{' '}
                {formatNumber(shift.soilProduct, 'm3')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Ээлж эхэлсэн
            </div>
            <div className="text-base font-medium text-foreground">
              {formatDateFull(shift.shiftStart) || '-'}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Ээлж дууссан
            </div>
            <div className="text-base font-medium text-foreground">
              {shift.shiftEnd ? formatDateFull(shift.shiftEnd) : '-'}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Gauge className="h-4 w-4" />
              Гүйлт
            </div>
            <div className="text-base font-medium text-foreground">
              {formatNumber(shift.mileageStart, 'км')} -{' '}
              {formatNumber(shift.mileageEnd, 'км')}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Activity className="h-4 w-4" />
              Мотоцаг
            </div>
            <div className="text-base font-medium text-foreground">
              {formatNumber(shift.motoStart, 'цаг')} -{' '}
              {formatNumber(shift.motoEnd, 'цаг')}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <ClipboardCheck className="h-5 w-5" />
              Үзлэгийн дэлгэрэнгүй
            </div>
            <div className="w-44">
              <Select
                value={inspectionStatusFilter}
                onChange={(value) =>
                  setInspectionStatusFilter(
                    (value || 'all') as 'all' | InspectionStatus
                  )
                }
                placeholder="Төлөвөөр шүүх"
                options={inspectionStatusOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                  keywords: [option.label, option.value],
                }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Нийт: {inspections.length}</span>
            <span>Хэвийн: {normalCount}</span>
            <span>Анхаарах: {needsInspectionCount}</span>
            <span>Аюултай: {issueCount}</span>
          </div>
        </div>

        {filteredInspections.length > 0 ? (
          <VehicleInspectionTable
            shiftInspections={filteredInspections}
            inspectionNameClassName="w-40 max-w-[10rem]"
            textSizeClassName="text-sm"
          />
        ) : (
          <div className="rounded-xl border bg-muted/20 p-8 text-center text-base text-muted-foreground">
            Үзлэг байхгүй
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
          <Truck className="h-5 w-5" />
          Рейсийн дэлгэрэнгүй
        </div>

        {workLogs.length > 0 ? (
          <WorkLogsTable workLogs={workLogs} />
        ) : (
          <div className="rounded-xl border bg-muted/20 p-8 text-center text-base text-muted-foreground">
            Рейс бүртгэгдээгүй.
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
          <NotebookPen className="h-5 w-5" />
          Нэмэлт мэдээлэл
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-base font-medium text-foreground">
              Гүйлтийн зөрүү
            </div>
            <div className="text-base text-muted-foreground">
              {shift.mileageEnd
                ? formatNumber(
                  String(
                    Number(shift.mileageEnd) - Number(shift.mileageStart)
                  ),
                  'км'
                )
                : '-'}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-2 text-base font-medium text-foreground">
              Мотоцагийн зөрүү
            </div>
            <div className="text-base text-muted-foreground">
              {shift.motoEnd
                ? formatNumber(
                  String(Number(shift.motoEnd) - Number(shift.motoStart)),
                  'цаг'
                )
                : '-'}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-4">
          <div className="mb-2 text-base font-medium text-foreground">
            Ээлжийн тэмдэглэл
          </div>
          <div className="text-base leading-7 text-muted-foreground">
            {shift.notes || '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
