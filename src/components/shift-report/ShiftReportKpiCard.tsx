import {
  Activity,
  CalendarClock,
  CircleCheckBig,
  Pickaxe,
  Route,
  Sparkles,
  Trophy,
} from 'lucide-react';
import shiftReportService from '@/services/internal/shift-report';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../ui/StatCard';
import TopExcavatorCard from '../shift-kpi/TopExca';
import MostActiveDumpCard from '../shift-kpi/MostActiveDump';
import MostActiveOperatorsCard from '../shift-kpi/MostActiveOperators';
import TodayInspectionsCard from '../shift-kpi/TodayInspection';
import { shiftReportKeys } from '../../app/(admin)/(others-pages)/shift-report/queryKeys';

interface ShiftReportKpiCardProps {
  filters: Omit<ShiftReportFilters, 'offset' | 'limit'>;
}

const formatNumber = (value?: string | number | null) =>
  Number(value || 0).toLocaleString('en-US', {
    maximumFractionDigits: 1,
  });

export default function ShiftReportKpiCard({
  filters,
}: ShiftReportKpiCardProps) {
  const { data: insightsData, isLoading } = useQuery({
    queryKey: shiftReportKeys.insights(filters),
    queryFn: () => shiftReportService.getShiftsInsights(filters),
    staleTime: 30000,
  });

  const insights = insightsData?.body || {
    totalShifts: '0',
    completedShifts: '0',
    activeShifts: '0',
    totalTrips: '0',
    totalProduction: '0',
    topDriverShiftGroup: null,
    topDriverShiftGroupProduction: '0',
  };

  const totalShifts = formatNumber(insights.totalShifts);
  const completedShifts = formatNumber(insights.completedShifts);
  const activeShifts = formatNumber(insights.activeShifts);
  const totalTrips = formatNumber(insights.totalTrips);
  const totalProduction = formatNumber(insights.totalProduction);
  const topShiftProduction = formatNumber(
    insights.topDriverShiftGroupProduction,
  );

  return (
    <div className="space-y-5">
      {/* Ерөнхий KPI */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Ерөнхий үзүүлэлт
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Сонгосон шүүлтүүрийн нэгдсэн мэдээлэл
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {/* Нийт ээлж */}
          <StatCard
            title="Нийт ээлж"
            value={totalShifts}
            subtitle="Бүртгэгдсэн ээлж"
            additionalInfo={`Идэвхтэй: ${activeShifts}`}
            icon={<CalendarClock className="h-5 w-5" />}
            bgColor="bg-blue-50 dark:bg-blue-950/30"
            iconColor="text-blue-600 dark:text-blue-400"
            isLoading={isLoading}
          />

          {/* Дууссан ээлж */}
          <StatCard
            title="Дууссан ээлж"
            value={completedShifts}
            subtitle="Амжилттай хаагдсан"
            icon={<CircleCheckBig className="h-5 w-5" />}
            bgColor="bg-emerald-50 dark:bg-emerald-950/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
            isLoading={isLoading}
          />

          {/* Рейс */}
          <StatCard
            title="Нийт рейс"
            value={totalTrips}
            subtitle="Бүртгэгдсэн тээвэрлэлт"
            icon={<Route className="h-5 w-5" />}
            bgColor="bg-amber-50 dark:bg-amber-950/30"
            iconColor="text-amber-600 dark:text-amber-400"
            isLoading={isLoading}
          />

          {/* Бүтээмж */}
          <StatCard
            title="Нийт бүтээмж"
            value={`${totalProduction} м³`}
            subtitle="Нүүрс + хөрсний нийт хэмжээ"
            icon={<Pickaxe className="h-5 w-5" />}
            bgColor="bg-orange-50 dark:bg-orange-950/30"
            iconColor="text-orange-600 dark:text-orange-400"
            isLoading={isLoading}
          />

          {/* Шилдэг ээлж */}
          <StatCard
            title="Шилдэг ээлж"
            value={insights.topDriverShiftGroup || '-'}
            subtitle="ABCD ээлжийн гүйцэтгэл"
            additionalInfo={`Бүтээмж: ${topShiftProduction} м³`}
            icon={<Trophy className="h-5 w-5" />}
            bgColor="bg-violet-50 dark:bg-violet-950/30"
            iconColor="text-violet-600 dark:text-violet-400"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Онцлох мэдээлэл */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Онцлох үзүүлэлтүүд
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Техник, оператор болон үзлэгийн идэвх
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <TopExcavatorCard filters={filters} />
          <MostActiveDumpCard filters={filters} />
          <MostActiveOperatorsCard filters={filters} />
          <TodayInspectionsCard filters={filters} />
        </div>
      </section>
    </div>
  );
}