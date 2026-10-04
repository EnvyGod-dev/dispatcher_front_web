import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../ui/StatCard';
import shiftPerformanceService from '@/services/internal/shift-performance';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';

interface MostActiveOperatorsCardProps {
  filters: Omit<ShiftReportFilters, 'offset' | 'limit'>;
}

export default function MostActiveOperatorsCard({
  filters,
}: MostActiveOperatorsCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['most-active-operators', filters],
    queryFn: () => shiftPerformanceService.getMostActiveOperators(filters),
    staleTime: 30000,
  });

  const operators = data?.data || [];
  const topOperator = operators[0];

  const formatProduction = (value: number) =>
    Number(value).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    });

  if (!topOperator && !isLoading) {
    return (
      <StatCard
        title="Хамгийн их Рейстэй операторууд"
        value="0"
        subtitle="Өгөгдөл байхгүй"
        bgColor="bg-violet-50 dark:bg-violet-950/30"
        iconColor="text-violet-600 dark:text-violet-400"
        icon={<Users className="w-6 h-6" />}
        isLoading={false}
      />
    );
  }

  return (
    <StatCard
      title="Хамгийн их Рейстэй операторууд"
      value={topOperator ? `${topOperator.tripCount} Рейс` : '0 Рейс'}
      subtitle={
        topOperator
          ? `${topOperator.firstName} ${topOperator.lastName}`
          : 'Рейс'
      }
      bgColor="bg-violet-50 dark:bg-violet-950/30"
      iconColor="text-violet-600 dark:text-violet-400"
      icon={<Users className="w-6 h-6" />}
      breakdown={
        operators.length > 0
          ? operators.map((operator, index) => ({
            label: `${index + 1}. ${operator.firstName} ${operator.lastName}`,
            value: `${operator.tripCount} Рейс • ${formatProduction(operator.totalProduction)} m3`,
            color:
              index === 0
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-slate-600 dark:text-slate-300',
          }))
          : undefined
      }
      isLoading={isLoading}
    />
  );
}
