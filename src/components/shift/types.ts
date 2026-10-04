import { VehicleType } from '@/services/internal/vehicle/types';

export type ShiftStep =
  | 'start'
  | 'route'
  | 'vehicle'
  | 'inspection'
  | 'working'
  | 'summary';

export type ShiftData = {
  shiftType: 'day' | 'night';
  planId: string;
  vehicleType?: VehicleType;
  vehicleId: string;
  mileageStart: string;
  mileageEnd: string;
  motoStart: string;
  motoEnd: string;
  shiftId: string;
  // Route info from daily plan
  routeCode?: string;
  routeName?: string;
  pickUpBlockName?: string;
  dropOffBlockName?: string;
};

export type InspectionStatus = 'normal' | 'issue' | 'needs_inspection';

export type InspectionResult = {
  status?: InspectionStatus;
  notes?: string;
  photoUrl?: string;
};

export type InspectionStats = {
  total: number;
  completed: number;
  issues: number;
  needsInspection: number;
};

export type WorkLogStatus = 'in_progress' | 'completed' | 'cancelled';

export type WorkLog = {
  id: string;
  shiftId: string;
  planId: string;
  stockpileId: string;
  transportedAmount: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  status: WorkLogStatus;
};
