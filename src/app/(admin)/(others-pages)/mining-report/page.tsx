'use client';

import { useAuth } from '@/components/AuthProvider';
import { Column, DataTable, DateRangeFilter, EmptyState, ExportButton, KpiCard, LoadingRows, Panel, Pill } from '@/components/fuel/ui';
import { exportExcel } from '@/lib/fuel/export';
import { DateRange, errorMessage, fmtNumber, rangePresets } from '@/lib/fuel/format';
import { cn } from '@/lib/utils';
import miningReportService from '@/services/internal/mining-report';
import type {
  MiningCrewRow,
  MiningDayRow,
  MiningExcavatorRow,
  MiningOperatorRow,
  MiningReport,
  MiningTruckRow,
} from '@/services/internal/mining-report/types';
import { miningReportRoles, UserRole } from '@/services/roles';
import { stockpileTypeMap } from '@/services/internal/stockpile/types';
import { useQuery } from '@tanstack/react-query';
import { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import { AlertTriangle, Mountain, Trophy } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/** Өдрийн ба шөнийн ээлжийн өнгө (light/dark аль алинд ялгагдах хос). */
const SHIFT_COLORS = { day: '#c58a12', night: '#35507a' };

const MAX_DAYS = 93;

const m3 = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${fmtNumber(v)} м³`);
const liters = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${fmtNumber(v)} л`);
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${fmtNumber(v)}%`);
const ratio = (v: number | null | undefined, digits = 2) => (v === null || v === undefined ? '—' : fmtNumber(v, digits));
const stockpileLabel = (type: string) => stockpileTypeMap.find((s) => s.value === type)?.label ?? type;
const dayLabel = (date: string) => {
  const d = dayjs(date);
  const weekdays = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
  return `${d.format('MM.DD')} ${weekdays[d.day()]}`;
};

function CrewBadge({ label, night, size = 'md' }: { label: string; night?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white',
        size === 'sm' && 'size-6 text-xs',
        size === 'md' && 'size-8 text-sm',
        size === 'lg' && 'size-11 text-lg',
      )}
      style={{ backgroundColor: night ? SHIFT_COLORS.night : SHIFT_COLORS.day }}
    >
      {label}
    </span>
  );
}

export default function MiningReportPage() {
  const { user } = useAuth();
  const allowed = !!user && (miningReportRoles as readonly string[]).includes(user.role as UserRole);
  const [range, setRange] = useState<DateRange>(rangePresets[0].range());

  const days = dayjs(range.to).diff(dayjs(range.from), 'day');
  const rangeError = days < 0 ? 'Эхлэх огноо дуусах огнооноос хойш байна.' : days > MAX_DAYS ? `Хугацаа ${MAX_DAYS} хоногоос ихгүй байна.` : null;

  const report = useQuery({
    queryKey: ['mining-report', range],
    queryFn: () => miningReportService.getReport(range.from, range.to),
    enabled: allowed && !rangeError,
  });
  const schedule = useQuery({
    queryKey: ['crew-schedule'],
    queryFn: () => miningReportService.getCrewSchedule(6),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  if (user && !allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <Mountain className="size-8 text-gray-300" />
        <p className="font-medium text-gray-700 dark:text-gray-300">Энэ тайланг харах эрхгүй байна</p>
      </div>
    );
  }

  const current = schedule.data?.current;
  const currentWeek = schedule.data?.weeks[0];
  const data = report.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Mountain className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Уулын ажлын нэгдсэн тайлан</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Бүтээл ээлж (А/Б/В/Г), өдөр, техник, түлш, төлөвлөгөөгөөр</p>
          </div>
        </div>
        {current?.label && currentWeek && (
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-white/[0.03]">
            <CrewBadge label={current.label} night={current.shiftType === 'night'} size="lg" />
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">Одоо: {current.label} ээлж ({current.shiftType === 'day' ? 'өдөр' : 'шөнө'})</p>
              <p className="text-gray-500 dark:text-gray-400">
                Энэ 7 хоног: өдөр {currentWeek.dayLabel}, шөнө {currentWeek.nightLabel}, амралт {currentWeek.restingLabels.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <ExportButton onClick={() => data && exportReport(data)} disabled={!data || !!rangeError} />
      </div>

      {rangeError ? (
        <Panel>
          <p className="text-sm text-error-600">{rangeError}</p>
        </Panel>
      ) : report.isLoading ? (
        <Panel>
          <LoadingRows rows={8} />
        </Panel>
      ) : report.isError ? (
        <Panel>
          <p className="text-sm text-error-600">{errorMessage(report.error)}</p>
        </Panel>
      ) : data ? (
        <ReportBody data={data} />
      ) : null}
    </div>
  );
}

function ReportBody({ data }: { data: MiningReport }) {
  const t = data.totals;
  const h = data.highlights;
  const hasWork = t.shifts > 0 || t.fleetFuelLiters > 0 || data.excavators.length > 0;

  return (
    <div className="space-y-6">
      {data.warnings.map((w) => (
        <div key={w} className="flex items-center gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          <AlertTriangle className="size-4 shrink-0" /> {w}
        </div>
      ))}

      {!hasWork ? (
        <Panel>
          <EmptyState title="Энэ хугацаанд бүтээл бүртгэгдээгүй" />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              label="Нийт бүтээл"
              value={m3(t.totalM3)}
              tone="brand"
              hint={t.planM3 > 0 ? `Төлөвлөгөө ${m3(t.planM3)} · ${pct(t.planPercent)}` : 'Төлөвлөгөө оруулаагүй'}
            />
            <KpiCard label="Нүүрс" value={m3(t.coalM3)} hint={`${t.coalTrips} рейс`} />
            <KpiCard label="Хөрс" value={m3(t.soilM3)} hint={`${t.soilTrips} рейс`} />
            <KpiCard label="Рейс" value={fmtNumber(t.trips)} hint={`${t.trucks} машин · ${ratio(t.tripsPerShift, 1)} рейс/ээлж`} />
            <KpiCard label="Хөрс хуулалтын коэф." value={ratio(t.strippingRatio)} hint="хөрс м³ / нүүрс м³" />
            <KpiCard
              label="Түлш"
              value={liters(t.fleetFuelLiters)}
              tone="amber"
              hint={`${ratio(t.litersPerM3)} л/м³ · ${ratio(t.litersPerTrip, 1)} л/рейс`}
            />
            {/* Онцлох: шөнийн ээлжийн шилдэг оператор, машин, экскаватор; хамгийн их түлш авсан техник */}
            <KpiCard
              label="Шөнийн шилдэг оператор"
              value={h?.nightOperator?.name ?? '—'}
              tone="blue"
              hint={h?.nightOperator ? `${m3(h.nightOperator.m3)} · ${h.nightOperator.trips} рейс` : 'Шөнийн ээлжийн бүртгэл алга'}
            />
            <KpiCard
              label="Шөнийн шилдэг машин"
              value={h?.nightTruck ? h.nightTruck.code || h.nightTruck.name : '—'}
              tone="blue"
              hint={h?.nightTruck ? `${m3(h.nightTruck.m3)} · ${h.nightTruck.trips} рейс` : 'Шөнийн ээлжийн бүртгэл алга'}
            />
            <KpiCard
              label="Шөнийн шилдэг экскаватор"
              value={h?.nightExcavator ? h.nightExcavator.code || h.nightExcavator.name : '—'}
              tone="blue"
              hint={h?.nightExcavator ? `${m3(h.nightExcavator.m3)} · ${h.nightExcavator.trips} рейс` : 'Шөнийн ээлжийн бүртгэл алга'}
            />
            <KpiCard
              label="Хамгийн их түлш авсан"
              value={h?.topFuelVehicle ? h.topFuelVehicle.code || h.topFuelVehicle.name : '—'}
              tone="amber"
              hint={h?.topFuelVehicle ? `${liters(h.topFuelVehicle.liters)} · ${h.topFuelVehicle.count} удаа` : 'Түлш олголт алга'}
            />
          </div>

          <CrewCards crews={data.crews} />

          <Panel title="Өдөр тутмын бүтээл" description="Өдрийн ба шөнийн ээлжээр, ээлжийн бригадтай">
            <DailyChart days={data.days} />
          </Panel>

          <Panel title="Өдрөөр">
            <DataTable columns={dayColumns} rows={[...data.days].reverse()} rowKey={(d) => d.date} pageSize={31} />
          </Panel>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <Panel title="Экскаватор" description="Бүтээл, цаг ашиглалт, маркшейдерийн зөрүү">
              <DataTable columns={excavatorColumns} rows={data.excavators} rowKey={(e) => e.vehicleId} empty="Мэдээлэл алга" />
            </Panel>
            <Panel title="Автосамосвал" description={`${data.trucks.length} машин`}>
              <DataTable columns={truckColumns} rows={data.trucks} rowKey={(r) => r.vehicleId} empty="Мэдээлэл алга" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
            <Panel title="Оператор" className="2xl:col-span-2">
              <DataTable columns={operatorColumns} rows={data.operators} rowKey={(o) => o.driverId} empty="Мэдээлэл алга" />
            </Panel>
            <div className="space-y-6">
              <Panel title="Буулгасан цэг">
                <PlaceList items={data.destinations.map((d) => ({ key: `${d.type}|${d.layer}`, label: [stockpileLabel(d.type), d.layer].filter(Boolean).join(' · '), trips: d.trips, m3: d.m3 }))} />
              </Panel>
              <Panel title="Ачилтын блок">
                <PlaceList items={data.blocks.map((b) => ({ key: `${b.name}|${b.layer}`, label: [b.name, b.layer ? `үе ${b.layer}` : null].filter(Boolean).join(' · '), trips: b.trips, m3: b.m3 }))} />
              </Panel>
            </div>
          </div>
        </>
      )}

      {data.schedule.length > 0 && (
        <Panel title="Ээлжийн хуваарь" description="7 хоног тутам Мягмар гарагт солигдоно">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {data.schedule.map((w) => (
              <div key={w.weekStart} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
                <span className="w-24 text-xs text-gray-500">
                  {dayjs(w.weekStart).format('MM.DD')} – {dayjs(w.weekEnd).format('MM.DD')}
                </span>
                <CrewBadge label={w.dayLabel} size="sm" />
                <CrewBadge label={w.nightLabel} night size="sm" />
                <span className="text-xs text-gray-500">амралт {w.restingLabels.join(', ')}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function CrewCards({ crews }: { crews: MiningCrewRow[] }) {
  const best = Math.max(0, ...crews.map((c) => c.totalM3));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {crews.map((c) => {
        const isBest = best > 0 && c.totalM3 === best;
        return (
          <div
            key={c.crew}
            className={cn(
              'rounded-2xl border bg-white p-5 dark:bg-white/[0.03]',
              isBest ? 'border-brand-400 ring-1 ring-brand-400/40' : 'border-gray-200 dark:border-gray-800',
            )}
          >
            <div className="flex items-center gap-3">
              <CrewBadge label={c.label} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{c.label} ээлж</p>
                <p className="text-xs text-gray-500">
                  {c.dayShifts} өдөр · {c.nightShifts} шөнө · {c.operators} оператор
                </p>
              </div>
              {isBest && <Trophy className="size-5 text-brand-500" />}
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">{m3(c.totalM3)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${best > 0 ? (c.totalM3 / best) * 100 : 0}%` }} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-gray-500">Рейс</dt>
              <dd className="text-right tabular-nums">{fmtNumber(c.trips)}</dd>
              <dt className="text-gray-500">Нүүрс / Хөрс</dt>
              <dd className="text-right tabular-nums">
                {fmtNumber(c.coalM3)} / {fmtNumber(c.soilM3)}
              </dd>
              <dt className="text-gray-500">Түлш</dt>
              <dd className="text-right tabular-nums">{liters(c.fuelLiters)}</dd>
              <dt className="text-gray-500">л/м³</dt>
              <dd className="text-right tabular-nums">{ratio(c.litersPerM3)}</dd>
              <dt className="text-gray-500">Рейс/ээлж</dt>
              <dd className="text-right tabular-nums">{ratio(c.tripsPerShift, 1)}</dd>
              {c.planM3 > 0 && (
                <>
                  <dt className="text-gray-500">Төлөвлөгөө</dt>
                  <dd className="text-right tabular-nums">{pct(c.planPercent)}</dd>
                </>
              )}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function DailyChart({ days }: { days: MiningDayRow[] }) {
  const options: ApexOptions = {
    chart: { type: 'bar', stacked: true, fontFamily: 'Gip, sans-serif', toolbar: { show: false }, zoom: { enabled: false } },
    colors: [SHIFT_COLORS.day, SHIFT_COLORS.night],
    plotOptions: { bar: { columnWidth: days.length > 20 ? '70%' : '45%', borderRadius: 3, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last' } },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', markers: { size: 6 } },
    grid: { borderColor: 'rgba(148,163,184,0.18)', strokeDashArray: 4 },
    xaxis: {
      categories: days.map((d) => d.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: days.length > 14 ? 10 : undefined,
      labels: { formatter: (v: string) => (v ? dayjs(v).format('MM/DD') : v), style: { colors: '#98a2b3', fontSize: '12px' }, hideOverlappingLabels: true, rotate: 0 },
    },
    yaxis: { labels: { formatter: (v: number) => fmtNumber(v, 0), style: { colors: ['#98a2b3'] } } },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (_v: number, opts?: { dataPointIndex: number }) => {
          const d = days[opts?.dataPointIndex ?? 0];
          return d ? `${dayLabel(d.date)} · өдөр ${d.day.label}, шөнө ${d.night.label}` : '';
        },
      },
      y: { formatter: (v: number) => m3(v) },
    },
  };

  return (
    <ReactApexChart
      options={options}
      series={[
        { name: 'Өдөр', data: days.map((d) => d.day.totalM3) },
        { name: 'Шөнө', data: days.map((d) => d.night.totalM3) },
      ]}
      type="bar"
      height={300}
    />
  );
}

function PlaceList({ items }: { items: { key: string; label: string; trips: number; m3: number }[] }) {
  const total = items.reduce((s, i) => s + i.m3, 0);
  if (!items.length) return <p className="py-4 text-center text-sm text-gray-500">Мэдээлэл алга</p>;

  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-gray-800 dark:text-white/90">{i.label}</span>
            <span className="whitespace-nowrap tabular-nums text-gray-600 dark:text-gray-400">
              {i.trips} рейс · {m3(i.m3)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-gray-400 dark:bg-gray-500" style={{ width: `${total > 0 ? (i.m3 / total) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const slotCell = (s: MiningDayRow['day'], night: boolean) => (
  <div className="flex items-center gap-2">
    <CrewBadge label={s.label} night={night} size="sm" />
    {s.shifts === 0 ? (
      <span className="text-xs text-gray-400">—</span>
    ) : (
      <div className="text-xs">
        <p className="font-medium tabular-nums text-gray-800 dark:text-white/90">{m3(s.totalM3)}</p>
        <p className="text-gray-500">
          {s.trips} рейс · {s.trucks} машин
        </p>
      </div>
    )}
  </div>
);

const dayColumns: Column<MiningDayRow>[] = [
  { key: 'date', header: 'Огноо', render: (d) => <span className="font-medium text-gray-800 dark:text-white/90">{dayLabel(d.date)}</span> },
  { key: 'day', header: 'Өдөр', render: (d) => slotCell(d.day, false) },
  { key: 'night', header: 'Шөнө', render: (d) => slotCell(d.night, true) },
  { key: 'coal', header: 'Нүүрс', align: 'right', render: (d) => <span className="tabular-nums">{fmtNumber(d.coalM3)}</span> },
  { key: 'soil', header: 'Хөрс', align: 'right', render: (d) => <span className="tabular-nums">{fmtNumber(d.soilM3)}</span> },
  { key: 'total', header: 'Нийт м³', align: 'right', render: (d) => <span className="font-semibold tabular-nums">{fmtNumber(d.totalM3)}</span> },
  {
    key: 'plan',
    header: 'Төлөвлөгөө',
    align: 'right',
    render: (d) =>
      d.planM3 > 0 ? (
        <span className={cn('tabular-nums', d.totalM3 >= d.planM3 ? 'text-success-600' : 'text-warning-600')}>
          {fmtNumber(d.planM3)} · {pct(Math.round((d.totalM3 / d.planM3) * 1000) / 10)}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
  { key: 'fuel', header: 'Түлш', align: 'right', render: (d) => <span className="tabular-nums">{liters(d.fuelLiters)}</span> },
];

const excavatorColumns: Column<MiningExcavatorRow>[] = [
  { key: 'code', header: 'Экскаватор', render: (e) => <span className="font-medium text-gray-800 dark:text-white/90">{e.code ?? e.name}</span> },
  { key: 'trips', header: 'Рейс', align: 'right', render: (e) => `${e.trips} / ${e.trucks} маш.` },
  { key: 'm3', header: 'Бүтээл', align: 'right', render: (e) => <span className="font-semibold tabular-nums">{m3(e.totalM3)}</span> },
  {
    key: 'hours',
    header: 'Ажилласан / засвар / сул',
    align: 'right',
    render: (e) =>
      e.totalHours === null ? (
        <span className="text-gray-400">—</span>
      ) : (
        <span className="tabular-nums">
          {fmtNumber(e.workedHours)} / {fmtNumber(e.repairHours)} / {fmtNumber(e.idleHours)}
        </span>
      ),
  },
  { key: 'avail', header: 'Бэлэн / Ашиглалт', align: 'right', render: (e) => `${pct(e.availability)} / ${pct(e.utilization)}` },
  { key: 'rate', header: 'м³/цаг', align: 'right', render: (e) => ratio(e.m3PerHour, 1) },
  {
    key: 'mark',
    header: 'Маркшейдер',
    align: 'right',
    render: (e) =>
      e.markM3 === null ? (
        <span className="text-gray-400">—</span>
      ) : (
        <div className="text-xs">
          <p className="tabular-nums">{m3(e.markM3)}</p>
          <p className={cn('tabular-nums', (e.markDiff ?? 0) < 0 ? 'text-error-600' : 'text-success-600')}>{m3(e.markDiff)}</p>
        </div>
      ),
  },
];

const truckColumns: Column<MiningTruckRow>[] = [
  {
    key: 'truck',
    header: 'Машин',
    render: (r) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-white/90">{r.code ?? r.name}</p>
        <p className="text-xs text-gray-500">{[r.model, r.owner].filter(Boolean).join(' · ')}</p>
      </div>
    ),
  },
  { key: 'shifts', header: 'Ээлж', align: 'right', render: (r) => r.shifts },
  { key: 'trips', header: 'Рейс', align: 'right', render: (r) => r.trips },
  { key: 'm3', header: 'Бүтээл', align: 'right', render: (r) => <span className="font-semibold tabular-nums">{m3(r.totalM3)}</span> },
  { key: 'moto', header: 'Мото / км', align: 'right', render: (r) => `${fmtNumber(r.motoHours)} / ${fmtNumber(r.km)}` },
  { key: 'fuel', header: 'Түлш', align: 'right', render: (r) => liters(r.fuelLiters) },
  { key: 'lpm', header: 'л/м³', align: 'right', render: (r) => ratio(r.litersPerM3) },
];

const operatorColumns: Column<MiningOperatorRow>[] = [
  {
    key: 'name',
    header: 'Оператор',
    render: (o) => (
      <div className="flex items-center gap-2">
        {o.crewLabel ? <CrewBadge label={o.crewLabel} size="sm" /> : <Pill>—</Pill>}
        <span className="font-medium text-gray-800 dark:text-white/90">{o.name}</span>
      </div>
    ),
  },
  { key: 'shifts', header: 'Ээлж', align: 'right', render: (o) => o.shifts },
  { key: 'trips', header: 'Рейс', align: 'right', render: (o) => o.trips },
  { key: 'm3', header: 'Бүтээл', align: 'right', render: (o) => <span className="font-semibold tabular-nums">{m3(o.totalM3)}</span> },
  { key: 'tps', header: 'Рейс/ээлж', align: 'right', render: (o) => ratio(o.tripsPerShift, 1) },
  { key: 'fuel', header: 'Түлш', align: 'right', render: (o) => liters(o.fuelLiters) },
];

function exportReport(data: MiningReport) {
  const t = data.totals;
  type Pair = [string, string | number | null];
  const summary: Pair[] = [
    ['Нийт бүтээл (м³)', t.totalM3],
    ['Нүүрс (м³)', t.coalM3],
    ['Хөрс (м³)', t.soilM3],
    ['Төлөвлөгөө (м³)', t.planM3],
    ['Төлөвлөгөөний биелэлт (%)', t.planPercent],
    ['Рейс', t.trips],
    ['Нүүрсний рейс', t.coalTrips],
    ['Хөрсний рейс', t.soilTrips],
    ['Хөрс хуулалтын коэф.', t.strippingRatio],
    ['Машин', t.trucks],
    ['Экскаватор', t.excavators],
    ['Оператор', t.operators],
    ['Ээлж', t.shifts],
    ['Мото цаг (машин)', t.motoHours],
    ['Км', t.km],
    ['Түлш (бүх техник, л)', t.fleetFuelLiters],
    ['л/м³', t.litersPerM3],
    ['л/рейс', t.litersPerTrip],
    ['Экскаваторын бэлэн байдал (%)', t.excavatorAvailability],
    ['Экскаваторын ашиглалт (%)', t.excavatorUtilization],
    ['Маркшейдер (м³)', t.markM3],
    ['Маркшейдерийн зөрүү (м³)', t.markDiff],
  ];

  const metricCols = <T extends MiningCrewRow | MiningTruckRow | MiningOperatorRow>() => [
    { header: 'Ээлж', value: (r: T) => r.shifts, width: 8 },
    { header: 'Рейс', value: (r: T) => r.trips, width: 8 },
    { header: 'Нүүрс м³', value: (r: T) => r.coalM3, width: 11 },
    { header: 'Хөрс м³', value: (r: T) => r.soilM3, width: 11 },
    { header: 'Нийт м³', value: (r: T) => r.totalM3, width: 11 },
    { header: 'Мото цаг', value: (r: T) => r.motoHours, width: 10 },
    { header: 'Км', value: (r: T) => r.km, width: 9 },
    { header: 'Түлш л', value: (r: T) => r.fuelLiters, width: 10 },
    { header: 'л/м³', value: (r: T) => r.litersPerM3, width: 8 },
  ];

  exportExcel(
    `uul-ajlyn-tailan_${data.from}_${data.to}`,
    [
      {
        name: 'Нэгдсэн',
        rows: summary,
        columns: [
          { header: 'Үзүүлэлт', value: (r: Pair) => r[0], width: 32 },
          { header: 'Утга', value: (r: Pair) => r[1], width: 14 },
        ],
      },
      {
        name: 'Ээлжээр',
        rows: data.crews,
        columns: [
          { header: 'Ээлж', value: (r: MiningCrewRow) => r.label, width: 8 },
          { header: 'Өдөр', value: (r: MiningCrewRow) => r.dayShifts, width: 8 },
          { header: 'Шөнө', value: (r: MiningCrewRow) => r.nightShifts, width: 8 },
          ...metricCols<MiningCrewRow>(),
          { header: 'Төлөвлөгөө м³', value: (r: MiningCrewRow) => r.planM3, width: 13 },
          { header: 'Биелэлт %', value: (r: MiningCrewRow) => r.planPercent, width: 10 },
        ],
      },
      {
        name: 'Өдрөөр',
        rows: data.days,
        columns: [
          { header: 'Огноо', value: (d: MiningDayRow) => d.date, width: 12 },
          { header: 'Өдрийн ээлж', value: (d: MiningDayRow) => d.day.label, width: 11 },
          { header: 'Өдөр м³', value: (d: MiningDayRow) => d.day.totalM3, width: 10 },
          { header: 'Өдөр рейс', value: (d: MiningDayRow) => d.day.trips, width: 10 },
          { header: 'Шөнийн ээлж', value: (d: MiningDayRow) => d.night.label, width: 11 },
          { header: 'Шөнө м³', value: (d: MiningDayRow) => d.night.totalM3, width: 10 },
          { header: 'Шөнө рейс', value: (d: MiningDayRow) => d.night.trips, width: 10 },
          { header: 'Нүүрс м³', value: (d: MiningDayRow) => d.coalM3, width: 10 },
          { header: 'Хөрс м³', value: (d: MiningDayRow) => d.soilM3, width: 10 },
          { header: 'Нийт м³', value: (d: MiningDayRow) => d.totalM3, width: 10 },
          { header: 'Төлөвлөгөө м³', value: (d: MiningDayRow) => d.planM3, width: 13 },
          { header: 'Түлш л', value: (d: MiningDayRow) => d.fuelLiters, width: 10 },
        ],
        totals: ['Нийт', '', '', '', '', '', '', t.coalM3, t.soilM3, t.totalM3, t.planM3, ''],
      },
      {
        name: 'Экскаватор',
        rows: data.excavators,
        columns: [
          { header: 'Экскаватор', value: (e: MiningExcavatorRow) => e.code ?? e.name, width: 14 },
          { header: 'Рейс', value: (e: MiningExcavatorRow) => e.trips, width: 8 },
          { header: 'Машин', value: (e: MiningExcavatorRow) => e.trucks, width: 8 },
          { header: 'Нүүрс м³', value: (e: MiningExcavatorRow) => e.coalM3, width: 10 },
          { header: 'Хөрс м³', value: (e: MiningExcavatorRow) => e.soilM3, width: 10 },
          { header: 'Нийт м³', value: (e: MiningExcavatorRow) => e.totalM3, width: 10 },
          { header: 'Нийт цаг', value: (e: MiningExcavatorRow) => e.totalHours, width: 9 },
          { header: 'Ажилласан', value: (e: MiningExcavatorRow) => e.workedHours, width: 10 },
          { header: 'Засвар', value: (e: MiningExcavatorRow) => e.repairHours, width: 9 },
          { header: 'Сул зогсолт', value: (e: MiningExcavatorRow) => e.idleHours, width: 11 },
          { header: 'Бэлэн %', value: (e: MiningExcavatorRow) => e.availability, width: 9 },
          { header: 'Ашиглалт %', value: (e: MiningExcavatorRow) => e.utilization, width: 10 },
          { header: 'м³/цаг', value: (e: MiningExcavatorRow) => e.m3PerHour, width: 9 },
          { header: 'Маркшейдер м³', value: (e: MiningExcavatorRow) => e.markM3, width: 13 },
          { header: 'Зөрүү м³', value: (e: MiningExcavatorRow) => e.markDiff, width: 10 },
        ],
      },
      {
        name: 'Машин',
        rows: data.trucks,
        columns: [
          { header: 'Машин', value: (r: MiningTruckRow) => r.code ?? r.name, width: 12 },
          { header: 'Марк', value: (r: MiningTruckRow) => r.model ?? '', width: 12 },
          { header: 'Эзэмшигч', value: (r: MiningTruckRow) => r.owner ?? '', width: 16 },
          ...metricCols<MiningTruckRow>(),
        ],
      },
      {
        name: 'Оператор',
        rows: data.operators,
        columns: [
          { header: 'Оператор', value: (r: MiningOperatorRow) => r.name, width: 18 },
          { header: 'Ээлж (бригад)', value: (r: MiningOperatorRow) => r.crewLabel ?? '', width: 12 },
          ...metricCols<MiningOperatorRow>(),
        ],
      },
      {
        name: 'Буулгалт',
        rows: data.destinations,
        columns: [
          { header: 'Төрөл', value: (d: MiningReport['destinations'][number]) => stockpileLabel(d.type), width: 18 },
          { header: 'Овоолго', value: (d: MiningReport['destinations'][number]) => d.layer ?? '', width: 12 },
          { header: 'Рейс', value: (d: MiningReport['destinations'][number]) => d.trips, width: 8 },
          { header: 'м³', value: (d: MiningReport['destinations'][number]) => d.m3, width: 10 },
        ],
      },
      {
        name: 'Блок',
        rows: data.blocks,
        columns: [
          { header: 'Блок', value: (b: MiningReport['blocks'][number]) => b.name, width: 16 },
          { header: 'Үе', value: (b: MiningReport['blocks'][number]) => b.layer ?? '', width: 8 },
          { header: 'Рейс', value: (b: MiningReport['blocks'][number]) => b.trips, width: 8 },
          { header: 'м³', value: (b: MiningReport['blocks'][number]) => b.m3, width: 10 },
        ],
      },
    ],
    [`Уулын ажлын тайлан: ${data.from} — ${data.to}`],
  );
}
