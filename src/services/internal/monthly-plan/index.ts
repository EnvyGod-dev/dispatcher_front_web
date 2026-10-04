import http from '../../index';
import {
  CreateMonthlyPlanInput,
  MonthlyPlan,
  MonthlyPlanResponse,
  UpdateMonthlyPlanInput,
} from './types';

const monthlyPlanService = {
  getMonthlyPlans: async ({
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  }) => {
    const response = await http.get<MonthlyPlan[]>(
      '/api/internal/monthly-plans',
      {
        params: {
          offset,
          limit,
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as MonthlyPlanResponse;
  },

  getMonthlyPlan: async (id: string) => {
    return await http.get<MonthlyPlan>('/api/internal/monthly-plan', {
      params: { id },
    });
  },

  createMonthlyPlan: async (body: CreateMonthlyPlanInput) => {
    return await http.post<MonthlyPlan>('/api/internal/monthly-plan', { body });
  },

  updateMonthlyPlan: async (body: UpdateMonthlyPlanInput) => {
    return await http.put<MonthlyPlan>('/api/internal/monthly-plan', { body });
  },

  deleteMonthlyPlan: async (id: string) => {
    return await http.delete<boolean>('/api/internal/monthly-plan', {
      body: { id },
    });
  },
};

export default monthlyPlanService;
