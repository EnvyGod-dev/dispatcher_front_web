import * as XLSX from 'xlsx';

import {
  driverShiftGroupOptions,
  type Employee,
  userRoleOptions,
} from '@/services/internal/employee/type';

/**
 * Хүний нөөцийн Excel: загвар татах, жагсаалт экспортлох, импорт файлыг
 * backend-ийн `/register-user/bulk`-ийн хүлээж авдаг хэлбэрт хөрвүүлэх.
 *
 * Импорт нь монгол толгой ("Утас") эсвэл backend-ийн түлхүүр ("phoneNumber"),
 * үүргийн монгол нэр ("Оператор") эсвэл код ("driver") аль алиныг хүлээн авна.
 */

type ColumnKey =
  | 'lastName'
  | 'firstName'
  | 'phoneNumber'
  | 'password'
  | 'role'
  | 'driverShiftGroup'
  | 'position'
  | 'department'
  | 'registerNumber'
  | 'email'
  | 'driverLicenseExpiryDate'
  | 'ettDriverLicenseExpiryDate'
  | 'entryPermitExpiryDate';

type Column = {
  key: ColumnKey;
  header: string;
  required?: boolean;
  example: string;
  width: number;
  isDate?: boolean;
};

const COLUMNS: Column[] = [
  { key: 'lastName', header: 'Овог', required: true, example: 'Бат', width: 16 },
  { key: 'firstName', header: 'Нэр', required: true, example: 'Дорж', width: 16 },
  { key: 'phoneNumber', header: 'Утас', required: true, example: '99112233', width: 12 },
  { key: 'password', header: 'Нууц үг', required: true, example: '123456', width: 12 },
  { key: 'role', header: 'Үүрэг', required: true, example: 'Оператор', width: 22 },
  { key: 'driverShiftGroup', header: 'Ээлж (A/B/C/D)', example: 'A', width: 14 },
  { key: 'position', header: 'Албан тушаал', example: 'Экскаваторын оператор', width: 24 },
  { key: 'department', header: 'Хэлтэс', example: 'Уулын хэлтэс', width: 18 },
  { key: 'registerNumber', header: 'Регистр', example: 'УА90010112', width: 14 },
  { key: 'email', header: 'Имэйл', example: '', width: 22 },
  { key: 'driverLicenseExpiryDate', header: 'Жолооны үнэмлэх дуусах', example: '2027-12-31', width: 20, isDate: true },
  { key: 'ettDriverLicenseExpiryDate', header: 'ЭТТ үнэмлэх дуусах', example: '', width: 18, isDate: true },
  { key: 'entryPermitExpiryDate', header: 'Нэвтрэх зөвшөөрөл дуусах', example: '', width: 22, isDate: true },
];

/** Операторууд ээлжтэй байх ёстой (backend шаарддаг). */
const SHIFT_REQUIRED_ROLES = ['driver', 'assistant_operator'];

const normalize = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('mn-MN')
    .replace(/\s+/g, ' ');

const headerToKey = new Map<string, ColumnKey>();
COLUMNS.forEach((column) => {
  headerToKey.set(normalize(column.header), column.key);
  headerToKey.set(normalize(column.key), column.key);
});
// Хуучин загварын болон түгээмэл өөр нэрс.
(
  [
    ['утасны дугаар', 'phoneNumber'],
    ['phone', 'phoneNumber'],
    ['ээлж', 'driverShiftGroup'],
    ['регистрийн дугаар', 'registerNumber'],
    ['email', 'email'],
    ['и-мэйл', 'email'],
  ] as const
).forEach(([alias, key]) => headerToKey.set(normalize(alias), key));

const roleLookup = new Map<string, string>();
userRoleOptions.forEach((option) => {
  roleLookup.set(normalize(option.value), option.value);
  roleLookup.set(normalize(option.label), option.value);
});

const roleLabel = (role: string) =>
  userRoleOptions.find((option) => option.value === role)?.label ?? role;

const toDateString = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  return text;
};

// ── Загвар ──────────────────────────────────────────────────

export const downloadEmployeeTemplate = () => {
  const workbook = XLSX.utils.book_new();

  const sheet = XLSX.utils.aoa_to_sheet([
    COLUMNS.map((column) => (column.required ? `${column.header} *` : column.header)),
    COLUMNS.map((column) => column.example),
  ]);
  sheet['!cols'] = COLUMNS.map((column) => ({ wch: column.width }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Ажилтан');

  const guide: (string | number)[][] = [
    ['Заавар'],
    ['* тэмдэгтэй багана заавал бөглөнө. Жишээ мөрийг устгаад өөрийн мэдээллээ оруулна уу.'],
    ['Оператор, Туслах техник оператор үүрэгтэй ажилтанд ээлж (A/B/C/D) заавал оруулна.'],
    ['Огноог 2027-12-31 хэлбэрээр оруулна.'],
    [],
    ['Үүрэг (Монгол нэр)', 'Код'],
    ...userRoleOptions
      .filter((option) => option.value !== 'superadmin')
      .map((option) => [option.label, option.value]),
    [],
    ['Ээлж'],
    ...driverShiftGroupOptions.map((option) => [option.value]),
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guide);
  guideSheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Заавар');

  XLSX.writeFile(workbook, 'ajiltan_zagvar.xlsx');
};

// ── Экспорт ─────────────────────────────────────────────────

export const exportEmployees = (employees: Employee[], fileName = 'ajiltnuud') => {
  const exportColumns = COLUMNS.filter((column) => column.key !== 'password');
  const statusLabel: Record<string, string> = {
    available: 'Ажилд бэлэн',
    resting: 'Амарсан',
    sick_leave: 'Өвчтэй',
    on_leave: 'Чөлөөтэй',
    inactive: 'Идэвхгүй',
  };

  const rows = employees.map((employee) => [
    ...exportColumns.map((column) => {
      const value = employee[column.key as keyof Employee];
      if (column.key === 'role') return roleLabel(String(value ?? ''));
      if (column.isDate) return toDateString(value) ?? '';
      return value === null || value === undefined ? '' : String(value);
    }),
    statusLabel[employee.status] ?? employee.status ?? '',
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([
    [...exportColumns.map((column) => column.header), 'Төлөв'],
    ...rows,
  ]);
  sheet['!cols'] = [...exportColumns.map((column) => ({ wch: column.width })), { wch: 14 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Ажилтан');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// ── Импорт ──────────────────────────────────────────────────

export type ImportIssue = { row: number; error: string };

export type PreparedImport = {
  /** Backend рүү илгээх файл (англи түлхүүртэй толгой). */
  file: File;
  /** Илгээж буй мөр бүрийн эх файл дахь мөрийн дугаар. */
  sourceRows: number[];
  /** Илгээхээс өмнө илэрсэн алдаа (эдгээр мөрийг илгээхгүй). */
  issues: ImportIssue[];
};

export const prepareEmployeeImport = async (input: File): Promise<PreparedImport> => {
  const workbook = XLSX.read(await input.arrayBuffer(), { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error('Файлд хуудас олдсонгүй.');
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true });
  const [headerRow = [], ...body] = matrix;

  const keys = headerRow.map((cell) => headerToKey.get(normalize(cell).replace(/\s*\*$/, '')));
  const missing = COLUMNS.filter((column) => column.required && !keys.includes(column.key));

  if (missing.length) {
    throw new Error(
      `Дараах багана олдсонгүй: ${missing.map((column) => column.header).join(', ')}. Загвар файлыг ашиглана уу.`,
    );
  }

  const records: Record<string, string>[] = [];
  const sourceRows: number[] = [];
  const issues: ImportIssue[] = [];

  body.forEach((cells, index) => {
    const rowNumber = index + 2;

    if (cells.every((cell) => String(cell ?? '').trim() === '')) return;

    const record: Record<string, string> = {};
    keys.forEach((key, cellIndex) => {
      if (!key) return;
      const column = COLUMNS.find((item) => item.key === key)!;
      const raw = cells[cellIndex];
      const value = column.isDate ? toDateString(raw) : String(raw ?? '').trim();
      if (value) record[key] = value;
    });

    const errors: string[] = [];

    COLUMNS.filter((column) => column.required && !record[column.key]).forEach((column) =>
      errors.push(`${column.header} хоосон`),
    );

    if (record.role) {
      const role = roleLookup.get(normalize(record.role));
      if (role) record.role = role;
      else errors.push(`Үүрэг "${record.role}" танигдсангүй`);
    }

    if (record.driverShiftGroup) {
      record.driverShiftGroup = record.driverShiftGroup.toUpperCase().replace(/\s*ЭЭЛЖ$/i, '');
      if (!['A', 'B', 'C', 'D'].includes(record.driverShiftGroup)) {
        errors.push('Ээлж A, B, C, D-ийн нэг байна');
      }
    } else if (record.role && SHIFT_REQUIRED_ROLES.includes(record.role)) {
      errors.push('Операторт ээлж (A/B/C/D) заавал');
    }

    if (record.phoneNumber) {
      record.phoneNumber = record.phoneNumber.replace(/\D/g, '');
      if (record.phoneNumber.length < 8) errors.push('Утасны дугаар буруу');
    }

    if (errors.length) {
      issues.push({ row: rowNumber, error: errors.join(', ') });
      return;
    }

    records.push(record);
    sourceRows.push(rowNumber);
  });

  const outSheet = XLSX.utils.json_to_sheet(records, {
    header: COLUMNS.map((column) => column.key),
  });
  const outBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outBook, outSheet, 'users');
  const buffer = XLSX.write(outBook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

  return {
    file: new File([buffer], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    sourceRows,
    issues,
  };
};
