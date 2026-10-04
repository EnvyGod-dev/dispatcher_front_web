export type TopExcaResponse = {
  vehicleId: string;
  vehicleName: string;
  vehicleCode: string | null;
  totalProduction: number;
  soilProduction: number;
  coalProduction: number;
};

export type MostActiveDump = {
  vehicleId: string;
  vehicleName: string;
  vehicleCode: string | null;
  tripCount: number;
  totalProduction: number;
};

export type MostActiveOperator = {
  driverId: string;
  firstName: string;
  lastName: string;
  position: string | null;
  tripCount: number;
  totalProduction: number;
};

export type TodayInspection = {
  inspectionDate: string;
  totalVehicles: number;
  normalVehicleCount: number;
  issueVehicleCount: number;
  needsInspectionVehicleCount: number;
};
