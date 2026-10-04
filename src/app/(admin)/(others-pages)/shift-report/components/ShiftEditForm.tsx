'use client';

import DatePicker from '@/components/form/date-picker';
import Label from '@/components/form/Label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import vehicleService from '@/services/internal/vehicle';
import { driverShiftGroupOptions } from '@/services/internal/employee/type';
import { useQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import Select from '@/components/form/Select';
import TextArea from '@/components/form/input/TextArea';
import { ShiftStatus } from '@/services/internal/shift/types';
import { shiftReportKeys } from '../queryKeys';

interface ShiftEditFormProps {
  shiftData: {
    driverShiftGroup: string;
    shiftType: string;
    operationalDate: string;
    vehicleId?: string;
    mileageStart: string;
    mileageEnd: string;
    motoStart: string;
    motoEnd: string;
    notes: string;
    status: ShiftStatus;
  };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  canEdit: boolean;
  isPending?: boolean;
}

const shiftTypeOptions = [
  { value: 'day', label: 'Өдрийн ээлж' },
  { value: 'night', label: 'Шөнийн ээлж' },
];

const statusOptions = [
  { value: 'started', label: 'Эхэлсэн' },
  { value: 'completed', label: 'Дууссан' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
];

const parseDateOnlyToLocalDate = (value: string) => new Date(`${value}T00:00:00`);

const toDateOnlyString = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ShiftEditForm({
  shiftData,
  onChange,
  onSave,
  canEdit,
  isPending,
}: ShiftEditFormProps) {
  const { data: trucksData, isLoading: trucksLoading } = useQuery({
    queryKey: [...shiftReportKeys.all, 'vehicles', 'truck'],
    queryFn: () => vehicleService.getShiftVehicles({ type: 'truck' }),
  });

  const { data: excavatorsData, isLoading: excavatorsLoading } = useQuery({
    queryKey: [...shiftReportKeys.all, 'vehicles', 'excavator'],
    queryFn: () => vehicleService.getShiftVehicles({ type: 'excavator' }),
  });

  const vehiclesLoading = trucksLoading || excavatorsLoading;

  const vehicles = [
    ...(trucksData?.data || []),
    ...(excavatorsData?.data || []),
  ];

  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: vehicle.code || vehicle.name,
    searchText: [
      vehicle.code,
      vehicle.name,
      vehicle.vehicleNumber,
      vehicle.mineNumber,
    ]
      .filter(Boolean)
      .join(' '),
    keywords: [
      vehicle.code,
      vehicle.code?.replace(/[^a-zA-Z0-9]/g, ''),
      vehicle.code?.replace(/\D/g, ''),
      vehicle.name,
      vehicle.vehicleNumber,
      vehicle.vehicleNumber?.replace(/[^a-zA-Z0-9]/g, ''),
      vehicle.vehicleNumber?.replace(/\D/g, ''),
      vehicle.mineNumber,
    ].filter(Boolean),
  }));

  const totalMileage =
    shiftData.mileageEnd && shiftData.mileageStart
      ? (Number(shiftData.mileageEnd) - Number(shiftData.mileageStart)).toFixed(2)
      : null;

  const totalMotoHours =
    shiftData.motoEnd && shiftData.motoStart
      ? (Number(shiftData.motoEnd) - Number(shiftData.motoStart)).toFixed(2)
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <Label>ABCD ээлж</Label>
          <Select
            value={shiftData.driverShiftGroup}
            onChange={(value) => onChange('driverShiftGroup', value)}
            options={driverShiftGroupOptions}
            disabled={!canEdit}
          />
        </div>
        <div>
          <Label>Ээлжийн огноо</Label>
          {canEdit ? (
            <DatePicker
              id="shift-edit-operational-date"
              placeholder="Огноо сонгох"
              mode="single"
              defaultDate={
                shiftData.operationalDate
                  ? parseDateOnlyToLocalDate(shiftData.operationalDate)
                  : undefined
              }
              onChange={(dates) =>
                onChange(
                  'operationalDate',
                  dates?.[0] ? toDateOnlyString(dates[0]) : ''
                )
              }
            />
          ) : (
            <Input value={shiftData.operationalDate} disabled />
          )}
        </div>
        <div>
          <Label>Ээлжийн төрөл</Label>
          <Select
            value={shiftData.shiftType}
            onChange={(value) => onChange('shiftType', value)}
            options={shiftTypeOptions}
            disabled={!canEdit}
          />
        </div>
        <div>
          <Label>Техник</Label>
          <Select
            value={vehiclesLoading ? '' : (shiftData.vehicleId || '')}
            onChange={(value) => onChange('vehicleId', value)}
            options={vehicleOptions}
            placeholder={vehiclesLoading ? 'Уншиж байна...' : 'Техник сонгох'}
            disabled={!canEdit || vehiclesLoading}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Төлөв</Label>
          <Select
            value={shiftData.status || 'started'}
            onChange={(value) => onChange('status', value)}
            options={statusOptions}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Mileage */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm font-medium text-muted-foreground">
            Гүйлтийн мэдээлэл
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Эхлэх (км)</Label>
            <Input
              type="number"
              value={shiftData.mileageStart}
              onChange={(e) => onChange('mileageStart', e.target.value)}
              disabled={!canEdit}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <Label>Дуусах (км)</Label>
            <Input
              type="number"
              value={shiftData.mileageEnd}
              onChange={(e) => onChange('mileageEnd', e.target.value)}
              disabled={!canEdit}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="flex w-32 flex-col justify-end">
            {totalMileage ? (
              <div className="rounded-md border border-border bg-muted/50 px-4 py-2 text-center">
                <div className="text-xs text-muted-foreground">Нийт</div>
                <div className="text-sm font-semibold">{totalMileage} км</div>
              </div>
            ) : (
              <div className="h-[42px]" />
            )}
          </div>
        </div>
      </div>

      {/* Moto Hours */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm font-medium text-muted-foreground">
            Мотоцагийн мэдээлэл
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Эхлэх (цаг)</Label>
            <Input
              type="number"
              value={shiftData.motoStart}
              onChange={(e) => onChange('motoStart', e.target.value)}
              disabled={!canEdit}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <Label>Дуусах (цаг)</Label>
            <Input
              type="number"
              value={shiftData.motoEnd}
              onChange={(e) => onChange('motoEnd', e.target.value)}
              disabled={!canEdit}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="flex w-32 flex-col justify-end">
            {totalMotoHours ? (
              <div className="rounded-md border border-border bg-muted/50 px-4 py-2 text-center">
                <div className="text-xs text-muted-foreground">Зарцуулсан</div>
                <div className="text-sm font-semibold">
                  {totalMotoHours} цаг
                </div>
              </div>
            ) : (
              <div className="h-[42px]" />
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Тэмдэглэл</Label>
        <TextArea
          value={shiftData.notes}
          onChange={(e) => onChange('notes', e)}
          disabled={!canEdit}
          rows={4}
          placeholder="Нэмэлт тэмдэглэл..."
        />
      </div>

      {canEdit && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={onSave}
            disabled={isPending}
            size="default"
            variant="default"
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Хадгалж байна...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Хадгалах
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}