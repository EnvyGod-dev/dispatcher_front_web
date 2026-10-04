'use client';

import React from 'react';
import ShiftStatusBadge from '@/components/shift-report/ShiftStatusBadge';
import { ColumnOption } from '@/components/vehicles/ColumnSettings';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { formatDate, formatDateFull } from '@/lib/time-formatter';
import { ShiftReport } from '@/services/internal/shift-report/types';
import { AlertTriangle, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'shift_report_visible_columns';
const STORAGE_VERSION = '4';

const H = ({ children }: { children: React.ReactNode }) => (
  <span className="font-extrabold text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-tight text-[10px] uppercase tracking-tight">
    {children}
  </span>
);

export const availableColumns: ColumnOption[] = [
  { key: 'createdAt', label: 'Огноо', defaultVisible: true },
  { key: 'driver', label: 'Оператор', defaultVisible: true },
  { key: 'driverPosition', label: 'Албан тушаал', defaultVisible: true },
  { key: 'vehicle', label: 'Техник', defaultVisible: true },
  { key: 'shiftType', label: 'Ээлж', defaultVisible: true },
  { key: 'trips', label: 'Рейс', defaultVisible: true },
  { key: 'coalWorkLogCount', label: 'Нүүрсний Рейс', defaultVisible: true },
  { key: 'soilWorkLogCount', label: 'Хөрсний Рейс', defaultVisible: true },
  { key: 'shiftStatus', label: 'Төлөв', defaultVisible: true },
  { key: 'shiftTime', label: 'Эхэлсэн/Дууссан', defaultVisible: false },
  { key: 'coalProduct', label: 'Нүүрс (м3)', defaultVisible: false },
  { key: 'soilProduct', label: 'Хөрс (м3)', defaultVisible: false },
  { key: 'issue', label: 'Үзлэг', defaultVisible: false },
  { key: 'totalProduct', label: 'Нийт бүтээгдэхүүн (м3)', defaultVisible: false },
  { key: 'mileageStart', label: 'Эхлэх (км)', defaultVisible: false },
  { key: 'mileageEnd', label: 'Дуусах (км)', defaultVisible: false },
  { key: 'mileage', label: 'Гүйлт (км)', defaultVisible: false },
  { key: 'motoHours', label: 'Мотоцаг', defaultVisible: false },
  { key: 'motoStart', label: 'Эхлэх мотоцаг', defaultVisible: false },
  { key: 'motoEnd', label: 'Дуусах мотоцаг', defaultVisible: false },
  { key: 'shiftStart', label: 'Ээлж эхэлсэн', defaultVisible: false },
  { key: 'shiftEnd', label: 'Ээлж дууссан', defaultVisible: false },
];

const allColumns = {
  createdAt: TableColumn.custom<ShiftReport>(
    'createdAt',
    <H>Огноо</H> as any,
    (shift) => (
      <span className="text-xs text-gray-700 dark:text-gray-200 whitespace-nowrap">
        {shift.operationalDate || formatDate(shift.createdAt)}
      </span>
    ),
  ).sortable().className('w-[90px] min-w-[90px]').build(),

  driver: TableColumn.custom<ShiftReport>(
    'driver',
    <H>Оператор</H> as any,
    (shift) => (
      <div
        className="font-medium text-xs break-words"
        style={{ maxWidth: '140px', whiteSpace: 'normal', wordBreak: 'break-word' }}
      >
        {shift.driver ? `${shift.driver.firstName} ${shift.driver.lastName}` : '-'}
      </div>
    ),
  ).className('max-w-[90px]').build(),

  driverPosition: TableColumn.custom<ShiftReport>(
    'driverPosition',
    <H>Албан тушаал</H> as any,
    (shift) => (
      <div
        className="text-xs text-muted-foreground break-words"
        style={{ maxWidth: '90px', whiteSpace: 'normal', wordBreak: 'break-word' }}
      >
        {shift.driver?.position || '-'}
      </div>
    ),
  ).className('max-w-[90px]').build(),

  vehicle: TableColumn.custom<ShiftReport>(
    'vehicle',
    <H>Техник</H> as any,
    (shift) => (
      <div className="text-xs dark:text-gray-200 whitespace-nowrap">
        {shift.vehicle?.code || '-'}
      </div>
    ),
  ).sortable().className('min-w-[110px]').build(),

  shiftType: TableColumn.custom<ShiftReport>(
    'shiftType',
    <H>Ээлж</H> as any,
    (shift) => (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium justify-center whitespace-nowrap ${shift.shiftType === 'day'
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
          }`}
      >
        {shift.shiftType === 'day' ? '☀️ Өдөр' : '🌙 Шөнө'}
      </span>
    ),
  ).sortable().className('w-[75px] min-w-[75px]').build(),

  shiftTime: TableColumn.custom<ShiftReport>(
    'shiftTime',
    <H>Эхэлсэн/ Дууссан</H> as any,
    (shift) => (
      <div className="text-[10px] text-gray-800 whitespace-nowrap">
        <div className="dark:text-white/90">{formatDateFull(shift.shiftStart)}</div>
        {shift.shiftEnd ? (
          <div className="text-gray-500 dark:text-gray-400">{formatDateFull(shift.shiftEnd)}</div>
        ) : '-'}
      </div>
    ),
  ).sortable().className('min-w-[130px]').build(),

  trips: TableColumn.custom<ShiftReport>(
    'trips',
    <H>Рейс</H> as any,
    (shift) => (
      <div className="text-gray-700 dark:text-white text-xs text-center">
        {shift.workLogsCount || shift.workLogs?.length || 0}
      </div>
    ),
  ).className('w-[50px] min-w-[50px]').build(),

  coalWorkLogCount: TableColumn.custom<ShiftReport>(
    'coalWorkLogCount',
    <H>Нүүрсний Рейс</H> as any,
    (shift) => (
      <div className="text-gray-700 dark:text-white text-xs text-center">
        {shift.coalWorkLogCount || 0}
      </div>
    ),
  ).className('w-[70px] min-w-[70px]').build(),

  soilWorkLogCount: TableColumn.custom<ShiftReport>(
    'soilWorkLogCount',
    <H>Хөрсний Рейс</H> as any,
    (shift) => (
      <div className="text-gray-700 text-xs dark:text-white text-center">
        {shift.soilWorkLogCount || 0}
      </div>
    ),
  ).className('w-[70px] min-w-[70px]').build(),

  coalProduct: TableColumn.custom<ShiftReport>(
    'coalProduct',
    <H>Нүүрс (м3)</H> as any,
    (shift) => (
      <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
        {shift.coalProduct ? `${shift.coalProduct} м3` : '-'}
      </span>
    ),
  ).sortable().className('w-[80px] min-w-[80px]').build(),

  soilProduct: TableColumn.custom<ShiftReport>(
    'soilProduct',
    <H>Хөрс (м3)</H> as any,
    (shift) => (
      <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
        {shift.soilProduct ? `${shift.soilProduct} м3` : '-'}
      </span>
    ),
  ).sortable().className('w-[80px] min-w-[80px]').build(),

  shiftStatus: TableColumn.custom<ShiftReport>(
    'shiftStatus',
    <H>Төлөв</H> as any,
    (shift) => (
      <div>
        <ShiftStatusBadge status={shift.status} />
      </div>
    ),
  ).sortable().className('min-w-[100px]').build(),

  issue: TableColumn.custom<ShiftReport>(
    'issue',
    <H>Үзлэг</H> as any,
    (shift) => {
      const hasIssues = shift.inspections?.some((i) => i.status !== 'normal') || false;
      return hasIssues ? (
        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
      ) : (
        <CheckCheck className="w-3.5 h-3.5 text-green-600" />
      );
    },
  ).className('w-[50px] min-w-[50px]').build(),

  totalProduct: TableColumn.custom<ShiftReport>(
    'totalProduct',
    <H>Нийт м3</H> as any,
    (shift) => {
      const coal = parseFloat(shift.coalProduct || '0');
      const soil = parseFloat(shift.soilProduct || '0');
      const total = coal + soil;
      return (
        <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
          {total > 0 ? `${total.toFixed(1)} м3` : '-'}
        </span>
      );
    },
  ).className('w-[80px] min-w-[80px]').build(),

  mileageStart: TableColumn.custom<ShiftReport>(
    'mileageStart',
    <H>Эхлэх (км)</H> as any,
    (shift) => (
      <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
        {shift.mileageStart
          ? `${parseFloat(shift.mileageStart.toString()).toFixed(2)} км`
          : '-'}
      </span>
    ),
  ).sortable().className('w-[80px] min-w-[80px]').build(),

  mileageEnd: TableColumn.custom<ShiftReport>(
    'mileageEnd',
    <H>Дуусах (км)</H> as any,
    (shift) => (
      <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
        {shift.mileageEnd
          ? `${parseFloat(shift.mileageEnd.toString()).toFixed(2)} км`
          : '-'}
      </span>
    ),
  ).sortable().className('w-[80px] min-w-[80px]').build(),

  mileage: TableColumn.custom<ShiftReport>(
    'mileage',
    <H>Гүйлт (км)</H> as any,
    (shift) => {
      const start = parseFloat(shift.mileageStart?.toString() || '0');
      const end = parseFloat(shift.mileageEnd?.toString() || '0');
      const diff = end - start;
      return (
        <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
          {diff > 0 ? `${diff.toFixed(1)} км` : '-'}
        </span>
      );
    },
  ).className('w-[80px] min-w-[80px]').build(),

  motoHours: TableColumn.custom<ShiftReport>(
    'motoHours',
    <H>Мотоцаг</H> as any,
    (shift) => {
      const start = parseFloat(shift.motoStart?.toString() || '0');
      const end = parseFloat(shift.motoEnd?.toString() || '0');
      const diff = end - start;
      return (
        <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
          {diff > 0 ? `${diff.toFixed(1)} ц` : '-'}
        </span>
      );
    },
  ).className('w-[70px] min-w-[70px]').build(),

  motoStart: TableColumn.custom<ShiftReport>(
    'motoStart',
    <H>Эхлэх мотоцаг</H> as any,
    (shift) => (
      <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
        {shift.motoStart
          ? `${parseFloat(shift.motoStart.toString()).toFixed(1)} ц`
          : '-'}
      </span>
    ),
  ).className('w-[90px] min-w-[90px]').build(),

  motoEnd: TableColumn.custom<ShiftReport>(
    'motoEnd',
    <H>Дуусах мотоцаг</H> as any,
    (shift) => (
      <span className="text-gray-700 dark:text-white text-xs whitespace-nowrap">
        {shift.motoEnd
          ? `${parseFloat(shift.motoEnd.toString()).toFixed(1)} ц`
          : '-'}
      </span>
    ),
  ).className('w-[90px] min-w-[90px]').build(),

  shiftStart: TableColumn.custom<ShiftReport>(
    'shiftStart',
    <H>Ээлж эхэлсэн</H> as any,
    (shift) => (
      <span className="text-xs text-gray-700 dark:text-white whitespace-nowrap">
        {formatDateFull(shift.shiftStart)}
      </span>
    ),
  ).className('min-w-[120px]').build(),

  shiftEnd: TableColumn.custom<ShiftReport>(
    'shiftEnd',
    <H>Ээлж дууссан</H> as any,
    (shift) => (
      <span className="text-xs text-gray-700 dark:text-white whitespace-nowrap">
        {shift.shiftEnd ? formatDateFull(shift.shiftEnd) : '-'}
      </span>
    ),
  ).className('min-w-[120px]').build(),
};

export function useShiftReportColumns() {
  const getDefaultColumns = (): string[] => {
    return availableColumns
      .filter((col) => col.defaultVisible)
      .map((col) => col.key);
  };

  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(getDefaultColumns());

  useEffect(() => {
    const savedVersion = localStorage.getItem(STORAGE_KEY + '_version');

    if (savedVersion !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY + '_version', STORAGE_VERSION);
      setVisibleColumns(getDefaultColumns());
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        const valid = parsed.filter((key) =>
          availableColumns.some((col) => col.key === key)
        );
        setVisibleColumns(valid.length > 0 ? valid : getDefaultColumns());
      } catch {
        setVisibleColumns(getDefaultColumns());
      }
    }
  }, []);

  const handleColumnVisibilityChange = (newVisibleColumns: string[]) => {
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibleColumns));
  };

  const getColumns = () => {
    return visibleColumns
      .map((key) => allColumns[key as keyof typeof allColumns])
      .filter(Boolean);
  };

  return {
    availableColumns,
    visibleColumns,
    setVisibleColumns: handleColumnVisibilityChange,
    getColumns,
  };
}