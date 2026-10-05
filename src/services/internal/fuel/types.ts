export type FuelShiftType = 'day' | 'night';
export type FuelType = 'diesel' | 'gasoline';

export interface FuelTank {
  id: string;
  name: string;
  location: string | null;
  capacity: string | null;
  fuelType: FuelType;
  isActive: boolean;
}

export interface FuelSupplier {
  id: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  isActive: boolean;
}

export interface FuelVehicle {
  id: string;
  name: string;
  mineNumber: string | null;
  vehicleNumber: string | null;
  model: string | null;
  type: string | null;
  fuelTankCapacity: string | null;
}

export interface FuelBalance {
  holderType: 'tank' | 'dispenser' | 'equipment';
  holderId: string;
  name: string;
  mineNumber: string | null;
  model: string | null;
  fuelType: string | null;
  capacity: number | null;
  balance: number;
  fillPercent: number | null;
  lastMovementAt: string | null;
}

export interface FuelRefueling {
  id: string;
  clientId: string | null;
  sourceType: 'tank' | 'dispenser';
  tankId: string | null;
  dispenserVehicleId: string | null;
  receiverVehicleId: string;
  quantity: string;
  refueledAt: string;
  operationalDate: string;
  shiftType: FuelShiftType | null;
  meterStart: string | null;
  meterEnd: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  receiverMineNumber: string | null;
  receiverName: string | null;
  receiverModel: string | null;
  tankName: string | null;
  dispenserMineNumber: string | null;
  /** Ажлын өдөр, ээлжийн төрлөөс автоматаар тооцсон ээлж (А/Б/В/Г). */
  crew?: 'A' | 'B' | 'C' | 'D' | null;
  crewLabel?: string | null;
  /** Тухайн ээлжид техникийг жолоодсон оператор. */
  shiftDriverName?: string | null;
  createdAt: string;
}

export interface FuelRefuelingFilters {
  from: string;
  to: string;
  receiverVehicleId?: string;
  tankId?: string;
  shiftType?: FuelShiftType;
  includeCancelled?: boolean;
}

export interface FuelRefuelingUpdate {
  tankId?: string;
  receiverVehicleId?: string;
  quantity?: number | null;
  meterStart?: number | null;
  meterEnd?: number | null;
  shiftType?: FuelShiftType | null;
  notes?: string | null;
  reason: string;
}

export interface FuelReceipt {
  id: string;
  tankId: string;
  supplierId: string;
  fuelType: FuelType;
  quantity: string;
  receivedAt: string;
  operationalDate: string;
  documentNumber: string | null;
  transportVehicleNumber: string | null;
  actNumber: string | null;
  actSource: 'generated' | 'uploaded';
  actFileUrl: string | null;
  emailStatus: 'pending' | 'sent' | 'failed';
  notes: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  tankName: string;
  supplierName: string;
  receivedByName: string | null;
}

export interface FuelReceiptInput {
  tankId: string;
  supplierId: string;
  quantity: number;
  receivedAt: string;
  documentNumber?: string | null;
  transportVehicleNumber?: string | null;
  notes?: string | null;
}

export interface FuelReceiptEditRequest {
  id: string;
  receiptId: string;
  type: 'update' | 'cancel';
  changes: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  createdAt: string;
  actNumber: string | null;
  receiptQuantity: string | null;
  receiptReceivedAt: string | null;
  requestedByName: string | null;
}

export interface FuelMetric {
  actual: number | null;
  groupAverage: number | null;
  norm: number | null;
  baseline: number | null;
  baselineSource: 'group_average' | 'norm' | null;
  deviationPercent: number | null;
  exceeds: boolean;
}

export interface FuelConsumptionRow {
  vehicleId: string;
  mineNumber: string | null;
  name: string;
  model: string | null;
  type: string | null;
  groupKey: string;
  totalRefueled: number;
  tripCount: number;
  volumeM3: number;
  thresholdPercent: number;
  perTrip: FuelMetric;
  perM3: FuelMetric;
}

export interface FuelConsumptionReport {
  from: string;
  to: string;
  rows: FuelConsumptionRow[];
}

export interface FuelAlert {
  id: string;
  vehicleId: string;
  vehicleModel: string;
  periodStart: string;
  periodEnd: string;
  metric: 'liters_per_trip' | 'liters_per_m3';
  actualValue: string;
  averageValue: string;
  baselineSource: string;
  deviationPercent: string;
  thresholdPercent: string;
  totalRefueled: string;
  tripCount: number;
  status: 'open' | 'closed';
  closeReason: string | null;
  closedAt: string | null;
  mineNumber: string | null;
  vehicleName: string;
  closedByName: string | null;
}

export interface FuelSummaryBucket {
  bucket: string;
  received: number;
  issued: number;
  refueled: number;
  refueledFromTank: number;
  refueledFromDispenser: number;
  tankAdjustment: number;
  tankClosing: number;
}

export interface FuelHolderSummary {
  holderType: string;
  holderId: string;
  name: string;
  mineNumber: string | null;
  model: string | null;
  opening: number;
  inflow: number;
  outflow: number;
  adjustment: number;
  closing: number;
}

export interface FuelPeriodSummary {
  from: string;
  to: string;
  granularity: 'day' | 'week' | 'month';
  totals: {
    received: number;
    issued: number;
    refueled: number;
    refueledFromTank: number;
    tankOpening: number;
    tankClosing: number;
  };
  series: FuelSummaryBucket[];
  tanks: FuelHolderSummary[];
  equipment: FuelHolderSummary[];
}

export interface FuelSupplierReport {
  total: number;
  rows: {
    supplierId: string;
    supplierName: string;
    fuelType: FuelType;
    receiptCount: number;
    totalQuantity: number;
    sharePercent: number;
    lastReceivedAt: string;
  }[];
}

export interface FuelDashboard {
  summary: {
    total_receipts: number;
    total_refuelings: number;
    open_alerts: number;
    pending_edit_requests: number;
    failed_act_emails: number;
    tank_total_balance: number;
  };
  tankBalances: FuelBalance[];
}

export interface FuelNorm {
  id: string;
  vehicleModel: string;
  targetLitersPerTrip: string | null;
  targetLitersPerM3: string | null;
  thresholdPercent: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface FuelSettings {
  defaultThresholdPercent: string;
  alertWindowDays: number;
  alertEmailEnabled: boolean;
  actNumberPrefix: string;
}

export interface FuelRecipient {
  id: string;
  purpose: 'act' | 'alert';
  email: string;
  name: string | null;
  isCc: boolean;
  isActive: boolean;
}

export interface FuelAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  userName: string | null;
  userRole: string | null;
}

export type FuelMeasureMethod = 'meter' | 'gauge' | 'sensor' | 'manual' | 'calculated';

export interface FuelOpeningBalance {
  id: string;
  holderType: 'tank' | 'dispenser' | 'equipment';
  tankId: string | null;
  vehicleId: string | null;
  balanceAt: string;
  quantity: string;
  method: FuelMeasureMethod;
  notes: string | null;
  tankName: string | null;
}

export interface FuelMeasurement {
  id: string;
  holderType: 'tank' | 'dispenser' | 'equipment';
  tankId: string | null;
  measuredAt: string;
  calculatedQuantity: string;
  measuredQuantity: string;
  difference: string;
  method: FuelMeasureMethod;
  applyAdjustment: boolean;
  notes: string | null;
  tankName: string | null;
}

/** Зарлага: агуулахаас түгээгч машин (ST...) руу шилжүүлсэн түлш. */
export interface FuelIssue {
  id: string;
  tankId: string;
  dispenserVehicleId: string;
  quantity: string;
  issuedAt: string;
  operationalDate: string;
  notes: string | null;
  createdAt: string;
  tankName: string;
  dispenserMineNumber: string | null;
  dispenserName: string;
}

export interface FuelIssueInput {
  tankId: string;
  dispenserVehicleId: string;
  quantity: number;
  issuedAt: string;
  notes?: string | null;
}

export interface FuelBreakdownVehicle {
  vehicleId: string;
  mineNumber: string | null;
  name: string;
  vehicleNumber: string | null;
  model: string | null;
  type: string | null;
  owner: string | null;
  liters: number;
  count: number;
  day: number;
  night: number;
}

export interface FuelBreakdownSource {
  key: string;
  label: string;
  kind: 'tank' | 'dispenser';
  liters: number;
  count: number;
  meterGap: number;
}

/** Зарлагын (түлш олголтын) задаргаа тайлан. */
export interface FuelRefuelBreakdown {
  from: string;
  to: string;
  total: number;
  day: number;
  night: number;
  count: number;
  daysWithRefuel: number;
  days: { date: string; day: number; night: number; other: number; dayCrew?: string | null; nightCrew?: string | null }[];
  vehicles: FuelBreakdownVehicle[];
  sources: FuelBreakdownSource[];
  /** Ээлжээр (А/Б/В/Г). */
  crews?: { crew: string; label: string; liters: number; count: number; vehicles: number }[];
}
