'use client';
import React, { useState } from 'react';
import { ApexOptions } from 'apexcharts';
import ChartTab from '../common/ChartTab';
import dynamic from 'next/dynamic';
import { FleetMetricsProps } from '../dashboard/FleetDashboard';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

export const StatisticsChart: React.FC<FleetMetricsProps> = ({ data }) => {
  const [selectedType, setSelectedType] = useState<'coal' | 'soil' | 'total'>(
    'total'
  );

  const options: ApexOptions = {
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#3b82f6', '#10b981'], // Blue for planned, green for actual
    chart: {
      fontFamily: 'Gip, sans-serif',
      height: 310,
      type: 'line',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'straight',
      width: [2, 2],
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val.toFixed(1)} м3`,
      },
    },
    xaxis: {
      type: 'category',
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
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: ['#6B7280'],
        },
        formatter: (val: number) => `${val.toFixed(0)}`,
      },
      title: {
        text: 'м3',
        style: {
          fontSize: '12px',
          fontFamily: 'Gip, sans-serif',
        },
      },
    },
  };

  const getSeriesData = () => {
    const defaultData = Array(12).fill(0);

    if (!data?.yearlyStatistics) {
      return [
        { name: 'Төлөвлөгөө', data: defaultData },
        { name: 'Гүйцэтгэл', data: defaultData },
      ];
    }

    switch (selectedType) {
      case 'coal':
        return [
          {
            name: 'Төлөвлөгөө (Нүүрс)',
            data: data.yearlyStatistics.map((s) => s.planned.coal),
          },
          {
            name: 'Гүйцэтгэл (Нүүрс)',
            data: data.yearlyStatistics.map((s) => s.actual.coal),
          },
        ];
      case 'soil':
        return [
          {
            name: 'Төлөвлөгөө (Хөрс)',
            data: data.yearlyStatistics.map((s) => s.planned.soil),
          },
          {
            name: 'Гүйцэтгэл (Хөрс)',
            data: data.yearlyStatistics.map((s) => s.actual.soil),
          },
        ];
      case 'total':
      default:
        return [
          {
            name: 'Төлөвлөгөө (Нийт)',
            data: data.yearlyStatistics.map((s) => s.planned.total),
          },
          {
            name: 'Гүйцэтгэл (Нийт)',
            data: data.yearlyStatistics.map((s) => s.actual.total),
          },
        ];
    }
  };

  const series = getSeriesData();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Төлөвлөлт болон гүйцэтгэлийн харьцаа
          </h3>
        </div>

        {/* Type Switcher */}
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedType('coal')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'coal'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Нүүрс
            </button>
            <button
              onClick={() => setSelectedType('soil')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'soil'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Хөрс
            </button>
            <button
              onClick={() => setSelectedType('total')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'total'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Нийт
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={310}
          />
        </div>
      </div>
    </div>
  );
};
