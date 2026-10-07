import { formatDateFull } from '@/lib/time-formatter';
import {
  ShiftInspectionReportRow,
  ShiftReport,
  ShiftReportFilters,
} from '@/services/internal/shift-report/types';
import worklogService from '@/services/internal/work-log';
import { WorkLogReport } from '@/services/internal/work-log/types';
import { vehicleTypeLabels } from '@/services/internal/vehicle/types';
import * as XLSX from 'xlsx';

export type ExportType = 'shifts' | 'worklogs' | 'shift-inspections';
export type ExportFormat = 'csv' | 'xlsx';

interface ColumnMapping {
  key: string;
  label: string;
  getValue: (shift: ShiftReport) => string | number;
}

type ProductionSource = {
  coalProduct?: string | number | null;
  soilProduct?: string | number | null;
};

// ---------------------------------------------------------------------------
// Inspection detail export types
// ---------------------------------------------------------------------------

export type ShiftInspectionDetailItem = {
  inspectionName: string;
  type: string;
  status: string;
  notes: string | null;
  photoUrl: string | null;
};

export type ShiftInspectionDetailExportData = {
  vehicleCode: string;
  vehicleName: string;
  driverName: string;
  operationalDate: string;
  shiftType: string;
  totalCount: number;
  normalCount: number;
  needsInspectionCount: number;
  issueCount: number;
  groups: {
    type: string;
    items: ShiftInspectionDetailItem[];
  }[];
};

// ---------------------------------------------------------------------------
// Number helpers
// ---------------------------------------------------------------------------

function parseExportNumber(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const commaNormalized =
    trimmed.includes(',') && !trimmed.includes('.')
      ? trimmed.replace(',', '.')
      : trimmed.replace(/,/g, '');

  const normalized = commaNormalized.replace(/[^0-9.-]/g, '');
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundForExport(value: number): number {
  return Number(value.toFixed(2));
}

function getShiftProductionBreakdown(shift: ProductionSource) {
  const coal = parseExportNumber(shift.coalProduct);
  const soil = parseExportNumber(shift.soilProduct);

  if (coal === null && soil === null) return null;

  const safeCoal = coal ?? 0;
  const safeSoil = soil ?? 0;

  return {
    coal: roundForExport(safeCoal),
    soil: roundForExport(safeSoil),
    total: roundForExport(safeCoal + safeSoil),
  };
}

// ---------------------------------------------------------------------------
// Shift column mappings
// ---------------------------------------------------------------------------

const shiftColumnMappings: Record<string, ColumnMapping> = {
  driver: {
    key: 'driver',
    label: 'Оператор',
    getValue: (shift) =>
      shift.driver
        ? `${shift.driver.firstName} ${shift.driver.lastName}`
        : shift.driverName || '-',
  },
  vehicle: {
    key: 'vehicle',
    label: 'Техник',
    getValue: (shift) => shift.vehicle?.code || shift.vehicleName || '-',
  },
  shiftType: {
    key: 'shiftType',
    label: 'Ээлж',
    getValue: (shift) => (shift.shiftType === 'day' ? 'Өдрийн' : 'Шөнийн'),
  },
  shiftTime: {
    key: 'shiftStart',
    label: 'Эхэлсэн цаг',
    getValue: (shift) => formatDateFull(shift.shiftStart) || '',
  },
  shiftStart: {
    key: 'shiftStart',
    label: 'Ээлж эхэлсэн',
    getValue: (shift) => formatDateFull(shift.shiftStart) || '',
  },
  shiftEnd: {
    key: 'shiftEnd',
    label: 'Дууссан цаг',
    getValue: (shift) =>
      shift.shiftEnd ? formatDateFull(shift.shiftEnd) || '' : '-',
  },
  trips: {
    key: 'trips',
    label: 'Рейс',
    getValue: (shift) => shift.workLogsCount || shift.workLogs?.length || 0,
  },
  coalWorkLogCount: {
    key: 'coalWorkLogCount',
    label: 'Нүүрсний Рейс',
    getValue: (shift) => shift.coalWorkLogCount || 0,
  },
  soilWorkLogCount: {
    key: 'soilWorkLogCount',
    label: 'Хөрсний Рейс',
    getValue: (shift) => shift.soilWorkLogCount || 0,
  },
  coalProduct: {
    key: 'coalProduct',
    label: 'Нүүрс (м3)',
    getValue: (shift) => getShiftProductionBreakdown(shift)?.coal ?? 0,
  },
  soilProduct: {
    key: 'soilProduct',
    label: 'Хөрс (м3)',
    getValue: (shift) => getShiftProductionBreakdown(shift)?.soil ?? 0,
  },
  totalProduct: {
    key: 'totalProduct',
    label: 'Нийт бүтээгдэхүүн (м3)',
    getValue: (shift) => getShiftProductionBreakdown(shift)?.total ?? 0,
  },
  mileage: {
    key: 'mileage',
    label: 'Гүйлт (км)',
    getValue: (shift) => {
      const start = parseFloat(shift.mileageStart?.toString() || '0');
      const end = parseFloat(shift.mileageEnd?.toString() || '0');
      return Math.max(0, end - start);
    },
  },
  motoHours: {
    key: 'motoHours',
    label: 'Мотоцаг',
    getValue: (shift) => {
      const start = parseFloat(shift.motoStart?.toString() || '0');
      const end = parseFloat(shift.motoEnd?.toString() || '0');
      return Math.max(0, end - start);
    },
  },
  motoStart: {
    key: 'motoStart',
    label: 'Эхлэх мотоцаг',
    getValue: (shift) => parseFloat(shift.motoStart?.toString() || '0'),
  },
  motoEnd: {
    key: 'motoEnd',
    label: 'Дуусах мотоцаг',
    getValue: (shift) => parseFloat(shift.motoEnd?.toString() || '0'),
  },
  shiftStatus: {
    key: 'shiftStatus',
    label: 'Төлөв',
    getValue: (shift) => {
      switch (shift.status) {
        case 'started': return 'Эхэлсэн';
        case 'completed': return 'Дууссан';
        case 'cancelled': return 'Цуцлагдсан';
        default: return shift.status;
      }
    },
  },
  issue: {
    key: 'issue',
    label: 'Үзлэг',
    getValue: (shift) => {
      const hasIssues =
        shift.hasInspectionIssues ||
        shift.inspections?.some((i) => i.status !== 'normal') ||
        false;
      return hasIssues ? 'Аюултай' : 'Хэвийн';
    },
  },
  issueInspectionNames: {
    key: 'issueInspectionNames',
    label: 'Аюултай үзлэгийн нэрс',
    getValue: (shift) => shift.issueInspectionNames || '-',
  },
  comment: {
    key: 'comment',
    label: 'Тэмдэглэл',
    getValue: (shift) => (shift as any).comment || '-',
  },
};

// ---------------------------------------------------------------------------
// Inspection helpers
// ---------------------------------------------------------------------------

const COMMENT_COL = 'Тайлбар' as const;

function getRowComment(row: ShiftInspectionReportRow): string {
  return row.issueInspectionNames?.trim() || '-';
}

// ---------------------------------------------------------------------------
// Worklog export helpers
// ---------------------------------------------------------------------------

type WorkLogFilters = Omit<ShiftReportFilters, 'offset' | 'limit'>;
type WorkLogCellValue = string | number;

type StockpileColumn = { key: string; label: string };

type ExcavatorExportSummary = {
  pickupBlocks: Set<string>;
  stockpileCounts: Map<string, number>;
  production: number;
};

type ExcavatorColumnGroup = {
  vehicleCode: string;
  stockpiles: StockpileColumn[];
};

type ShiftInspectionExportOptions = { filterSummary?: string[] };

function formatShiftType(shiftType: string): string {
  return shiftType === 'day' ? 'Өдрийн' : 'Шөнийн';
}

function formatShiftStatus(status: string): string {
  switch (status) {
    case 'started': return 'Эхэлсэн';
    case 'completed': return 'Дууссан';
    case 'cancelled': return 'Цуцлагдсан';
    default: return status;
  }
}

function formatInspectionStatus(status: string): string {
  switch (status) {
    case 'normal': return 'Хэвийн';
    case 'needs_inspection': return 'Анхаарах';
    case 'issue': return 'Аюултай';
    default: return status;
  }
}

function getShiftInspectionResult(row: ShiftInspectionReportRow): string {
  if (!row.hasInspection) return 'Хийгдээгүй';

  const parts: string[] = [];
  if (row.issueCount > 0) parts.push('Аюултай');
  if (row.needsInspectionCount > 0) parts.push('Анхаарах');

  return parts.length === 0 ? 'Хэвийн' : parts.join(', ');
}

// ---------------------------------------------------------------------------
// Sheet columns
// ---------------------------------------------------------------------------

const FLAT_COLUMNS = [
  'Огноо / Ээлж',
  'Оператор',
  'Албан тушаал',
  'Техник',
  'Техникийн нэр',
  'Техникийн төрөл',
  'Ээлжийн төлөв',
  'Үзлэг',
  'Үзлэгийн үр дүн',
  'Аюултай үзлэгийн нэрс',
  COMMENT_COL,
  'Хэвийн',
  'Анхаарах',
  'Аюултай',
  'Ээлж эхэлсэн',
  'Ээлж дууссан',
] as const;

type FlatColumnKey = (typeof FLAT_COLUMNS)[number];

function buildShiftInspectionExportRecords(
  rows: ShiftInspectionReportRow[]
): Record<FlatColumnKey, string | number>[] {
  return rows.map((row) => ({
    'Огноо / Ээлж': `${row.operationalDate ?? '-'} / ${formatShiftType(row.shiftType)}`,
    Оператор: `${row.driverFirstName} ${row.driverLastName}`,
    'Албан тушаал': row.driverPosition ?? '-',
    Техник: row.vehicleCode,
    'Техникийн нэр': row.vehicleName,
    'Техникийн төрөл': vehicleTypeLabels[row.vehicleType] ?? row.vehicleType,
    'Ээлжийн төлөв': formatShiftStatus(row.shiftStatus),
    Үзлэг: row.hasInspection ? 'Тийм' : 'Үгүй',
    'Үзлэгийн үр дүн': getShiftInspectionResult(row),
    'Аюултай үзлэгийн нэрс': row.issueInspectionNames || '-',
    [COMMENT_COL]: getRowComment(row),
    Хэвийн: row.normalCount,
    Анхаарах: row.needsInspectionCount,
    Аюултай: row.issueCount,
    'Ээлж эхэлсэн': formatDateFull(row.shiftStart) || '-',
    'Ээлж дууссан': row.shiftEnd ? formatDateFull(row.shiftEnd) || '-' : '-',
  }));
}

// ---------------------------------------------------------------------------
// Worklog helpers
// ---------------------------------------------------------------------------

function getWorkLogVehicleCodes(workLogReports: WorkLogReport[]): string[] {
  const vehicleCodes = new Set<string>();
  for (const report of workLogReports) {
    for (const workLog of report.workLogs ?? []) {
      const vehicleCode = workLog.dailyPlan?.vehicle?.code;
      if (vehicleCode) vehicleCodes.add(vehicleCode);
    }
  }
  return Array.from(vehicleCodes).sort((a, b) => a.localeCompare(b));
}

const baseWorkLogColumns = [
  'Оператор', 'Техник', 'Ээлж', 'Ээлж эхэлсэн', 'Ээлж дууссан',
  'Эхлэх мото цаг', 'Дуусах мото цаг', 'Эхлэх км', 'Дуусах км',
  'Нийт Рейс', 'Нийт бүтээл м3', 'Төлөв',
] as const;

function getStockpileLabel(type?: string, layerNumber?: string): string {
  const typeLabel = type === 'soil' ? 'Хөрс' : type === 'coal' ? 'Нүүрс' : '';
  const layerLabel = layerNumber?.trim() || '';
  return [typeLabel, layerLabel].filter(Boolean).join(' ').trim() || '-';
}

function getStockpileKey(type?: string, layerNumber?: string): string {
  return `${type ?? 'unknown'}::${layerNumber?.trim() ?? ''}`;
}

function toDisplayValue(values: Set<string>): string {
  if (values.size === 0) return '-';
  return Array.from(values).sort((a, b) => a.localeCompare(b)).join(', ');
}

function toNumber(value: string | number | null | undefined): number {
  return parseExportNumber(value) ?? 0;
}

function getExcavatorColumnGroups(
  workLogReports: WorkLogReport[]
): ExcavatorColumnGroup[] {
  const groupedStockpiles = new Map<string, Map<string, StockpileColumn>>();

  for (const report of workLogReports) {
    for (const workLog of report.workLogs ?? []) {
      const vehicleCode = workLog.dailyPlan?.vehicle?.code;
      if (!vehicleCode) continue;

      const stockpileMap = groupedStockpiles.get(vehicleCode) ?? new Map<string, StockpileColumn>();
      const stockpileKey = getStockpileKey(workLog.stockpile?.type, workLog.stockpile?.layerNumber);

      stockpileMap.set(stockpileKey, {
        key: stockpileKey,
        label: getStockpileLabel(workLog.stockpile?.type, workLog.stockpile?.layerNumber),
      });
      groupedStockpiles.set(vehicleCode, stockpileMap);
    }
  }

  return getWorkLogVehicleCodes(workLogReports).map((vehicleCode) => ({
    vehicleCode,
    stockpiles: Array.from(groupedStockpiles.get(vehicleCode)?.values() ?? [])
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

function getExcavatorSummaries(report: WorkLogReport) {
  const summaries = new Map<string, ExcavatorExportSummary>();

  for (const workLog of report.workLogs ?? []) {
    const excavator = workLog.dailyPlan?.vehicle;
    const vehicleCode = excavator?.code;
    if (!vehicleCode) continue;

    const summary = summaries.get(vehicleCode) ?? {
      pickupBlocks: new Set<string>(),
      stockpileCounts: new Map<string, number>(),
      production: 0,
    };

    const pickupBlockName = workLog.dailyPlan?.miningBlock?.name?.trim();
    if (pickupBlockName) summary.pickupBlocks.add(pickupBlockName);

    const stockpileKey = getStockpileKey(workLog.stockpile?.type, workLog.stockpile?.layerNumber);
    summary.stockpileCounts.set(stockpileKey, (summary.stockpileCounts.get(stockpileKey) ?? 0) + 1);

    const coefficient =
      workLog.stockpile?.type === 'soil'
        ? toNumber(excavator?.soilCoefficient)
        : toNumber(excavator?.coalCoefficient);

    summary.production += coefficient;
    summaries.set(vehicleCode, summary);
  }

  return summaries;
}

function getDerivedWorkLogProduction(
  excavatorSummaries: Map<string, ExcavatorExportSummary>
): number {
  return roundForExport(
    Array.from(excavatorSummaries.values()).reduce((sum, s) => sum + s.production, 0)
  );
}

function getReportTotalProduction(
  report: ProductionSource,
  excavatorSummaries: Map<string, ExcavatorExportSummary>
): number {
  const shiftProduction = getShiftProductionBreakdown(report);
  return shiftProduction !== null
    ? shiftProduction.total
    : getDerivedWorkLogProduction(excavatorSummaries);
}

function buildWorkLogExportRows(
  workLogReports: WorkLogReport[]
): Record<string, WorkLogCellValue>[] {
  const excavatorGroups = getExcavatorColumnGroups(workLogReports);

  return workLogReports.map((report) => {
    const driverName = report.driver
      ? `${report.driver.firstName} ${report.driver.lastName}`.trim()
      : (report as any).driverName || '-';
    const excavatorSummaries = getExcavatorSummaries(report);

    const row: Record<string, WorkLogCellValue> = {
      Оператор: driverName || '-',
      Техник: report.vehicle?.code || '-',
      Ээлж: formatShiftType(report.shiftType),
      'Ээлж эхэлсэн': formatDateFull(report.shiftStart) || '-',
      'Ээлж дууссан': report.shiftEnd ? (formatDateFull(report.shiftEnd) ?? '-') : '-',
      'Эхлэх мото цаг': report.motoStart ?? '-',
      'Дуусах мото цаг': report.motoEnd ?? '-',
      'Эхлэх км': report.mileageStart ?? '-',
      'Дуусах км': report.mileageEnd ?? '-',
      'Нийт Рейс': report.workLogs?.length || 0,
      'Нийт бүтээл м3': getReportTotalProduction(report, excavatorSummaries),
      Төлөв: formatShiftStatus(report.status),
    };

    excavatorGroups.forEach(({ vehicleCode, stockpiles }) => {
      const summary = excavatorSummaries.get(vehicleCode);
      row[`${vehicleCode} ачих блок`] = summary ? toDisplayValue(summary.pickupBlocks) : '-';
      stockpiles.forEach((stockpile) => {
        row[`${vehicleCode} ${stockpile.label}`] = summary?.stockpileCounts.get(stockpile.key) ?? 0;
      });
    });

    return row;
  });
}

function buildWorkLogGroupedSheet(workLogReports: WorkLogReport[]) {
  const excavatorGroups = getExcavatorColumnGroups(workLogReports);

  const headerRow1: WorkLogCellValue[] = [...baseWorkLogColumns];
  const headerRow2: WorkLogCellValue[] = baseWorkLogColumns.map(() => '');
  const merges: XLSX.Range[] = [];

  baseWorkLogColumns.forEach((_, index) => {
    merges.push({ s: { r: 0, c: index }, e: { r: 1, c: index } });
  });

  let currentColumn = baseWorkLogColumns.length;

  excavatorGroups.forEach(({ vehicleCode, stockpiles }) => {
    const groupWidth = 1 + stockpiles.length;
    headerRow1.push(vehicleCode, ...Array.from({ length: groupWidth - 1 }, () => ''));
    headerRow2.push('Ачих блок', ...stockpiles.map((s) => s.label));
    merges.push({ s: { r: 0, c: currentColumn }, e: { r: 0, c: currentColumn + groupWidth - 1 } });
    currentColumn += groupWidth;
  });

  const dataRows = workLogReports.map((report) => {
    const driverName = report.driver
      ? `${report.driver.firstName} ${report.driver.lastName}`.trim()
      : (report as any).driverName || '-';
    const excavatorSummaries = getExcavatorSummaries(report);

    const row: WorkLogCellValue[] = [
      driverName || '-',
      report.vehicle?.code || '-',
      formatShiftType(report.shiftType),
      formatDateFull(report.shiftStart) || '-',
      report.shiftEnd ? (formatDateFull(report.shiftEnd) ?? '-') : '-',
      report.motoStart ?? '-',
      report.motoEnd ?? '-',
      report.mileageStart ?? '-',
      report.mileageEnd ?? '-',
      report.workLogs?.length || 0,
      getReportTotalProduction(report, excavatorSummaries),
      formatShiftStatus(report.status),
    ];

    excavatorGroups.forEach(({ vehicleCode, stockpiles }) => {
      const summary = excavatorSummaries.get(vehicleCode);
      row.push(summary ? toDisplayValue(summary.pickupBlocks) : '-');
      stockpiles.forEach((stockpile) => {
        row.push(summary?.stockpileCounts.get(stockpile.key) ?? 0);
      });
    });

    return row;
  });

  const allRows = [headerRow1, headerRow2, ...dataRows];
  const columnCount = allRows[0]?.length ?? 0;
  const cols = Array.from({ length: columnCount }, (_, columnIndex) => {
    const width = allRows.reduce((maxWidth, row) => {
      const cell = row[columnIndex];
      return Math.max(maxWidth, String(cell ?? '').length);
    }, 12);
    return { wch: Math.min(Math.max(width + 2, 14), 32) };
  });

  return { rows: allRows, merges, cols };
}

// ---------------------------------------------------------------------------
// Public export service
// ---------------------------------------------------------------------------

export class ShiftReportExportService {
  static exportShifts(
    shifts: ShiftReport[],
    visibleColumns: string[],
    format: ExportFormat,
    /** Дээд талын картуудын мэдээлэл: [хэсэг, үзүүлэлт, утга, тайлбар] — Excel-д "Тойм" хуудас болно. */
    summary?: [string, string, string | number, string][],
  ): void {
    const columns = visibleColumns
      .map((col) => {
        const mapping = shiftColumnMappings[col];
        if (!mapping) console.warn(`Missing mapping for column: ${col}`);
        return mapping;
      })
      .filter((mapping): mapping is ColumnMapping => mapping !== undefined);

    console.log(columns, 'columns');

    if (visibleColumns.includes('shiftTime')) {
      columns.push(shiftColumnMappings.shiftEnd);
    }

    if (!columns.some((c) => c.key === 'issueInspectionNames')) {
      columns.push(shiftColumnMappings.issueInspectionNames);
    }

    if (!columns.some((c) => c.key === 'comment')) {
      columns.push(shiftColumnMappings.comment);
    }

    const exportData = shifts.map((shift) => {
      const row: Record<string, any> = {};
      columns.forEach((col) => { row[col.label] = col.getValue(shift); });
      return row;
    });

    if (format === 'xlsx' && summary?.length) {
      this.downloadXLSXWithSummary(exportData, summary, `shift-report-${this.getDateString()}`);
      return;
    }

    this.downloadFile(exportData, `shift-report-${this.getDateString()}`, format);
  }

  private static downloadXLSXWithSummary(
    data: Record<string, unknown>[],
    summary: [string, string, string | number, string][],
    filename: string,
  ): void {
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([['Хэсэг', 'Үзүүлэлт', 'Утга', 'Тайлбар'], ...summary]);
    summarySheet['!cols'] = [{ wch: 22 }, { wch: 36 }, { wch: 26 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Тойм');

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = Object.keys(data[0] ?? {}).map(() => ({ wch: 15 }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Тайлан');

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  static async exportWorkLogs(
    format: ExportFormat = 'xlsx',
    filters?: WorkLogFilters
  ): Promise<void> {
    try {
      const workLogResponse = await worklogService.getWorkLogReport(filters);
      const workLogs = workLogResponse.data;

      if (format === 'csv') {
        this.exportWorkLogsDirectCSV(workLogs);
      } else {
        this.exportWorkLogsGroupedByVehicle(workLogs);
      }
    } catch (error) {
      console.error('Failed to export work logs:', error);
      throw error;
    }
  }

  static async exportShiftInspections(
    rows: ShiftInspectionReportRow[],
    options: ShiftInspectionExportOptions & { format?: ExportFormat } = {}
  ): Promise<void> {
    const { format = 'xlsx', filterSummary = [] } = options;
    const exportData = buildShiftInspectionExportRecords(rows);

    if (format === 'csv') {
      this.downloadCSV(exportData, `shift-inspection-report-${this.getDateString()}`);
      return;
    }

    await this.downloadShiftInspectionXLSX(
      exportData,
      `shift-inspection-report-${this.getDateString()}`,
      filterSummary,
      rows
    );
  }

  // -------------------------------------------------------------------------
  // Inspection detail export — тухайн ээлжийн бүх үзлэгийг дэлгэрэнгүй
  // -------------------------------------------------------------------------
  static exportShiftInspectionDetail(data: ShiftInspectionDetailExportData): void {
    const workbook = XLSX.utils.book_new();
    const shiftLabel = formatShiftType(data.shiftType);
    const rows: (string | number)[][] = [];

    // ── Header ──────────────────────────────────────────────────────────────
    rows.push(['Үзлэгийн дэлгэрэнгүй тайлан']);
    rows.push([`Техник: ${data.vehicleCode} — ${data.vehicleName}`]);
    rows.push([`Оператор: ${data.driverName}`]);
    rows.push([`Огноо: ${data.operationalDate} / ${shiftLabel} ээлж`]);
    rows.push([]);

    // ── Summary ─────────────────────────────────────────────────────────────
    rows.push(['Нийт', 'Хэвийн', 'Анхаарах', 'Аюултай']);
    rows.push([
      data.totalCount,
      data.normalCount,
      data.needsInspectionCount,
      data.issueCount,
    ]);
    rows.push([]);

    // ── Groups ──────────────────────────────────────────────────────────────
    for (const group of data.groups) {
      // Group header
      rows.push([`${group.type} (${group.items.length})`]);
      rows.push(['#', 'Үзлэг', 'Төлөв', 'Тэмдэглэл']);

      group.items.forEach((item, idx) => {
        rows.push([
          idx + 1,
          item.inspectionName,
          formatInspectionStatus(item.status),
          item.notes || '-',
        ]);
      });

      rows.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 36 }, // Үзлэг
      { wch: 12 }, // Төлөв
      { wch: 32 }, // Тэмдэглэл
    ];

    // Header мөрүүдийг merge хийх (4 багана = A:D = index 0..3)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Гарчиг
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Техник
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Оператор
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Огноо
    ];

    ws['!rows'] = [
      { hpt: 22 }, // Гарчиг
      { hpt: 18 }, // Техник
      { hpt: 18 }, // Оператор
      { hpt: 18 }, // Огноо
    ];

    XLSX.utils.book_append_sheet(workbook, ws, 'Үзлэгийн дэлгэрэнгүй');

    const filename = `inspection-${data.vehicleCode}-${data.operationalDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  private static exportWorkLogsGroupedByVehicle(workLogReports: WorkLogReport[]): void {
    if (workLogReports.length === 0) return;

    const exportData = buildWorkLogGroupedSheet(workLogReports);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(exportData.rows);
    worksheet['!cols'] = exportData.cols;
    worksheet['!merges'] = exportData.merges;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Worklog Report');
    XLSX.writeFile(workbook, `worklog-report-${this.getDateString()}.xlsx`);
  }

  private static exportWorkLogsDirectCSV(workLogReports: WorkLogReport[]): void {
    const exportData = buildWorkLogExportRows(workLogReports);
    this.downloadCSV(exportData, `worklog-report-${this.getDateString()}`);
  }

  private static downloadFile(
    data: Record<string, any>[],
    filename: string,
    format: ExportFormat
  ): void {
    if (format === 'csv') {
      this.downloadCSV(data, filename);
    } else {
      this.downloadXLSX(data, filename);
    }
  }

  private static downloadCSV(data: Record<string, any>[], filename: string): void {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const v = row[h];
            if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  private static downloadXLSX(data: Record<string, any>[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Тайлан');
    const cols = Object.keys(data[0] ?? {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = cols;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  private static async downloadShiftInspectionXLSX(
    data: Record<FlatColumnKey, string | number>[],
    filename: string,
    filterSummary: string[],
    originalRows?: ShiftInspectionReportRow[]
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // ===== Sheet 1: Техник тус бүрээр grouped =====
    if (originalRows && originalRows.length > 0) {
      const groupedByVehicle = new Map<string, ShiftInspectionReportRow[]>();
      for (const row of originalRows) {
        const existing = groupedByVehicle.get(row.vehicleCode) ?? [];
        existing.push(row);
        groupedByVehicle.set(row.vehicleCode, existing);
      }

      const filtersText =
        filterSummary.length > 0
          ? `Идэвхтэй шүүлт: ${filterSummary.join(' | ')}`
          : 'Идэвхтэй шүүлт: Бүх өгөгдөл';

      const summaryRows: (string | number)[][] = [];
      summaryRows.push(['Үзлэгийн хураангуй']);
      summaryRows.push([`Татсан огноо: ${formatDateFull(new Date().toISOString())}`]);
      summaryRows.push([filtersText]);
      summaryRows.push([]);
      summaryRows.push(['Парк дугаар', 'Үзлэгийн нэр', 'Төлөв', COMMENT_COL, 'Огноо / Ээлж', 'Оператор']);

      for (const [vehicleCode, vehicleRows] of groupedByVehicle) {
        const issueRows = vehicleRows.filter(
          (r) => r.issueCount > 0 || r.needsInspectionCount > 0
        );

        if (issueRows.length === 0) continue;

        let isFirstForVehicle = true;

        for (const row of issueRows) {
          const shiftLabel = `${row.operationalDate ?? ''} / ${row.shiftType === 'day' ? 'Өдрийн' : 'Шөнийн'}`;
          const operatorName = `${row.driverFirstName} ${row.driverLastName}`.trim();
          const issueNames = row.issueInspectionNames
            ? row.issueInspectionNames.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          const commentText = getRowComment(row);
          const statusLabel = row.issueCount > 0 ? 'Аюултай' : 'Анхаарах';

          if (issueNames.length === 0) {
            summaryRows.push([
              isFirstForVehicle ? vehicleCode : '',
              '-',
              statusLabel,
              commentText,
              shiftLabel,
              operatorName,
            ]);
            isFirstForVehicle = false;
          } else {
            for (let i = 0; i < issueNames.length; i++) {
              summaryRows.push([
                isFirstForVehicle && i === 0 ? vehicleCode : '',
                issueNames[i] ?? '',
                statusLabel,
                i === 0 ? commentText : '',
                shiftLabel,
                operatorName,
              ]);
              isFirstForVehicle = false;
            }
          }
        }

        summaryRows.push([]);
      }

      const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws1['!cols'] = [
        { wch: 16 },
        { wch: 36 },
        { wch: 12 },
        { wch: 42 },
        { wch: 22 },
        { wch: 24 },
      ];
      ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      ];
      ws1['!rows'] = [{ hpt: 24 }, { hpt: 18 }, { hpt: 32 }, { hpt: 8 }, { hpt: 22 }];

      XLSX.utils.book_append_sheet(workbook, ws1, 'Үзлэгийн хураангуй');
    }

    // ===== Sheet 2: Бүх мэдээлэл =====
    const filtersText =
      filterSummary.length > 0
        ? `Идэвхтэй шүүлт: ${filterSummary.join(' | ')}`
        : 'Идэвхтэй шүүлт: Бүх өгөгдөл';

    const rows = [
      ['Ээлжийн тайлан (үзлэгээр)'],
      [`Татсан огноо: ${formatDateFull(new Date().toISOString())}`],
      [filtersText],
      [],
      [...FLAT_COLUMNS],
      ...data.map((row) => FLAT_COLUMNS.map((col) => row[col] ?? '-')),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(rows);
    const lastColumnLetter = XLSX.utils.encode_col(FLAT_COLUMNS.length - 1);

    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: FLAT_COLUMNS.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: FLAT_COLUMNS.length - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: FLAT_COLUMNS.length - 1 } },
    ];
    ws2['!cols'] = [
      { wch: 18 }, { wch: 24 }, { wch: 18 }, { wch: 16 },
      { wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 10 },
      { wch: 18 }, { wch: 34 }, { wch: 42 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 22 },
    ];
    ws2['!rows'] = [{ hpt: 24 }, { hpt: 18 }, { hpt: 32 }, { hpt: 8 }, { hpt: 22 }];
    ws2['!autofilter'] = { ref: `A5:${lastColumnLetter}5` };

    XLSX.utils.book_append_sheet(workbook, ws2, 'Бүх мэдээлэл');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private static getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}