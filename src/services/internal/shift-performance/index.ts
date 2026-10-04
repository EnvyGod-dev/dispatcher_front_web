import http from '@/services';
import type { ShiftReportFilters } from '../shift-report/types';
import {
  MostActiveDump,
  MostActiveOperator,
  TodayInspection,
  TopExcaResponse,
} from './types';

type ShiftPerformanceFilters = Omit<
  ShiftReportFilters,
  'offset' | 'limit' | 'sortColumn' | 'sortOrder'
>;

const shiftPerformanceService = {
  getTopExcavator: async (filters: ShiftPerformanceFilters = {}) => {
    const response = await http.get<TopExcaResponse>(
      '/api/internal/shift-performance/top-exca',
      {
        params: filters,
      }
    );
    return {
      data: response.body,
    };
  },

  getMostActiveDump: async (filters: ShiftPerformanceFilters = {}) => {
    const response = await http.get<MostActiveDump>(
      '/api/internal/shift-performance/most-active-dump',
      {
        params: filters,
      }
    );
    return {
      data: response.body,
    };
  },

  getMostActiveOperators: async (filters: ShiftPerformanceFilters = {}) => {
    const response = await http.get<MostActiveOperator[]>(
      '/api/internal/shift-performance/most-active-operators',
      {
        params: filters,
      }
    );
    return {
      data: response.body,
    };
  },

  getTodayInspections: async (filters: ShiftPerformanceFilters = {}) => {
    const response = await http.get<TodayInspection>(
      '/api/internal/shift-performance/today-inspections',
      {
        params: filters,
      }
    );
    return {
      data: response.body,
    };
  },
};

export default shiftPerformanceService;
