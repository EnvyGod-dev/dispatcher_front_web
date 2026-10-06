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

export const fmtMeter = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(Math.round(toNum(value)));

/** Заалтыг бичсэн хэлбэрээр нь (урд талын 0-уудтай); хуучин бичлэгт тоон утгаас. */
export const meterText = (reading?: string | null, numeric?: string | number | null): string | null => {
  if (reading) return reading;
  if (numeric === null || numeric === undefined || numeric === '') return null;
  return String(Math.round(toNum(numeric)));
};

/** Тоолуурын оронгийн тоогоор урдаас нь 0-оор нөхнө. */
export const padReading = (reading: string, digits?: number | null) =>
  digits && digits > 0 && reading.length < digits ? reading.padStart(digits, '0') : reading;

/**
 * Заалтын зөрүү (литр). Тоолуур дүүрээд 0-ээс эхэлсэн бол (9999900 → 0000150) оронгийн тоогоор нөхнө.
 * Төгсгөл нь эхнээсээ бага бөгөөд дүүрсэн биш бол null (серверийн дүрэмтэй ижил).
 */
export const readingDelta = (start: string, end: string, digits?: number | null): number | null => {
  if (!/^\d+$/.test(start) || !/^\d+$/.test(end)) return null;
  const a = BigInt(start);
  const b = BigInt(end);
  if (b >= a) return Number(b - a);
  if (digits && digits > 0) {
    const modulus = BigInt(10) ** BigInt(digits);
    const delta = b + modulus - a;
    if (delta * BigInt(10) <= modulus) return Number(delta);
  }
  return null;
};

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
