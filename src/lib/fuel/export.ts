import * as XLSX from 'xlsx';

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
  width?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- sheet бүр өөр мөрийн төрөлтэй
export type ExportSheet<T = any> = {
  name: string;
  rows: T[];
  columns: ExportColumn<T>[];
  /** Хүснэгтийн доор нэмэх нийлбэр мөр. */
  totals?: (string | number | null)[];
};

/**
 * Олон sheet-тэй Excel (.xlsx) файл үүсгэж татна.
 * Тоон утгыг тоо хэвээр нь бичдэг тул Excel дээр нэмж, шүүж болно.
 */
export const exportExcel = (fileName: string, sheets: ExportSheet[], meta?: string[]) => {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const header = sheet.columns.map((c) => c.header);
    const body = sheet.rows.map((row) => sheet.columns.map((c) => c.value(row) ?? ''));
    const aoa: (string | number | null)[][] = [];

    if (meta?.length) {
      meta.forEach((line) => aoa.push([line]));
      aoa.push([]);
    }

    aoa.push(header, ...body);
    if (sheet.totals) aoa.push(sheet.totals);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = sheet.columns.map((c) => ({ wch: c.width ?? Math.max(12, c.header.length + 2) }));
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};
