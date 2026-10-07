import shiftPerformanceService from '@/services/internal/shift-performance';
import shiftReportService from '@/services/internal/shift-report';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';

/** Excel-ийн "Тойм" хуудасны мөр: [хэсэг, үзүүлэлт, утга, тайлбар]. */
export type ShiftSummaryRow = [string, string, string | number, string];

const CREW_LABELS: Record<string, string> = { A: 'А', B: 'Б', C: 'В', D: 'Г' };

const num = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
};

const settled = <T,>(result: PromiseSettledResult<T>) => (result.status === 'fulfilled' ? result.value : null);

/**
 * Ээлжийн тайлангийн дээд талын картуудын мэдээлэл (Ерөнхий үзүүлэлт, Онцлох үзүүлэлтүүд)-ийг
 * Excel-д оруулахаар цуглуулна. Нэг хүсэлт амжилтгүй болсон ч бусад нь гарна.
 */
export const buildShiftSummary = async (filters: ShiftReportFilters): Promise<ShiftSummaryRow[]> => {
  // Хуудаслалт, эрэмбэ хамаарахгүй — картуудтай ижил шүүлтүүр.
  const kpiFilters: ShiftReportFilters = { ...filters };
  delete kpiFilters.offset;
  delete kpiFilters.limit;
  delete kpiFilters.sortColumn;
  delete kpiFilters.sortOrder;

  const [insightsRes, topExcaRes, dumpRes, operatorsRes, inspectionsRes] = await Promise.allSettled([
    shiftReportService.getShiftsInsights(kpiFilters),
    shiftPerformanceService.getTopExcavator(kpiFilters),
    shiftPerformanceService.getMostActiveDump(kpiFilters),
    shiftPerformanceService.getMostActiveOperators(kpiFilters),
    shiftPerformanceService.getTodayInspections(kpiFilters),
  ]);

  const insights = settled(insightsRes)?.body;
  const topExca = settled(topExcaRes)?.data;
  const dump = settled(dumpRes)?.data;
  const operators = settled(operatorsRes)?.data ?? [];
  const inspections = settled(inspectionsRes)?.data;

  const general = 'Ерөнхий үзүүлэлт';
  const highlight = 'Онцлох үзүүлэлтүүд';
  const crew = insights?.topDriverShiftGroup ? `${CREW_LABELS[insights.topDriverShiftGroup] ?? insights.topDriverShiftGroup} ээлж` : '-';
  const vehicle = (v?: { vehicleCode: string | null; vehicleName: string | null } | null) =>
    v ? v.vehicleCode || v.vehicleName || '-' : '-';

  const rows: ShiftSummaryRow[] = [
    [
      general,
      'Шилдэг ээлжийн экскаватор',
      vehicle(insights?.topShiftExcavator),
      insights?.topShiftExcavator
        ? `${crew} · ${num(insights.topShiftExcavator.production)} м³ · ${insights.topShiftExcavator.trips} рейс`
        : '',
    ],
    [
      general,
      'Шилдэг ээлжийн самосвал',
      vehicle(insights?.topShiftDump),
      insights?.topShiftDump ? `${crew} · ${num(insights.topShiftDump.production)} м³ · ${insights.topShiftDump.trips} рейс` : '',
    ],
    [general, 'Нийт рейс', num(insights?.totalTrips), 'Бүртгэгдсэн тээвэрлэлт'],
    [
      general,
      'Нийт бүтээмж (м³)',
      num(insights?.totalProduction),
      `Нүүрс ${num(insights?.totalCoalProduction)} м³ · Хөрс ${num(insights?.totalSoilProduction)} м³`,
    ],
    [general, 'Шилдэг ээлж', crew, `Бүтээмж ${num(insights?.topDriverShiftGroupProduction)} м³`],
    [general, 'Нийт ээлж', num(insights?.totalShifts), `Дууссан ${num(insights?.completedShifts)} · Идэвхтэй ${num(insights?.activeShifts)}`],
    [
      highlight,
      'Хамгийн өндөр бүтээлтэй экскаватор',
      topExca ? `${num(topExca.totalProduction)} м³` : '-',
      topExca
        ? `${[topExca.vehicleName, topExca.vehicleCode].filter(Boolean).join(' · ')} · Хөрс ${num(topExca.soilProduction)} м³ · Нүүрс ${num(topExca.coalProduction)} м³`
        : '',
    ],
    [
      highlight,
      'Хамгийн их рейстэй дамп',
      dump ? `${dump.tripCount} рейс` : '-',
      dump ? `${[dump.vehicleName, dump.vehicleCode].filter(Boolean).join(' · ')} · ${num(dump.totalProduction)} м³` : '',
    ],
    ...operators.slice(0, 3).map<ShiftSummaryRow>((o, i) => [
      highlight,
      `Хамгийн их рейстэй оператор #${i + 1}`,
      `${[o.lastName, o.firstName].filter(Boolean).join(' ')}`.trim() || '-',
      `${o.tripCount} рейс · ${num(o.totalProduction)} м³`,
    ]),
    [
      highlight,
      `Техникийн үзлэг${inspections?.inspectionDate ? ` (${inspections.inspectionDate})` : ''}`,
      inspections ? `${inspections.totalVehicles} техник` : '-',
      inspections
        ? `Хэвийн ${inspections.normalVehicleCount} · Анхаарах ${inspections.needsInspectionVehicleCount} · Аюултай ${inspections.issueVehicleCount}`
        : '',
    ],
  ];

  return rows;
};
