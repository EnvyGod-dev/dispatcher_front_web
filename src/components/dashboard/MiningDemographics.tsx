"use client";
import React from "react";
import { DashboardMetrics } from "@/services/internal/dashboard/types";

interface MiningDemographicsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export default function MiningDemographics({ data, isLoading }: MiningDemographicsProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-1"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const demographics = data?.miningDemographics || [];
  const totalTonnage = demographics.reduce((sum, item) => sum + Number(item.totalTonnage), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Уурхайн бүсчлэл
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Материал олборлолтын газар нутгийн хуваарь
        </p>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
        {demographics.map((item) => {
          const percentage = totalTonnage > 0 ? (Number(item.totalTonnage) / Number(totalTonnage)) * 100 : 0;
          const isPickUp = item.type === 'pick_up';
          
          return (
            <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    isPickUp 
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    {isPickUp ? (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
                        {item.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isPickUp
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {item.code}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {item.materialName} ({item.materialCode})
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {item.workCount} ажил
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-3">
                  <div className="font-bold text-gray-800 dark:text-white">
                    {Number(item.totalTonnage).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    тонн
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isPickUp
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        
        {demographics.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Уурхайн мэдээлэл олдсонгүй
            </p>
          </div>
        )}
      </div>
      
      {demographics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Нийт тонн:
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {totalTonnage.toFixed(1)} т
            </span>
          </div>
        </div>
      )}
    </div>
  );
}