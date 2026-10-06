'use client';

import FuelFlowsReport from '@/components/fuel/FuelFlowsReport';
import FuelTrendChart from '@/components/fuel/FuelTrendChart';
import RefuelBreakdownReport from '@/components/fuel/RefuelBreakdownReport';
import { Btn, Column, DataTable, DateRangeFilter, EmptyState, KpiCard, LoadingRows, Panel, Segmented } from '@/components/fuel/ui';
import { exportExcel } from '@/lib/fuel/export';
import { DateRange, fmtLiters, fmtNumber, fuelTypeLabel, rangePresets } from '@/lib/fuel/format';
import fuelService from '@/services/internal/fuel';
import type { FuelHolderSummary, FuelSummaryBucket, FuelSupplierReport } from '@/services/internal/fuel/types';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

type Granularity = 'day' | 'week' | 'month';
type SupplierRow = FuelSupplierReport['rows'][number];

const granularityLabel: Record<Granularity, string> = { day: 'Өдөр', week: 'Долоо хоног', month: 'Сар' };
const granularitySheet: Record<Granularity, string> = { day: 'Өдрөөр', week: '7 хоногоор', month: 'Сараар' };

const holderColumns = (nameHeader: string): Column<FuelHolderSummary>[] => [
  {
    key: 'name',
    header: nameHeader,
    render: (h) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-white/90">{h.mineNumber ?? h.name}</p>
        {h.model && <p className="text-xs text-gray-500">{h.model}</p>}
      </div>
    ),
  },
  { key: 'opening', header: 'Эхний үлдэгдэл', align: 'right', render: (h) => <span className="tabular-nums">{fmtLiters(h.opening)}</span> },
  { key: 'inflow', header: 'Орлого', align: 'right', render: (h) => <span className="tabular-nums text-blue-light-700 dark:text-blue-light-400">{fmtLiters(h.inflow)}</span> },
  { key: 'outflow', header: 'Зарлага', align: 'right', render: (h) => <span className="tabular-nums text-brand-700 dark:text-brand-400">{fmtLiters(h.outflow)}</span> },
  { key: 'adjustment', header: 'Тохируулга', align: 'right', render: (h) => <span className="tabular-nums">{h.adjustment ? fmtLiters(h.adjustment) : '—'}</span> },
  { key: 'closing', header: 'Эцсийн үлдэгдэл', align: 'right', render: (h) => <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{fmtLiters(h.closing)}</span> },
];

export default function FuelReportsPage() {
  const [range, setRange] = useState<DateRange>(rangePresets[4].range());
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [view, setView] = useState<'refuel' | 'flows' | 'balance'>('refuel');

  const summary = useQuery({
    queryKey: ['fuel', 'summary', range, granularity],
    queryFn: () => fuelService.getSummary(range.from, range.to, granularity),
    enabled: view === 'balance',
  });
  const suppliers = useQuery({
    queryKey: ['fuel', 'supplier-report', range],
    queryFn: () => fuelService.getSupplierReport(range.from, range.to),
    enabled: view === 'balance',
  });

  const data = summary.data;
  const t = data?.totals;
  const tankAdjustment = (data?.series ?? []).reduce((s, b) => s + b.tankAdjustment, 0);
  const equipment = [...(data?.equipment ?? [])].sort((a, b) => b.inflow - a.inflow);

  const seriesColumns: Column<FuelSummaryBucket>[] = [
    { key: 'bucket', header: granularityLabel[granularity], render: (b) => <span className="font-medium text-gray-800 dark:text-white/90">{b.bucket}</span> },
    { key: 'received', header: 'Орлого', align: 'right', render: (b) => <span className="tabular-nums">{fmtLiters(b.received)}</span> },
    { key: 'refueled', header: 'Олголт', align: 'right', render: (b) => <span className="tabular-nums">{fmtLiters(b.refueled)}</span> },
    { key: 'adj', header: 'Тохируулга', align: 'right', render: (b) => <span className="tabular-nums">{b.tankAdjustment ? fmtLiters(b.tankAdjustment) : '—'}</span> },
    { key: 'closing', header: 'Агуулахын үлдэгдэл', align: 'right', render: (b) => <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{fmtLiters(b.tankClosing)}</span> },
  ];

  const supplierColumns: Column<SupplierRow>[] = [
    { key: 'name', header: 'Нийлүүлэгч', render: (r) => <span className="font-medium text-gray-800 dark:text-white/90">{r.supplierName}</span> },
    { key: 'type', header: 'Түлш', render: (r) => fuelTypeLabel(r.fuelType) },
    { key: 'count', header: 'Орлогын тоо', align: 'right', render: (r) => r.receiptCount },
    {
      key: 'share',
      header: 'Эзлэх хувь',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-blue-light-600" style={{ width: `${r.sharePercent}%` }} />
          </div>
          <span className="text-xs tabular-nums text-gray-500">{r.sharePercent}%</span>
        </div>
      ),
    },
    { key: 'total', header: 'Нийт', align: 'right', render: (r) => <span className="font-semibold tabular-nums">{fmtLiters(r.totalQuantity)}</span> },
  ];

  const handleExport = () => {
    if (!data) return;
    const holderSheet = (name: string, rows: FuelHolderSummary[]) => ({
      name,
      rows,
      columns: [
        { header: 'Нэр', value: (h: FuelHolderSummary) => h.mineNumber ?? h.name, width: 16 },
        { header: 'Модел', value: (h: FuelHolderSummary) => h.model ?? '', width: 14 },
        { header: 'Эхний үлдэгдэл', value: (h: FuelHolderSummary) => h.opening, width: 15 },
        { header: 'Орлого', value: (h: FuelHolderSummary) => h.inflow, width: 12 },
        { header: 'Зарлага', value: (h: FuelHolderSummary) => h.outflow, width: 12 },
        { header: 'Тохируулга', value: (h: FuelHolderSummary) => h.adjustment, width: 12 },
        { header: 'Эцсийн үлдэгдэл', value: (h: FuelHolderSummary) => h.closing, width: 15 },
      ],
    });

    exportExcel(
      `tulsh-tailan_${range.from}_${range.to}`,
      [
        {
          name: 'Нэгдсэн',
          rows: [
            ['Эхний үлдэгдэл (агуулах)', data.totals.tankOpening],
            ['Орлого', data.totals.received],
            ['Олголт', data.totals.refueled],
            ['Тохируулга', tankAdjustment],
            ['Эцсийн үлдэгдэл (агуулах)', data.totals.tankClosing],
          ],
          columns: [
            { header: 'Үзүүлэлт', value: (r: (string | number)[]) => r[0], width: 28 },
            { header: 'Литр', value: (r: (string | number)[]) => r[1], width: 14 },
          ],
        },
        {
          name: granularitySheet[granularity],
          rows: data.series,
          columns: [
            { header: granularityLabel[granularity], value: (b: FuelSummaryBucket) => b.bucket, width: 14 },
            { header: 'Орлого', value: (b: FuelSummaryBucket) => b.received, width: 12 },
            { header: 'Олголт', value: (b: FuelSummaryBucket) => b.refueled, width: 12 },
            { header: 'Тохируулга', value: (b: FuelSummaryBucket) => b.tankAdjustment, width: 12 },
            { header: 'Агуулахын үлдэгдэл', value: (b: FuelSummaryBucket) => b.tankClosing, width: 18 },
          ],
          totals: ['Нийт', data.totals.received, data.totals.refueled, tankAdjustment, data.totals.tankClosing],
        },
        holderSheet('Агуулах', data.tanks),
        holderSheet('Техник', equipment),
        {
          name: 'Нийлүүлэгч',
          rows: suppliers.data?.rows ?? [],
          columns: [
            { header: 'Нийлүүлэгч', value: (r: SupplierRow) => r.supplierName, width: 24 },
            { header: 'Түлш', value: (r: SupplierRow) => fuelTypeLabel(r.fuelType), width: 10 },
            { header: 'Орлогын тоо', value: (r: SupplierRow) => r.receiptCount, width: 12 },
            { header: 'Нийт литр', value: (r: SupplierRow) => r.totalQuantity, width: 12 },
            { header: 'Эзлэх %', value: (r: SupplierRow) => r.sharePercent, width: 10 },
          ],
          totals: ['Нийт', '', '', suppliers.data?.total ?? 0, 100],
        },
      ],
      [`Түлшний тайлан: ${range.from} — ${range.to}`],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'refuel', label: 'Зарлагын тайлан' },
              { value: 'flows', label: 'Агуулах ба нийлүүлэгч' },
              { value: 'balance', label: 'Баланс, орлого' },
            ]}
          />
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        {view === 'balance' && (
          <Btn variant="primary" icon={<FileSpreadsheet className="size-4" />} onClick={handleExport} disabled={!data}>
            Бүрэн тайлан (Excel)
          </Btn>
        )}
      </div>

      {view === 'refuel' ? (
        <RefuelBreakdownReport range={range} />
      ) : view === 'flows' ? (
        <FuelFlowsReport range={range} />
      ) : (
        <>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Эхний үлдэгдэл" value={fmtLiters(t?.tankOpening)} loading={summary.isLoading} />
        <KpiCard label="Орлого" value={fmtLiters(t?.received)} tone="blue" loading={summary.isLoading} />
        <KpiCard label="Олголт" value={fmtLiters(t?.refueled)} tone="brand" loading={summary.isLoading} />
        <KpiCard label="Тохируулга" value={tankAdjustment ? fmtLiters(tankAdjustment) : '—'} hint="Хэмжилтээр засварласан" loading={summary.isLoading} />
        <KpiCard label="Эцсийн үлдэгдэл" value={fmtLiters(t?.tankClosing)} tone="green" loading={summary.isLoading} />
      </div>

      <Panel
        title="Хугацааны тайлан"
        action={
          <Segmented
            size="sm"
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: 'day', label: 'Өдөр' },
              { value: 'week', label: 'Долоо хоног' },
              { value: 'month', label: 'Сар' },
            ]}
          />
        }
      >
        {summary.isLoading ? (
          <LoadingRows rows={6} />
        ) : !data?.series.length ? (
          <EmptyState title="Энэ хугацаанд хөдөлгөөн алга" />
        ) : (
          <div className="space-y-4">
            <FuelTrendChart series={data.series} height={260} />
            <DataTable columns={seriesColumns} rows={data.series} rowKey={(b) => b.bucket} />
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Panel title="Агуулахын хөдөлгөөн">
          <DataTable columns={holderColumns('Агуулах')} rows={data?.tanks ?? []} rowKey={(h) => h.holderId} loading={summary.isLoading} empty="Агуулахын хөдөлгөөн алга" />
        </Panel>
        <Panel title="Нийлүүлэгчээр" description={suppliers.data ? `Нийт ${fmtLiters(suppliers.data.total)}` : undefined}>
          <DataTable columns={supplierColumns} rows={suppliers.data?.rows ?? []} rowKey={(r) => r.supplierId + r.fuelType} loading={suppliers.isLoading} empty="Орлого алга" />
        </Panel>
      </div>

      <Panel title="Техникийн түлш авалт" description={`${equipment.length} техник · ${fmtNumber(equipment.reduce((s, e) => s + e.inflow, 0))} л`}>
        <DataTable columns={holderColumns('Техник')} rows={equipment} rowKey={(h) => h.holderId} loading={summary.isLoading} empty="Мэдээлэл алга" />
      </Panel>
        </>
      )}
    </div>
  );
}
