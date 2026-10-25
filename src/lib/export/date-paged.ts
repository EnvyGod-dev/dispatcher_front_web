import { fetchAllPages } from '@/lib/export/fetch-all';
import { hasDateRange, inDateRange, type OptionalDateRange } from '@/components/form/DateRangeInputs';

/**
 * Огнооны шүүлтүүр backend-д байхгүй жагсаалтууд: огноо сонгоогүй бол ердийн хуудас,
 * сонгосон бол бүх мөрийг татаж огноогоор шүүгээд тухайн хуудсыг таслана.
 */
export async function fetchPageWithDateFilter<T>({
  offset,
  limit,
  range,
  getDate,
  fetchPage,
}: {
  offset: number;
  limit: number;
  range: OptionalDateRange;
  getDate: (row: T) => string | null | undefined;
  fetchPage: (offset: number, limit: number) => Promise<{ data: T[]; totalCount: number }>;
}): Promise<{ data: T[]; totalCount: number }> {
  if (!hasDateRange(range)) return fetchPage(offset, limit);

  const rows = (await fetchAllPages<T>(fetchPage)).filter((row) => inDateRange(getDate(row), range));

  return { data: rows.slice(offset, offset + limit), totalCount: rows.length };
}
