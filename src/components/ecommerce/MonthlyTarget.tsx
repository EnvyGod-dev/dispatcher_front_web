'use client';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { FleetMetricsProps } from '../dashboard/FleetDashboard';
import { useState, useMemo } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

export const MonthlyTarget: React.FC<FleetMetricsProps> = ({
  data,
  isLoading,
}) => {
  const [selectedType, setSelectedType] = useState<'coal' | 'soil'>('coal');

  const currentProgress =
    selectedType === 'coal'
      ? data?.targets?.progress?.coal || 0
      : data?.targets?.progress?.soil || 0;

  const series = [currentProgress];

  const options: ApexOptions = useMemo(
    () => ({
      colors: [selectedType === 'coal' ? '#3b82f6' : '#f59e0b'],
      chart: {
        fontFamily: 'Gip, sans-serif',
        type: 'radialBar',
        height: 330,
        sparkline: {
          enabled: true,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -85,
          endAngle: 85,
          hollow: {
            size: '80%',
          },
          track: {
            background: '#E4E7EC',
            strokeWidth: '100%',
            margin: 5,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              fontSize: '36px',
              fontWeight: '600',
              offsetY: -40,
              color: '#1D2939',
              formatter: function (val) {
                return val + '%';
              },
            },
          },
        },
      },
      fill: {
        type: 'solid',
        colors: [selectedType === 'coal' ? '#3b82f6' : '#f59e0b'],
      },
      stroke: {
        lineCap: 'round',
      },
      labels: ['Progress'],
    }),
    [selectedType]
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
          <div className="flex items-center justify-center">
            <div className="w-80 h-80 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentTarget =
    selectedType === 'coal' ? data?.targets?.coal : data?.targets?.soil;
  const currentActual =
    selectedType === 'coal'
      ? data?.targets?.current?.coal
      : data?.targets?.current?.soil;
  const currentToday =
    selectedType === 'coal'
      ? data?.targets?.today?.coal
      : data?.targets?.today?.soil;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-8 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Энэ сарын гүйцэтгэл
          </h3>

          {/* Type Switcher */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedType('coal')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'coal'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Нүүрс
            </button>
            <button
              onClick={() => setSelectedType('soil')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedType === 'soil'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Хөрс
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]">
            <ReactApexChart
              key={selectedType}
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {selectedType === 'coal' ? 'Нүүрс' : 'Хөрс'}
          </span>
        </div>

        <p className="mx-auto mt-16 mb-8 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {`Өнөөдрийн бүтээгдэхүүн ${currentToday?.toFixed(1) || 0} м3 `}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Төлөвлөсөн
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {currentTarget?.toFixed(1) || 0} м3
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Гүйцэтгэсэн
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {currentActual?.toFixed(1) || 0} м3
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Өнөөдөр
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {currentToday?.toFixed(1) || 0} м3
          </p>
        </div>
      </div>
    </div>
  );
};
