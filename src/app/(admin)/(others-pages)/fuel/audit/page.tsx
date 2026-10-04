'use client';

import { Column, DataTable, Panel, Pill, Segmented, SelectInput } from '@/components/fuel/ui';
import { fmtDateTime } from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import type { FuelAuditLog } from '@/services/internal/fuel/types';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const entityLabels: Record<string, string> = {
  fuel_refueling: 'Цэнэглэлт',
  fuel_receipt: 'Орлого',
  fuel_receipt_edit_request: 'Орлогын хүсэлт',
  fuel_issue: 'Зарлага',
  fuel_measurement: 'Хэмжилт',
  fuel_opening_balance: 'Гарааны үлдэгдэл',
  fuel_alert: 'Alert',
  vehicle_fuel_profile: 'Техникийн тохиргоо',
};

const actionMeta: Record<string, { label: string; tone: 'gray' | 'green' | 'blue' | 'red' | 'amber' }> = {
  create: { label: 'Үүсгэсэн', tone: 'green' },
  update: { label: 'Зассан', tone: 'blue' },
  cancel: { label: 'Цуцалсан', tone: 'red' },
  request: { label: 'Хүсэлт', tone: 'amber' },
  approve: { label: 'Баталсан', tone: 'green' },
  reject: { label: 'Татгалзсан', tone: 'red' },
  close: { label: 'Хаасан', tone: 'gray' },
};

const fieldLabels: Record<string, string> = {
  quantity: 'Хэмжээ',
  meterStart: 'Эхний заалт',
  meterEnd: 'Төгсгөлийн заалт',
  receiverVehicleId: 'Техник',
  shiftType: 'Ээлж',
  notes: 'Тайлбар',
  refueledAt: 'Огноо',
  operationalDate: 'Ажлын өдөр',
  cancelReason: 'Цуцалсан шалтгаан',
  cancelledAt: 'Цуцалсан',
  status: 'Төлөв',
  reason: 'Шалтгаан',
  documentNumber: 'Баримт №',
  transportVehicleNumber: 'Тээврийн хэрэгсэл',
  receivedAt: 'Хүлээн авсан',
  supplierId: 'Нийлүүлэгч',
  tankId: 'Агуулах',
  closeReason: 'Хаасан шалтгаан',
  reviewNote: 'Тэмдэглэл',
};

const ignored = new Set(['updatedAt', 'createdAt', 'syncedAt', 'id', 'organizationId']);

const diffOf = (log: FuelAuditLog) => {
  const before = log.before ?? {};
  const after = log.after ?? {};
  return Object.keys(after)
    .filter((k) => !ignored.has(k) && k in before && String(before[k] ?? '') !== String(after[k] ?? ''))
    .map((k) => ({ key: k, before: before[k], after: after[k] }));
};

const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));

export default function FuelAuditPage() {
  const { canControl } = useFuelPermissions();
  const [entityType, setEntityType] = useState('');
  const [limit, setLimit] = useState<'100' | '300' | '500'>('100');
  const [expanded, setExpanded] = useState<string | null>(null);

  const logs = useQuery({
    queryKey: ['fuel', 'audit', entityType, limit],
    queryFn: () => fuelService.getAudit({ entityType: entityType || undefined, limit: Number(limit) }),
    enabled: canControl,
  });

  if (!canControl) return null;

  const columns: Column<FuelAuditLog>[] = [
    { key: 'time', header: 'Огноо', render: (l) => <span className="whitespace-nowrap">{fmtDateTime(l.createdAt)}</span> },
    {
      key: 'user',
      header: 'Хэрэглэгч',
      render: (l) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{l.userName ?? 'Систем'}</p>
          {l.userRole && <p className="text-xs text-gray-500">{l.userRole}</p>}
        </div>
      ),
    },
    { key: 'entity', header: 'Бүртгэл', render: (l) => entityLabels[l.entityType] ?? l.entityType },
    {
      key: 'action',
      header: 'Үйлдэл',
      render: (l) => {
        const m = actionMeta[l.action] ?? { label: l.action, tone: 'gray' as const };
        return <Pill tone={m.tone}>{m.label}</Pill>;
      },
    },
    {
      key: 'diff',
      header: 'Өөрчлөлт',
      className: 'min-w-[320px]',
      render: (l) => {
        const diff = diffOf(l);
        const reason = (l.after as Record<string, unknown> | null)?.reason ?? (l.after as Record<string, unknown> | null)?.cancelReason;
        const open = expanded === l.id;
        return (
          <div className="space-y-1 text-xs">
            {reason ? <p className="text-gray-700 dark:text-gray-300">Шалтгаан: {show(reason)}</p> : null}
            {diff.slice(0, open ? undefined : 3).map((d) => (
              <p key={d.key} className="text-gray-500">
                <span className="text-gray-700 dark:text-gray-300">{fieldLabels[d.key] ?? d.key}:</span>{' '}
                <span className="line-through">{show(d.before)}</span> → <span className="font-medium text-gray-900 dark:text-white">{show(d.after)}</span>
              </p>
            ))}
            {diff.length > 3 && (
              <button type="button" onClick={() => setExpanded(open ? null : l.id)} className="inline-flex items-center gap-0.5 text-brand-600 hover:text-brand-700">
                {open ? 'Хураах' : `+${diff.length - 3} талбар`}
                <ChevronDown className={open ? 'size-3 rotate-180' : 'size-3'} />
              </button>
            )}
            {!diff.length && !reason && <span className="text-gray-400">—</span>}
          </div>
        );
      },
    },
  ];

  return (
    <Panel
      title="Аудитын бүртгэл"
      description="Түлшний бүртгэлд хийгдсэн бүх үйлдэл, хэн хэзээ юуг өөрчилсөн"
      action={
        <>
          <SelectInput
            value={entityType}
            onChange={setEntityType}
            placeholder="Бүх бүртгэл"
            options={Object.entries(entityLabels).map(([value, label]) => ({ value, label }))}
            className="w-48"
          />
          <Segmented
            size="sm"
            value={limit}
            onChange={setLimit}
            options={[
              { value: '100', label: '100' },
              { value: '300', label: '300' },
              { value: '500', label: '500' },
            ]}
          />
        </>
      }
    >
      <DataTable columns={columns} rows={logs.data ?? []} rowKey={(l) => l.id} loading={logs.isLoading} empty="Аудитын бүртгэл алга" />
    </Panel>
  );
}
