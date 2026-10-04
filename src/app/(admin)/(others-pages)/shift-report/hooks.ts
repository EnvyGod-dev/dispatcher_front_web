import shiftReportService from '@/services/internal/shift-report';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch shifts report with filters and pagination
 */
export function useShiftsReport(filters: ShiftReportFilters = {}) {
  return useQuery({
    queryKey: ['shifts-report', filters],
    queryFn: () => shiftReportService.getShiftsReport(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch single shift detail
 */
export function useShiftDetail(shiftId: string | null) {
  return useQuery({
    queryKey: ['shift-detail', shiftId],
    queryFn: async () => {
      if (!shiftId) return null;
      const response = await shiftReportService.getShiftDetail({ shiftId });
      return response;
    },
    enabled: !!shiftId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch shift statistics
 */
export function useShiftStatistics(
  filters: Omit<ShiftReportFilters, 'offset' | 'limit'> = {}
) {
  return useQuery({
    queryKey: ['shift-statistics', filters],
    queryFn: async () => {
      const response = await shiftReportService.getShiftStatistics(filters);
      return response.body;
    },
    staleTime: 60000, // 1 minute
  });
}
