'use client';

import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/time-formatter';
import type { ApexOptions } from 'apexcharts';
import monthlyAggregationService, {
  DailyBreakdown,
  MonthlyAggregationFilters,
} from '@/services/internal/shift-report/monthly-aggregation';
import markshaderReportService from '@/services/internal/markshader-report';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Eye, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import PageBreadcrumb from '../common/PageBreadCrumb';
import MonthlyStatsCard from './MonthlyStatsCard';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export default function MonthlyAggregation() {
  const [filters, setFilters] = useState<MonthlyAggregationFilters>({
    year: currentYear,
    month: currentMonth,
  });

  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [dialogYear, setDialogYear] = useState(filters.year);
  const [dialogMonth, setDialogMonth] = useState(filters.month);

  const queryClient = useQueryClient();
  const [commentModal, setCommentModal] = useState<{
    date: string;
    shiftType: 'day' | 'night';
    label: string;
    comment: string | null;
  } | null>(null);
  const [commentValue, setCommentValue] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [viewComment, setViewComment] = useState<{
    label: string;
    comment: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openCommentModal = (record: {
    date: string;
    shiftType: 'day' | 'night';
    comment: string | null;
    day: string;
    shift: string;
  }) => {
    setCommentModal({
      date: record.date,
      shiftType: record.shiftType,
      label: `${record.day} · ${record.shift}`,
      comment: record.comment,
    });
    setCommentValue(record.comment ?? '');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const saveComment = async () => {
    if (!commentModal) return;
    setIsSavingComment(true);
    try {
      await monthlyAggregationService.upsertComment({
        date: commentModal.date,
        shiftType: commentModal.shiftType,
        comment: commentValue,
      });
      await queryClient.invalidateQueries({ queryKey: ['monthly-aggregation', filters] });
      setCommentModal(null);
    } finally {
      setIsSavingComment(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-aggregation', filters],
    queryFn: () => monthlyAggregationService.getMonthlyAggregation(filters),
    staleTime: 30000,
  });

  // Маркшейдерийн мэдээ — сарын эхнээс сүүл хүртэл
  const monthStr = String(filters.month).padStart(2, '0');
  const startDate = `${filters.year}-${monthStr}-01`;
  const lastDay = new Date(filters.year, filters.month, 0).getDate();
  const endDate = `${filters.year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const { data: markshaderData } = useQuery({
    queryKey: ['markshader-reports-monthly', filters.year, filters.month],
    queryFn: () =>
      markshaderReportService.getReports({
        offset: 0,
        limit: 200,
        startDate,
        endDate,
      }),
    staleTime: 30000,
  });

  // reportDate → { markProduction, markDisDiscrepancy } map
  const markshaderMap = useMemo(() => {
    const map = new Map<string, { markProduction: number; markDisDiscrepancy: number | null }>();
    for (const r of markshaderData?.data ?? []) {
      const existing = map.get(r.reportDate);
      const mark = r.markProduction ? parseFloat(r.markProduction) : 0;
      const disc = r.markDisDiscrepancy ? parseFloat(r.markDisDiscrepancy) : null;
      if (existing) {
        map.set(r.reportDate, {
          markProduction: existing.markProduction + mark,
          markDisDiscrepancy:
            existing.markDisDiscrepancy !== null && disc !== null
              ? existing.markDisDiscrepancy + disc
              : existing.markDisDiscrepancy ?? disc,
        });
      } else {
        map.set(r.reportDate, { markProduction: mark, markDisDiscrepancy: disc });
      }
    }
    return map;
  }, [markshaderData]);

  type RowData = {
    id: string;
    dayIndex: number;
    day: string;
    shift: string;
    shiftType: 'day' | 'night';
    date: string;
    trips: number;
    production: number;
    totalDayProduction: number;
    plannedAmount: number;
    performanceRatio: number;
    coalTrips: number;
    coalProduction: number;
    totalDayCoalProduction: number;
    isFirstShift: boolean;
    totalPlannedAmount: number;
    comment: string | null;
  };

  const groupedData: RowData[][] =
    data?.body?.dailyBreakdown?.map((dayData: DailyBreakdown, index: number) => {
      const dayStr = String(Number(dayData.day)).padStart(2, '0');
      const fullDate = `${filters.year}-${monthStr}-${dayStr}`;
      const totalPlanned =
        Number(dayData.dayShift.plannedAmount) + Number(dayData.nightShift.plannedAmount);
      return [
        {
          id: `${dayData.day}-day`,
          dayIndex: index + 1,
          day: dayData.day,
          shift: 'Өдөр',
          shiftType: 'day',
          date: fullDate,
          trips: dayData.dayShift.trips,
          production: dayData.dayShift.production,
          totalDayProduction: dayData.totalDayProduction,
          plannedAmount: dayData.dayShift.plannedAmount,
          performanceRatio: dayData.dayShift.performanceRatio,
          coalTrips: dayData.dayShift.coalTrips,
          coalProduction: dayData.dayShift.coalProduction,
          totalDayCoalProduction: dayData.totalCoalProduction,
          isFirstShift: true,
          totalPlannedAmount: totalPlanned,
          comment: dayData.dayShift.comment,
        },
        {
          id: `${dayData.day}-night`,
          dayIndex: index + 1,
          day: dayData.day,
          shift: 'Шөнө',
          shiftType: 'night',
          date: fullDate,
          trips: dayData.nightShift.trips,
          production: dayData.nightShift.production,
          totalDayProduction: dayData.totalDayProduction,
          plannedAmount: dayData.nightShift.plannedAmount,
          performanceRatio: dayData.nightShift.performanceRatio,
          coalTrips: dayData.nightShift.coalTrips,
          coalProduction: dayData.nightShift.coalProduction,
          totalDayCoalProduction: dayData.totalCoalProduction,
          isFirstShift: false,
          totalPlannedAmount: totalPlanned,
          comment: dayData.nightShift.comment,
        },
      ];
    }) || [];

  const flatRows = groupedData.flat();

  const shiftSeries = data?.body?.shiftSeries || [];

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        id: 'monthly-shift-chart',
        type: 'line',
        toolbar: { show: false },
        fontFamily: 'Outfit, sans-serif',
        animations: { enabled: false },
        redrawOnParentResize: false,
        redrawOnWindowResize: false,
      },
      stroke: { curve: 'smooth', width: [2.5, 2.5, 2, 2], dashArray: [6, 0, 0, 0] },
      colors: ['#94A3B8', '#465FFF', '#F59E0B', '#10B981'],
      markers: { size: 3, strokeWidth: 0, hover: { size: 5 } },
      fill: {
        type: ['solid', 'gradient', 'solid', 'solid'],
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          opacityFrom: 0.25,
          opacityTo: 0.02,
          stops: [0, 100],
        },
      },
      xaxis: {
        categories: shiftSeries.map((item) => item.label),
        labels: { rotate: -45, style: { fontSize: '10px', colors: '#94A3B8' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (value) => value.toLocaleString(),
          style: { colors: '#94A3B8', fontSize: '11px' },
        },
        title: { text: 'м3', style: { color: '#94A3B8', fontSize: '11px' } },
      },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', markers: { size: 8 } },
      grid: { borderColor: '#F1F5F9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      tooltip: {
        shared: true,
        intersect: false,
        fixed: { enabled: true, position: 'topLeft', offsetX: 60, offsetY: 10 },
        y: { formatter: (value) => `${value.toLocaleString()} м3` },
      },
    }),
    [shiftSeries]
  );

  const chartSeries = useMemo(
    () => [
      { name: 'Төлөвлөгөө', data: shiftSeries.map((i) => i.plannedAmount), type: 'line' },
      { name: 'Гүйцэтгэл', data: shiftSeries.map((i) => i.production), type: 'area' },
      { name: 'Нүүрс', data: shiftSeries.map((i) => i.coalProduction), type: 'line' },
      { name: 'Хөрс', data: shiftSeries.map((i) => i.production - i.coalProduction), type: 'line' },
    ],
    [shiftSeries]
  );

  const totals = data?.body?.monthlyTotals;
  const breakdown = data?.body?.dailyBreakdown ?? [];
  const totalPlannedAll = flatRows.reduce((s, r) => s + Number(r.plannedAmount), 0);
  const avgPerf =
    flatRows.length > 0
      ? flatRows.reduce((s, r) => s + Number(r.performanceRatio), 0) / flatRows.length
      : 0;

  // Маркшейдерийн нийлбэр
  const totalMarkProduction = Array.from(markshaderMap.values()).reduce(
    (s, v) => s + v.markProduction,
    0
  );
  const totalMarkDisDiscrepancy = Array.from(markshaderMap.values()).reduce(
    (s, v) => s + (v.markDisDiscrepancy ?? 0),
    0
  );

  const thClass =
    'px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-black dark:text-gray-400 whitespace-nowrap border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60';

  const tdClass =
    'px-1.5 py-1 text-[11px] text-center text-gray-700 dark:text-gray-300 whitespace-nowrap border-b border-gray-100 dark:border-gray-800';

  const tfClass =
    'px-2 py-2 text-xs font-bold text-center text-gray-800 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-800/60 border-t-2 border-gray-200 dark:border-gray-700';

  // colSpan тоо: 15 (№ Өдөр Ээлж Рейс Бүтээл ХоногНийт Төлөвлөгөө Гүйцэтгэл НүүрсРейс НүүрсМ³ НүүрсХоног МаркБүтээл МаркДисЗөрүү Тэмдэглэл засах)
  const TOTAL_COLS = 15;

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        pageTitle={`${filters.year} оны ${filters.month} сарын нэгтгэл`}
        description={`Нийт ${data?.body.dailyBreakdown.length ?? '0'} өдрийн мэдээлэл`}
        actions={{
          label: 'Огноо солих',
          onClick: () => setIsFilterDialogOpen(true),
          variant: 'primary',
          icon: <Calendar className="h-4 w-4" />,
        }}
      />

      {data?.body && (
        <MonthlyStatsCard
          monthlyTotals={data.body.monthlyTotals}
          monthlyPlan={data.body.monthlyPlan}
          summary={data.body.summary}
        />
      )}

      {/* Chart */}
      <Card className="bg-background">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Ээлж тус бүрийн төлөвлөгөө ба гүйцэтгэл
            </CardTitle>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {filters.year}.{String(filters.month).padStart(2, '0')} — ээлж тус бүр
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <div style={{ minWidth: Math.max(shiftSeries.length * 28, 600) }}>
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={300}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Өдөр тус бүрийн дэлгэрэнгүй
          </span>
          {breakdown.length > 0 && (
            <span className="text-xs text-gray-400">
              {breakdown.length} өдөр · {flatRows.length} ээлж
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={thClass}>№</th>
                <th className={thClass}>Өдөр</th>
                <th className={thClass}>Ээлж</th>
                <th className={thClass}>Рейс</th>
                <th className={thClass}>Бүтээл м³</th>
                <th className={thClass}>Хоногийн нийт м³</th>
                <th className={thClass}>Төлөвлөгөө м³</th>
                <th className={thClass}>Гүйцэтгэл %</th>
                <th className={thClass}>Нүүрс рейс</th>
                <th className={thClass}>Нүүрс м³</th>
                <th className={thClass}>Нүүрс хоногоор</th>
                <th className={`${thClass} border-l-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400`}>
                  Марк бүтээл м³
                </th>
                <th className={`${thClass} bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400`}>
                  Марк-Дис зөрүү
                </th>
                <th className={`${thClass} text-left`}>Тэмдэглэл</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: TOTAL_COLS }).map((_, j) => (
                      <td key={j} className={tdClass}>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded mx-auto w-12" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : flatRows.length === 0 ? (
                <tr>
                  <td colSpan={TOTAL_COLS} className="px-4 py-10 text-center text-xs text-gray-400">
                    Өгөгдөл байхгүй
                  </td>
                </tr>
              ) : (
                groupedData.map((pair) =>
                  pair.map((row, pairIdx) => {
                    const isDay = row.shiftType === 'day';
                    const pct = row.performanceRatio * 100;
                    const met = pct >= 100;
                    const totalMet =
                      Number(row.totalDayProduction) >= Number(row.totalPlannedAmount);

                    const markEntry = markshaderMap.get(row.date);
                    const markProd = markEntry?.markProduction ?? null;
                    const markDisc = markEntry?.markDisDiscrepancy ?? null;

                    return (
                      <tr
                        key={row.id}
                        className={`group transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${row.dayIndex % 2 === 0 ? 'bg-gray-50/40 dark:bg-gray-800/10' : ''
                          }`}
                      >
                        {/* № — rowspan=2 */}
                        {pairIdx === 0 && (
                          <td
                            rowSpan={2}
                            className={`${tdClass} text-gray-400 dark:text-gray-500 font-medium border-r border-gray-100 dark:border-gray-800`}
                          >
                            {row.dayIndex}
                          </td>
                        )}

                        {/* Өдөр — rowspan=2 */}
                        {pairIdx === 0 && (
                          <td
                            rowSpan={2}
                            className={`${tdClass} font-medium text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-800`}
                          >
                            {formatDate(
                              new Date(`${filters.year}-${filters.month}-${row.day}`)
                            )}
                          </td>
                        )}

                        {/* Ээлж */}
                        <td className={tdClass}>
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isDay
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              }`}
                          >
                            {isDay ? '☀' : '🌙'} {row.shift}
                          </span>
                        </td>

                        {/* Рейс */}
                        <td className={tdClass}>
                          <span className="tabular-nums">{row.trips.toLocaleString()}</span>
                        </td>

                        {/* Бүтээл */}
                        <td className={`${tdClass} font-medium`}>
                          <span className="tabular-nums">{row.production.toLocaleString()}</span>
                        </td>

                        {/* Хоногийн нийт — rowspan=2 */}
                        {pairIdx === 0 && (
                          <td
                            rowSpan={2}
                            className={`${tdClass} font-semibold border-x border-gray-100 dark:border-gray-800 ${totalMet
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500 dark:text-red-400'
                              }`}
                          >
                            <span className="tabular-nums">
                              {Number(row.totalDayProduction).toLocaleString()}
                            </span>
                          </td>
                        )}

                        {/* Төлөвлөгөө */}
                        <td className={`${tdClass} text-gray-500 dark:text-gray-400`}>
                          <span className="tabular-nums">
                            {Number(row.plannedAmount).toLocaleString()}
                          </span>
                        </td>

                        {/* Гүйцэтгэл */}
                        <td className={tdClass}>
                          <span
                            className={`inline-block tabular-nums text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${met
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                              }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </td>

                        {/* Нүүрс рейс */}
                        <td className={`${tdClass} text-gray-500 dark:text-gray-400`}>
                          <span className="tabular-nums">{row.coalTrips.toLocaleString()}</span>
                        </td>

                        {/* Нүүрс м³ */}
                        <td className={`${tdClass} font-medium`}>
                          <span className="tabular-nums">{row.coalProduction.toLocaleString()}</span>
                        </td>

                        {/* Нүүрс хоногоор — rowspan=2 */}
                        {pairIdx === 0 && (
                          <td
                            rowSpan={2}
                            className={`${tdClass} font-semibold border-x border-gray-100 dark:border-gray-800`}
                          >
                            <span className="tabular-nums">
                              {row.totalDayCoalProduction.toLocaleString()}
                            </span>
                          </td>
                        )}

                        {/* Марк бүтээл — rowspan=2, зөвхөн эхний ээлжинд */}
                        {pairIdx === 0 && (
                          <td
                            rowSpan={2}
                            className={`${tdClass} font-semibold border-l-2 border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20`}
                          >
                            {markProd !== null ? (
                              <span className="tabular-nums text-blue-700 dark:text-blue-300">
                                {markProd.toLocaleString('mn-MN', { maximumFractionDigits: 1 })}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        )}

                        {/* Марк-Дис зөрүү — rowspan=2 */}
                        {pairIdx === 0 && (
                          <td
                            rowSpan={2}
                            className={`${tdClass} font-semibold bg-blue-50/40 dark:bg-blue-950/20`}
                          >
                            {markDisc !== null ? (
                              <span
                                className={`tabular-nums font-bold ${markDisc >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-500 dark:text-red-400'
                                  }`}
                              >
                                {markDisc > 0 ? '+' : ''}
                                {markDisc.toLocaleString('mn-MN', { maximumFractionDigits: 1 })}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        )}

                        {/* Тэмдэглэл — нүдний icon дээр дарахад popup-аар харуулна */}
                        <td className={`${tdClass} w-[52px] min-w-[52px]`}>
                          {row.comment ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewComment({
                                  label: `${row.day} · ${row.shift}`,
                                  comment: row.comment!,
                                })
                              }
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                              aria-label="Тэмдэглэл харах"
                              title="Тэмдэглэл харах"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>

                        {/* Тэмдэглэл засах */}
                        <td className={`${tdClass} w-[40px] min-w-[40px]`}>
                          <button
                            onClick={() => openCommentModal(row)}
                            className="p-1 rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            title="Тэмдэглэл засах"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>

            {/* Footer */}
            {totals && breakdown.length > 0 && (
              <tfoot>
                <tr>
                  <td className={`${tfClass} text-left`} colSpan={2}>
                    Нийт
                  </td>
                  <td className={tfClass}>{breakdown.length} өдөр · {flatRows.length} ээлж</td>
                  <td className={tfClass}>
                    {totals.totalTrips.toLocaleString()}
                  </td>
                  <td className={tfClass}>
                    {totals.totalProduction.toLocaleString()}
                  </td>
                  <td className={tfClass}>
                    {totals.totalProduction.toLocaleString()}
                  </td>
                  <td className={tfClass}>
                    {totalPlannedAll.toLocaleString()}
                  </td>
                  <td className={tfClass}>
                    <span
                      className={`inline-block tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full ${avgPerf >= 1
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                        }`}
                    >
                      {(avgPerf * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className={tfClass}>
                    {totals.totalCoalTrips.toLocaleString()}
                  </td>
                  <td className={tfClass}>
                    {totals.totalCoalProduction.toLocaleString()}
                  </td>
                  <td className={tfClass}>
                    {totals.totalCoalProduction.toLocaleString()}
                  </td>
                  {/* Марк нийлбэр */}
                  <td className={`${tfClass} border-l-2 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300`}>
                    {totalMarkProduction > 0
                      ? totalMarkProduction.toLocaleString('mn-MN', { maximumFractionDigits: 1 })
                      : '—'}
                  </td>
                  <td className={`${tfClass} bg-blue-50/60 dark:bg-blue-950/30`}>
                    {totalMarkDisDiscrepancy !== 0 ? (
                      <span
                        className={`font-bold ${totalMarkDisDiscrepancy >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                          }`}
                      >
                        {totalMarkDisDiscrepancy > 0 ? '+' : ''}
                        {totalMarkDisDiscrepancy.toLocaleString('mn-MN', { maximumFractionDigits: 1 })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={tfClass} colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Comment харах popup */}
      <Dialog
        open={!!viewComment}
        onOpenChange={(open) => {
          if (!open) setViewComment(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Тэмдэглэл — {viewComment?.label}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {viewComment?.comment}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewComment(null)}>
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment modal */}
      <Dialog open={!!commentModal} onOpenChange={(open) => { if (!open) setCommentModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Тэмдэглэл — {commentModal?.label}</DialogTitle>
          </DialogHeader>
          <textarea
            ref={textareaRef}
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            rows={5}
            placeholder="Тэмдэглэл бичнэ үү..."
            className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSavingComment}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentModal(null)} disabled={isSavingComment}>
              Цуцлах
            </Button>
            <Button onClick={saveComment} disabled={isSavingComment}>
              {isSavingComment ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter modal */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сар / Жил сонгох</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filter-year">Жил</Label>
              <Input
                id="filter-year"
                type="number"
                value={dialogYear}
                onChange={(e) => setDialogYear(parseInt(e.target.value) || currentYear)}
                placeholder="Жил"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter-month">Сар</Label>
              <Input
                id="filter-month"
                type="number"
                min="1"
                max="12"
                value={dialogMonth}
                onChange={(e) => setDialogMonth(parseInt(e.target.value) || currentMonth)}
                placeholder="Сар (1-12)"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogYear(currentYear);
                setDialogMonth(currentMonth);
                setFilters({ year: currentYear, month: currentMonth });
                setIsFilterDialogOpen(false);
              }}
              disabled={isLoading}
            >
              Цэвэрлэх
            </Button>
            <Button
              onClick={() => {
                setFilters({ year: dialogYear, month: dialogMonth });
                setIsFilterDialogOpen(false);
              }}
              disabled={isLoading}
            >
              Хайх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}