'use client';
import { DashboardMetrics } from '@/services/internal/dashboard/types';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';

interface FleetMetricsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

export const MonthlyTransportChart: React.FC<FleetMetricsProps> = ({
  data,
  isLoading,
}) => {
  const monthly = data?.yearlyStatistics;

  const options: ApexOptions = {
    colors: ['#3b82f6', '#f59e0b', '#10b981'],
    chart: {
      fontFamily: 'Gip, sans-serif',
      type: 'bar',
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
      style: {
        fontFamily: 'Gip, sans-serif',
      },
    },
    stroke: {
      show: true,
      width: 4,
      colors: ['transparent'],
    },
    xaxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontFamily: 'Gip, sans-serif',
        },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Gip, sans-serif',
    },
    yaxis: {
      title: {
        text: 'м3',
        style: {
          fontFamily: 'Gip, sans-serif',
        },
      },
      labels: {
        style: {
          fontFamily: 'Gip, sans-serif',
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val.toFixed(1)} м3`,
      },
      style: {
        fontFamily: 'Gip, sans-serif',
      },
    },
  };

  const series = [
    {
      name: 'Нүүрс',
      data: monthly?.map((m) => m.actual.coal) || Array(12).fill(0),
    },
    {
      name: 'Хөрс',
      data: monthly?.map((m) => m.actual.soil) || Array(12).fill(0),
    },
  ];

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
        <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Гүйцэтгэл
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={180}
          />
        </div>
      </div>
    </div>
  );
};
