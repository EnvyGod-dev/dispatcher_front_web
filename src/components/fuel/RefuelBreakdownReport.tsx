'use client';

import { Column, DataTable, EmptyState, ExportButton, KpiCard, LoadingRows, Panel, Pill } from '@/components/fuel/ui';
import { exportExcel } from '@/lib/fuel/export';
import { DateRange, fmtLiters, fmtNumber } from '@/lib/fuel/format';
import fuelService from '@/services/internal/fuel';
import type { FuelBreakdownSource, FuelBreakdownVehicle } from '@/services/internal/fuel/types';
import { useQuery } from '@tanstack/react-query';
import { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/** Өдрийн ба шөнийн ээлжийн өнгө (light/dark аль алинд ялгагдах хос). */
const SHIFT_COLORS = { day: '#c58a12', night: '#35507a' };

const vehicleTypeLabels: Record<string, string> = {
  truck: 'Автосамосвал',
  excavator: 'Экскаватор',
  loader: 'Дугуйт ачигч',
  dozer: 'Бульдозер',
  dump: 'Дамп',
  light_vehicle: 'Хөнгөн тэрэг',
  special_purpose: 'Тусгай зориулалт',
  grader: 'Автогрейдр',
};

const typeLabel = (type: string | null) => (type ? vehicleTypeLabels[type] ?? type : 'Тодорхойгүй');
const isDump = (v: FuelBreakdownVehicle) => v.type === 'truck' || v.type === 'dump';

type RankItem = { label: string; liters: number; hint?: string };

const groupBy = (vehicles: FuelBreakdownVehicle[], key: (v: FuelBreakdownVehicle) => string): RankItem[] => {
  const map = new Map<string, { liters: number; count: number }>();
  vehicles.forEach((v) => {
    const k = key(v);
    const cur = map.get(k) ?? { liters: 0, count: 0 };
    cur.liters += v.liters;
    cur.count += 1;
    map.set(k, cur);
  });
  return [...map.entries()]
    .map(([label, g]) => ({ label, liters: g.liters, hint: `${g.count} техник` }))
    .sort((a, b) => b.liters - a.liters);
};

function RankList({ title, items, total }: { title: string; items: RankItem[]; total: number }) {
  return (
    <Panel title={title}>
      {!items.length ? (
        <p className="py-6 text-center text-sm text-gray-500">Мэдээлэл алга</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const pct = total > 0 ? (it.liters / total) * 100 : 0;
            return (
              <li key={it.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-gray-800 dark:text-white/90">
                    {it.label}
                    {it.hint && <span className="ml-2 text-xs font-normal text-gray-500">{it.hint}</span>}
                  </span>
                  <span className="whitespace-nowrap tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtLiters(it.liters)} <span className="text-xs text-gray-500">· {fmtNumber(pct)}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** Зарлагын тайлан: техникүүдэд олгосон түлшийг өдөр/шөнө, эх үүсвэр, төрөл, марк, эзэмшигчээр задлана. */
export default function RefuelBreakdownReport({ range }: { range: DateRange }) {
  const query = useQuery({
    queryKey: ['fuel', 'refuel-breakdown', range],
    queryFn: () => fuelService.getRefuelBreakdown(range.from, range.to),
  });
  const data = query.data;

  const totalDays = dayjs(range.to).diff(dayjs(range.from), 'day') + 1;
  const vehicles = data?.vehicles ?? [];
  const dump = vehicles.filter(isDump).reduce((s, v) => s + v.liters, 0);
  const total = data?.total ?? 0;
  const byType = groupBy(vehicles, (v) => typeLabel(v.type));
  const byModel = groupBy(vehicles, (v) => v.model || 'Тодорхойгүй');
  const byOwner = groupBy(vehicles, (v) => v.owner || 'Тодорхойгүй');
  const top10 = vehicles.slice(0, 10);

  const days = data?.days ?? [];
  const chartOptions: ApexOptions = {
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
      labels: {
        formatter: (v: string) => (v ? dayjs(v).format('MM/DD') : v),
        style: { colors: '#98a2b3', fontSize: '12px' },
        hideOverlappingLabels: true,
        rotate: 0,
      },
    },
    yaxis: { labels: { formatter: (v: number) => fmtNumber(v, 0), style: { colors: ['#98a2b3'] } } },
    tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => fmtLiters(v) } },
  };

  const sourceColumns: Column<FuelBreakdownSource>[] = [
    {
      key: 'label',
      header: 'Эх үүсвэр',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 dark:text-white/90">{s.label}</span>
          <Pill tone={s.kind === 'dispenser' ? 'brand' : 'blue'}>{s.kind === 'dispenser' ? 'Түгээгч' : 'Агуулах'}</Pill>
        </div>
      ),
    },
    { key: 'count', header: 'Олголт', align: 'right', render: (s) => s.count },
    { key: 'liters', header: 'Литр', align: 'right', render: (s) => <span className="font-semibold tabular-nums">{fmtLiters(s.liters)}</span> },
    {
      key: 'gap',
      header: 'Тоолуурын зөрүү',
      align: 'right',
      render: (s) =>
        Math.abs(s.meterGap) < 0.05 ? (
          <span className="text-gray-400">—</span>
        ) : (
          <span className="tabular-nums text-warning-600 dark:text-warning-400">{fmtLiters(s.meterGap)}</span>
        ),
    },
  ];

  const vehicleColumns: Column<FuelBreakdownVehicle>[] = [
    {
      key: 'rank',
      header: '#',
      render: (v) => <span className="tabular-nums text-gray-500">{top10.indexOf(v) + 1}</span>,
    },
    {
      key: 'vehicle',
      header: 'Техник',
      render: (v) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{v.mineNumber ?? v.name}</p>
          <p className="text-xs text-gray-500">{[typeLabel(v.type), v.model, v.owner].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    { key: 'count', header: 'Олголт', align: 'right', render: (v) => v.count },
    { key: 'day', header: 'Өдөр', align: 'right', render: (v) => <span className="tabular-nums">{fmtLiters(v.day)}</span> },
    { key: 'night', header: 'Шөнө', align: 'right', render: (v) => <span className="tabular-nums">{fmtLiters(v.night)}</span> },
    { key: 'liters', header: 'Нийт', align: 'right', render: (v) => <span className="font-semibold tabular-nums">{fmtLiters(v.liters)}</span> },
  ];

  const handleExport = () => {
    if (!data) return;
    const rankSheet = (name: string, items: RankItem[]) => ({
      name,
      rows: items,
      columns: [
        { header: name, value: (r: RankItem) => r.label, width: 24 },
        { header: 'Техник', value: (r: RankItem) => r.hint ?? '', width: 12 },
        { header: 'Литр', value: (r: RankItem) => r.liters, width: 12 },
      ],
      totals: ['Нийт', '', total],
    });

    exportExcel(
      `tulsh-zarlagyn-tailan_${range.from}_${range.to}`,
      [
        {
          name: 'Өдрөөр',
          rows: data.days,
          columns: [
            { header: 'Огноо', value: (d: (typeof data.days)[number]) => d.date, width: 12 },
            { header: 'Өдөр', value: (d: (typeof data.days)[number]) => d.day, width: 12 },
            { header: 'Шөнө', value: (d: (typeof data.days)[number]) => d.night, width: 12 },
            { header: 'Ээлж тодорхойгүй', value: (d: (typeof data.days)[number]) => d.other, width: 16 },
            { header: 'Нийт', value: (d: (typeof data.days)[number]) => Math.round((d.day + d.night + d.other) * 10) / 10, width: 12 },
          ],
          totals: ['Нийт', data.day, data.night, Math.round((data.total - data.day - data.night) * 10) / 10, data.total],
        },
        {
          name: 'Техникээр',
          rows: data.vehicles,
          columns: [
            { header: 'Парк №', value: (v: FuelBreakdownVehicle) => v.mineNumber ?? '', width: 12 },
            { header: 'Нэр', value: (v: FuelBreakdownVehicle) => v.name, width: 18 },
            { header: 'Улсын дугаар', value: (v: FuelBreakdownVehicle) => v.vehicleNumber ?? '', width: 14 },
            { header: 'Төрөл', value: (v: FuelBreakdownVehicle) => typeLabel(v.type), width: 16 },
            { header: 'Марк', value: (v: FuelBreakdownVehicle) => v.model ?? '', width: 14 },
            { header: 'Эзэмшигч', value: (v: FuelBreakdownVehicle) => v.owner ?? '', width: 18 },
            { header: 'Олголт', value: (v: FuelBreakdownVehicle) => v.count, width: 10 },
            { header: 'Өдөр', value: (v: FuelBreakdownVehicle) => v.day, width: 10 },
            { header: 'Шөнө', value: (v: FuelBreakdownVehicle) => v.night, width: 10 },
            { header: 'Нийт литр', value: (v: FuelBreakdownVehicle) => v.liters, width: 12 },
          ],
          totals: ['Нийт', '', '', '', '', '', data.count, data.day, data.night, data.total],
        },
        {
          name: 'Эх үүсвэр',
          rows: data.sources,
          columns: [
            { header: 'Эх үүсвэр', value: (s: FuelBreakdownSource) => s.label, width: 16 },
            { header: 'Төрөл', value: (s: FuelBreakdownSource) => (s.kind === 'dispenser' ? 'Түгээгч машин' : 'Агуулах'), width: 14 },
            { header: 'Олголт', value: (s: FuelBreakdownSource) => s.count, width: 10 },
            { header: 'Литр', value: (s: FuelBreakdownSource) => s.liters, width: 12 },
            { header: 'Тоолуурын зөрүү', value: (s: FuelBreakdownSource) => s.meterGap, width: 16 },
          ],
        },
        rankSheet('Төрөл', byType),
        rankSheet('Марк', byModel),
        rankSheet('Эзэмшигч', byOwner),
      ],
      [`Түлшний зарлагын тайлан: ${range.from} — ${range.to}`],
    );
  };

  if (query.isLoading) {
    return (
      <Panel>
        <LoadingRows rows={6} />
      </Panel>
    );
  }

  if (!data || !data.count) {
    return (
      <Panel>
        <EmptyState title="Энэ хугацаанд түлш олголт бүртгэгдээгүй" />
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton onClick={handleExport} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Нийт зарлага" value={fmtLiters(total)} tone="brand" hint={`${data.count} олголт`} />
        <KpiCard label="Өдрийн ээлж" value={fmtLiters(data.day)} hint={total ? `${fmtNumber((data.day / total) * 100)}%` : undefined} />
        <KpiCard label="Шөнийн ээлж" value={fmtLiters(data.night)} hint={total ? `${fmtNumber((data.night / total) * 100)}%` : undefined} />
        <KpiCard label="Өдрийн дундаж" value={fmtLiters(totalDays > 0 ? total / totalDays : 0)} hint={`${data.daysWithRefuel}/${totalDays} өдөр олголттой`} />
        <KpiCard label="Техник" value={vehicles.length} hint="Түлш авсан" />
      </div>

      <Panel title="Өдөр тутмын зарлага" description="Өдрийн ба шөнийн ээлжээр">
        <ReactApexChart
          options={chartOptions}
          series={[
            { name: 'Өдөр', data: days.map((d) => d.day) },
            { name: 'Шөнө', data: days.map((d) => Math.round((d.night + d.other) * 10) / 10) },
          ]}
          type="bar"
          height={280}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Эх үүсвэрээр" description="Тоолуурын зөрүү = (эцсийн − эхний заалт) − бүртгэсэн литр">
          <DataTable columns={sourceColumns} rows={data.sources} rowKey={(s) => s.key} />
        </Panel>
        <RankList
          title="Дамп ба бусад техник"
          total={total}
          items={[
            { label: 'Дампны түлш', liters: dump },
            { label: 'Бусад техникийн түлш', liters: Math.max(0, total - dump) },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RankList title="Төрлөөр" items={byType} total={total} />
        <RankList title="Маркаар" items={byModel.slice(0, 10)} total={total} />
        <RankList title="Эзэмшигчээр" items={byOwner} total={total} />
      </div>

      <Panel title="Хамгийн их түлш авсан 10 техник">
        <DataTable columns={vehicleColumns} rows={top10} rowKey={(v) => v.vehicleId} />
      </Panel>
    </div>
  );
}
