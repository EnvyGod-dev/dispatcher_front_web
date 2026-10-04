import { DailyPlan, DailyPlanReport } from '../daily-plan/types';
import { MiningBlock } from '../mining-block/types';
import { Shift } from '../shift/types';
import { Stockpile } from '../stockpile/types';
import { Vehicle } from '../vehicle/types';

export type WorkLogStatus = 'in_progress' | 'completed' | 'cancelled';

export type WorkLog = {
  id: string;
  shiftId: string;
  planId: string;
  transportedAmount: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  status: WorkLogStatus;
  createdAt: string;
  updatedAt: string;
  stockpileId: string;

  dailyPlan?: DailyPlan;
};

export type WorkLogReport = Shift & {
  coalProduct?: string | null;
  soilProduct?: string | null;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  workLogs: WorkLog &
    {
      stockpile: Stockpile;
      miningBlock: MiningBlock;
      dailyPlan: DailyPlanReport & {
        vehicle: Vehicle;
      };
    }[];
  vehicle: Vehicle;
};

export type WorkLog2 = WorkLog & {
  stockpile: Stockpile;
  miningBlock: MiningBlock;
  dailyPlan: DailyPlanReport & {
    vehicle: Vehicle;
  };
  vehicle: Vehicle;
};

export type StartWorkLogInput = {
  shiftId: string;
  planId: string;
  transportedAmount: string;
  notes?: string;
};

export type CreateWorkLogInput = {
  shiftId: string;
  planId: string;
  stockpileId: string;
  startTime: string;
  endTime: string;
  status: WorkLogStatus;
  notes?: string;
};

export type EndWorkLogInput = {
  worklogId: string;

  status: WorkLogStatus;
  transportedAmount: string;
  notes?: string;
};

export type WorkLogResponse = {
  data: WorkLogReport[];
  totalCount: number;
};
