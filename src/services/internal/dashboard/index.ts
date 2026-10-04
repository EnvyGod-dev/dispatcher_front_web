import http from '@/services';
import { DashboardMetrics, DashboardFilters } from './types';

const dashboardService = {
  /**
   * Get dashboard metrics with optional filters
   */
  getDashboardMetrics: async (filters: DashboardFilters = {}) => {
    const response = await http.get<DashboardMetrics>('/api/internal/dashboard-metrics', {
      params: filters,
    });
    
    return response;
  },
};

export default dashboardService;