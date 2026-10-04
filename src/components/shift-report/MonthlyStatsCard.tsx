import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MonthlyPlan } from '@/services/internal/monthly-plan/types';
import {
  MonthlyAggregationSummary,
  MonthlyAggregationResponse,
} from '@/services/internal/shift-report/monthly-aggregation';
import {
  BadgePercent,
  BarChart3,
  CalendarFold,
  Info,
  Pickaxe,
  Target,
  TrendingUp,
} from 'lucide-react';

type MonthlyStatsProps = {
  monthlyTotals: MonthlyAggregationResponse['monthlyTotals'];
  monthlyPlan?: MonthlyPlan;
  summary: MonthlyAggregationSummary;
};

const fmt = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Single metric row: label left, value right, optional progress bar below */
function MetricRow({
  label,
  value,
  ratio,
  sub,
  tooltip,
}: {
  label: string;
  value: string;
  ratio: number; // 0–1, drives progress bar + color
  sub?: string;
  tooltip?: React.ReactNode;
}) {
  const met = ratio >= 1;
  const barWidth = `${Math.min(ratio * 100, 100)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help text-gray-400" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[260px] whitespace-pre-line bg-gray-900 text-gray-100 text-xs leading-relaxed px-3 py-2"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        <span
          className={`text-base font-bold tabular-nums ${met
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
            }`}
        >
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${met ? 'bg-green-500' : 'bg-red-400'}`}
          style={{ width: barWidth }}
        />
      </div>
      {sub && (
        <p className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
          {sub}
        </p>
      )}
    </div>
  );
}

/** Label-value row used in production/trips table */
function DataRow({
  label,
  value,
  unit,
  dot,
  bold,
}: {
  label: string;
  value: number;
  unit?: string;
  dot?: string; // tailwind bg class
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />}
        {label}
      </span>
      <span
        className={`tabular-nums text-sm ${bold
            ? 'font-bold text-gray-800 dark:text-gray-200'
            : 'font-medium text-gray-700 dark:text-gray-300'
          }`}
      >
        {fmt(value)}
        {unit && (
          <span className="ml-0.5 font-normal text-gray-400">{unit}</span>
        )}
      </span>
    </div>
  );
}

export default function MonthlyStatsCard({
  monthlyTotals,
  monthlyPlan,
  summary,
}: MonthlyStatsProps) {
  const monthlyPlanCoal = Number(monthlyPlan?.coalAmount) || 0;
  const monthlyPlanSoil = Number(monthlyPlan?.soilAmount) || 0;
  const monthlyPlanTotal =
    monthlyPlanCoal + monthlyPlanSoil || summary.monthlyPlanTotalProduction;

  const cumulativePlanToDate =
    summary.monthlyShiftPlanCount > 0
      ? (monthlyPlanTotal * summary.elapsedShiftPlanCount) /
      summary.monthlyShiftPlanCount
      : 0;

  const monthlyRatio =
    monthlyPlanTotal > 0 ? monthlyTotals.totalProduction / monthlyPlanTotal : 0;
  const cumulativeRatio =
    cumulativePlanToDate > 0
      ? monthlyTotals.totalProduction / cumulativePlanToDate
      : 0;

  const totalDays = summary.daysMetPlan + summary.daysMissedPlan;
  const metPct = totalDays > 0 ? summary.daysMetPlan / totalDays : 0;
  const coalPct = monthlyPlanTotal > 0 ? monthlyPlanCoal / monthlyPlanTotal : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* ── Card 1: Plan fulfillment ── */}
      <Card className="bg-background border-border py-0">
        <CardContent className="px-4 py-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-4">
            <BadgePercent className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
              Биелэлт
            </span>
          </div>
          <div className="space-y-3">
            <MetricRow
              label="Сарын биелэлт"
              value={fmtPct(monthlyRatio)}
              ratio={monthlyRatio}
              sub={`${fmt(monthlyTotals.totalProduction)} / ${fmt(monthlyPlanTotal)} м3`}
              tooltip={
                <>
                  <span className="font-semibold">Сарын биелэлт</span>
                  {'\n'}
                  Томъёо: Гүйцэтгэл ÷ Сарын төлөвлөгөө{'\n\n'}
                  {fmt(monthlyTotals.totalProduction)} ÷ {fmt(monthlyPlanTotal)}{' '}
                  = {fmtPct(monthlyRatio)}
                  {'\n\n'}
                  Тухайн өдрийг хүртэлх нийт гүйцэтгэлийг бүтэн сарын
                  төлөвлөгөөтэй харьцуулав.
                </>
              }
            />
            <MetricRow
              label="Явцын биелэлт"
              value={fmtPct(cumulativeRatio)}
              ratio={cumulativeRatio}
              sub={`${fmt(monthlyTotals.totalProduction)} / ${Math.round(cumulativePlanToDate).toLocaleString()} м3`}
              tooltip={
                <>
                  <span className="font-semibold">Явцын биелэлт</span>
                  {'\n'}
                  Томъёо: Гүйцэтгэл ÷ Өдрийн төлөвлөгөө{'\n\n'}
                  Өссөн = {fmt(monthlyPlanTotal)} × (
                  {summary.elapsedShiftPlanCount} ÷{' '}
                  {summary.monthlyShiftPlanCount}) ={' '}
                  {Math.round(cumulativePlanToDate).toLocaleString()}
                  {'\n\n'}
                  {fmt(monthlyTotals.totalProduction)} ÷{' '}
                  {Math.round(cumulativePlanToDate).toLocaleString()} ={' '}
                  {fmtPct(cumulativeRatio)}
                  {'\n\n'}
                  Өнөөдрийг хүртэл хийх ёстой байсан хэмжээтэй харьцуулав.
                </>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: Daily fulfillment ── */}
      <Card className="bg-background border-border py-0">
        <CardContent className="px-4 py-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-4">
            <BarChart3 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
              Өдөр тутмын биелэлт
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                Төлөвлөгөө биелсэн
              </span>
              <span className="text-sm font-bold tabular-nums text-green-600 dark:text-green-400">
                {summary.daysMetPlan}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  өдөр
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                Төлөвлөгөө биелээгүй
              </span>
              <span className="text-sm font-bold tabular-nums text-red-500 dark:text-red-400">
                {summary.daysMissedPlan}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  өдөр
                </span>
              </span>
            </div>
          </div>
          {totalDays > 0 && (
            <div className="mt-2.5">
              <div className="flex h-2 rounded-full overflow-hidden bg-red-100 dark:bg-red-950/40">
                <div
                  className="bg-green-500"
                  style={{ width: `${metPct * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                <span>{(metPct * 100).toFixed(0)}% биелсэн</span>
                <span>нийт {totalDays} өдөр</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Card 3: Production & trips ── */}
      <Card className="bg-background border-border py-0">
        <CardContent className="px-4 py-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-4">
            <Pickaxe className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
              Бүтээл ба Рейс
            </span>
          </div>
          {/* Production section */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-0.5">
            Бүтээл
          </p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <DataRow
              label="Нийт"
              value={monthlyTotals.totalProduction}
              unit="м3"
              dot="bg-blue-500"
              bold
            />
            <DataRow
              label="Нүүрс"
              value={monthlyTotals.totalCoalProduction}
              unit="м3"
              dot="bg-gray-700 dark:bg-gray-400"
            />
            <DataRow
              label="Хөрс"
              value={monthlyTotals.totalSoilProduction}
              unit="м3"
              dot="bg-amber-400"
            />
          </div>
          {/* Trips section */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mt-2 mb-0.5">
            Рейс
          </p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <DataRow
              label="Нийт"
              value={monthlyTotals.totalTrips}
              dot="bg-blue-500"
              bold
            />
            <DataRow
              label="Нүүрс"
              value={monthlyTotals.totalCoalTrips}
              dot="bg-gray-700 dark:bg-gray-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 4: Monthly plan ── */}
      <Card className="bg-background border-border py-0">
        <CardContent className="px-4 py-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-4">
            {/* <Target /> */}
            <CalendarFold className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
              Сарын төлөвлөгөө
            </span>
          </div>
          <div className="mb-2.5">
            <div className="text-2xl font-bold tabular-nums text-gray-800 dark:text-gray-200">
              {fmt(monthlyPlanTotal)}
              <span className="ml-1 text-sm font-normal text-gray-400">м3</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {summary.monthlyShiftPlanCount} ээлж · ээлжид{' '}
              {summary.monthlyShiftPlanCount > 0
                ? fmt(
                  Math.round(monthlyPlanTotal / summary.monthlyShiftPlanCount)
                )
                : 0}{' '}
              м3
            </p>
          </div>
          {monthlyPlanTotal > 0 && (
            <>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gray-700 dark:bg-gray-400"
                  style={{ width: `${coalPct * 100}%` }}
                />
                <div className="flex-1 bg-amber-400" />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-700 dark:bg-gray-400" />
                    Нүүрс
                  </span>
                  <span className="tabular-nums font-medium text-gray-600 dark:text-gray-400">
                    {fmt(monthlyPlanCoal)} м3
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Хөрс
                  </span>
                  <span className="tabular-nums font-medium text-gray-600 dark:text-gray-400">
                    {fmt(monthlyPlanSoil)} м3
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
