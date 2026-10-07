import { DailyPlan } from "../daily-plan/types";
import { Employee } from "../employee/type";
import { Inspection, ShiftInspection } from "../inspection/types";
import { MiningBlock } from "../mining-block/types";
import { Route } from "../routes/types";
import { Stockpile } from "../stockpile/types";
import { Vehicle } from "../vehicle/types";
import { WorkLog } from "../work-log/types";
import type { VehicleType } from "../vehicle/types";
import type { DriverShiftGroup } from "../employee/type";

export interface Shift {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  vehicleNumber: string;
  driverShiftGroup?: DriverShiftGroup | null;
  shiftType: "day" | "night";
  operationalDate?: string;
  shiftStart: string;
  shiftEnd: string | null;
  status: "started" | "completed" | "cancelled";
  mileageStart: string;
  mileageEnd: string | null;
  motoStart: string;
  motoEnd: string | null;
  notes?: string;
  workLogs?: WorkLog[];
  inspections?: ShiftInspection[];
  coalProduct?: string;
  soilProduct?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftDetails {
  shift: {
    id: string;
    operationalDate: string | null;
    shiftType: 'day' | 'night';
    status: 'started' | 'completed' | 'cancelled';
    shiftStart: string;
    shiftEnd: string | null;
    mileageStart: string;
    mileageEnd: string | null;
    motoStart: string;
    motoEnd: string | null;
    notes: string | null;
    coalProduct: string | null;
    soilProduct: string | null;
    driver: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'position'> | null;
    vehicle: Pick<Vehicle, 'id' | 'code' | 'name' | 'type'> | null;
  } | null;
  workLogs: (WorkLog & {
    stockPile: Pick<Stockpile, "id" | "type" | "layerNumber">;
    vehicle: Pick<Vehicle, "id" | "code">;
    dailyPlan: Pick<
      DailyPlan,
      | "id"
      | "pickUpBlockId"
      | "vehicleId"
      | "transportAmount"
      | "date"
      | "shiftType"
    >;
    miningBlock: Pick<MiningBlock, "id" | "name" | "layerNumber">;
    route: Pick<Route, "id" | "routeCode">;
  })[];
  inspections: (ShiftInspection & {
    inspection: Inspection;
  })[];
}

export interface ShiftReportFilters {
  status?: "started" | "completed" | "cancelled";
  shiftType?: "day" | "night";
  operationalDate?: string;
  startDate?: string;
  endDate?: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleOrganizationId?: string;
  vehicleCode?: string;
  stockpileId?: string;
  miningBlockId?: string;
  search?: string;
  offset?: number;
  limit?: number;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
}

export type ShiftReport = Shift & {
  workLogsCount?: string;
  coalWorkLogCount?: string;
  soilWorkLogCount?: string;
  hasInspectionIssues?: boolean;
  issueInspectionNames?: string;
  driver: Pick<Employee, "id" | "firstName" | "lastName" | "position"> | null;
  vehicle: Pick<Vehicle, "id" | "code" | "name" | "type"> | null;
};

export interface ShiftReportResponse {
  data: ShiftReport[];
  totalCount: number;
}

export interface ShiftInspectionReportFilters {
  operationalDate?: string;
  shiftType?: "day" | "night";
  driverId?: string;
  vehicleId?: string;
  vehicleOrganizationId?: string;
  vehicleType?: VehicleType;
  inspectionState?: "all" | "done" | "not_done" | "has_issue";
  offset?: number;
  limit?: number;
}

export interface ShiftInspectionReportRow {
  shiftId: string;
  operationalDate: string | null;
  shiftType: "day" | "night";
  shiftStatus: "started" | "completed" | "cancelled";
  shiftStart: string;
  shiftEnd: string | null;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  driverPosition: string | null;
  vehicleId: string;
  vehicleCode: string;
  vehicleName: string;
  vehicleType: VehicleType;
  hasInspection: boolean;
  normalCount: number;
  issueCount: number;
  needsInspectionCount: number;
  issueInspectionNames: string;
  issueInspectionTypes: string;
}

export interface ShiftInspectionReportResponse {
  data: ShiftInspectionReportRow[];
  totalCount: number;
}

export interface ShiftStatistics {
  totalShifts: number;
  totalTrips: number;
  totalTonnage: number;
  averageTonnagePerShift: number;
  averageTripsPerShift: number;
  completedShifts: number;
  activeShifts: number;
  cancelledShifts: number;
  shiftsWithIssues: number;
  totalMileage: number;
}

export type ShiftTopVehicle = {
  vehicleId: string | null;
  vehicleCode: string | null;
  vehicleName: string | null;
  production: string;
  trips: number;
};

export type ShiftInsight = {
  totalShifts: string;
  completedShifts: string;
  activeShifts: string;
  cancelledShifts: string;
  totalTrips: string;
  averageTonnagePerShift: string;
  averageTripsPerShift: string;
  shiftsWithIssues: string;
  normalInspectionCount: string;
  issueInspectionCount: string;
  needsInspectionCount: string;
  totalProduction: string;
  totalCoalProduction: string;
  totalSoilProduction: string;
  topDriverShiftGroup: DriverShiftGroup | null;
  topDriverShiftGroupProduction: string;
  /** Шилдэг ээлжийн хамгийн өндөр бүтээлтэй самосвал, экскаватор (хуучин backend-д байхгүй). */
  topShiftDump?: ShiftTopVehicle | null;
  topShiftExcavator?: ShiftTopVehicle | null;
  activeVehicles: string;
  totalActiveVehicles: string;
};
