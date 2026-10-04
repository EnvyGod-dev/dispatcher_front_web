import { MiningBlock } from '../mining-block/types';
import { Route } from '../routes/types';
import { ShiftType } from '../shift/types';
import { Stockpile } from '../stockpile/types';
import { Vehicle } from '../vehicle/types';

export type DailyPlanStatus = 'active' | 'completed';

// services/internal/daily-plan/types.ts
export interface DailyPlan {
  id: string;
  organizationId: string;
  routeId: string;
  pickUpBlockId: string;
  stockpileIds: string[];
  vehicleId: string;
  transportAmount?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  shiftType: ShiftType;
  status: DailyPlanStatus;

  date: string;

  // joined data
  routeCode?: string;
  miningBlockName?: string;
  miningBlockLayerNumber?: string;
  vehicleName?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleCode?: string;

  // array of stockpiles
  stockpiles: Array<{
    id: string;
    type: 'coal' | 'soil';
    layerNumber: string;
  }>;

  // for pagination
  totalCount?: string;
  route?: Route;
  miningBlock?: MiningBlock;
}

export type CreateDailyPlanInput = {
  date: string;
  routeId: string;
  pickUpBlockId: string;
  stockpileIds: string[];
  vehicleId: string;
  shiftType: ShiftType;
  transportAmount?: string;
};

export type UpdateDailyPlanInput = CreateDailyPlanInput & {
  id: string;
  status?: DailyPlanStatus;
  allowConcurrentActive?: boolean;
};

export type DailyPlanResponse = {
  data: DailyPlan[];
  totalCount: number;
};

export type DailyPlanReport = DailyPlan & {
  miningBlock: MiningBlock;
  stockpile: Stockpile;
  route: Route;
  vehicle: Vehicle;
};
