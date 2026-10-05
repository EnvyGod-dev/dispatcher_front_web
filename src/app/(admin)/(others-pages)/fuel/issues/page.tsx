'use client';

import {
  Btn,
  Column,
  DataTable,
  DateRangeFilter,
  Dialog,
  ExportButton,
  Field,
  KpiCard,
  Panel,
  SelectInput,
  TextArea,
  TextInput,
} from '@/components/fuel/ui';
import { exportExcel } from '@/lib/fuel/export';
import { DateRange, errorMessage, fmtDateTime, fmtLiters, rangePresets, toNum } from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import type { FuelIssue, FuelVehicle } from '@/services/internal/fuel/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const dispenserLabel = (v: Pick<FuelVehicle, 'mineNumber' | 'name'>) => v.mineNumber || v.name;

export default function FuelIssuesPage() {
  const { canControl } = useFuelPermissions();
  const [range, setRange] = useState<DateRange>(rangePresets[4].range());
  const [dispenserId, setDispenserId] = useState('');
  const [creating, setCreating] = useState(false);

  const dispensers = useQuery({ queryKey: ['fuel', 'dispensers'], queryFn: fuelService.getDispensers });
  const issues = useQuery({
    queryKey: ['fuel', 'issues', range, dispenserId],
    queryFn: () => fuelService.getIssues({ ...range, dispenserVehicleId: dispenserId || undefined }),
  });

  const rows = issues.data ?? [];
  const total = rows.reduce((s, r) => s + toNum(r.quantity), 0);
  const byDispenser = new Map<string, number>();
  rows.forEach((r) => {
    const key = r.dispenserMineNumber ?? r.dispenserName;
    byDispenser.set(key, (byDispenser.get(key) ?? 0) + toNum(r.quantity));
  });
  const top = [...byDispenser.entries()].sort((a, b) => b[1] - a[1])[0];

  const columns: Column<FuelIssue>[] = [
    {
      key: 'date',
      header: 'Огноо',
      render: (r) => <span className="font-medium text-gray-800 dark:text-white/90">{fmtDateTime(r.issuedAt)}</span>,
    },
    { key: 'tank', header: 'Агуулахаас', render: (r) => r.tankName },
    {
      key: 'dispenser',
      header: 'Түгээгч машин',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.dispenserMineNumber ?? '—'}</p>
          {r.dispenserName && r.dispenserName !== r.dispenserMineNumber && (
            <p className="text-xs text-gray-500">{r.dispenserName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'Литр',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{fmtLiters(r.quantity)}</span>,
    },
    {
      key: 'notes',
      header: 'Тайлбар',
      className: 'max-w-[260px]',
      render: (r) => <span className="line-clamp-2 text-xs text-gray-500">{r.notes || '—'}</span>,
    },
  ];

  const handleExport = () =>
    exportExcel(
      `tulsh-zarlaga_${range.from}_${range.to}`,
      [
        {
          name: 'Зарлага',
          rows,
          columns: [
            { header: 'Огноо', value: (r: FuelIssue) => fmtDateTime(r.issuedAt), width: 18 },
            { header: 'Ажлын өдөр', value: (r: FuelIssue) => r.operationalDate, width: 12 },
            { header: 'Агуулахаас', value: (r: FuelIssue) => r.tankName, width: 16 },
            { header: 'Түгээгч машин', value: (r: FuelIssue) => r.dispenserMineNumber ?? r.dispenserName, width: 16 },
            { header: 'Литр', value: (r: FuelIssue) => toNum(r.quantity), width: 10 },
            { header: 'Тайлбар', value: (r: FuelIssue) => r.notes ?? '', width: 28 },
          ],
          totals: ['Нийт', '', '', '', total, ''],
        },
      ],
      [`Түлшний зарлага (агуулах → түгээгч машин): ${range.from} — ${range.to}`],
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <div className="flex gap-2">
          <ExportButton onClick={handleExport} disabled={!rows.length} />
          {canControl && (
            <Btn variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              Зарлага бүртгэх
            </Btn>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Нийт зарлага" value={fmtLiters(total)} tone="brand" loading={issues.isLoading} />
        <KpiCard label="Зарлагын тоо" value={rows.length} loading={issues.isLoading} />
        <KpiCard
          label="Хамгийн их авсан"
          value={top ? top[0] : '—'}
          hint={top ? fmtLiters(top[1]) : 'Мэдээлэл алга'}
          loading={issues.isLoading}
        />
      </div>

      <Panel
        title="Зарлагын бүртгэл"
        description="Агуулахаас түгээгч машин руу шилжүүлсэн түлш"
        action={
          <SelectInput
            value={dispenserId}
            onChange={setDispenserId}
            placeholder="Бүх түгээгч"
            options={(dispensers.data ?? []).map((v) => ({ value: v.id, label: dispenserLabel(v) }))}
            className="w-44"
          />
        }
      >
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={issues.isLoading} empty="Зарлага бүртгэгдээгүй" />
      </Panel>

      {creating && <CreateIssueDialog dispensers={dispensers.data ?? []} onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateIssueDialog({ dispensers, onClose }: { dispensers: FuelVehicle[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const tanks = useQuery({ queryKey: ['fuel', 'tanks'], queryFn: fuelService.getTanks });

  const activeTanks = (tanks.data ?? []).filter((t) => t.isActive);
  const [tankId, setTankId] = useState('');
  const [dispenserId, setDispenserId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [issuedAt, setIssuedAt] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [notes, setNotes] = useState('');

  const effectiveTank = tankId || (activeTanks.length === 1 ? activeTanks[0].id : '');

  const mutation = useMutation({
    mutationFn: () =>
      fuelService.createIssue({
        tankId: effectiveTank,
        dispenserVehicleId: dispenserId,
        quantity: toNum(quantity),
        issuedAt: dayjs(issuedAt).toISOString(),
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Зарлага бүртгэгдлээ');
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const invalid = !effectiveTank || !dispenserId || toNum(quantity) <= 0 || !issuedAt || !dayjs(issuedAt).isValid();

  return (
    <Dialog
      open
      onClose={onClose}
      title="Зарлага бүртгэх"
      description="Агуулахаас түгээгч машин руу түлш шилжүүлнэ. Агуулахын үлдэгдэл хасагдаж, түгээгчийн үлдэгдэл нэмэгдэнэ."
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={invalid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хадгалах
          </Btn>
        </>
      }
    >
      {activeTanks.length !== 1 && (
        <Field label="Агуулах">
          <SelectInput
            value={tankId}
            onChange={setTankId}
            placeholder="Сонгох"
            options={activeTanks.map((t) => ({ value: t.id, label: t.name }))}
          />
        </Field>
      )}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Түгээгч машин</span>
        {dispensers.length > 0 && dispensers.length <= 8 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dispensers.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setDispenserId(v.id)}
                className={
                  'rounded-xl border px-3 py-2.5 text-sm font-semibold transition ' +
                  (dispenserId === v.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300')
                }
              >
                {dispenserLabel(v)}
              </button>
            ))}
          </div>
        ) : (
          <SelectInput
            value={dispenserId}
            onChange={setDispenserId}
            placeholder="Сонгох"
            options={dispensers.map((v) => ({ value: v.id, label: dispenserLabel(v) }))}
          />
        )}
        {!dispensers.length && (
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            Парк дугаар нь ST-ээр эхэлсэн техник олдсонгүй
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Хэмжээ (литр)">
          <TextInput inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
        <Field label="Огноо, цаг">
          <TextInput type="datetime-local" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Тайлбар">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Dialog>
  );
}
