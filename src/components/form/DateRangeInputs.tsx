'use client';

import { CalendarDays, X } from 'lucide-react';

import { rangePresets } from '@/lib/fuel/format';
import { cn } from '@/lib/utils';

export type OptionalDateRange = { from?: string; to?: string };

/** Ээлжийн шүүлтүүр: '' бол бүх ээлж. */
export type ShiftFilterValue = '' | 'day' | 'night';

export const shiftFilterOptions: { value: ShiftFilterValue; label: string }[] = [
  { value: '', label: 'Бүх ээлж' },
  { value: 'day', label: 'Өдөр' },
  { value: 'night', label: 'Шөнө' },
];

/** `YYYY-MM-DD...` огноо мужид багтах эсэх (хоосон муж бол бүгд). */
export const inDateRange = (value: string | null | undefined, range: OptionalDateRange) => {
  if (!range.from && !range.to) return true;
  const day = value?.slice(0, 10);
  if (!day) return false;
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
};

export const hasDateRange = (range: OptionalDateRange) => Boolean(range.from || range.to);

/** Ээлж (06:30–18:30 өдөр, бусад нь шөнө) — УБ цагаар, бүртгэсэн цагаас тооцно. */
export const shiftOfTimestamp = (iso: string | null | undefined): 'day' | 'night' | null => {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const ub = new Date(time + 8 * 60 * 60 * 1000);
  const minutes = ub.getUTCHours() * 60 + ub.getUTCMinutes();
  return minutes >= 6 * 60 + 30 && minutes < 18 * 60 + 30 ? 'day' : 'night';
};

export const inShift = (shift: ShiftFilterValue, rowShift: string | null | undefined) =>
  !shift || rowShift === shift;

const inputClass =
  'h-9 w-[150px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90';

const chipClass = (active: boolean) =>
  cn(
    'rounded-full px-3 py-1.5 text-xs font-medium transition',
    active
      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
  );

/** Ээлжийн сонголт (Бүх ээлж / Өдөр / Шөнө). */
export function ShiftChips({
  value,
  onChange,
}: {
  value: ShiftFilterValue;
  onChange: (value: ShiftFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shiftFilterOptions.map((option) => (
        <button
          key={option.value || 'all'}
          type="button"
          onClick={() => onChange(option.value)}
          className={chipClass(value === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Хугацааны хурдан сонголт (Бүгд, Өнөөдөр, Өчигдөр, 7 хоног...). */
export function RangePresetChips({
  value,
  onChange,
  allowAll = true,
}: {
  value: OptionalDateRange;
  onChange: (value: OptionalDateRange) => void;
  allowAll?: boolean;
}) {
  const active = rangePresets.find((p) => {
    const r = p.range();
    return r.from === value.from && r.to === value.to;
  })?.key;

  return (
    <div className="flex flex-wrap gap-1">
      {allowAll && (
        <button type="button" onClick={() => onChange({})} className={chipClass(!hasDateRange(value))}>
          Бүгд
        </button>
      )}
      {rangePresets.map((p) => (
        <button key={p.key} type="button" onClick={() => onChange(p.range())} className={chipClass(active === p.key)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Хайлтын шүүлтүүр: хугацаа (бичиж/сонгож, хурдан сонголттой) + ээлж.
 * Огноог хоосон үлдээж болно; эхлэх > дуусах бол нөгөөг нь тааруулна.
 * `onShiftChange` өгвөл ээлжийн сонголт гарна.
 */
export default function DateRangeInputs({
  value,
  onChange,
  label = 'Огноо',
  shift,
  onShiftChange,
}: {
  value: OptionalDateRange;
  onChange: (value: OptionalDateRange) => void;
  label?: string;
  shift?: ShiftFilterValue;
  onShiftChange?: (value: ShiftFilterValue) => void;
}) {
  const setFrom = (from: string) =>
    onChange({ from: from || undefined, to: from && value.to && from > value.to ? from : value.to });
  const setTo = (to: string) =>
    onChange({ from: to && value.from && to < value.from ? to : value.from, to: to || undefined });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
        <input
          type="date"
          aria-label={`${label} эхлэх`}
          value={value.from ?? ''}
          onChange={(e) => setFrom(e.target.value)}
          className={inputClass}
        />
        <span className="text-gray-400">—</span>
        <input
          type="date"
          aria-label={`${label} дуусах`}
          value={value.to ?? ''}
          onChange={(e) => setTo(e.target.value)}
          className={inputClass}
        />
        {hasDateRange(value) && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
            aria-label="Огноо цэвэрлэх"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <RangePresetChips value={value} onChange={onChange} />
      {onShiftChange && (
        <>
          <span className="hidden h-5 w-px bg-gray-200 sm:block dark:bg-gray-700" />
          <ShiftChips value={shift ?? ''} onChange={onShiftChange} />
        </>
      )}
    </div>
  );
}
