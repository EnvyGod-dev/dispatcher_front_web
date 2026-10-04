"use client";
import React from "react";
import { DashboardMetrics } from "@/services/internal/dashboard/types";

interface RecentShiftsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export default function RecentShifts({ data, isLoading }: RecentShiftsProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-1"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const shifts = data?.recentShifts || [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-400',
          dot: 'bg-blue-600',
          label: 'Идэвхтэй'
        };
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-400',
          dot: 'bg-green-600',
          label: 'Дууссан'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100 dark:bg-red-900/20',
          text: 'text-red-800 dark:text-red-400',
          dot: 'bg-red-600',
          label: 'Цуцлагдсан'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/20',
          text: 'text-gray-800 dark:text-gray-400',
          dot: 'bg-gray-600',
          label: 'Тодорхойгүй'
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Сүүлийн ээлжүүд
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Хамгийн сүүлийн {shifts.length} ээлжийн үйл ажиллагаа
          </p>
        </div>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
        {shifts.map((shift) => {
          const statusConfig = getStatusConfig(shift.status);
          const isActive = shift.status === 'started';
          
          return (
            <div key={shift.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  shift.shiftType === 'day' 
                    ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                    : 'bg-indigo-100 dark:bg-indigo-900/20'
                }`}>
                  {shift.shiftType === 'day' ? (
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                      {shift.driverName}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {shift.vehicleName}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDateTime(shift.shiftStart)}</span>
                    {shift.shiftEnd && (
                      <>
                        <span>-</span>
                        <span>{formatDateTime(shift.shiftEnd)}</span>
                      </>
                    )}
                    {isActive && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        (Үргэлжилж байна)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          );
        })}
        
        {shifts.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ээлжийн мэдээлэл олдсонгүй
            </p>
          </div>
        )}
      </div>
    </div>
  );
}