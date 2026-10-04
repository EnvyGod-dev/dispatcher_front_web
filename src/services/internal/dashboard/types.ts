import { ShiftStatus } from '../shift/types';

export interface DashboardMetrics {
  drivers: {
    total: number;
    active: number;
    inactive: number;
  };
  products: {
    current: {
      coal: number;
      soil: number;
      total: number;
    };
    previous: {
      coal: number;
      soil: number;
      total: number;
    };
    changes: {
      coal: number;
      soil: number;
      total: number;
    };
    isCoalIncreased: boolean;
    isSoilIncreased: boolean;
    isTotalIncreased: boolean;
  };
  targets: {
    coal: number;
    soil: number;
    current: {
      coal: number;
      soil: number;
    };
    today: {
      coal: number;
      soil: number;
    };
    progress: {
      coal: number;
      soil: number;
    };
  };
  yearlyStatistics: Array<{
    month: number;
    planned: {
      coal: number;
      soil: number;
      total: number;
    };
    actual: {
      coal: number;
      soil: number;
      total: number;
    };
    achievement: {
      coal: number;
      soil: number;
      total: number;
    };
  }>;
  miningDemographics: Array<{
    id: string;
    name: string;
    code: string;
    materialName: string;
    materialCode: string;
    type: 'pick_up' | 'drop_off';
    workCount: number;
    totalTonnage: number;
    longitude: string;
    latitude: string;
  }>;
  recentShifts: Array<{
    id: string;
    driverName: string;
    vehicleName: string;
    vehicleNumber: string;
    shiftStart: string;
    shiftEnd: string | null;
    status: ShiftStatus;
    shiftType: 'day' | 'night';
  }>;
  period: {
    type: 'monthly' | 'quarterly' | 'annually';
    year: number;
    month?: number;
    quarter?: number;
    startDate: string;
    endDate: string;
  };
}

export interface DashboardFilters {
  period?: 'monthly' | 'quarterly' | 'annually';
  year?: number;
  month?: number;
  quarter?: number;
}
