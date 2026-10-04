import { ClipboardCheck } from 'lucide-react';
import StatCard from '../ui/StatCard';
import shiftPerformanceService from '@/services/internal/shift-performance';
import 'dayjs/locale/mn';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/time-formatter';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';

interface TodayInspectionsCardProps {
  filters: Omit<ShiftReportFilters, 'offset' | 'limit'>;
}

const getInspectionLabel = ({
  startDate,
  endDate,
}: Pick<ShiftReportFilters, 'startDate' | 'endDate'>) => {
  if (startDate && endDate) {
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  }

  if (startDate) {
    return startDate;
  }

  if (endDate) {
    return endDate;
  }

  return formatDate(new Date());
};

export default function TodayInspectionsCard({
  filters,
}: TodayInspectionsCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['today-inspections', filters],
    queryFn: () => shiftPerformanceService.getTodayInspections(filters),
    staleTime: 30000,
    refetchInterval: 5 * 60 * 1000,
  });

  const inspections = data?.data;

  const inspectionLabel = getInspectionLabel(filters);

  if (!inspections && !isLoading) {
    return (
      <StatCard
        title="Техникийн үзлэг"
        value="0"
        subtitle={inspectionLabel}
        bgColor="bg-purple-50 dark:bg-purple-950/30"
        iconColor="text-purple-600 dark:text-purple-400"
        icon={<ClipboardCheck className="w-6 h-6" />}
        isLoading={false}
      />
    );
  }

  const totalVehicles = inspections?.totalVehicles || 0;

  return (
    <StatCard
      title={`Техникийн үзлэг /${inspectionLabel}/`}
      value={`${totalVehicles} техник`}
      bgColor="bg-purple-50 dark:bg-purple-950/30"
      iconColor="text-purple-600 dark:text-purple-400"
      icon={<ClipboardCheck className="w-6 h-6" />}
      breakdown={
        inspections && totalVehicles > 0
          ? [
              {
                label: 'Хэвийн',
                value: `${inspections.normalVehicleCount} техник`,
                color: 'text-green-600 dark:text-green-400',
              },
              {
                label: 'Анхаарах',
                value: `${inspections.needsInspectionVehicleCount} техник`,
                color: 'text-yellow-600 dark:text-yellow-400',
              },
              {
                label: 'Аюултай',
                value: `${inspections.issueVehicleCount} техник`,
                color: 'text-red-600 dark:text-red-400',
              },
            ]
          : undefined
      }
      isLoading={isLoading}
    />
  );
}
