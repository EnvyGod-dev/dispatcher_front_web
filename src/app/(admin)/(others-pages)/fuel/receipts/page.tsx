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
import { DateRange, errorMessage, fmtDateTime, fmtLiters, rangePresets, toNum } from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import type { FuelReceipt, FuelReceiptEditRequest } from '@/services/internal/fuel/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Check, FilePenLine, Mail, Plus, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

const emailTone = { pending: 'amber', sent: 'green', failed: 'red' } as const;
const emailLabel = { pending: 'Илгээгээгүй', sent: 'Илгээсэн', failed: 'Алдаатай' };
const changeLabels: Record<string, string> = {
  tankId: 'Агуулах',
  supplierId: 'Нийлүүлэгч',
  quantity: 'Хэмжээ',
  receivedAt: 'Хүлээн авсан огноо',
  documentNumber: 'Баримт №',
  transportVehicleNumber: 'Тээврийн хэрэгсэл',
  notes: 'Тайлбар',
};

export default function FuelReceiptsPage() {
  return (
    <Suspense>
      <ReceiptsContent />
    </Suspense>
  );
}

function ReceiptsContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState<'list' | 'requests'>(params.get('tab') === 'requests' ? 'requests' : 'list');
  const pending = useQuery({
    queryKey: ['fuel', 'edit-requests', 'pending'],
    queryFn: () => fuelService.getEditRequests('pending'),
  });

  return (
    <div className="space-y-6">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'list', label: 'Орлогын бүртгэл' },
          { value: 'requests', label: 'Засварын хүсэлт', count: pending.data?.length },
        ]}
      />
      {tab === 'list' ? <ReceiptList /> : <EditRequests />}
    </div>
  );
}

function ReceiptList() {
  const { canControl } = useFuelPermissions();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<DateRange>(rangePresets[4].range());
  const [supplierId, setSupplierId] = useState('');
  const [creating, setCreating] = useState(false);
  const [requesting, setRequesting] = useState<FuelReceipt | null>(null);

  const suppliers = useQuery({ queryKey: ['fuel', 'suppliers'], queryFn: fuelService.getSuppliers });
  const receipts = useQuery({
    queryKey: ['fuel', 'receipts', range, supplierId],
    queryFn: () => fuelService.getReceipts({ ...range, supplierId: supplierId || undefined }),
  });

  const rows = receipts.data ?? [];
  const valid = rows.filter((r) => !r.cancelledAt);
  const total = valid.reduce((s, r) => s + toNum(r.quantity), 0);
  const failed = valid.filter((r) => r.emailStatus === 'failed').length;

  const resend = useMutation({
    mutationFn: (id: string) => fuelService.resendAct(id),
    onSuccess: () => {
      toast.success('АКТ дахин илгээгдлээ');
      queryClient.invalidateQueries({ queryKey: ['fuel', 'receipts'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelReceipt>[] = [
    {
      key: 'date',
      header: 'Огноо',
      render: (r) => <span className="font-medium text-gray-800 dark:text-white/90">{fmtDateTime(r.receivedAt)}</span>,
    },
    { key: 'act', header: 'АКТ №', render: (r) => <span className="font-mono text-xs">{r.actNumber ?? '—'}</span> },
    { key: 'supplier', header: 'Нийлүүлэгч', render: (r) => r.supplierName },
    { key: 'tank', header: 'Агуулах', render: (r) => r.tankName },
    {
      key: 'doc',
      header: 'Баримт / Тээвэр',
      render: (r) => (
        <div className="text-xs">
          <p>{r.documentNumber || '—'}</p>
          <p className="text-gray-500">{r.transportVehicleNumber || ''}</p>
        </div>
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
      key: 'status',
      header: 'Төлөв',
      render: (r) =>
        r.cancelledAt ? <Pill tone="red">Цуцалсан</Pill> : <Pill tone={emailTone[r.emailStatus]}>АКТ {emailLabel[r.emailStatus]}</Pill>,
    },
    ...(canControl
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (r: FuelReceipt) =>
              r.cancelledAt ? null : (
                <div className="flex justify-end gap-0.5">
                  {r.emailStatus !== 'sent' && r.actFileUrl && (
                    <IconBtn label="АКТ дахин илгээх" icon={<Mail className="size-4" />} onClick={() => resend.mutate(r.id)} />
                  )}
                  <IconBtn label="Засвар / цуцлах хүсэлт" icon={<FilePenLine className="size-4" />} onClick={() => setRequesting(r)} />
                </div>
              ),
          },
        ]
      : []),
  ];

  const handleExport = () =>
    exportExcel(
      `tulsh-orlogo_${range.from}_${range.to}`,
      [
        {
          name: 'Орлого',
          rows: valid,
          columns: [
            { header: 'Огноо', value: (r) => fmtDateTime(r.receivedAt), width: 18 },
            { header: 'АКТ №', value: (r) => r.actNumber ?? '', width: 16 },
            { header: 'Нийлүүлэгч', value: (r) => r.supplierName, width: 22 },
            { header: 'Агуулах', value: (r) => r.tankName, width: 14 },
            { header: 'Баримт №', value: (r) => r.documentNumber ?? '', width: 14 },
            { header: 'Тээврийн хэрэгсэл', value: (r) => r.transportVehicleNumber ?? '', width: 16 },
            { header: 'Хүлээн авсан', value: (r) => r.receivedByName ?? '', width: 16 },
            { header: 'Литр', value: (r) => toNum(r.quantity), width: 10 },
            { header: 'Тайлбар', value: (r) => r.notes ?? '', width: 28 },
          ],
          totals: ['Нийт', '', '', '', '', '', '', total, ''],
        },
      ],
      [`Түлшний орлого: ${range.from} — ${range.to}`],
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <div className="flex gap-2">
          <ExportButton onClick={handleExport} disabled={!valid.length} />
          {canControl && (
            <Btn variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
              Орлого бүртгэх
            </Btn>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Нийт орлого" value={fmtLiters(total)} tone="blue" loading={receipts.isLoading} />
        <KpiCard label="Орлогын тоо" value={valid.length} loading={receipts.isLoading} />
        <KpiCard
          label="АКТ илгээгдээгүй"
          value={failed}
          hint={failed ? 'И-мэйл илгээхэд алдаа гарсан' : 'Бүх АКТ хэвийн'}
          tone={failed ? 'red' : 'green'}
          loading={receipts.isLoading}
        />
      </div>

      <Panel
        title="Орлогын бүртгэл"
        action={
          <SelectInput
            value={supplierId}
            onChange={setSupplierId}
            placeholder="Бүх нийлүүлэгч"
            options={(suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
            className="w-52"
          />
        }
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={receipts.isLoading}
          empty="Орлого бүртгэгдээгүй"
          rowClassName={(r) => (r.cancelledAt ? 'opacity-60' : undefined)}
        />
      </Panel>

      {creating && <CreateReceiptDialog onClose={() => setCreating(false)} />}
      {requesting && <EditRequestDialog receipt={requesting} onClose={() => setRequesting(null)} />}
    </>
  );
}

function CreateReceiptDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const tanks = useQuery({ queryKey: ['fuel', 'tanks'], queryFn: fuelService.getTanks });
  const suppliers = useQuery({ queryKey: ['fuel', 'suppliers'], queryFn: fuelService.getSuppliers });

  const activeTanks = (tanks.data ?? []).filter((t) => t.isActive);
  const [tankId, setTankId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [receivedAt, setReceivedAt] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [documentNumber, setDocumentNumber] = useState('');
  const [transport, setTransport] = useState('');
  const [notes, setNotes] = useState('');

  const effectiveTank = tankId || (activeTanks.length === 1 ? activeTanks[0].id : '');

  const mutation = useMutation({
    mutationFn: () =>
      fuelService.createReceipt({
        tankId: effectiveTank,
        supplierId,
        quantity: toNum(quantity),
        receivedAt: dayjs(receivedAt).toISOString(),
        documentNumber: documentNumber.trim() || null,
        transportVehicleNumber: transport.trim() || null,
        notes: notes.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(res.body.actNumber ? `Орлого бүртгэгдлээ · АКТ ${res.body.actNumber}` : 'Орлого бүртгэгдлээ');
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const invalid = !effectiveTank || !supplierId || toNum(quantity) <= 0 || !receivedAt;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Орлого бүртгэх"
      description="Хадгалсны дараа АКТ дугаар автоматаар үүснэ."
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
      <Field label="Нийлүүлэгч">
        <SelectInput
          value={supplierId}
          onChange={setSupplierId}
          placeholder="Сонгох"
          options={(suppliers.data ?? []).filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Хэмжээ (литр)">
          <TextInput inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
        <Field label="Хүлээн авсан огноо">
          <TextInput type="datetime-local" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
        </Field>
        <Field label="Баримт / накладной №">
          <TextInput value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </Field>
        <Field label="Тээврийн хэрэгслийн дугаар">
          <TextInput value={transport} onChange={(e) => setTransport(e.target.value)} />
        </Field>
      </div>
      <Field label="Тайлбар">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Dialog>
  );
}

function EditRequestDialog({ receipt, onClose }: { receipt: FuelReceipt; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'update' | 'cancel'>('update');
  const [quantity, setQuantity] = useState(String(toNum(receipt.quantity)));
  const [documentNumber, setDocumentNumber] = useState(receipt.documentNumber ?? '');
  const [transport, setTransport] = useState(receipt.transportVehicleNumber ?? '');
  const [notes, setNotes] = useState(receipt.notes ?? '');
  const [reason, setReason] = useState('');

  const changes: Record<string, unknown> = {};
  if (toNum(quantity) !== toNum(receipt.quantity)) changes.quantity = toNum(quantity);
  if (documentNumber.trim() !== (receipt.documentNumber ?? '')) changes.documentNumber = documentNumber.trim() || null;
  if (transport.trim() !== (receipt.transportVehicleNumber ?? '')) changes.transportVehicleNumber = transport.trim() || null;
  if (notes.trim() !== (receipt.notes ?? '')) changes.notes = notes.trim() || null;

  const mutation = useMutation({
    mutationFn: () =>
      fuelService.createReceiptEditRequest(receipt.id, {
        type,
        changes: type === 'update' ? changes : undefined,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      toast.success('Хүсэлт илгээгдлээ. Батлагдсаны дараа өөрчлөгдөнө.');
      queryClient.invalidateQueries({ queryKey: ['fuel', 'edit-requests'] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const invalid = reason.trim().length < 3 || (type === 'update' && (!Object.keys(changes).length || toNum(quantity) <= 0));

  return (
    <Dialog
      open
      onClose={onClose}
      title="Засварын хүсэлт"
      description={`АКТ ${receipt.actNumber ?? '—'} · ${fmtLiters(receipt.quantity)} · ${receipt.supplierName}. Өөр хүн батласны дараа хэрэгжинэ.`}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant={type === 'cancel' ? 'danger' : 'primary'} disabled={invalid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хүсэлт илгээх
          </Btn>
        </>
      }
    >
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: 'update', label: 'Засах' },
          { value: 'cancel', label: 'Цуцлах' },
        ]}
      />
      {type === 'update' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Хэмжээ (литр)">
            <TextInput inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ''))} />
          </Field>
          <Field label="Баримт №">
            <TextInput value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </Field>
          <Field label="Тээврийн хэрэгсэл" className="col-span-2">
            <TextInput value={transport} onChange={(e) => setTransport(e.target.value)} />
          </Field>
          <Field label="Тайлбар" className="col-span-2">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      )}
      <Field label="Шалтгаан">
        <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Dialog>
  );
}

function EditRequests() {
  const { canApprove } = useFuelPermissions();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FuelReceiptEditRequest['status']>('pending');
  const [reviewing, setReviewing] = useState<{ request: FuelReceiptEditRequest; approve: boolean } | null>(null);

  const requests = useQuery({
    queryKey: ['fuel', 'edit-requests', status],
    queryFn: () => fuelService.getEditRequests(status),
  });

  const review = useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note: string }) =>
      approve ? fuelService.approveEditRequest(id, note) : fuelService.rejectEditRequest(id, note),
    onSuccess: (_d, v) => {
      toast.success(v.approve ? 'Хүсэлт батлагдлаа' : 'Хүсэлт татгалзлаа');
      setReviewing(null);
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelReceiptEditRequest>[] = [
    { key: 'date', header: 'Огноо', render: (r) => fmtDateTime(r.createdAt) },
    {
      key: 'type',
      header: 'Төрөл',
      render: (r) => <Pill tone={r.type === 'cancel' ? 'red' : 'blue'}>{r.type === 'cancel' ? 'Цуцлах' : 'Засах'}</Pill>,
    },
    {
      key: 'receipt',
      header: 'Орлого',
      render: (r) => (
        <div>
          <p className="font-mono text-xs">{r.actNumber ?? '—'}</p>
          <p className="text-xs text-gray-500">
            {fmtLiters(r.receiptQuantity)} · {fmtDateTime(r.receiptReceivedAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'changes',
      header: 'Өөрчлөлт',
      className: 'max-w-[260px]',
      render: (r) =>
        r.type === 'cancel' ? (
          <span className="text-xs text-gray-500">Орлогыг цуцлах</span>
        ) : (
          <ul className="space-y-0.5 text-xs">
            {Object.entries(r.changes).map(([k, v]) => (
              <li key={k}>
                <span className="text-gray-500">{changeLabels[k] ?? k}:</span> {String(v ?? '—')}
              </li>
            ))}
          </ul>
        ),
    },
    {
      key: 'reason',
      header: 'Шалтгаан',
      className: 'max-w-[240px]',
      render: (r) => (
        <div className="text-xs">
          <p className="line-clamp-2">{r.reason}</p>
          <p className="text-gray-500">{r.requestedByName ?? ''}</p>
        </div>
      ),
    },
    ...(status === 'pending' && canApprove
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (r: FuelReceiptEditRequest) => (
              <div className="flex justify-end gap-1">
                <Btn size="sm" variant="ghost" className="text-error-600" icon={<X className="size-3.5" />} onClick={() => setReviewing({ request: r, approve: false })}>
                  Татгалзах
                </Btn>
                <Btn size="sm" variant="primary" icon={<Check className="size-3.5" />} onClick={() => setReviewing({ request: r, approve: true })}>
                  Батлах
                </Btn>
              </div>
            ),
          },
        ]
      : [
          {
            key: 'note',
            header: 'Шийдвэр',
            render: (r: FuelReceiptEditRequest) =>
              r.status === 'pending' ? <Pill tone="amber">Хүлээгдэж буй</Pill> : <span className="text-xs text-gray-500">{r.reviewNote || '—'}</span>,
          },
        ]),
  ];

  return (
    <Panel
      title="Орлогын засварын хүсэлт"
      description={canApprove ? 'Хүсэлт илгээсэн хүн өөрөө батлах боломжгүй.' : 'Хүсэлтийг зөвхөн админ батална.'}
      action={
        <Segmented
          size="sm"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'approved', label: 'Батлагдсан' },
            { value: 'rejected', label: 'Татгалзсан' },
          ]}
        />
      }
    >
      <DataTable columns={columns} rows={requests.data ?? []} rowKey={(r) => r.id} loading={requests.isLoading} empty="Хүсэлт алга" />
      <ReasonDialog
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={reviewing?.approve ? 'Хүсэлт батлах' : 'Хүсэлт татгалзах'}
        description={reviewing ? `АКТ ${reviewing.request.actNumber ?? '—'} · ${reviewing.request.reason}` : undefined}
        confirmText={reviewing?.approve ? 'Батлах' : 'Татгалзах'}
        danger={!reviewing?.approve}
        required={!reviewing?.approve}
        loading={review.isPending}
        onConfirm={(note) => reviewing && review.mutate({ id: reviewing.request.id, approve: reviewing.approve, note })}
      />
    </Panel>
  );
}
