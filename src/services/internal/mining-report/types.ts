export type Crew = 'A' | 'B' | 'C' | 'D';

export interface MiningMetrics {
  shifts: number;
  trucks: number;
  operators: number;
  trips: number;
  coalTrips: number;
  soilTrips: number;
  coalM3: number;
  soilM3: number;
  totalM3: number;
  motoHours: number;
  km: number;
  fuelLiters: number;
  planM3: number;
  planPercent: number | null;
  strippingRatio: number | null;
  litersPerM3: number | null;
  litersPerTrip: number | null;
  litersPerMotoHour: number | null;
  tripsPerShift: number | null;
  m3PerShift: number | null;
  m3PerMotoHour: number | null;
}

export interface MiningTotals extends MiningMetrics {
  excavators: number;
  fleetFuelLiters: number;
  unassignedFuelLiters: number;
  truckFuelLiters: number;
  planCoalM3: number;
  planSoilM3: number;
  markM3: number | null;
  markDiff: number | null;
  excavatorAvailability: number | null;
  excavatorUtilization: number | null;
}

export interface MiningCrewRow extends MiningMetrics {
  crew: Crew;
  label: string;
  dayShifts: number;
  nightShifts: number;
}

export interface MiningShiftSlot extends MiningMetrics {
  crew: Crew;
  label: string;
}

export interface MiningDayRow {
  date: string;
  day: MiningShiftSlot;
  night: MiningShiftSlot;
  trips: number;
  coalM3: number;
  soilM3: number;
  totalM3: number;
  fuelLiters: number;
  planM3: number;
}

export interface MiningExcavatorRow {
  vehicleId: string;
  code: string | null;
  name: string;
  trips: number;
  trucks: number;
  coalM3: number;
  soilM3: number;
  totalM3: number;
  totalHours: number | null;
  workedHours: number | null;
  repairHours: number | null;
  idleHours: number | null;
  availability: number | null;
  utilization: number | null;
  m3PerHour: number | null;
  markM3: number | null;
  markDiff: number | null;
}

export interface MiningTruckRow extends MiningMetrics {
  vehicleId: string;
  code: string | null;
  name: string;
  model: string | null;
  type: string | null;
  owner: string | null;
}

export interface MiningOperatorRow extends MiningMetrics {
  driverId: string;
  name: string;
  crew: Crew | null;
  crewLabel: string | null;
}

export interface MiningScheduleWeek {
  weekStart: string;
  weekEnd: string;
  day: Crew;
  night: Crew;
  resting: Crew[];
  dayLabel: string;
  nightLabel: string;
  restingLabels: string[];
}

export interface MiningHighlight {
  id: string;
  name: string;
  code: string | null;
  m3: number;
  trips: number;
}

/** Онцлох: шөнийн ээлжийн шилдэг оператор, машин, экскаватор; хамгийн их түлш авсан техник. */
export interface MiningHighlights {
  nightOperator: MiningHighlight | null;
  nightTruck: MiningHighlight | null;
  nightExcavator: MiningHighlight | null;
  topFuelVehicle: { id: string; name: string; code: string | null; liters: number; count: number } | null;
}

export interface MiningReport {
  from: string;
  to: string;
  generatedAt: string;
  warnings: string[];
  /** Хуучин backend-д байхгүй. */
  highlights?: MiningHighlights;
  totals: MiningTotals;
  crews: MiningCrewRow[];
  days: MiningDayRow[];
  excavators: MiningExcavatorRow[];
  trucks: MiningTruckRow[];
  operators: MiningOperatorRow[];
  destinations: { type: string; layer: string | null; trips: number; m3: number }[];
  blocks: { name: string; layer: string | null; trips: number; m3: number }[];
  schedule: MiningScheduleWeek[];
}

export type CrewSource = 'manual' | 'default';

export interface CrewSegment {
  start: string;
  end: string;
  day: Crew;
  night: Crew;
  resting: Crew[];
  source: CrewSource;
  dayLabel: string;
  nightLabel: string;
  restingLabels: string[];
}

export interface CrewSchedule {
  anchorDate: string;
  labels: Record<Crew, string>;
  current: {
    operationalDate: string;
    shiftType: 'day' | 'night';
    crew: Crew | null;
    label: string | null;
    dayCrew: Crew | null;
    nightCrew: Crew | null;
    source?: CrewSource | null;
  };
  days?: { date: string; day: Crew; night: Crew; source: CrewSource }[];
  segments?: CrewSegment[];
  weeks: MiningScheduleWeek[];
}

/** Вебээс гараар оруулсан ээлжийн хуваарь. */
export interface CrewPeriod {
  id: string;
  startDate: string;
  endDate: string;
  dayCrew: Crew;
  nightCrew: Crew;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrewPeriodInput {
  startDate: string;
  endDate: string;
  dayCrew: Crew;
  nightCrew: Crew;
  notes?: string | null;
}
