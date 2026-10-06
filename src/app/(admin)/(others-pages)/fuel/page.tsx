'use client';

import FuelTrendChart from '@/components/fuel/FuelTrendChart';
import { DateRangeFilter, EmptyState, KpiCard, LoadingRows, Panel, Pill, Segmented } from '@/components/fuel/ui';
import { DateRange, fmtLiters, fmtTime, fuelTypeLabel, rangePresets } from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Droplets } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function FuelOverviewPage() {
  const { canViewRecords } = useFuelPermissions();
  const [range, setRange] = useState<DateRange>(rangePresets[3].range());
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

  const dashboard = useQuery({
    queryKey: ['fuel', 'dashboard', range],
    queryFn: () => fuelService.getDashboard(range.from, range.to),
  });
  const summary = useQuery({
    queryKey: ['fuel', 'summary', range, granularity],
    queryFn: () => fuelService.getSummary(range.from, range.to, granularity),
  });
  const recent = useQuery({
    queryKey: ['fuel', 'refuelings', 'recent', range],
    queryFn: () => fuelService.getRefuelings(range),
  });

  const s = dashboard.data?.summary;
  const totals = summary.data?.totals;
  const topEquipment = [...(summary.data?.equipment ?? [])].sort((a, b) => b.inflow - a.inflow).slice(0, 8);
  const maxInflow = Math.max(1, ...topEquipment.map((e) => e.inflow));

  return (
    <div className="space-y-6">
      <DateRangeFilter value={range} onChange={setRange} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Олгосон түлш"
          value={fmtLiters(totals?.refueled ?? s?.total_refuelings)}
          hint={`${recent.data?.length ?? 0} цэнэглэлт`}
          icon={<ArrowUpFromLine className="size-4" />}
          tone="brand"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Орлого"
          value={fmtLiters(totals?.received ?? s?.total_receipts)}
          hint="Нийлүүлэгчээс хүлээн авсан"
          icon={<ArrowDownToLine className="size-4" />}
          tone="blue"
          loading={summary.isLoading}
        />
        <KpiCard
          label="Агуулахын үлдэгдэл"
          value={fmtLiters(s?.tank_total_balance)}
          hint="Одоогийн байдлаар"
          icon={<Droplets className="size-4" />}
          tone="green"
          loading={dashboard.isLoading}
        />
        <KpiCard
          label="Нээлттэй alert"
          value={s?.open_alerts ?? 0}
          hint={<Link href="/fuel/consumption" className="hover:text-brand-600">Норм хэтрэлт харах →</Link>}
          icon={<AlertTriangle className="size-4" />}
          tone={s?.open_alerts ? 'red' : 'gray'}
          loading={dashboard.isLoading}
        />
        <KpiCard
          label="Хүлээгдэж буй хүсэлт"
          value={s?.pending_edit_requests ?? 0}
          hint={
            canViewRecords ? (
              <Link href="/fuel/receipts?tab=requests" className="hover:text-brand-600">Орлогын засвар →</Link>
            ) : (
              'Орлогын засвар'
            )
          }
          icon={<ClipboardList className="size-4" />}
          tone={s?.pending_edit_requests ? 'amber' : 'gray'}
          loading={dashboard.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Олголт ба орлого"
          description="Хугацааны хүрээнд литрээр"
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
          ) : summary.data?.series.length ? (
            <FuelTrendChart series={summary.data.series} />
          ) : (
            <EmptyState title="Энэ хугацаанд хөдөлгөөн алга" />
          )}
        </Panel>

        <Panel title="Агуулахын үлдэгдэл">
          {dashboard.isLoading ? (
            <LoadingRows rows={3} />
          ) : !dashboard.data?.tankBalances.length ? (
            <EmptyState title="Агуулах бүртгэгдээгүй" description="Тохиргоо хэсгээс агуулах нэмнэ үү." />
          ) : (
            <ul className="space-y-5">
              {dashboard.data.tankBalances.map((t) => {
                const pct = Math.max(0, Math.min(100, t.fillPercent ?? 0));
                const low = t.fillPercent !== null && t.fillPercent < 15;
                return (
                  <li key={t.holderId}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">{t.name}</p>
                        <p className="text-xs text-gray-500">{fuelTypeLabel(t.fuelType)}</p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{fmtLiters(t.balance)}</p>
                    </div>
                    {t.capacity ? (
                      <>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={low ? 'h-full rounded-full bg-error-500' : 'h-full rounded-full bg-success-500'}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                          <span>{t.fillPercent?.toFixed(0) ?? 0}% дүүрэн{low && ' · бага байна'}</span>
                          <span>Багтаамж {fmtLiters(t.capacity)}</span>
                        </div>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Хамгийн их түлш авсан техник" description="Хугацааны хүрээнд">
          {summary.isLoading ? (
            <LoadingRows />
          ) : !topEquipment.length ? (
            <EmptyState title="Мэдээлэл алга" />
          ) : (
            <ul className="space-y-3">
              {topEquipment.map((e) => (
                <li key={e.holderId} className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{e.mineNumber ?? e.name}</p>
                    {e.model && <p className="truncate text-xs text-gray-500">{e.model}</p>}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(e.inflow / maxInflow) * 100}%` }} />
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">{fmtLiters(e.inflow)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Сүүлийн олголт"
          action={
            canViewRecords ? (
              <Link href="/fuel/refuelings" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Бүгдийг харах →
              </Link>
            ) : undefined
          }
        >
          {recent.isLoading ? (
            <LoadingRows />
          ) : !recent.data?.length ? (
            <EmptyState title="Олголт бүртгэгдээгүй" />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {recent.data.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {r.receiverMineNumber ?? r.receiverName}
                      {r.receiverModel && <span className="ml-1.5 font-normal text-gray-500">{r.receiverModel}</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.operationalDate} · {fmtTime(r.refueledAt)} · {r.tankName ?? 'Агуулах'}
                    </p>
                  </div>
                  <Pill tone="brand">{fmtLiters(r.quantity)}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
