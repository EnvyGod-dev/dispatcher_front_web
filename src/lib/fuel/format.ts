import dayjs from 'dayjs';

export const toNum = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export const fmtNumber = (value: string | number | null | undefined, digits = 1) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = toNum(value);
  return digits === 1
    ? numberFormatter.format(n).replace(/,/g, ' ')
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(n).replace(/,/g, ' ');
};

export const fmtLiters = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : `${fmtNumber(value)} л`;

/** Түгээгчийн тоолуур 7 оронтой (одоогийн уурхайн тоолуур). */
export const METER_DIGITS = 7;

export const fmtMeter = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(Math.round(toNum(value)));

export const fmtDate = (value?: string | null) => (value ? dayjs(value).format('YYYY.MM.DD') : '—');

export const fmtDateTime = (value?: string | null) => (value ? dayjs(value).format('YYYY.MM.DD HH:mm') : '—');

export const fmtTime = (value?: string | null) => (value ? dayjs(value).format('HH:mm') : '—');

export const shiftLabel = (value?: string | null) => (value === 'day' ? 'Өдөр' : value === 'night' ? 'Орой' : '—');

export const fuelTypeLabel = (value?: string | null) => (value === 'gasoline' ? 'Бензин' : 'Дизель');

export const dateStr = (date: dayjs.Dayjs | Date) => dayjs(date).format('YYYY-MM-DD');

export type DateRange = { from: string; to: string };

export const rangePresets: { key: string; label: string; range: () => DateRange }[] = [
  { key: 'today', label: 'Өнөөдөр', range: () => ({ from: dateStr(dayjs()), to: dateStr(dayjs()) }) },
  {
    key: 'yesterday',
    label: 'Өчигдөр',
    range: () => ({ from: dateStr(dayjs().subtract(1, 'day')), to: dateStr(dayjs().subtract(1, 'day')) }),
  },
  { key: '7d', label: '7 хоног', range: () => ({ from: dateStr(dayjs().subtract(6, 'day')), to: dateStr(dayjs()) }) },
  { key: '30d', label: '30 хоног', range: () => ({ from: dateStr(dayjs().subtract(29, 'day')), to: dateStr(dayjs()) }) },
  { key: 'month', label: 'Энэ сар', range: () => ({ from: dateStr(dayjs().startOf('month')), to: dateStr(dayjs()) }) },
  {
    key: 'prev-month',
    label: 'Өмнөх сар',
    range: () => ({
      from: dateStr(dayjs().subtract(1, 'month').startOf('month')),
      to: dateStr(dayjs().subtract(1, 'month').endOf('month')),
    }),
  },
];

export const errorMessage = (error: unknown, fallback = 'Алдаа гарлаа') =>
  (error as { message?: string })?.message || fallback;
