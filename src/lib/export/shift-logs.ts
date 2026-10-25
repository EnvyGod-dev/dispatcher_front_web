import { exportExcel } from '@/lib/fuel/export';
import { fetchAllPages } from '@/lib/export/fetch-all';
import equipmentShiftLogService, {
  type IdleEntry,
  type RepairEntry,
  type ShiftLog,
  type ShiftLogDetail,
} from '@/services/internal/equipment-shift-log';
import { vehicleTypeLabels } from '@/services/internal/vehicle/types';

const num = (value: string | null | undefined) =>
  value === null || value === undefined || value === '' ? null : Number(value);

const vehicleLabel = (log: ShiftLog) => log.vehicle?.mineNumber || log.vehicle?.name || '';

const personName = (p: { name: string | null; firstName: string | null; lastName: string | null } | null) =>
  p ? [p.lastName, p.firstName].filter(Boolean).join(' ') || p.name || '' : '';

const shiftLabel = (log: ShiftLog) => (log.shiftType === 'night' ? 'Шөнө' : 'Өдөр');

/** Дэлгэрэнгүйг (шалтгаан тус бүр) зэрэг 6-аар татна. */
async function fetchDetails(logs: ShiftLog[]) {
  const details: ShiftLogDetail[] = [];
  for (let i = 0; i < logs.length; i += 6) {
    const batch = await Promise.all(
      logs.slice(i, i + 6).map((log) => equipmentShiftLogService.getLogById(log.id)),
    );
    details.push(...batch);
  }
  return details;
}

/**
 * Цаг ашиглалтын бүртгэлийг Excel-д: нэгдсэн хуудас + шалтгаан тус бүрийн хуудас.
 * `focus = 'idle'` бол сул зогсолт, `'repair'` бол засварын задаргаа.
 */
export async function exportShiftLogs({
  startDate,
  endDate,
  focus,
}: {
  startDate?: string;
  endDate?: string;
  focus: 'idle' | 'repair';
}) {
  const logs = await fetchAllPages<ShiftLog>((offset, limit) =>
    equipmentShiftLogService.getLogs({ offset, limit, startDate, endDate }),
  );

  if (!logs.length) return 0;

  const withEntries = logs.filter((log) =>
    focus === 'idle' ? (num(log.idleHours) ?? 0) > 0 : (num(log.repairHours) ?? 0) > 0,
  );
  const details = await fetchDetails(withEntries);

  type IdleRow = IdleEntry & { log: ShiftLog };
  type RepairRow = RepairEntry & { log: ShiftLog };
  const idleRows: IdleRow[] = details.flatMap((d) => (d.idleEntries ?? []).map((e) => ({ ...e, log: d })));
  const repairRows: RepairRow[] = details.flatMap((d) => (d.repairEntries ?? []).map((e) => ({ ...e, log: d })));

  const period = [startDate, endDate].filter(Boolean).join('_');

  exportExcel(`${focus === 'idle' ? 'tsag-ashiglalt' : 'zasvar'}${period ? `_${period}` : ''}`, [
    {
      name: 'Цаг бүртгэл',
      rows: logs,
      columns: [
        { header: 'Огноо', value: (l: ShiftLog) => l.operationalDate, width: 12 },
        { header: 'Ээлж', value: shiftLabel, width: 8 },
        { header: 'Техник', value: vehicleLabel, width: 14 },
        { header: 'Төрөл', value: (l: ShiftLog) => (l.vehicle?.type ? vehicleTypeLabels[l.vehicle.type] ?? l.vehicle.type : ''), width: 14 },
        { header: 'Оператор', value: (l: ShiftLog) => personName(l.operator), width: 18 },
        { header: 'Нийт цаг', value: (l: ShiftLog) => num(l.totalHours), width: 10 },
        { header: 'Ажилласан', value: (l: ShiftLog) => num(l.workedHours), width: 10 },
        { header: 'Засвар', value: (l: ShiftLog) => num(l.repairHours), width: 9 },
        { header: 'Сул зогсолт', value: (l: ShiftLog) => num(l.idleHours), width: 11 },
        { header: 'Түлш (л)', value: (l: ShiftLog) => num(l.fuelReceived), width: 9 },
        { header: 'Тэмдэглэл', value: (l: ShiftLog) => l.notes ?? '', width: 30 },
      ],
    },
    focus === 'idle'
      ? {
          name: 'Сул зогсолт',
          rows: idleRows,
          columns: [
            { header: 'Огноо', value: (r: IdleRow) => r.log.operationalDate, width: 12 },
            { header: 'Ээлж', value: (r: IdleRow) => shiftLabel(r.log), width: 8 },
            { header: 'Техник', value: (r: IdleRow) => vehicleLabel(r.log), width: 14 },
            { header: 'Шалтгаан', value: (r: IdleRow) => r.reasonName ?? '', width: 26 },
            { header: 'Цаг', value: (r: IdleRow) => num(r.hours), width: 8 },
            { header: 'Тэмдэглэл', value: (r: IdleRow) => r.notes ?? '', width: 30 },
          ],
        }
      : {
          name: 'Засвар',
          rows: repairRows,
          columns: [
            { header: 'Огноо', value: (r: RepairRow) => r.log.operationalDate, width: 12 },
            { header: 'Ээлж', value: (r: RepairRow) => shiftLabel(r.log), width: 8 },
            { header: 'Техник', value: (r: RepairRow) => vehicleLabel(r.log), width: 14 },
            { header: 'Шалтгаан / төрөл', value: (r: RepairRow) => r.reasonName ?? '', width: 26 },
            { header: 'Механик', value: (r: RepairRow) => personName(r.mechanic), width: 18 },
            { header: 'Цаг', value: (r: RepairRow) => num(r.hours), width: 8 },
            { header: 'Тэмдэглэл', value: (r: RepairRow) => r.notes ?? '', width: 30 },
          ],
        },
  ]);

  return logs.length;
}
