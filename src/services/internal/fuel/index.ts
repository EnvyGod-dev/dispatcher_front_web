import http from '../../index';
import type {
  FuelAlert,
  FuelAuditLog,
  FuelBalance,
  FuelConsumptionReport,
  FuelDashboard,
  FuelIssue,
  FuelIssueInput,
  FuelNorm,
  FuelPeriodSummary,
  FuelMeasureMethod,
  FuelMeasurement,
  FuelOpeningBalance,
  FuelReceipt,
  FuelReceiptEditRequest,
  FuelReceiptInput,
  FuelRecipient,
  FuelRefuelBreakdown,
  FuelRefueling,
  FuelRefuelingFilters,
  FuelRefuelingUpdate,
  FuelSettings,
  FuelSupplier,
  FuelSupplierReport,
  FuelTank,
  FuelVehicle,
} from './types';

const base = '/api/internal/fuel';

type FuelTankInput = Omit<Partial<FuelTank>, 'capacity'> & { name: string; capacity?: number | null };

const body = <T extends object>(value: T) => value as unknown as Record<string, unknown>;

const fuelService = {
  // ── Master data ──────────────────────────────────────────
  getTanks: async () => (await http.get<FuelTank[]>(`${base}/tanks`)).body,
  createTank: (input: FuelTankInput) =>
    http.post<FuelTank>(`${base}/tanks`, { body: body(input) }),
  updateTank: (id: string, input: Partial<FuelTankInput>) =>
    http.put<FuelTank>(`${base}/tanks/${id}`, { body: body(input) }),

  getSuppliers: async () => (await http.get<FuelSupplier[]>(`${base}/suppliers`)).body,
  createSupplier: (input: Partial<FuelSupplier>) =>
    http.post<FuelSupplier>(`${base}/suppliers`, { body: body(input) }),
  updateSupplier: (id: string, input: Partial<FuelSupplier>) =>
    http.put<FuelSupplier>(`${base}/suppliers/${id}`, { body: body(input) }),

  getVehicles: async () => (await http.get<FuelVehicle[]>(`${base}/vehicles`)).body,
  /** Түгээгч машинууд (парк дугаар нь ST-ээр эхэлсэн эсвэл түгээгч гэж тэмдэглэсэн). */
  getDispensers: async () =>
    (await http.get<FuelVehicle[]>(`${base}/vehicles`, { params: { dispenserOnly: 'true' } })).body,

  getNorms: async () => (await http.get<FuelNorm[]>(`${base}/norms`)).body,
  upsertNorm: (input: {
    vehicleModel: string;
    targetLitersPerTrip?: number | null;
    targetLitersPerM3?: number | null;
    thresholdPercent?: number | null;
    isActive?: boolean;
    notes?: string | null;
  }) => http.put<FuelNorm>(`${base}/norms`, { body: body(input) }),
  deleteNorm: (id: string) => http.delete<null>(`${base}/norms/${id}`),

  getSettings: async () => (await http.get<FuelSettings | null>(`${base}/settings`)).body,
  updateSettings: (input: Partial<Omit<FuelSettings, 'defaultThresholdPercent'>> & { defaultThresholdPercent?: number }) =>
    http.put<FuelSettings>(`${base}/settings`, { body: body(input) }),

  getRecipients: async () => (await http.get<FuelRecipient[]>(`${base}/recipients`)).body,
  createRecipient: (input: Omit<FuelRecipient, 'id'>) =>
    http.post<FuelRecipient>(`${base}/recipients`, { body: body(input) }),
  deleteRecipient: (id: string) => http.delete<null>(`${base}/recipients/${id}`),

  // ── Movements ────────────────────────────────────────────
  getRefuelings: async ({ includeCancelled, ...filters }: FuelRefuelingFilters) =>
    (
      await http.get<FuelRefueling[]>(`${base}/refuelings`, {
        params: { ...filters, includeCancelled: includeCancelled ? 'true' : undefined },
      })
    ).body,
  updateRefueling: (id: string, input: FuelRefuelingUpdate) =>
    http.put<FuelRefueling>(`${base}/refuelings/${id}`, { body: body(input) }),
  cancelRefueling: (id: string, reason: string) =>
    http.post<FuelRefueling>(`${base}/refuelings/${id}/cancel`, { body: { reason } }),

  getIssues: async (params: { from?: string; to?: string; tankId?: string; dispenserVehicleId?: string }) =>
    (await http.get<FuelIssue[]>(`${base}/issues`, { params })).body,
  createIssue: (input: FuelIssueInput) => http.post<FuelIssue>(`${base}/issues`, { body: body(input) }),

  getReceipts: async (params: { from?: string; to?: string; tankId?: string; supplierId?: string }) =>
    (await http.get<FuelReceipt[]>(`${base}/receipts`, { params })).body,
  createReceipt: (input: FuelReceiptInput) => http.post<FuelReceipt>(`${base}/receipts`, { body: body(input) }),
  createReceiptEditRequest: (
    id: string,
    input: { type: 'update' | 'cancel'; changes?: Record<string, unknown>; reason: string },
  ) => http.post<FuelReceiptEditRequest>(`${base}/receipts/${id}/edit-requests`, { body: body(input) }),
  resendAct: (id: string) => http.post<unknown>(`${base}/receipts/${id}/act/resend`),

  getEditRequests: async (status?: FuelReceiptEditRequest['status']) =>
    (await http.get<FuelReceiptEditRequest[]>(`${base}/receipt-edit-requests`, { params: { status } })).body,
  approveEditRequest: (id: string, note?: string) =>
    http.post<FuelReceiptEditRequest>(`${base}/receipt-edit-requests/${id}/approve`, { body: { note: note || null } }),
  rejectEditRequest: (id: string, note: string) =>
    http.post<FuelReceiptEditRequest>(`${base}/receipt-edit-requests/${id}/reject`, { body: { note } }),

  // ── Balances ─────────────────────────────────────────────
  getBalances: async (holderType: FuelBalance['holderType']) =>
    (await http.get<FuelBalance[]>(`${base}/balances`, { params: { holderType } })).body,

  getOpeningBalances: async () =>
    (await http.get<FuelOpeningBalance[]>(`${base}/opening-balances`, { params: { holderType: 'tank' } })).body,
  /** Агуулахын эхний (гарааны) үлдэгдэл. Энэ огнооноос өмнө хөдөлгөөн байж болохгүй. */
  createOpeningBalance: (input: {
    holderId: string;
    balanceAt: string;
    quantity: number;
    method: FuelMeasureMethod;
    notes?: string | null;
  }) => http.post<FuelOpeningBalance>(`${base}/opening-balances`, { body: { holderType: 'tank', ...input } }),

  getMeasurements: async (tankId?: string) =>
    (await http.get<FuelMeasurement[]>(`${base}/measurements`, { params: { holderType: 'tank', tankId } })).body,
  /** Бодит хэмжилт. applyAdjustment үед тооцоолсон үлдэгдлийг хэмжсэнтэй тэнцүүлэх тохируулга үүснэ. */
  createMeasurement: (input: {
    holderId: string;
    measuredAt: string;
    measuredQuantity: number;
    method: FuelMeasureMethod;
    applyAdjustment: boolean;
    notes?: string | null;
  }) => http.post<FuelMeasurement>(`${base}/measurements`, { body: { holderType: 'tank', ...input } }),

  // ── Analytics ────────────────────────────────────────────
  getDashboard: async (from: string, to: string) =>
    (await http.get<FuelDashboard>(`${base}/reports/dashboard`, { params: { from, to } })).body,
  getSummary: async (from: string, to: string, granularity: FuelPeriodSummary['granularity']) =>
    (await http.get<FuelPeriodSummary>(`${base}/reports/summary`, { params: { from, to, granularity } })).body,
  getSupplierReport: async (from: string, to: string) =>
    (await http.get<FuelSupplierReport>(`${base}/reports/receipts-by-supplier`, { params: { from, to } })).body,
  getRefuelBreakdown: async (from: string, to: string) =>
    (await http.get<FuelRefuelBreakdown>(`${base}/reports/refuel-breakdown`, { params: { from, to } })).body,
  getConsumption: async (params: { from: string; to: string; shiftType?: string; vehicleModel?: string }) =>
    (await http.get<FuelConsumptionReport>(`${base}/consumption`, { params })).body,
  getAlerts: async (status?: FuelAlert['status']) =>
    (await http.get<FuelAlert[]>(`${base}/alerts`, { params: { status } })).body,
  closeAlert: (id: string, reason: string) => http.post<FuelAlert>(`${base}/alerts/${id}/close`, { body: { reason } }),
  evaluateAlerts: () => http.post<unknown>(`${base}/alerts/evaluate`, { body: {} }),

  getAudit: async (params: { entityType?: string; limit?: number }) =>
    (
      await http.get<FuelAuditLog[]>(`${base}/audit`, {
        params: { entityType: params.entityType, limit: params.limit ? String(params.limit) : undefined },
      })
    ).body,
};

export default fuelService;
