import http from '../../index';
import { ShiftType } from '../shift/types';
import {
  CreateDailyPlanInput,
  DailyPlan,
  DailyPlanResponse,
  DailyPlanStatus,
  UpdateDailyPlanInput,
} from './types';

const dailyPlanService = {
  getDailyPlans: async ({
    offset,
    limit,
    date,
    shiftType,
    status,
  }: {
    offset?: number;
    limit?: number;
    date?: string;
    shiftType?: ShiftType;
    status?: DailyPlanStatus;
  }) => {
    const response = await http.get<DailyPlan[]>('/api/internal/daily-plans', {
      params: {
        offset,
        limit,
        ...(date && { date: date }),
        ...(shiftType && { shiftType }),
        ...(status && { status }),
      },
    });

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as DailyPlanResponse;
  },

  getDailyPlansForAllShifts: async ({
    offset,
    limit,
    date,
    status,
  }: {
    offset?: number;
    limit?: number;
    date?: string;
    status?: DailyPlanStatus;
  }) => {
    const normalizedOffset = offset ?? 0;
    const requestLimit =
      limit !== undefined ? normalizedOffset + limit : undefined;

    const [dayPlans, nightPlans] = await Promise.all([
      dailyPlanService.getDailyPlans({
        offset: 0,
        limit: requestLimit,
        date,
        shiftType: 'day',
        status,
      }),
      dailyPlanService.getDailyPlans({
        offset: 0,
        limit: requestLimit,
        date,
        shiftType: 'night',
        status,
      }),
    ]);

    const mergedData = [...dayPlans.data, ...nightPlans.data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      data:
        limit !== undefined
          ? mergedData.slice(normalizedOffset, normalizedOffset + limit)
          : mergedData,
      totalCount: dayPlans.totalCount + nightPlans.totalCount,
    } as DailyPlanResponse;
  },

  getDailyPlan: async (id: string) => {
    return await http.get<DailyPlan>('/api/internal/daily-plan', {
      params: { id },
    });
  },

  createDailyPlan: async (body: CreateDailyPlanInput) => {
    return await http.post<DailyPlan>('/api/internal/daily-plan', { body });
  },

  updateDailyPlan: async (body: UpdateDailyPlanInput) => {
    return await http.put<DailyPlan>('/api/internal/daily-plan', { body });
  },

  deleteDailyPlan: async (id: string) => {
    return await http.delete<boolean>('/api/internal/daily-plan', {
      body: { id },
    });
  },
};

export default dailyPlanService;
