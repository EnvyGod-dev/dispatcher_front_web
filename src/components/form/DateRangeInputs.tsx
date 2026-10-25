'use client';

import { CalendarDays, X } from 'lucide-react';

export type OptionalDateRange = { from?: string; to?: string };

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

const inputClass =
  'h-9 w-[150px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90';

/**
 * Хайлтын огнооны шүүлтүүр: огноог бичиж эсвэл сонгож оруулна (гар утсанд системийн сонгогч).
 * Хоосон үлдээж болно; эхлэх > дуусах бол нөгөөг нь тааруулна.
 */
export default function DateRangeInputs({
  value,
  onChange,
  label = 'Огноо',
}: {
  value: OptionalDateRange;
  onChange: (value: OptionalDateRange) => void;
  label?: string;
}) {
  const setFrom = (from: string) =>
    onChange({ from: from || undefined, to: from && value.to && from > value.to ? from : value.to });
  const setTo = (to: string) =>
    onChange({ from: to && value.from && to < value.from ? to : value.from, to: to || undefined });

  return (
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
  );
}
