export type ShiftType = 'day' | 'night';
export type ShiftStatus = 'started' | 'completed' | 'cancelled';
export type DriverShiftGroup = 'A' | 'B' | 'C' | 'D';

type ShiftMap = {
  value: ShiftType;
  label: string;
};

export const shiftTypeItems: ShiftMap[] = [
  { value: 'day' as const, label: 'Өдөр' },
  { value: 'night' as const, label: 'Шөнө' },
];

export type Shift = {
  id: string;
  planId?: string;
  driverId: string;
  vehicleId: string;
  organizationId: string;
  driverShiftGroup?: DriverShiftGroup | null;
  shiftType: ShiftType;
  operationalDate?: string;
  shiftStart: string;
  shiftEnd?: string;
  motoStart: string;
  motoEnd?: string;
  mileageStart: string;
  mileageEnd?: string;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShiftResponse = {
  data: Shift[];
  totalCount: number;
};

export type StartShiftInput = {
  shiftType: ShiftType;
  operationalDate?: string;
  vehicleId: string;
  mileageStart: string;
  motoStart: string;
};

export type CreateShiftInput = StartShiftInput & {
  driverId: string;
};

export type EndShiftInput = {
  shiftId: string;
  mileageEnd: string;
  motoEnd: string;
  notes?: string;
};
