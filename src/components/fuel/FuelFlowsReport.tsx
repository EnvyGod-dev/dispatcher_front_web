'use client';

import { Column, DataTable, EmptyState, KpiCard, LoadingRows, Panel } from '@/components/fuel/ui';
import { DateRange, fmtDateTime, fmtLiters } from '@/lib/fuel/format';
import fuelService from '@/services/internal/fuel';
import type { FuelFlowDispenser, FuelFlowPart, FuelFlowSupplier, FuelFlowTank } from '@/services/internal/fuel/types';
import { useQuery } from '@tanstack/react-query';
import { Gauge } from 'lucide-react';

function Parts({ title, parts, extra }: { title: string; parts: FuelFlowPart[]; extra?: FuelFlowPart | null }) {
  const rows = extra ? [...parts, extra] : parts;
  if (!rows.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{title}</p>
      {rows.map((p) => (
        <div key={p.name} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="truncate text-gray-700 dark:text-gray-300">
            {p.name}
            {p.count ? <span className="text-gray-400"> · {p.count} удаа</span> : null}
          </span>
          <span className="tabular-nums text-gray-900 dark:text-white">{fmtLiters(p.quantity)}</span>
        </div>
      ))}
    </div>
  );
}

function Readings({ first, last, meter }: { first: string | null; last: string | null; meter: FuelFlowTank['meter'] }) {
  if (!first && !meter) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.03]">
      <Gauge className="mt-0.5 size-4 shrink-0 text-gray-400" />
      <div className="text-sm">
        {first && last && (
          <p className="font-mono tabular-nums text-gray-800 dark:text-white/90">
            {first} → {last}
          </p>
        )}
        {meter && (
          <p className="text-xs text-gray-500">
            Одоогийн заалт <span className="font-mono">{meter.reading}</span> · {meter.digits} оронтой
          </p>
        )}
      </div>
    </div>
  );
}

function TankCard({ tank }: { tank: FuelFlowTank }) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-900 dark:text-white">{tank.name}</p>
        <span className="text-sm text-gray-500">Үлдэгдэл {fmtLiters(tank.closing)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Авсан</p>
          <p className="text-lg font-semibold tabular-nums text-success-600">{fmtLiters(tank.received)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Өгсөн</p>
          <p className="text-lg font-semibold tabular-nums text-brand-600">{fmtLiters(tank.given)}</p>
        </div>
      </div>
      <Parts title="Нийлүүлэгчээс" parts={tank.suppliers} />
      <Parts
        title="Хэнд өгсөн"
        parts={tank.toDispensers}
        extra={tank.refueled > 0 ? { name: 'Техникт шууд', quantity: tank.refueled } : null}
      />
      <Readings first={tank.firstReading} last={tank.lastReading} meter={tank.meter} />
    </div>
  );
}

const readingText = (d: FuelFlowDispenser) =>
  d.firstReading && d.lastReading ? `${d.firstReading} → ${d.lastReading}` : d.meter ? d.meter.reading : '—';

const dispenserColumns: Column<FuelFlowDispenser>[] = [
  { key: 'name', header: 'Түгээгч машин', render: (d) => <span className="font-medium text-gray-800 dark:text-white/90">{d.name}</span> },
  {
    key: 'received',
    header: 'Агуулахаас авсан',
    align: 'right',
    render: (d) => <span className="tabular-nums text-success-600">{fmtLiters(d.received)}</span>,
  },
  {
    key: 'given',
    header: 'Техникт олгосон',
    align: 'right',
    render: (d) => (
      <div>
        <p className="tabular-nums text-brand-600">{fmtLiters(d.given)}</p>
        {d.givenCount > 0 && <p className="text-xs text-gray-500">{d.givenCount} цэнэглэлт · {d.vehicles} техник</p>}
      </div>
    ),
  },
  { key: 'reading', header: 'Тоолуур', render: (d) => <span className="font-mono text-xs tabular-nums text-gray-600 dark:text-gray-400">{readingText(d)}</span> },
  { key: 'closing', header: 'Үлдэгдэл', align: 'right', render: (d) => <span className="font-semibold tabular-nums">{fmtLiters(d.closing)}</span> },
];

const supplierColumns: Column<FuelFlowSupplier>[] = [
  { key: 'name', header: 'Нийлүүлэгч', render: (s) => <span className="font-medium text-gray-800 dark:text-white/90">{s.name}</span> },
  {
    key: 'tanks',
    header: 'Аль агуулахад',
    render: (s) => (
      <div className="space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
        {s.tanks.map((t) => (
          <p key={t.tankId}>
            {t.name}
            {s.tanks.length > 1 && <span className="tabular-nums"> · {fmtLiters(t.quantity)}</span>}
          </p>
        ))}
      </div>
    ),
  },
  { key: 'count', header: 'Орлого', align: 'right', render: (s) => s.count },
  { key: 'last', header: 'Сүүлд', render: (s) => fmtDateTime(s.lastReceivedAt) },
  { key: 'total', header: 'Нийт', align: 'right', render: (s) => <span className="font-semibold tabular-nums">{fmtLiters(s.quantity)}</span> },
];

/** Агуулах, түгээгч машин бүр хэнээс хэдийг авч хэнд хэдийг өгсөн, нийлүүлэгч бүр хэдийг нийлүүлсэн. */
export default function FuelFlowsReport({ range }: { range: DateRange }) {
  const flows = useQuery({
    queryKey: ['fuel', 'flows', range],
    queryFn: () => fuelService.getFlows(range.from, range.to),
  });
  const data = flows.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Нийлүүлэгчээс орсон" value={fmtLiters(data?.totals.received)} tone="green" loading={flows.isLoading} />
        <KpiCard label="Агуулахаас түгээгч рүү" value={fmtLiters(data?.totals.issued)} tone="blue" loading={flows.isLoading} />
        <KpiCard label="Түгээгчээс техникт" value={fmtLiters(data?.totals.refueledFromDispenser)} tone="brand" loading={flows.isLoading} />
        <KpiCard label="Агуулахаас техникт" value={fmtLiters(data?.totals.refueledFromTank)} loading={flows.isLoading} />
      </div>

      <Panel title="Агуулах" description="Хэнээс хэдийг авч, хэнд хэдийг өгсөн, тоолуурын эхний → сүүлийн заалт">
        {flows.isLoading ? (
          <LoadingRows rows={4} />
        ) : !data?.tanks.length ? (
          <EmptyState title="Агуулах бүртгэгдээгүй" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {data.tanks.map((t) => (
              <TankCard key={t.id} tank={t} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Түгээгч машин">
        <DataTable columns={dispenserColumns} rows={data?.dispensers ?? []} rowKey={(d) => d.id} loading={flows.isLoading} empty="Хөдөлгөөн алга" />
      </Panel>

      <Panel title="Нийлүүлэгч">
        <DataTable columns={supplierColumns} rows={data?.suppliers ?? []} rowKey={(s) => s.supplierId} loading={flows.isLoading} empty="Энэ хугацаанд орлого алга" />
      </Panel>
    </div>
  );
}
