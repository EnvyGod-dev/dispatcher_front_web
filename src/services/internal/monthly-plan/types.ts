// services/internal/daily-plan/types.ts
export interface MonthlyPlan {
  id: string;
  organizationId: string;
  coalAmount: string;
  soilAmount: string;
  createdAt: string;

  date: string;
  year: number;
  month: number;
}

export type CreateMonthlyPlanInput = {
  coalAmount: string;
  soilAmount: string;
  year: number;
  month: number;
};

export type UpdateMonthlyPlanInput = {
  id: string;
  coalAmount: string;
  soilAmount: string;

  year?: number;
  month?: number;
};

export type MonthlyPlanResponse = {
  data: MonthlyPlan[];
  totalCount: number;
};
