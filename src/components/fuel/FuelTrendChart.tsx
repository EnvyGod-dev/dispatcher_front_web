'use client';

import { fmtLiters, fmtNumber } from '@/lib/fuel/format';
import type { FuelSummaryBucket } from '@/services/internal/fuel/types';
import { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/** Олголт (orange) ба орлого (blue) — light/dark аль алинд CVD шалгалт давсан хос. */
export const FUEL_SERIES_COLORS = { refueled: '#e85d00', received: '#0086c9' };

export default function FuelTrendChart({ series, height = 300 }: { series: FuelSummaryBucket[]; height?: number }) {
  const categories = series.map((b) => b.bucket);

  const options: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'Gip, sans-serif', toolbar: { show: false }, zoom: { enabled: false } },
    colors: [FUEL_SERIES_COLORS.refueled, FUEL_SERIES_COLORS.received],
    plotOptions: {
      bar: { columnWidth: series.length > 20 ? '70%' : '45%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', markers: { size: 6 } },
    grid: { borderColor: 'rgba(148,163,184,0.18)', strokeDashArray: 4, yaxis: { lines: { show: true } } },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: series.length > 14 ? 10 : undefined,
      labels: {
        formatter: (v: string) => (v ? dayjs(v).format('MM/DD') : v),
        style: { colors: '#98a2b3', fontSize: '12px' },
        hideOverlappingLabels: true,
        rotate: 0,
        rotateAlways: false,
      },
    },
    yaxis: { labels: { formatter: (v: number) => fmtNumber(v, 0), style: { colors: ['#98a2b3'] } } },
    tooltip: {
      shared: true,
      intersect: false,
      x: { formatter: (_v: number, opts?: { dataPointIndex: number }) => categories[opts?.dataPointIndex ?? 0] ?? '' },
      y: { formatter: (v: number) => fmtLiters(v) },
    },
  };

  return (
    <ReactApexChart
      options={options}
      series={[
        { name: 'Олголт', data: series.map((b) => b.refueled) },
        { name: 'Орлого', data: series.map((b) => b.received) },
      ]}
      type="bar"
      height={height}
    />
  );
}
