"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { DashboardMetrics } from "@/services/internal/dashboard/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface YearlyStatisticsChartProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export default function YearlyStatisticsChart({ data, isLoading }: YearlyStatisticsChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const monthNames = [
    "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
    "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"
  ];

  const plannedData = data?.yearlyStatistics?.map(stat => stat.planned) || Array(12).fill(0);
  const actualData = data?.yearlyStatistics?.map(stat => stat.actual) || Array(12).fill(0);
  const categories = data?.yearlyStatistics?.map(stat => monthNames[stat.month - 1]) || monthNames;

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#465FFF", "#22C55E"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 350,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 3],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
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
      y: {
        formatter: (val: number) => `${val.toFixed(1)} т`,
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Тонн",
        style: {
          fontSize: "12px",
          color: "#6B7280",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (val: number) => `${val.toFixed(0)}т`,
      },
    },
  };

  const series = [
    {
      name: "Төлөвлөсөн",
      data: plannedData,
    },
    {
      name: "Биелэсэн",
      data: actualData,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Жилийн статистик
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {data?.period?.year || new Date().getFullYear()} оны төлөвлөсөн ба биелсэн гүйцэтгэл
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
}