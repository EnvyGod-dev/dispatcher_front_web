'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Construction } from 'lucide-react';
import React, { useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from '../ui/table';

import { ColumnDef } from '../ui/table/builder';

export interface Action<T> {
  label?: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  isLoading?: (item: T) => boolean;
  isDisabled?: (item: T) => boolean;
  title?: string;
}

export interface DynamicTableProps<T> {
  data: T[][];
  columns: ColumnDef<T>[];
  actions?: Action<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey: keyof T | ((item: T) => string | number);
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, groupIndex: number) => string;
  expandedRowRender?: (item: T) => React.ReactNode;
  defaultExpandedRows?: (string | number)[];
  showIndex?: boolean;
  indexLabel?: string;
  indexOffset?: number;
  wrapText?: boolean;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  footer?: React.ReactNode;
  footerClassName?: string;
  tableFooter?: React.ReactNode;
}

function DynamicTable<T extends object>({
  data: groupedData,
  columns,
  actions = [],
  isLoading = false,
  emptyMessage = 'Бүртгэл байхгүй.',
  rowKey,
  onRowClick,
  rowClassName,
  expandedRowRender,
  defaultExpandedRows = [],
  showIndex = true,
  indexLabel = '№',
  indexOffset = 0,
  sortColumn,
  sortOrder,
  onSort,
  footer,
  footerClassName,
  tableFooter,
}: DynamicTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(
    new Set(defaultExpandedRows)
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background">
        <div className="space-y-4 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const getRowKey = (item: T): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(item);
    }
    return item[rowKey as keyof T] as string | number;
  };

  const toggleRowExpansion = (key: string | number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isRowExpanded = (key: string | number) => expandedRows.has(key);

  const getCellValue = (item: T, column: ColumnDef<T>) => {
    if (column.render) {
      return column.render(item);
    }
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(item);
      }
      return (item as Record<string, unknown>)[column.accessor as string];
    }
    return null;
  };

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable || !onSort) return;
    const columnKey = column.sortKey || column.key;
    if (sortColumn === columnKey) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newOrder);
    } else {
      onSort(columnKey, 'desc');
    }
  };

  const getSortIcon = (column: ColumnDef<T>) => {
    if (!column.sortable) return null;
    const columnKey = column.sortKey || column.key;
    const isActive = sortColumn === columnKey;
    if (!isActive) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-blue-500" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-500" />
    );
  };

  const getActionButtonClasses = (variant: Action<T>['variant'] = 'default') => {
    const baseClasses =
      'inline-flex items-center justify-center w-7 h-7 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors';
    const variants = {
      default:
        'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:ring-brand-500',
      danger:
        'border-red-300 bg-background text-red-500 hover:bg-red-50 hover:text-red-700 focus:ring-red-500 dark:border-red-900 dark:hover:bg-red-950/30',
      success:
        'border-green-300 bg-background text-green-500 hover:bg-green-50 hover:text-green-700 focus:ring-green-500 dark:border-green-900 dark:hover:bg-green-950/30',
      warning:
        'border-yellow-300 bg-background text-yellow-500 hover:bg-yellow-50 hover:text-yellow-700 focus:ring-yellow-500 dark:border-yellow-900 dark:hover:bg-yellow-950/30',
    };
    return `${baseClasses} ${variants[variant]}`;
  };

  if (
    !groupedData ||
    groupedData[0] === undefined ||
    groupedData[0]?.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Construction className="mx-auto" size={46} color="#ff810a" strokeWidth={1} />
            <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasExpandableRows = !!expandedRowRender;
  let rowIndexCounter = 0;

  return (
    <div className="flex max-h-[80vh] flex-col rounded-xl border border-border bg-background">
      <div className="custom-scrollbar relative isolate flex-1 overflow-auto [-webkit-overflow-scrolling:touch]">
        <div className="min-w-max">
          <Table scrollable={false} className="w-full table-auto">
            <TableHeader className="border-b border-border">
              <TableRow className="border-b border-border">
                {hasExpandableRows && (
                  <TableCell className="sticky top-0 left-0 z-30 w-8 bg-background px-1 py-2 shadow-[0_1px_0_0_hsl(var(--border))] sm:px-2" />
                )}
                {showIndex && (
                  <TableCell
                    className="sticky top-0 z-[25] w-8 bg-background py-2 text-start text-[10px] font-bold text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))] sm:w-10 sm:px-2"
                    style={{ left: hasExpandableRows ? '32px' : '8px' }}
                  >
                    {indexLabel}
                  </TableCell>
                )}

                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`sticky top-0 z-20 bg-background px-2 py-2 text-start shadow-[0_1px_0_0_hsl(var(--border))] whitespace-normal min-w-[80px] ${column.headerClassName || ''} ${column.sortable
                      ? 'cursor-pointer select-none hover:text-foreground'
                      : ''
                      }`}
                    onClick={() => handleSort(column)}
                    style={{ minWidth: '80px' }}
                  >
                    <div className="flex items-center gap-0.5">
                      {column.header}
                      {getSortIcon(column)}
                    </div>
                  </TableCell>
                ))}

                {actions.length > 0 && (
                  <TableCell className="sticky top-0 right-0 z-40 border-l border-border bg-background px-2 py-2 text-start text-[10px] font-bold text-muted-foreground shadow-[-12px_0_16px_-12px_rgba(15,23,42,0.55),0_1px_0_0_hsl(var(--border))]">
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>

            {groupedData.map((group, groupIndex) => (
              <TableBody
                key={groupIndex}
                className={`group ${groupIndex % 2 !== 0 ? 'bg-muted/30' : ''}`}
              >
                {group.map((item) => {
                  const key = getRowKey(item);
                  const isExpanded = isRowExpanded(key);
                  const overallIndex = rowIndexCounter++;

                  const shouldRenderCell = (
                    columnIndex: number,
                    itemIndex: number
                  ): boolean => {
                    for (let i = 1; i <= itemIndex; i++) {
                      const prevItem = group[itemIndex - i];
                      const prevColumn = columns[columnIndex];
                      if (prevColumn.rowSpan) {
                        const span = prevColumn.rowSpan(prevItem);
                        if (span > i) {
                          return false;
                        }
                      }
                    }
                    return true;
                  };

                  return (
                    <React.Fragment key={key}>
                      <TableRow
                        onClick={
                          hasExpandableRows
                            ? () => toggleRowExpansion(key)
                            : onRowClick
                              ? () => onRowClick(item)
                              : undefined
                        }
                        className={`align-top ${hasExpandableRows || onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(item, groupIndex) : ''}`}
                      >
                        {hasExpandableRows && (
                          <TableCell className="sticky left-0 z-20 w-8 border-r border-border bg-background px-1 py-2 sm:px-2 align-top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(key);
                              }}
                              className="text-muted-foreground transition-transform duration-200 hover:text-foreground mt-0.5"
                              style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              }}
                            >
                              <svg
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </TableCell>
                        )}
                        {showIndex && (
                          <TableCell
                            className="sticky z-[15] w-8 border-r border-border bg-background px-1 py-2 text-xs text-muted-foreground sm:w-10 sm:px-2 align-top"
                            style={{ left: hasExpandableRows ? '32px' : '8px' }}
                          >
                            {indexOffset + overallIndex + 1}
                          </TableCell>
                        )}
                        {columns.map((column, colIndex) => {
                          if (!shouldRenderCell(colIndex, group.indexOf(item))) {
                            return null;
                          }
                          const rowSpan = column.rowSpan ? column.rowSpan(item) : 1;
                          return (
                            <TableCell
                              key={column.key}
                              rowSpan={rowSpan}
                              className={`text-start px-2 sm:px-3 py-2 border border-border whitespace-normal min-w-[80px] align-top ${column.className || ''}`}
                              style={{ minWidth: '80px' }}
                            >
                              {getCellValue(item, column) as React.ReactNode}
                            </TableCell>
                          );
                        })}
                        {actions.length > 0 && (
                          <TableCell className="sticky right-0 z-20 border-l border-border bg-background px-2 py-2 shadow-[-12px_0_16px_-12px_rgba(15,23,42,0.55)] align-top">
                            <div className="flex items-center gap-1">
                              {actions.map((action, actionIndex) => {
                                const isActionLoading = action.isLoading?.(item) || false;
                                const isActionDisabled = action.isDisabled?.(item) || false;
                                return (
                                  <button
                                    key={actionIndex}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(item);
                                    }}
                                    disabled={isActionLoading || isActionDisabled}
                                    className={`${getActionButtonClasses(action.variant)} ${isActionLoading || isActionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={action.title || action.label}
                                  >
                                    {isActionLoading ? (
                                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                      action.icon
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {hasExpandableRows && isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={
                              (hasExpandableRows ? 1 : 0) +
                              (showIndex ? 1 : 0) +
                              columns.length +
                              (actions.length > 0 ? 1 : 0)
                            }
                            className="p-0"
                          >
                            <div className="w-full p-4 sm:p-6">
                              <div className="animate-in slide-in-from-top-2 duration-200">
                                {expandedRowRender(item)}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            ))}

            {tableFooter && (
              <TableFooter className="bg-muted/60 dark:bg-muted/30 font-semibold">
                {tableFooter}
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {footer && (
        <div className={`border-t border-border bg-background ${footerClassName || 'p-4'}`}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default DynamicTable;