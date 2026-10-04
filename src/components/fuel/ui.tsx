'use client';

import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { DateRange, rangePresets } from '@/lib/fuel/format';
import { Download, Inbox, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

// ─── Layout ────────────────────────────────────────────────

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>}
            {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'gray',
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'gray' | 'brand' | 'blue' | 'green' | 'red' | 'amber';
  loading?: boolean;
}) {
  const tones = {
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    blue: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400',
    green: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400',
    red: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
    amber: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {icon && <span className={cn('flex size-9 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums dark:text-white">
        {loading ? <span className="inline-block h-7 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /> : value}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

export function Pill({
  children,
  tone = 'gray',
  className,
}: {
  children: React.ReactNode;
  tone?: 'gray' | 'brand' | 'blue' | 'green' | 'red' | 'amber';
  className?: string;
}) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    blue: 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
    green: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
    red: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    amber: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
        <Inbox className="size-5" />
      </span>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/70" />
      ))}
    </div>
  );
}

// ─── Buttons ───────────────────────────────────────────────

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Btn({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-theme-xs',
    secondary:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.06]',
    danger: 'bg-error-500 text-white hover:bg-error-600 shadow-theme-xs',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]',
  };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm' };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function IconBtn({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg transition',
        danger
          ? 'text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200',
      )}
    >
      {icon}
    </button>
  );
}

export function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Btn icon={<Download className="size-4" />} onClick={onClick} disabled={disabled}>
      Excel татах
    </Btn>
  );
}

// ─── Form controls ─────────────────────────────────────────

const controlClass =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800';

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, className)} {...props} />;
  },
);

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'h-auto min-h-20 py-2', className)} {...props} />;
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlClass, 'pr-8', !value && 'text-gray-400', className)}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-gray-800">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-sm',
            value === o.value
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
          )}
        >
          {o.label}
          {o.count !== undefined && o.count > 0 && (
            <span className="rounded-full bg-brand-500 px-1.5 text-[10px] leading-4 text-white">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (value: DateRange) => void }) {
  const active = rangePresets.find((p) => {
    const r = p.range();
    return r.from === value.from && r.to === value.to;
  })?.key;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <TextInput
          type="date"
          value={value.from}
          max={value.to}
          onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
          className="w-[150px]"
        />
        <span className="text-gray-400">—</span>
        <TextInput
          type="date"
          value={value.to}
          min={value.from}
          onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
          className="w-[150px]"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {rangePresets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.range())}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              active === p.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty = 'Мэдээлэл олдсонгүй',
  emptyDescription,
  onRowClick,
  rowClassName,
  footer,
  pageSize = 25,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  footer?: React.ReactNode;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = rows.length > pageSize ? rows.slice(current * pageSize, (current + 1) * pageSize) : rows;

  if (loading) return <LoadingRows />;
  if (!rows.length) return <EmptyState title={empty} description={emptyDescription} />;

  const align = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-y border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400',
                  align(c.align),
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {visible.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition',
                onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]',
                rowClassName?.(row),
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn('px-5 py-3 text-gray-700 dark:text-gray-300', align(c.align), c.className)}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot className="border-t-2 border-gray-200 bg-gray-50/70 font-semibold dark:border-gray-700 dark:bg-white/[0.02]">
            {footer}
          </tfoot>
        )}
      </table>
      {rows.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <span>
            {current * pageSize + 1}–{Math.min(rows.length, (current + 1) * pageSize)} / {rows.length}
          </span>
          <div className="flex gap-2">
            <Btn size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Өмнөх
            </Btn>
            <Btn size="sm" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
              Дараах
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dialogs ───────────────────────────────────────────────

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className={cn('m-4 w-full', width)}>
      <div className="p-6">
        <h3 className="pr-10 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        <div className="mt-5 max-h-[65vh] space-y-4 overflow-y-auto pr-1">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </Modal>
  );
}

/** Шалтгаан бичүүлж баталгаажуулах dialog. */
export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  confirmText,
  danger,
  required = true,
  loading,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText: string;
  danger?: boolean;
  required?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const invalid = required && reason.trim().length < 3;

  return (
    <Dialog
      open={open}
      onClose={() => {
        setReason('');
        onClose();
      }}
      title={title}
      description={description}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            disabled={invalid}
            onClick={() => {
              onConfirm(reason.trim());
              setReason('');
            }}
          >
            {confirmText}
          </Btn>
        </>
      }
    >
      <Field label={required ? 'Шалтгаан' : 'Тэмдэглэл (заавал биш)'} hint={required ? 'Хамгийн багадаа 3 тэмдэгт' : undefined}>
        <TextArea value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
    </Dialog>
  );
}
