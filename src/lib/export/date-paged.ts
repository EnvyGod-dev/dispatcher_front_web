import { fetchAllPages } from '@/lib/export/fetch-all';
import {
  hasDateRange,
  inDateRange,
  inShift,
  shiftOfTimestamp,
  type OptionalDateRange,
  type ShiftFilterValue,
} from '@/components/form/DateRangeInputs';

/** Бүртгэсэн огноо, ээлжээр (бүртгэсэн цагаас) шүүх. */
export const matchesCreated = (
  createdAt: string | null | undefined,
  range: OptionalDateRange,
  shift: ShiftFilterValue = '',
) => inDateRange(createdAt, range) && inShift(shift, shiftOfTimestamp(createdAt));

/**
 * Огноо/ээлжийн шүүлтүүр backend-д байхгүй жагсаалтууд: шүүлтгүй бол ердийн хуудас,
 * шүүлттэй бол бүх мөрийг татаж шүүгээд тухайн хуудсыг таслана.
 */
export async function fetchPageWithDateFilter<T>({
  offset,
  limit,
  range,
  shift = '',
  getDate,
  fetchPage,
}: {
  offset: number;
  limit: number;
  range: OptionalDateRange;
  shift?: ShiftFilterValue;
  getDate: (row: T) => string | null | undefined;
  fetchPage: (offset: number, limit: number) => Promise<{ data: T[]; totalCount: number }>;
}): Promise<{ data: T[]; totalCount: number }> {
  if (!hasDateRange(range) && !shift) return fetchPage(offset, limit);

  const rows = (await fetchAllPages<T>(fetchPage)).filter((row) => matchesCreated(getDate(row), range, shift));

  return { data: rows.slice(offset, offset + limit), totalCount: rows.length };
}
