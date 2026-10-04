import http from '../../index';
import { MonthlyPlan } from '../monthly-plan/types';

export interface MonthlyAggregationFilters {
  year: number;
  month: number;
}

export interface ShiftData {
  trips: number;
  production: number;
  plannedAmount: number;
  performanceRatio: number;
  coalTrips: number;
  coalProduction: number;
  comment: string | null;
}

export interface DailyBreakdown {
  day: string;
  dayShift: ShiftData;
  nightShift: ShiftData;
  totalDayProduction: number;
  totalPlannedAmount: number;
  totalPerformanceRatio: number;
  totalCoalProduction: number;
}

export interface MonthlyAggregationSummary {
  daysInMonth: number;
  elapsedDays: number;
  monthlyShiftPlanCount: number;
  elapsedShiftPlanCount: number;
  daysMetPlan: number;
  daysMissedPlan: number;
  monthlyPlanTotalProduction: number;
  cumulativePlanToDate: number;
  monthlyPlanFulfillmentRatio: number;
  cumulativePlanFulfillmentRatio: number;
}

export interface MonthlyAggregationShiftSeries {
  id: string;
  day: string;
  shiftType: 'day' | 'night';
  label: string;
  plannedAmount: number;
  production: number;
  coalProduction: number;
  trips: number;
  coalTrips: number;
  performanceRatio: number;
  comment: string | null;
}

export interface MonthlyAggregationResponse {
  year: number;
  month: number;
  dailyBreakdown: DailyBreakdown[];
  monthlyPlan: MonthlyPlan;
  summary: MonthlyAggregationSummary;
  shiftSeries: MonthlyAggregationShiftSeries[];
  monthlyTotals: {
    totalTrips: number;
    totalProduction: number;
    totalPlannedAmount: number;
    totalCoalTrips: number;
    totalCoalProduction: number;
    totalSoilProduction: number;
    overallPerformanceRatio: number;
  };
}

const monthlyAggregationService = {
  getMonthlyAggregation: async (filters: MonthlyAggregationFilters) => {
    const response = await http.get<MonthlyAggregationResponse>(
      '/api/internal/monthly-aggregation',
      {
        params: filters,
      }
    );
    return response;
  },

  upsertComment: async (params: {
    date: string;
    shiftType: 'day' | 'night';
    comment: string;
  }) => {
    const response = await http.put('/api/internal/shift-report/comment', { body: params });
    return response;
  },
};

export default monthlyAggregationService;
