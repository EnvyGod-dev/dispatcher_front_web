'use client';
import dashboardService from '@/services/internal/dashboard';
import {
  DashboardFilters,
  DashboardMetrics,
} from '@/services/internal/dashboard/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DemographicCard } from '../ecommerce/DemographicCard';
import { DriverMetrics } from '../ecommerce/ProductionOfTheMonth';
import { MonthlyTransportChart } from '../ecommerce/MonthlySalesChart';
import { MonthlyTarget } from '../ecommerce/MonthlyTarget';
import { RecentShifts } from '../ecommerce/RecentOrders';
import { StatisticsChart } from '../ecommerce/StatisticsChart';
import { useAuth } from '../AuthProvider';
import { UserRole } from '@/services/roles';
import { useRouter } from 'next/navigation';

export interface FleetMetricsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export default function FleetDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/signin');
    } else if (user.role === 'superadmin') {
      router.push('/organizations');
    }
  }, [user, router]);

  const isDriver =
    user?.role === UserRole.DRIVER ||
    user?.role === UserRole.ASSISTANT_OPERATOR;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [filters] = useState<DashboardFilters>({
    period: 'monthly',
    year: currentYear,
    month: currentMonth,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: () => dashboardService.getDashboardMetrics(filters),
    staleTime: 60000,
    refetchInterval: 300000,
    enabled: !isDriver && !!user,
  });

  const dashboardData = data?.body;

  if (!user || user.role === 'superadmin') {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Мэдээлэл ачаалахад алдаа гарлаа
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Дашбоардын мэдээллийг ачаалж чадсангүй. Дахин оролдоно уу.
          </p>
        </div>
      </div>
    );
  }

  if (isDriver) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Тавтай морил!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Ээлжийн ажлаа эхлүүлэхийн тулд апп-аа ашиглана уу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <DriverMetrics data={dashboardData} isLoading={isLoading} />
        <MonthlyTransportChart data={dashboardData} isLoading={isLoading} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget data={dashboardData} isLoading={isLoading} />
      </div>

      <div className="col-span-12">
        <StatisticsChart data={dashboardData} isLoading={isLoading} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard data={dashboardData} isLoading={isLoading} />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentShifts data={dashboardData} isLoading={isLoading} />
      </div>
    </div>
  );
}