import { useQuery } from '@tanstack/react-query';
import { Truck } from 'lucide-react';
import StatCard from '../ui/StatCard';
import shiftPerformanceService from '@/services/internal/shift-performance';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';

interface MostActiveDumpCardProps {
  filters: Omit<ShiftReportFilters, 'offset' | 'limit'>;
}

export default function MostActiveDumpCard({
  filters,
}: MostActiveDumpCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['most-active-dump', filters],
    queryFn: () => shiftPerformanceService.getMostActiveDump(filters),
    staleTime: 30000,
  });

  const dump = data?.data;

  // if no dump data, show placeholder
  if (!dump && !isLoading) {
    return (
      <StatCard
        title="Хамгийн их Рейстэй дамп"
        value="0"
        subtitle="Өгөгдөл байхгүй"
        bgColor="bg-teal-50 dark:bg-teal-950/30"
        iconColor="text-teal-600 dark:text-teal-400"
        icon={<Truck className="w-6 h-6" />}
        isLoading={false}
      />
    );
  }

  return (
    <StatCard
      title="Хамгийн их Рейстэй дамп"
      value={dump ? `${dump.tripCount}` : '0'}
      subtitle={
        dump ? `${dump.vehicleName} • ${dump.vehicleCode || ''}` : 'Рейс'
      }
      bgColor="bg-teal-50 dark:bg-teal-950/30"
      iconColor="text-teal-600 dark:text-teal-400"
      icon={<Truck className="w-6 h-6" />}
      breakdown={
        dump
          ? [
            {
              label: 'Нийт Рейс',
              value: `${dump.tripCount}`,
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Уулын цул',
              value: `${Number(dump.totalProduction).toLocaleString('en-US', {
                maximumFractionDigits: 1,
              })} m3`,
              color: 'text-blue-600 dark:text-blue-400',
            },
          ]
          : undefined
      }
      isLoading={isLoading}
    />
  );
}
