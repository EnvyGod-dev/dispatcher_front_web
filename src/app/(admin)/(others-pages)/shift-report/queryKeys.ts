import type { ShiftReportFilters } from '@/services/internal/shift-report/types';

export const shiftReportKeys = {
  all: ['shift-report'] as const,
  list: (filters: ShiftReportFilters) =>
    [...shiftReportKeys.all, 'list', filters] as const,
  detail: (shiftId: string) => [...shiftReportKeys.all, 'detail', shiftId] as const,
  insights: (filters: Partial<ShiftReportFilters>) =>
    [...shiftReportKeys.all, 'insights', filters] as const,
  dailyPlans: (date?: string) =>
    [...shiftReportKeys.all, 'daily-plans', date ?? 'none'] as const,
};
