import http from '../../index';
import type { ShiftReportFilters } from '../shift-report/types';
import {
  CreateWorkLogInput,
  StartWorkLogInput,
  EndWorkLogInput,
  WorkLog,
  WorkLogResponse,
  WorkLogReport,
} from './types';

const worklogService = {
  startWorkLog: async (body: StartWorkLogInput) => {
    return await http.post<WorkLog>('/api/internal/work-log/start', { body });
  },

  endWorkLog: async (body: EndWorkLogInput) => {
    return await http.post<WorkLog>('/api/internal/work-log/end', { body });
  },

  // getWorkLogs: async ({
  //   offset,
  //   limit,
  //   shiftId,
  // }: {
  //   offset?: number;
  //   limit?: number;
  //   shiftId?: string;
  // }) => {
  //   const response = await http.get<WorkLog[]>('/api/internal/work-logs', {
  //     params: {
  //       offset,
  //       limit,
  //       ...(shiftId && { shiftId }),
  //     },
  //   });

  //   return {
  //     data: response.body,
  //     totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
  //   } as WorkLogResponse;
  // },

  getWorkLogReport: async (filters?: ShiftReportFilters) => {
    const response = await http.get<WorkLogReport[]>(
      '/api/internal/worklog-report',
      {
        params: {
          ...(filters?.status && { status: filters.status }),
          ...(filters?.shiftType && { shiftType: filters.shiftType }),
          ...(filters?.operationalDate && {
            operationalDate: filters.operationalDate,
          }),
          ...(filters?.startDate && { startDate: filters.startDate }),
          ...(filters?.endDate && { endDate: filters.endDate }),
          ...(filters?.driverId && { driverId: filters.driverId }),
          ...(filters?.driverName && { driverName: filters.driverName }),
          ...(filters?.vehicleCode && { vehicleCode: filters.vehicleCode }),
          ...(filters?.miningBlockId && {
            miningBlockId: filters.miningBlockId,
          }),
          ...(filters?.stockpileId && { stockpileId: filters.stockpileId }),
          ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 0),
    } as WorkLogResponse;
  },

  createWorkLog: async (body: CreateWorkLogInput) => {
    return await http.post<WorkLog>('/api/internal/work-log', { body });
  },

  updateWorkLog: async (
    id: string,
    data: {
      notes?: string;
      stockpileId?: string;
      status?: string;
      planId?: string;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    return await http.put<WorkLog>('/api/internal/work-log', {
      body: { id, ...data },
    });
  },

  deleteWorkLog: async (id: string) => {
    return await http.delete(`/api/internal/work-log/${id}`);
  },
};

export default worklogService;
