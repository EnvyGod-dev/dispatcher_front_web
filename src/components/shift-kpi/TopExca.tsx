import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import StatCard from '../ui/StatCard';
import shiftPerformanceService from '@/services/internal/shift-performance';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';

interface TopExcavatorCardProps {
  filters: Omit<ShiftReportFilters, 'offset' | 'limit'>;
}

export default function TopExcavatorCard({ filters }: TopExcavatorCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['top-exca', filters],
    queryFn: () => shiftPerformanceService.getTopExcavator(filters),
    staleTime: 30000,
  });

  const excavator = data?.data;

  // if no excavator data, show placeholder
  if (!excavator && !isLoading) {
    return (
      <StatCard
        title="Хамгийн өндөр бүтээлтэй экскаватор"
        value="0"
        subtitle="Өгөгдөл байхгүй"
        bgColor="bg-cyan-50 dark:bg-cyan-950/30"
        iconColor="text-cyan-600 dark:text-cyan-400"
        icon={<TrendingUp className="w-6 h-6" />}
        isLoading={false}
      />
    );
  }

  return (
    <StatCard
      title="Хамгийн өндөр бүтээлтэй экскаватор"
      value={
        excavator
          ? `${Number(excavator.totalProduction).toLocaleString('en-US', {
              maximumFractionDigits: 1,
            })}m3`
          : '0'
      }
      subtitle={
        excavator
          ? `${excavator.vehicleName} • ${excavator.vehicleCode || ''}`
          : 'м3'
      }
      bgColor="bg-cyan-50 dark:bg-cyan-950/30"
      iconColor="text-cyan-600 dark:text-cyan-400"
      icon={<TrendingUp className="w-6 h-6" />}
      breakdown={
        excavator
          ? [
              {
                label: 'Хөрс',
                value: `${Number(excavator.soilProduction).toLocaleString(
                  'en-US',
                  { maximumFractionDigits: 0 },
                )} м3`,
                color: 'text-amber-600 dark:text-amber-400',
              },
              {
                label: 'Нүүрс',
                value: `${Number(excavator.coalProduction).toLocaleString(
                  'en-US',
                  { maximumFractionDigits: 0 },
                )} m3`,
                color: 'text-slate-700 dark:text-slate-300',
              },
            ]
          : undefined
      }
      isLoading={isLoading}
    />
  );
}
