import { MiningSection } from '../mining-section/types';
import { VehicleOrganization } from '../vehicle-organization/types';

export type VehicleType =
  | 'truck'
  | 'excavator'
  | 'loader'
  | 'dozer'
  | 'dump'
  | 'light_vehicle'
  | 'special_purpose'
  | 'grader';

export type VehicleStatus = 'active' | 'maintenance' | 'retired';

export const vehicleStatusOptions = [
  { value: 'active', label: 'Идэвхтэй' },
  { value: 'maintenance', label: 'Засварт' },
  { value: 'retired', label: 'Идэвхгүй' },
];

export const vehiclePositionMap = [
  { position: 'front' as const, label: 'Урд' },
  { position: 'rear' as const, label: 'Арын' },
  { position: 'left' as const, label: 'Зүүн' },
  { position: 'right' as const, label: 'Баруун' },
  { position: 'left_front' as const, label: 'Зүүн-урд' },
  { position: 'right_front' as const, label: 'Баруун-урд' },
  { position: 'left_rear' as const, label: 'Зүүн-арын' },
  { position: 'right_rear' as const, label: 'Баруун-арын' },
];

export const vehicleTypeLabels: Record<string, string> = {
  truck: 'Автосамосвал',
  excavator: 'Экскаватор',
  loader: 'Дугуйт ачигч',
  dozer: 'Бульдозер',
  dump: 'Дамп',
  light_vehicle: 'Хөнгөн тэрэг',
  special_purpose: 'Тусгай зориулалт',
  grader: 'Автогрейдр',
};

export const vehicleTypeMap = [
  { value: 'truck', label: 'Автосамосвал' },
  { value: 'excavator', label: 'Экскаватор' },
  { value: 'loader', label: 'Дугуйт ачигч' },
  { value: 'dozer', label: 'Бульдозер' },
  { value: 'dump', label: 'Дамп' },
  { value: 'light_vehicle', label: 'Хөнгөн тэрэг' },
  { value: 'special_purpose', label: 'Тусгай зориулалт' },
  { value: 'grader', label: 'Автогрейдр' },
];

export const vehicleStatusLabels: Record<string, string> = {
  active: 'Идэвхтэй',
  maintenance: 'Засварт',
  retired: 'Идэвхгүй',
};

export type Vehicle = {
  id: string;
  name: string;
  code: string;
  vehicleNumber: string;
  serialNumber: string;
  engineNumber: string;
  organizationId: string;
  vehicleOrganizationId: string;
  miningSectionId: string;
  mineNumber: string;
  type: VehicleType;
  commissioningDate: string;
  insuranceExpiryDate: string;
  decommissioningDate: string;
  stoppedMotoHours: number;
  hasGps: boolean;
  gpsId: string;
  gpsGroupId: string;
  gpsName: string;
  hasBuzzer: boolean;
  hasFuelSensor: boolean;
  status: VehicleStatus;
  notes?: string;
  lastInspection?: string;
  fuelConsumptionPerHour: number;
  soilCoefficient: string;
  coalCoefficient: string;
  createdAt: string;
  vehiclePictures: VehiclePicture[];
  pictureUrl: string;
  vehicleOrganization: VehicleOrganization;
  miningSection: MiningSection;
  vehicleOrganizationName?: string;
  miningSectionName?: string;
  vehicleType: VehicleType;
};

export type VehicleResponse = {
  data: Vehicle[];
  totalCount: number;
};

export type VehicleImagePosition =
  | 'front'
  | 'rear'
  | 'left'
  | 'right'
  | 'left_front'
  | 'right_front'
  | 'left_rear'
  | 'right_rear';

export type VehiclePicture = {
  position:
    | 'front'
    | 'rear'
    | 'left'
    | 'right'
    | 'left_front'
    | 'right_front'
    | 'left_rear'
    | 'right_rear';
  url: string;
};

export type CreateVehicleInput = {
  name: string;
  code: string;
  vehicleNumber: string;
  serialNumber: string;
  engineNumber: string;
  vehicleOrganizationId: string;
  miningSectionId: string;
  mineNumber: string;
  type: VehicleType;
  soilCoefficient: string;
  coalCoefficient: string;
  commissioningDate?: string;
  insuranceExpiryDate?: string;
  decommissioningDate?: string;
  stoppedMotoHours?: number;
  vehicleType: VehicleType;
  hasGps?: boolean;
  gpsId?: string;
  gpsGroupId?: string;
  gpsName?: string;
  hasBuzzer?: boolean;
  hasFuelSensor?: boolean;
  fuelConsumptionPerHour?: number;
  notes?: string;
  vehiclePictures?: VehiclePicture[];
  status?: VehicleStatus;
};

export type UpdateVehicleInput = {
  id: string;
  name: string;
  code: string;
  vehicleNumber: string;
  serialNumber: string;
  engineNumber: string;
  vehicleOrganizationId: string;
  miningSectionId: string;
  mineNumber: string;
  type: VehicleType;
  commissioningDate?: string;
  insuranceExpiryDate?: string;
  decommissioningDate?: string;
  stoppedMotoHours?: number;
  soilCoefficient: string;
  coalCoefficient: string;
  hasGps?: boolean;
  gpsId?: string;
  gpsGroupId?: string;
  gpsName?: string;
  hasBuzzer?: boolean;
  hasFuelSensor?: boolean;
  fuelConsumptionPerHour?: number;
  notes?: string;
  vehiclePictures?: VehiclePicture[];
  status?: VehicleStatus;
};

export type UploadResponse = {
  url: string;
};
