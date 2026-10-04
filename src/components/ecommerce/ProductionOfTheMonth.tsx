'use client';
import React from 'react';
import Badge from '../ui/badge/Badge';
import { DashboardMetrics } from '@/services/internal/dashboard/types';
import { ArrowDownIcon, ArrowUpIcon, BoxIcon, GroupIcon } from 'lucide-react';

interface FleetMetricsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export const DriverMetrics: React.FC<FleetMetricsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Driver Stats --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Операторын мэдээлэл
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {data?.drivers?.total || 0}
          </h4>
          <div className="flex gap-2 mt-3">
            <Badge color="success">{data?.drivers?.active || 0} идэвхтэй</Badge>
            <Badge color="warning">
              {data?.drivers?.inactive || 0} идэвхгүй
            </Badge>
          </div>
        </div>
      </div>

      {/* <!-- Production Stats --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIcon className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Энэ сарын гүйцэтгэл
          </span>

          {/* Coal */}
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Нүүрс
              </span>
              <h4 className="font-bold text-gray-800 dark:text-white/90">
                {data?.products?.current?.coal?.toFixed(1) || '0.0'} m3
              </h4>
            </div>
            <Badge
              color={data?.products?.isCoalIncreased ? 'success' : 'error'}
            >
              {data?.products?.isCoalIncreased ? (
                <ArrowUpIcon />
              ) : (
                <ArrowDownIcon />
              )}
              {Math.abs(data?.products?.changes?.coal || 0).toFixed(1)}%
            </Badge>
          </div>

          {/* Soil */}
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Хөрс
              </span>
              <h4 className="font-bold text-gray-800 dark:text-white/90">
                {data?.products?.current?.soil?.toFixed(1) || '0.0'} m3
              </h4>
            </div>
            <Badge
              color={data?.products?.isSoilIncreased ? 'success' : 'error'}
            >
              {data?.products?.isSoilIncreased ? (
                <ArrowUpIcon />
              ) : (
                <ArrowDownIcon />
              )}
              {Math.abs(data?.products?.changes?.soil || 0).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
