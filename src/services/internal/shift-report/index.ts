import http from '@/services';
import {
  ShiftInspectionReportFilters,
  ShiftInspectionReportResponse,
  ShiftInspectionReportRow,
  ShiftDetails,
  ShiftInsight,
  ShiftReport,
  ShiftReportFilters,
  ShiftReportResponse,
  ShiftStatistics,
} from './types';
import type { CreateShiftInput, Shift } from '../shift/types';

const shiftReportService = {
  /**
   * Get all shifts with filtering and pagination
   */
  getShiftsReport: async (filters: ShiftReportFilters = {}) => {
    const { offset, limit, ...queryParams } = filters;

    const response = await http.get<ShiftReport[]>(
      '/api/internal/shifts-report',
      {
        params: {
          offset,
          limit,
          ...queryParams,
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as ShiftReportResponse;
  },

  getShiftInspectionReport: async (
    filters: ShiftInspectionReportFilters = {}
  ) => {
    const { offset, limit, ...queryParams } = filters;

    const response = await http.get<ShiftInspectionReportRow[]>(
      '/api/internal/shifts-report/inspection-view',
      {
        params: {
          offset,
          limit,
          ...queryParams,
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as ShiftInspectionReportResponse;
  },

  /**
   * Get single shift details by ID
   */
  getShiftDetail: async ({ shiftId }: { shiftId: string }) => {
    const response = await http.get<ShiftDetails>(
      '/api/internal/shift-details',
      {
        params: { shiftId },
      }
    );

    return response.body;
  },

  /**
   * Get shift statistics based on filters
   */
  getShiftStatistics: async (
    filters: Omit<ShiftReportFilters, 'offset' | 'limit'> = {}
  ) => {
    return await http.get<ShiftStatistics>(
      '/api/internal/shifts-report/statistics',
      {
        params: filters,
      }
    );
  },

  /**
   * Export shifts report to CSV
   */
  exportShiftsReport: async (
    filters: Omit<ShiftReportFilters, 'offset' | 'limit'> = {},
    exportType: 'summary' | 'detailed' | 'inspection' = 'summary'
  ) => {
    return await http.get<Blob>('/api/internal/shifts-report/export', {
      params: {
        ...filters,
        exportType,
      },
    });
  },

  /**
   * Get shifts insights with overall statistics
   */
  getShiftsInsights: async (
    filters: Omit<ShiftReportFilters, 'offset' | 'limit'> = {}
  ) => {
    return await http.get<ShiftInsight>('/api/internal/shifts-insights', {
      params: filters,
    });
  },

  deleteShift: async (id: string) => {
    return await http.delete<boolean>('/api/internal/shift', {
      body: { id },
    });
  },

  createShift: async (data: CreateShiftInput) => {
    return await http.post<Shift>('/api/internal/shift', {
      body: data,
    });
  },

  updateShift: async (
    id: string,
    data: {
      driverShiftGroup?: 'A' | 'B' | 'C' | 'D';
      shiftType?: string;
      operationalDate?: string;
      mileageStart?: string | number;
      mileageEnd?: string | number;
      motoStart?: string | number;
      motoEnd?: string | number;
      notes?: string;
    }
  ) => {
    return await http.put<ShiftReport>('/api/internal/shift', {
      body: { id, ...data },
    });
  },
};

export default shiftReportService;
