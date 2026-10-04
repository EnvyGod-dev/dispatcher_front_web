import { Employee } from '../employee/type';
import { Shift } from '../shift/types';
import { Vehicle, VehicleStatus, VehicleType } from '../vehicle/types';

export type InspectionStatus = 'normal' | 'issue' | 'needs_inspection';

export type Inspection = {
  id: string;
  organizationId: string;
  vehicleType: VehicleType;
  name: string;
  type: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateInspectionInput = {
  vehicleType: VehicleType;
  name: string;
  type?: string;
};

export type UpdateInspectionInput = {
  id: string;
  vehicleType?: VehicleType;
  name?: string;
  type?: string;
};

export type VehicleInspectionSummary = {
  vehicleId: string;
  vehicleCode: string;
  vehicleName: string;
  vehicleType: string;
  totalInspections: number;
  normalCount: number;
  issueCount: number;
  needsInspectionCount: number;
  lastInspectionDate: string;
  shiftsWithoutInspection: string;
  vehicleStatus: VehicleStatus;
};

export type InspectionResponse = {
  data: Inspection[];
  totalCount: number;
};

export type ShiftInspectionWithDetails = ShiftInspection & {
  vehicle: Vehicle;
  user: Employee;
  shift: Shift;
};

export type ShiftInspection = {
  id: string;
  shiftId: string;
  vehicleId: string;
  inspectionId: string;
  driverId: string;
  status: InspectionStatus;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  inspection: Inspection;
};

export type CreateShiftInspectionInput = {
  shiftId: string;
  vehicleId: string;
  inspectionId: string;
  status: InspectionStatus;
  notes?: string;
  photoUrl?: string;
};

export type CreateShiftInspectionsBulkInput = {
  shiftId: string;
  vehicleId: string;
  inspections: Array<{
    inspectionId: string;
    status: InspectionStatus;
    notes?: string;
    photoUrl?: string;
  }>;
};

export type ShiftInspectionStats = {
  total: number;
  normal: number;
  issues: number;
  needsInspection: number;
};

export type UploadImageResponse = {
  url: string;
};
