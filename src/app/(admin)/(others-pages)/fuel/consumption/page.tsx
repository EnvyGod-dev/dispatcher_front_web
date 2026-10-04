'use client';

import {
  Btn,
  Column,
  DataTable,
  DateRangeFilter,
  ExportButton,
  KpiCard,
  Panel,
  Pill,
  ReasonDialog,
  Segmented,
  TextInput,
} from '@/components/fuel/ui';
import { exportExcel } from '@/lib/fuel/export';
import { DateRange, errorMessage, fmtLiters, fmtNumber, rangePresets, toNum } from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import type { FuelAlert, FuelConsumptionRow, FuelMetric } from '@/services/internal/fuel/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const metricLabel = { liters_per_trip: 'л/рейс', liters_per_m3: 'л/м³' };

function Deviation({ metric }: { metric: FuelMetric }) {
  if (metric.deviationPercent === null) return <span className="text-gray-400">—</span>;
  const up = metric.deviationPercent > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={
        metric.exceeds
          ? 'inline-flex items-center gap-1 font-semibold text-error-600 dark:text-error-400'
          : up
            ? 'inline-flex items-center gap-1 text-warning-600 dark:text-warning-400'
            : 'inline-flex items-center gap-1 text-success-600 dark:text-success-400'
      }
    >
      <Icon className="size-3.5" />
      {up ? '+' : ''}
      {metric.deviationPercent.toFixed(1)}%
    </span>
  );
}

export default function FuelConsumptionPage() {
  const { canControl } = useFuelPermissions();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<DateRange>(rangePresets[3].range());
  const [shift, setShift] = useState<'all' | 'day' | 'night'>('all');
  const [search, setSearch] = useState('');
  const [onlyExceeds, setOnlyExceeds] = useState(false);
  const [alertStatus, setAlertStatus] = useState<'open' | 'closed'>('open');
  const [closing, setClosing] = useState<FuelAlert | null>(null);

  const consumption = useQuery({
    queryKey: ['fuel', 'consumption', range, shift],
    queryFn: () => fuelService.getConsumption({ ...range, shiftType: shift === 'all' ? undefined : shift }),
  });
  const alerts = useQuery({ queryKey: ['fuel', 'alerts', alertStatus], queryFn: () => fuelService.getAlerts(alertStatus) });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (consumption.data?.rows ?? []).filter(
      (r) =>
        (!onlyExceeds || r.perTrip.exceeds || r.perM3.exceeds) &&
        (!q || [r.mineNumber, r.name, r.model, r.groupKey].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [consumption.data, search, onlyExceeds]);

  const all = consumption.data?.rows ?? [];
  const totalRefueled = all.reduce((s, r) => s + r.totalRefueled, 0);
  const totalTrips = all.reduce((s, r) => s + r.tripCount, 0);
  const totalVolume = all.reduce((s, r) => s + r.volumeM3, 0);
  const exceeding = all.filter((r) => r.perTrip.exceeds || r.perM3.exceeds).length;

  const evaluate = useMutation({
    mutationFn: fuelService.evaluateAlerts,
    onSuccess: () => {
      toast.success('Норм хэтрэлтийг дахин тооцлоо');
      queryClient.invalidateQueries({ queryKey: ['fuel', 'alerts'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const close = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => fuelService.closeAlert(id, reason),
    onSuccess: () => {
      toast.success('Alert хаагдлаа');
      setClosing(null);
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelConsumptionRow>[] = [
    {
      key: 'vehicle',
      header: 'Техник',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.mineNumber ?? r.name}</p>
          <p className="text-xs text-gray-500">{r.model ?? r.groupKey}</p>
        </div>
      ),
    },
    { key: 'refueled', header: 'Түлш', align: 'right', render: (r) => <span className="tabular-nums">{fmtLiters(r.totalRefueled)}</span> },
    { key: 'trips', header: 'Рейс', align: 'right', render: (r) => <span className="tabular-nums">{fmtNumber(r.tripCount, 0)}</span> },
    { key: 'volume', header: 'Бүтээл м³', align: 'right', render: (r) => <span className="tabular-nums">{fmtNumber(r.volumeM3)}</span> },
    {
      key: 'perTrip',
      header: 'л/рейс',
      align: 'right',
      render: (r) => (
        <div className="tabular-nums">
          <p className="font-medium text-gray-800 dark:text-white/90">{r.perTrip.actual === null ? '—' : fmtNumber(r.perTrip.actual, 2)}</p>
          {r.perTrip.baseline !== null && (
            <p className="text-xs text-gray-500">
              {r.perTrip.baselineSource === 'norm' ? 'норм' : 'дундаж'} {fmtNumber(r.perTrip.baseline, 2)}
            </p>
          )}
        </div>
      ),
    },
    { key: 'devTrip', header: 'Хазайлт', align: 'right', render: (r) => <Deviation metric={r.perTrip} /> },
    {
      key: 'perM3',
      header: 'л/м³',
      align: 'right',
      render: (r) => (
        <div className="tabular-nums">
          <p className="font-medium text-gray-800 dark:text-white/90">{r.perM3.actual === null ? '—' : fmtNumber(r.perM3.actual, 3)}</p>
          {r.perM3.baseline !== null && <p className="text-xs text-gray-500">{fmtNumber(r.perM3.baseline, 3)}</p>}
        </div>
      ),
    },
    { key: 'devM3', header: 'Хазайлт', align: 'right', render: (r) => <Deviation metric={r.perM3} /> },
    {
      key: 'flag',
      header: '',
      render: (r) =>
        r.perTrip.exceeds || r.perM3.exceeds ? (
          <Pill tone="red">
            <AlertTriangle className="size-3" /> Хэтэрсэн
          </Pill>
        ) : null,
    },
  ];

  const alertColumns: Column<FuelAlert>[] = [
    {
      key: 'vehicle',
      header: 'Техник',
      render: (a) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{a.mineNumber ?? a.vehicleName}</p>
          <p className="text-xs text-gray-500">{a.vehicleModel}</p>
        </div>
      ),
    },
    { key: 'period', header: 'Хугацаа', render: (a) => <span className="text-xs">{a.periodStart} — {a.periodEnd}</span> },
    { key: 'metric', header: 'Үзүүлэлт', render: (a) => metricLabel[a.metric] },
    {
      key: 'value',
      header: 'Бодит / суурь',
      align: 'right',
      render: (a) => (
        <span className="tabular-nums">
          {fmtNumber(a.actualValue, 2)} <span className="text-gray-400">/ {fmtNumber(a.averageValue, 2)}</span>
        </span>
      ),
    },
    {
      key: 'dev',
      header: 'Хэтрэлт',
      align: 'right',
      render: (a) => <span className="font-semibold text-error-600 dark:text-error-400">+{toNum(a.deviationPercent).toFixed(1)}%</span>,
    },
    ...(alertStatus === 'open' && canControl
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (a: FuelAlert) => (
              <Btn size="sm" onClick={() => setClosing(a)}>
                Тайлбарлаж хаах
              </Btn>
            ),
          },
        ]
      : alertStatus === 'closed'
        ? [
            {
              key: 'reason',
              header: 'Хаасан шалтгаан',
              className: 'max-w-[260px]',
              render: (a: FuelAlert) => (
                <div className="text-xs">
                  <p className="line-clamp-2">{a.closeReason}</p>
                  <p className="text-gray-500">{a.closedByName ?? 'Автомат'}</p>
                </div>
              ),
            },
          ]
        : []),
  ];

  const handleExport = () =>
    exportExcel(
      `tulsh-zartsuulalt_${range.from}_${range.to}`,
      [
        {
          name: 'Зарцуулалт',
          rows: consumption.data?.rows ?? [],
          columns: [
            { header: 'Парк №', value: (r) => r.mineNumber ?? '', width: 12 },
            { header: 'Техник', value: (r) => r.name, width: 18 },
            { header: 'Модел', value: (r) => r.model ?? r.groupKey, width: 14 },
            { header: 'Түлш (л)', value: (r) => r.totalRefueled, width: 12 },
            { header: 'Рейс', value: (r) => r.tripCount, width: 8 },
            { header: 'Бүтээл (м³)', value: (r) => r.volumeM3, width: 12 },
            { header: 'л/рейс', value: (r) => r.perTrip.actual ?? '', width: 10 },
            { header: 'л/рейс суурь', value: (r) => r.perTrip.baseline ?? '', width: 12 },
            { header: 'Хазайлт % (рейс)', value: (r) => r.perTrip.deviationPercent ?? '', width: 16 },
            { header: 'л/м³', value: (r) => r.perM3.actual ?? '', width: 10 },
            { header: 'л/м³ суурь', value: (r) => r.perM3.baseline ?? '', width: 12 },
            { header: 'Хазайлт % (м³)', value: (r) => r.perM3.deviationPercent ?? '', width: 16 },
            { header: 'Босго %', value: (r) => r.thresholdPercent, width: 9 },
            { header: 'Хэтэрсэн', value: (r) => (r.perTrip.exceeds || r.perM3.exceeds ? 'Тийм' : ''), width: 10 },
          ],
          totals: ['Нийт', '', '', totalRefueled, totalTrips, totalVolume],
        },
      ],
      [`Түлшний зарцуулалт: ${range.from} — ${range.to}`],
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <ExportButton onClick={handleExport} disabled={!all.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Нийт түлш" value={fmtLiters(totalRefueled)} tone="brand" loading={consumption.isLoading} />
        <KpiCard label="Дундаж л/рейс" value={totalTrips ? fmtNumber(totalRefueled / totalTrips, 2) : '—'} hint={`${fmtNumber(totalTrips, 0)} рейс`} loading={consumption.isLoading} />
        <KpiCard label="Дундаж л/м³" value={totalVolume ? fmtNumber(totalRefueled / totalVolume, 3) : '—'} hint={`${fmtNumber(totalVolume)} м³`} loading={consumption.isLoading} />
        <KpiCard label="Норм хэтэрсэн техник" value={exceeding} tone={exceeding ? 'red' : 'green'} icon={<AlertTriangle className="size-4" />} loading={consumption.isLoading} />
      </div>

      <Panel
        title="Техник тус бүрийн зарцуулалт"
        description="Ижил моделийн дундаж (2+ техник) эсвэл нормтой харьцуулна."
        action={
          <Segmented
            size="sm"
            value={shift}
            onChange={setShift}
            options={[
              { value: 'all', label: 'Бүх ээлж' },
              { value: 'day', label: 'Өдөр' },
              { value: 'night', label: 'Орой' },
            ]}
          />
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <TextInput placeholder="Парк №, модел…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={onlyExceeds}
              onChange={(e) => setOnlyExceeds(e.target.checked)}
              className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Зөвхөн хэтэрсэн
          </label>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.vehicleId}
          loading={consumption.isLoading}
          empty="Зарцуулалтын мэдээлэл алга"
          emptyDescription="Олголт болон бүтээлийн мэдээлэл энэ хугацаанд байхгүй байна."
          rowClassName={(r) => (r.perTrip.exceeds || r.perM3.exceeds ? 'bg-error-50/40 dark:bg-error-500/5' : undefined)}
        />
      </Panel>

      <Panel
        title="Норм хэтрэлтийн alert"
        action={
          <>
            <Segmented
              size="sm"
              value={alertStatus}
              onChange={setAlertStatus}
              options={[
                { value: 'open', label: 'Нээлттэй' },
                { value: 'closed', label: 'Хаагдсан' },
              ]}
            />
            {canControl && (
              <Btn size="sm" icon={<RefreshCw className="size-3.5" />} loading={evaluate.isPending} onClick={() => evaluate.mutate()}>
                Дахин тооцох
              </Btn>
            )}
          </>
        }
      >
        <DataTable columns={alertColumns} rows={alerts.data ?? []} rowKey={(a) => a.id} loading={alerts.isLoading} empty={alertStatus === 'open' ? 'Нээлттэй alert алга' : 'Хаагдсан alert алга'} />
      </Panel>

      <ReasonDialog
        open={!!closing}
        onClose={() => setClosing(null)}
        title="Alert хаах"
        description={closing ? `${closing.mineNumber ?? closing.vehicleName} · +${toNum(closing.deviationPercent).toFixed(1)}% хэтэрсэн шалтгааныг тайлбарлана уу.` : undefined}
        confirmText="Хаах"
        loading={close.isPending}
        onConfirm={(reason) => closing && close.mutate({ id: closing.id, reason })}
      />
    </div>
  );
}
