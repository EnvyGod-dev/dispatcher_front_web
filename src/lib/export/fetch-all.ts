/**
 * Хуудаслалттай жагсаалтын бүх мөрийг Excel-д зориулж татна.
 * `x-total-count` байвал түүгээр, байхгүй бол хоосон/дутуу хуудас ирэхэд зогсоно.
 */
export async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ data: T[]; totalCount?: number }>,
  { pageSize = 200, maxRows = 20000 }: { pageSize?: number; maxRows?: number } = {},
): Promise<T[]> {
  const rows: T[] = [];

  while (rows.length < maxRows) {
    const page = await fetchPage(rows.length, pageSize);
    const items = page.data ?? [];
    rows.push(...items);

    if (items.length === 0 || items.length < pageSize) break;
    if (typeof page.totalCount === 'number' && page.totalCount > 0 && rows.length >= page.totalCount) break;
  }

  return rows;
}
