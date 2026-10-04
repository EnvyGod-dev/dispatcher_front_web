'use client';

import {
  Btn,
  Column,
  DataTable,
  DateRangeFilter,
  Dialog,
  ExportButton,
  Field,
  IconBtn,
  KpiCard,
  Panel,
  Pill,
  ReasonDialog,
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
} from '@/components/fuel/ui';
import { exportExcel } from '@/lib/fuel/export';
import {
  DateRange,
  errorMessage,
  fmtDateTime,
  fmtLiters,
  fmtMeter,
  rangePresets,
  shiftLabel,
  toNum,
} from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import type { FuelRefueling, FuelShiftType, FuelVehicle } from '@/services/internal/fuel/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Pencil, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type VehicleGroup = { key: string; label: string; model: string | null; count: number; total: number };

const vehicleLabel = (r: FuelRefueling) => r.receiverMineNumber ?? r.receiverName ?? '—';

export default function FuelRefuelingsPage() {
  const { canControl } = useFuelPermissions();
  const queryClient = useQueryClient();

  const [range, setRange] = useState<DateRange>(rangePresets[2].range());
  const [shift, setShift] = useState<'all' | FuelShiftType>('all');
  const [tankId, setTankId] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'vehicle'>('list');
  const [showCancelled, setShowCancelled] = useState(false);
  const [editing, setEditing] = useState<FuelRefueling | null>(null);
  const [cancelling, setCancelling] = useState<FuelRefueling | null>(null);

  const tanks = useQuery({ queryKey: ['fuel', 'tanks'], queryFn: fuelService.getTanks });
  const refuelings = useQuery({
    queryKey: ['fuel', 'refuelings', range, shift, tankId, showCancelled],
    queryFn: () =>
      fuelService.getRefuelings({
        ...range,
        shiftType: shift === 'all' ? undefined : shift,
        tankId: tankId || undefined,
        includeCancelled: showCancelled,
      }),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = refuelings.data ?? [];
    if (!q) return list;
    return list.filter((r) =>
      [r.receiverMineNumber, r.receiverName, r.receiverModel, r.notes].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [refuelings.data, search]);

  const active = rows.filter((r) => !r.cancelledAt);
  const total = active.reduce((sum, r) => sum + toNum(r.quantity), 0);
  const vehicles = new Set(active.map((r) => r.receiverVehicleId)).size;

  const groups = useMemo<VehicleGroup[]>(() => {
    const map = new Map<string, VehicleGroup>();
    for (const r of active) {
      const g = map.get(r.receiverVehicleId) ?? {
        key: r.receiverVehicleId,
        label: vehicleLabel(r),
        model: r.receiverModel,
        count: 0,
        total: 0,
      };
      g.count += 1;
      g.total += toNum(r.quantity);
      map.set(r.receiverVehicleId, g);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [active]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fuel'] });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => fuelService.cancelRefueling(id, reason),
    onSuccess: () => {
      toast.success('Цэнэглэлт цуцлагдлаа');
      setCancelling(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelRefueling>[] = [
    {
      key: 'date',
      header: 'Огноо',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{fmtDateTime(r.refueledAt)}</p>
          <p className="text-xs text-gray-500">Ажлын өдөр {r.operationalDate}</p>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Ээлж',
      render: (r) => <Pill tone={r.shiftType === 'night' ? 'blue' : 'amber'}>{shiftLabel(r.shiftType)}</Pill>,
    },
    {
      key: 'vehicle',
      header: 'Техник',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{vehicleLabel(r)}</p>
          {r.receiverModel && <p className="text-xs text-gray-500">{r.receiverModel}</p>}
        </div>
      ),
    },
    { key: 'tank', header: 'Агуулах', render: (r) => r.tankName ?? '—' },
    {
      key: 'meter',
      header: 'Тоолуур',
      render: (r) =>
        r.meterStart !== null && r.meterEnd !== null ? (
          <span className="font-mono text-xs tabular-nums text-gray-600 dark:text-gray-400">
            {fmtMeter(r.meterStart)} → {fmtMeter(r.meterEnd)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'qty',
      header: 'Литр',
      align: 'right',
      render: (r) => (
        <span className={r.cancelledAt ? 'text-gray-400 line-through' : 'font-semibold tabular-nums text-gray-900 dark:text-white'}>
          {fmtLiters(r.quantity)}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Тайлбар',
      className: 'max-w-[220px]',
      render: (r) =>
        r.cancelledAt ? (
          <Pill tone="red">Цуцалсан{r.cancelReason ? `: ${r.cancelReason}` : ''}</Pill>
        ) : (
          <span className="line-clamp-2 text-xs text-gray-500">{r.notes || '—'}</span>
        ),
    },
    ...(canControl
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (r: FuelRefueling) =>
              r.cancelledAt ? null : (
                <div className="flex justify-end gap-0.5">
                  <IconBtn label="Засах" icon={<Pencil className="size-4" />} onClick={() => setEditing(r)} />
                  <IconBtn label="Цуцлах" danger icon={<Ban className="size-4" />} onClick={() => setCancelling(r)} />
                </div>
              ),
          },
        ]
      : []),
  ];

  const groupColumns: Column<VehicleGroup>[] = [
    {
      key: 'vehicle',
      header: 'Техник',
      render: (g) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{g.label}</p>
          {g.model && <p className="text-xs text-gray-500">{g.model}</p>}
        </div>
      ),
    },
    { key: 'count', header: 'Цэнэглэлт', align: 'right', render: (g) => g.count },
    { key: 'avg', header: 'Дундаж', align: 'right', render: (g) => fmtLiters(g.total / g.count) },
    {
      key: 'share',
      header: 'Эзлэх хувь',
      render: (g) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${total ? (g.total / total) * 100 : 0}%` }} />
          </div>
          <span className="text-xs tabular-nums text-gray-500">{total ? ((g.total / total) * 100).toFixed(1) : 0}%</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Нийт',
      align: 'right',
      render: (g) => <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{fmtLiters(g.total)}</span>,
    },
  ];

  const handleExport = () => {
    exportExcel(
      `tulsh-olgolt_${range.from}_${range.to}`,
      [
        {
          name: 'Олголт',
          rows: active,
          columns: [
            { header: 'Огноо цаг', value: (r) => fmtDateTime(r.refueledAt), width: 18 },
            { header: 'Ажлын өдөр', value: (r) => r.operationalDate, width: 12 },
            { header: 'Ээлж', value: (r) => shiftLabel(r.shiftType), width: 8 },
            { header: 'Парк №', value: (r) => r.receiverMineNumber ?? '', width: 12 },
            { header: 'Техник', value: (r) => r.receiverName ?? '', width: 18 },
            { header: 'Модел', value: (r) => r.receiverModel ?? '', width: 14 },
            { header: 'Агуулах', value: (r) => r.tankName ?? '', width: 14 },
            { header: 'Эхний заалт', value: (r) => (r.meterStart ? toNum(r.meterStart) : ''), width: 14 },
            { header: 'Төгсгөлийн заалт', value: (r) => (r.meterEnd ? toNum(r.meterEnd) : ''), width: 16 },
            { header: 'Литр', value: (r) => toNum(r.quantity), width: 10 },
            { header: 'Тайлбар', value: (r) => r.notes ?? '', width: 30 },
          ],
          totals: ['Нийт', '', '', '', '', '', '', '', '', total, ''],
        },
        {
          name: 'Техникээр',
          rows: groups,
          columns: [
            { header: 'Техник', value: (g) => g.label, width: 16 },
            { header: 'Модел', value: (g) => g.model ?? '', width: 14 },
            { header: 'Цэнэглэлт', value: (g) => g.count, width: 12 },
            { header: 'Нийт литр', value: (g) => Math.round(g.total * 10) / 10, width: 12 },
          ],
          totals: ['Нийт', '', active.length, total],
        },
      ],
      [`Түлшний олголт: ${range.from} — ${range.to}`],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <ExportButton onClick={handleExport} disabled={!active.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Нийт олгосон" value={fmtLiters(total)} tone="brand" loading={refuelings.isLoading} />
        <KpiCard label="Цэнэглэлт" value={active.length} hint="Цуцлагдсаныг оруулаагүй" loading={refuelings.isLoading} />
        <KpiCard label="Техник" value={vehicles} hint={vehicles ? `Дунджаар ${fmtLiters(total / vehicles)}` : undefined} loading={refuelings.isLoading} />
      </div>

      <Panel
        title={view === 'list' ? 'Олголтын бүртгэл' : 'Техникээр нэгтгэсэн'}
        action={
          <Segmented
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'Жагсаалт' },
              { value: 'vehicle', label: 'Техникээр' },
            ]}
          />
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <TextInput placeholder="Парк №, модел, тайлбар…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Segmented
            size="sm"
            value={shift}
            onChange={setShift}
            options={[
              { value: 'all', label: 'Бүх ээлж' },
              { value: 'day', label: 'Өдөр' },
              { value: 'night', label: 'Орой' },
            ]}
          />
          {(tanks.data?.length ?? 0) > 1 && (
            <SelectInput
              value={tankId}
              onChange={setTankId}
              placeholder="Бүх агуулах"
              options={(tanks.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
              className="w-44"
            />
          )}
          {canControl && view === 'list' && (
            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Цуцлагдсаныг харуулах
            </label>
          )}
        </div>

        {view === 'list' ? (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            loading={refuelings.isLoading}
            empty="Олголт олдсонгүй"
            emptyDescription="Хугацаа эсвэл шүүлтүүрээ өөрчилж үзнэ үү."
            rowClassName={(r) => (r.cancelledAt ? 'opacity-60' : undefined)}
          />
        ) : (
          <DataTable
            columns={groupColumns}
            rows={groups}
            rowKey={(g) => g.key}
            loading={refuelings.isLoading}
            empty="Олголт олдсонгүй"
            footer={
              <tr>
                <td className="px-5 py-3 text-gray-800 dark:text-white">Нийт</td>
                <td className="px-5 py-3 text-right">{active.length}</td>
                <td />
                <td />
                <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white">{fmtLiters(total)}</td>
              </tr>
            }
          />
        )}
      </Panel>

      {editing && <EditRefuelingDialog refueling={editing} onClose={() => setEditing(null)} onSaved={invalidate} />}

      <ReasonDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Цэнэглэлт цуцлах"
        description={
          cancelling
            ? `${vehicleLabel(cancelling)} · ${fmtLiters(cancelling.quantity)} · ${fmtDateTime(cancelling.refueledAt)}. Агуулахын үлдэгдэл буцаж нэмэгдэнэ.`
            : undefined
        }
        confirmText="Цуцлах"
        danger
        loading={cancelMutation.isPending}
        onConfirm={(reason) => cancelling && cancelMutation.mutate({ id: cancelling.id, reason })}
      />
    </div>
  );
}

function EditRefuelingDialog({
  refueling,
  onClose,
  onSaved,
}: {
  refueling: FuelRefueling;
  onClose: () => void;
  onSaved: () => void;
}) {
  const hasMeter = refueling.meterStart !== null && refueling.meterEnd !== null;
  const vehicles = useQuery({ queryKey: ['fuel', 'vehicles'], queryFn: fuelService.getVehicles });

  const [vehicleId, setVehicleId] = useState(refueling.receiverVehicleId);
  const [quantity, setQuantity] = useState(String(toNum(refueling.quantity)));
  const [meterStart, setMeterStart] = useState(hasMeter ? fmtMeter(refueling.meterStart) : '');
  const [meterEnd, setMeterEnd] = useState(hasMeter ? fmtMeter(refueling.meterEnd) : '');
  const [shift, setShift] = useState<FuelShiftType>(refueling.shiftType ?? 'day');
  const [notes, setNotes] = useState(refueling.notes ?? '');
  const [reason, setReason] = useState('');

  const meterQty = hasMeter ? toNum(meterEnd) - toNum(meterStart) : null;

  const mutation = useMutation({
    mutationFn: () => {
      const changes: Record<string, unknown> = {};
      if (vehicleId !== refueling.receiverVehicleId) changes.receiverVehicleId = vehicleId;
      if (hasMeter) {
        if (toNum(meterStart) !== toNum(refueling.meterStart) || toNum(meterEnd) !== toNum(refueling.meterEnd)) {
          changes.meterStart = toNum(meterStart);
          changes.meterEnd = toNum(meterEnd);
          changes.quantity = meterQty;
        }
      } else if (toNum(quantity) !== toNum(refueling.quantity)) {
        changes.quantity = toNum(quantity);
      }
      if (shift !== refueling.shiftType) changes.shiftType = shift;
      if (notes.trim() !== (refueling.notes ?? '')) changes.notes = notes.trim() || null;
      return fuelService.updateRefueling(refueling.id, { ...changes, reason: reason.trim() });
    },
    onSuccess: () => {
      toast.success('Цэнэглэлт засагдлаа');
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const invalid =
    reason.trim().length < 3 || (hasMeter ? !meterQty || meterQty <= 0 : toNum(quantity) <= 0) || !vehicleId;

  const vehicleOptions = (vehicles.data ?? []).map((v: FuelVehicle) => ({
    value: v.id,
    label: [v.mineNumber, v.model ?? v.name].filter(Boolean).join(' · '),
  }));

  return (
    <Dialog
      open
      onClose={onClose}
      title="Цэнэглэлт засах"
      description={`${vehicleLabel(refueling)} · ${fmtDateTime(refueling.refueledAt)}`}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={invalid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field label="Техник">
        <SelectInput value={vehicleId} onChange={setVehicleId} options={vehicleOptions} disabled={vehicles.isLoading} />
      </Field>
      {hasMeter ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Эхний заалт">
            <TextInput inputMode="numeric" value={meterStart} onChange={(e) => setMeterStart(e.target.value.replace(/\D/g, ''))} className="font-mono" />
          </Field>
          <Field label="Төгсгөлийн заалт">
            <TextInput inputMode="numeric" value={meterEnd} onChange={(e) => setMeterEnd(e.target.value.replace(/\D/g, ''))} className="font-mono" />
          </Field>
          <p className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
            Цэнэглэсэн хэмжээ:{' '}
            <span className={meterQty && meterQty > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'font-semibold text-error-600'}>
              {meterQty && meterQty > 0 ? fmtLiters(meterQty) : 'Төгсгөлийн заалт их байх ёстой'}
            </span>
          </p>
        </div>
      ) : (
        <Field label="Хэмжээ (литр)">
          <TextInput inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
      )}
      <Field label="Ээлж">
        <Segmented
          value={shift}
          onChange={setShift}
          options={[
            { value: 'day', label: 'Өдөр' },
            { value: 'night', label: 'Орой' },
          ]}
        />
      </Field>
      <Field label="Тайлбар">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Field label="Засах шалтгаан" hint="Аудитын бүртгэлд хадгалагдана">
        <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Жишээ: тоолуурын заалт буруу орсон" />
      </Field>
    </Dialog>
  );
}
