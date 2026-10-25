'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CheckCircle2, Circle, Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ShiftChips, type ShiftFilterValue } from '@/components/form/DateRangeInputs';
import { fetchAllPages } from '@/lib/export/fetch-all';
import { cn } from '@/lib/utils';
import equipmentShiftLogService, { type ShiftLog } from '@/services/internal/equipment-shift-log';
import vehicleService from '@/services/internal/vehicle';
import { vehicleTypeMap, type Vehicle, type VehicleType } from '@/services/internal/vehicle/types';
import type { TimeLogPreset } from './TimeManagmentForm';

const vehicleLabel = (vehicle: Pick<Vehicle, 'mineNumber' | 'code' | 'name'>) =>
  vehicle.mineNumber || vehicle.code || vehicle.name;

const operatorName = (log: ShiftLog) =>
  log.operator
    ? [log.operator.lastName, log.operator.firstName].filter(Boolean).join(' ') || log.operator.name || ''
    : '';

const num = (value: string | null | undefined) => Number(value) || 0;

/**
 * Цаг ашиглалт: техникийн төрлөөр бүртгэх.
 * Төрөл сонгоход тухайн төрлийн техникүүд гарч, огноо/ээлжид бүртгэгдсэн эсэх харагдана.
 * Техник дээр дарахад (оператор, цагийг оруулах) форм нээгдэнэ.
 */
export default function VehicleTypeBoard({
  canAction,
  onPickNew,
  onPickExisting,
}: {
  canAction: boolean;
  onPickNew: (preset: TimeLogPreset) => void;
  onPickExisting: (log: ShiftLog) => void;
}) {
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [shift, setShift] = useState<'day' | 'night'>(() => {
    const minutes = dayjs().hour() * 60 + dayjs().minute();
    return minutes >= 6 * 60 + 30 && minutes < 18 * 60 + 30 ? 'day' : 'night';
  });
  const [selectedType, setSelectedType] = useState<VehicleType | ''>('');
  const [search, setSearch] = useState('');

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', 'time-board', 'all'],
    queryFn: () => fetchAllPages<Vehicle>((offset, limit) => vehicleService.getVehicles({ offset, limit })),
    staleTime: 5 * 60_000,
  });

  const logsQuery = useQuery({
    queryKey: ['equipment-shift-logs', 'board', date, shift],
    queryFn: () =>
      fetchAllPages<ShiftLog>((offset, limit) =>
        equipmentShiftLogService.getLogs({ offset, limit, startDate: date, endDate: date, shiftType: shift }),
      ),
    enabled: Boolean(date),
  });

  const vehicles = useMemo(
    () => (vehiclesQuery.data ?? []).filter((vehicle) => vehicle.status !== 'retired'),
    [vehiclesQuery.data],
  );

  const logByVehicle = useMemo(() => {
    const map = new Map<string, ShiftLog>();
    (logsQuery.data ?? []).forEach((log) => map.set(log.vehicleId, log));
    return map;
  }, [logsQuery.data]);

  const types = useMemo(
    () =>
      vehicleTypeMap
        .map((type) => {
          const items = vehicles.filter((vehicle) => vehicle.type === type.value);
          return {
            value: type.value as VehicleType,
            label: type.label,
            total: items.length,
            done: items.filter((vehicle) => logByVehicle.has(vehicle.id)).length,
          };
        })
        .filter((type) => type.total > 0),
    [vehicles, logByVehicle],
  );

  const activeType = selectedType || types[0]?.value || '';

  const typeVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles
      .filter((vehicle) => vehicle.type === activeType)
      .filter(
        (vehicle) =>
          !query ||
          [vehicle.mineNumber, vehicle.code, vehicle.name, vehicle.vehicleNumber]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query)),
      )
      .sort((a, b) => vehicleLabel(a).localeCompare(vehicleLabel(b), 'mn', { numeric: true }));
  }, [vehicles, activeType, search]);

  const chip = (active: boolean) =>
    cn(
      'rounded-full px-3 py-1.5 text-xs font-medium transition',
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
    );

  const handlePick = (vehicle: Vehicle) => {
    if (!canAction) return;
    const existing = logByVehicle.get(vehicle.id);
    if (existing) {
      onPickExisting(existing);
      return;
    }
    onPickNew({
      vehicleId: vehicle.id,
      vehicleType: vehicle.type,
      vehicleLabel: vehicle.mineNumber ? `${vehicle.mineNumber} — ${vehicle.name}` : vehicle.name,
      operationalDate: date,
      shiftType: shift,
    });
  };

  const isLoading = vehiclesQuery.isLoading || logsQuery.isLoading;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Огноо, ээлж */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Техникийн төрлөөр бүртгэх</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Төрөл сонгоод техник дээр дарж оператор, цагийг оруулна
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.();
              } catch {
                /* хуучин хөтөч */
              }
            }}
            aria-label="Огноо"
            className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
          />
          <button type="button" className={chip(date === dayjs().format('YYYY-MM-DD'))} onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}>
            Өнөөдөр
          </button>
          <button
            type="button"
            className={chip(date === dayjs().subtract(1, 'day').format('YYYY-MM-DD'))}
            onClick={() => setDate(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))}
          >
            Өчигдөр
          </button>
          <span className="hidden h-5 w-px bg-gray-200 sm:block dark:bg-gray-700" />
          <ShiftChips
            value={shift}
            onChange={(value: ShiftFilterValue) => setShift(value === 'night' ? 'night' : 'day')}
            includeAll={false}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Техникийн төрөл */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 p-2 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r dark:border-gray-800">
          {isLoading && types.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Ачаалж байна...
            </div>
          ) : (
            types.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  'flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
                  activeType === type.value
                    ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800',
                )}
              >
                <span>{type.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                    type.done === type.total
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  )}
                >
                  {type.done}/{type.total}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Тухайн төрлийн техникүүд */}
        <div className="min-w-0 flex-1 p-3">
          <div className="relative mb-3 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Техник хайх..."
              className="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
            />
          </div>

          {typeVehicles.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {isLoading ? 'Ачаалж байна...' : 'Техник олдсонгүй'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {typeVehicles.map((vehicle) => {
                const log = logByVehicle.get(vehicle.id);
                const operator = log ? operatorName(log) : '';
                const disabled = !canAction;

                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handlePick(vehicle)}
                    disabled={disabled}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      log
                        ? 'border-green-200 bg-green-50/60 hover:bg-green-50 dark:border-green-900/50 dark:bg-green-900/10'
                        : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-700 dark:hover:bg-gray-800',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {log ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {vehicleLabel(vehicle)}
                      </p>
                      <p className="truncate text-xs text-gray-500">{vehicle.name}</p>
                      {log ? (
                        <p className="mt-1 truncate text-xs text-green-700 dark:text-green-400">
                          {num(log.workedHours).toFixed(1)}/{num(log.totalHours).toFixed(1)} цаг
                          {operator ? ` · ${operator}` : ''}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">Бүртгээгүй</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
