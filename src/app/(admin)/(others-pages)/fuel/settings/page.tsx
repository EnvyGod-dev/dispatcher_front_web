'use client';

import { Btn, Column, DataTable, Dialog, Field, IconBtn, Panel, Pill, Segmented, SelectInput, TextArea, TextInput } from '@/components/fuel/ui';
import { errorMessage, fmtLiters, fmtNumber, fuelTypeLabel, toNum } from '@/lib/fuel/format';
import { useFuelPermissions } from '@/lib/fuel/permissions';
import fuelService from '@/services/internal/fuel';
import type { FuelNorm, FuelRecipient, FuelSupplier, FuelTank, FuelType } from '@/services/internal/fuel/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Section = 'tanks' | 'suppliers' | 'norms' | 'general';

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['fuel'] });
};

const activePill = (active: boolean) => (active ? <Pill tone="green">Идэвхтэй</Pill> : <Pill>Идэвхгүй</Pill>);

export default function FuelSettingsPage() {
  const { canControl } = useFuelPermissions();
  const [section, setSection] = useState<Section>('tanks');
  if (!canControl) return null;

  return (
    <div className="space-y-6">
      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { value: 'tanks', label: 'Агуулах' },
          { value: 'suppliers', label: 'Нийлүүлэгч' },
          { value: 'norms', label: 'Зарцуулалтын норм' },
          { value: 'general', label: 'Ерөнхий' },
        ]}
      />
      {section === 'tanks' && <TanksSection />}
      {section === 'suppliers' && <SuppliersSection />}
      {section === 'norms' && <NormsSection />}
      {section === 'general' && <GeneralSection />}
    </div>
  );
}

// ─── Tanks ─────────────────────────────────────────────────

function TanksSection() {
  const tanks = useQuery({ queryKey: ['fuel', 'tanks'], queryFn: fuelService.getTanks });
  const balances = useQuery({ queryKey: ['fuel', 'balances', 'tank'], queryFn: () => fuelService.getBalances('tank') });
  const [editing, setEditing] = useState<FuelTank | 'new' | null>(null);

  const balanceOf = (id: string) => balances.data?.find((b) => b.holderId === id)?.balance;

  const columns: Column<FuelTank>[] = [
    {
      key: 'name',
      header: 'Нэр',
      render: (t) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{t.name}</p>
          {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
        </div>
      ),
    },
    { key: 'type', header: 'Түлш', render: (t) => fuelTypeLabel(t.fuelType) },
    { key: 'capacity', header: 'Багтаамж', align: 'right', render: (t) => fmtLiters(t.capacity) },
    { key: 'balance', header: 'Үлдэгдэл', align: 'right', render: (t) => <span className="font-semibold tabular-nums">{fmtLiters(balanceOf(t.id))}</span> },
    { key: 'active', header: 'Төлөв', render: (t) => activePill(t.isActive) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <IconBtn label="Засах" icon={<Pencil className="size-4" />} onClick={() => setEditing(t)} />
      ),
    },
  ];

  return (
    <Panel
      title="Түлшний агуулах"
      description="Mobile апп нь эхний идэвхтэй агуулахыг олголтод автоматаар ашиглана."
      action={
        <Btn variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
          Агуулах нэмэх
        </Btn>
      }
    >
      <DataTable columns={columns} rows={tanks.data ?? []} rowKey={(t) => t.id} loading={tanks.isLoading} empty="Агуулах бүртгэгдээгүй" />
      {editing && <TankDialog tank={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function TankDialog({ tank, onClose }: { tank: FuelTank | null; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [name, setName] = useState(tank?.name ?? '');
  const [location, setLocation] = useState(tank?.location ?? '');
  const [capacity, setCapacity] = useState(tank?.capacity ? String(toNum(tank.capacity)) : '');
  const [fuelType, setFuelType] = useState<FuelType>(tank?.fuelType ?? 'diesel');
  const [isActive, setIsActive] = useState(tank?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        location: location.trim() || null,
        capacity: capacity ? toNum(capacity) : null,
        fuelType,
        isActive,
      };
      return tank ? fuelService.updateTank(tank.id, input) : fuelService.createTank(input);
    },
    onSuccess: () => {
      toast.success(tank ? 'Агуулах шинэчлэгдлээ' : 'Агуулах нэмэгдлээ');
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={tank ? 'Агуулах засах' : 'Агуулах нэмэх'}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={!name.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field label="Нэр">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ: Үндсэн агуулах" autoFocus />
      </Field>
      <Field label="Байршил">
        <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Багтаамж (литр)">
          <TextInput inputMode="decimal" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/[^\d.]/g, ''))} />
        </Field>
        <Field label="Түлшний төрөл">
          <SelectInput
            value={fuelType}
            onChange={(v) => setFuelType(v as FuelType)}
            options={[
              { value: 'diesel', label: 'Дизель' },
              { value: 'gasoline', label: 'Бензин' },
            ]}
          />
        </Field>
      </div>
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </Dialog>
  );
}

function ActiveToggle({ value, onChange, label = 'Идэвхтэй' }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
      {label}
    </label>
  );
}

// ─── Suppliers ─────────────────────────────────────────────

function SuppliersSection() {
  const suppliers = useQuery({ queryKey: ['fuel', 'suppliers'], queryFn: fuelService.getSuppliers });
  const [editing, setEditing] = useState<FuelSupplier | 'new' | null>(null);

  const columns: Column<FuelSupplier>[] = [
    { key: 'name', header: 'Нэр', render: (s) => <span className="font-medium text-gray-800 dark:text-white/90">{s.name}</span> },
    { key: 'phone', header: 'Утас', render: (s) => s.contactPhone || '—' },
    { key: 'email', header: 'И-мэйл', render: (s) => s.contactEmail || '—' },
    { key: 'active', header: 'Төлөв', render: (s) => activePill(s.isActive) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <IconBtn label="Засах" icon={<Pencil className="size-4" />} onClick={() => setEditing(s)} />
      ),
    },
  ];

  return (
    <Panel
      title="Нийлүүлэгч"
      action={
        <Btn variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
          Нийлүүлэгч нэмэх
        </Btn>
      }
    >
      <DataTable columns={columns} rows={suppliers.data ?? []} rowKey={(s) => s.id} loading={suppliers.isLoading} empty="Нийлүүлэгч бүртгэгдээгүй" />
      {editing && <SupplierDialog supplier={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function SupplierDialog({ supplier, onClose }: { supplier: FuelSupplier | null; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [name, setName] = useState(supplier?.name ?? '');
  const [phone, setPhone] = useState(supplier?.contactPhone ?? '');
  const [email, setEmail] = useState(supplier?.contactEmail ?? '');
  const [isActive, setIsActive] = useState(supplier?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: () => {
      const input = { name: name.trim(), contactPhone: phone.trim() || null, contactEmail: email.trim() || null, isActive };
      return supplier ? fuelService.updateSupplier(supplier.id, input) : fuelService.createSupplier(input);
    },
    onSuccess: () => {
      toast.success(supplier ? 'Нийлүүлэгч шинэчлэгдлээ' : 'Нийлүүлэгч нэмэгдлээ');
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={supplier ? 'Нийлүүлэгч засах' : 'Нийлүүлэгч нэмэх'}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={!name.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field label="Нэр">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Утас">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="И-мэйл">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </Dialog>
  );
}

// ─── Norms ─────────────────────────────────────────────────

function NormsSection() {
  const invalidate = useInvalidate();
  const norms = useQuery({ queryKey: ['fuel', 'norms'], queryFn: fuelService.getNorms });
  const [editing, setEditing] = useState<FuelNorm | 'new' | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => fuelService.deleteNorm(id),
    onSuccess: () => {
      toast.success('Норм устгагдлаа');
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelNorm>[] = [
    { key: 'model', header: 'Техникийн модел', render: (n) => <span className="font-medium text-gray-800 dark:text-white/90">{n.vehicleModel}</span> },
    { key: 'trip', header: 'л/рейс', align: 'right', render: (n) => (n.targetLitersPerTrip ? fmtNumber(n.targetLitersPerTrip, 2) : '—') },
    { key: 'm3', header: 'л/м³', align: 'right', render: (n) => (n.targetLitersPerM3 ? fmtNumber(n.targetLitersPerM3, 3) : '—') },
    { key: 'threshold', header: 'Босго', align: 'right', render: (n) => (n.thresholdPercent ? `${toNum(n.thresholdPercent)}%` : 'Ерөнхий') },
    { key: 'active', header: 'Төлөв', render: (n) => activePill(n.isActive) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (n) => (
        <div className="flex justify-end gap-1">
          <IconBtn label="Засах" icon={<Pencil className="size-4" />} onClick={() => setEditing(n)} />
          <IconBtn label="Устгах" danger icon={<Trash2 className="size-4" />} onClick={() => window.confirm(`${n.vehicleModel} нормыг устгах уу?`) && remove.mutate(n.id)} />
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="Зарцуулалтын норм"
      description="Ижил моделийн 2-оос цөөн техниктэй үед нормтой харьцуулж хэтрэлт тооцно."
      action={
        <Btn variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
          Норм нэмэх
        </Btn>
      }
    >
      <DataTable columns={columns} rows={norms.data ?? []} rowKey={(n) => n.id} loading={norms.isLoading} empty="Норм тохируулаагүй" />
      {editing && <NormDialog norm={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

function NormDialog({ norm, onClose }: { norm: FuelNorm | null; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [model, setModel] = useState(norm?.vehicleModel ?? '');
  const [perTrip, setPerTrip] = useState(norm?.targetLitersPerTrip ? String(toNum(norm.targetLitersPerTrip)) : '');
  const [perM3, setPerM3] = useState(norm?.targetLitersPerM3 ? String(toNum(norm.targetLitersPerM3)) : '');
  const [threshold, setThreshold] = useState(norm?.thresholdPercent ? String(toNum(norm.thresholdPercent)) : '');
  const [notes, setNotes] = useState(norm?.notes ?? '');
  const [isActive, setIsActive] = useState(norm?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: () =>
      fuelService.upsertNorm({
        vehicleModel: model.trim(),
        targetLitersPerTrip: perTrip ? toNum(perTrip) : null,
        targetLitersPerM3: perM3 ? toNum(perM3) : null,
        thresholdPercent: threshold ? toNum(threshold) : null,
        notes: notes.trim() || null,
        isActive,
      }),
    onSuccess: () => {
      toast.success('Норм хадгалагдлаа');
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const num = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value.replace(/[^\d.]/g, ''));

  return (
    <Dialog
      open
      onClose={onClose}
      title={norm ? 'Норм засах' : 'Норм нэмэх'}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={!model.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field label="Техникийн модел" hint="Техникийн бүртгэл дэх модел нэртэй яг ижил байна">
        <TextInput value={model} onChange={(e) => setModel(e.target.value)} disabled={!!norm} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="л/рейс">
          <TextInput inputMode="decimal" value={perTrip} onChange={num(setPerTrip)} />
        </Field>
        <Field label="л/м³">
          <TextInput inputMode="decimal" value={perM3} onChange={num(setPerM3)} />
        </Field>
        <Field label="Босго %">
          <TextInput inputMode="decimal" value={threshold} onChange={num(setThreshold)} placeholder="Ерөнхий" />
        </Field>
      </div>
      <Field label="Тайлбар">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </Dialog>
  );
}

// ─── General ───────────────────────────────────────────────

function GeneralSection() {
  const invalidate = useInvalidate();
  const settings = useQuery({ queryKey: ['fuel', 'settings'], queryFn: fuelService.getSettings });
  const recipients = useQuery({ queryKey: ['fuel', 'recipients'], queryFn: fuelService.getRecipients });

  const [threshold, setThreshold] = useState('');
  const [windowDays, setWindowDays] = useState('');
  const [prefix, setPrefix] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setThreshold(String(toNum(settings.data.defaultThresholdPercent)));
    setWindowDays(String(settings.data.alertWindowDays));
    setPrefix(settings.data.actNumberPrefix);
    setEmailEnabled(settings.data.alertEmailEnabled);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () =>
      fuelService.updateSettings({
        defaultThresholdPercent: threshold ? toNum(threshold) : undefined,
        alertWindowDays: windowDays ? Math.round(toNum(windowDays)) : undefined,
        actNumberPrefix: prefix.trim() || undefined,
        alertEmailEnabled: emailEnabled,
      }),
    onSuccess: () => {
      toast.success('Тохиргоо хадгалагдлаа');
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const removeRecipient = useMutation({
    mutationFn: (id: string) => fuelService.deleteRecipient(id),
    onSuccess: () => {
      toast.success('Хүлээн авагч устгагдлаа');
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelRecipient>[] = [
    {
      key: 'email',
      header: 'И-мэйл',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.email}</p>
          {r.name && <p className="text-xs text-gray-500">{r.name}</p>}
        </div>
      ),
    },
    { key: 'purpose', header: 'Зориулалт', render: (r) => <Pill tone={r.purpose === 'act' ? 'blue' : 'amber'}>{r.purpose === 'act' ? 'Орлогын АКТ' : 'Норм хэтрэлт'}</Pill> },
    { key: 'cc', header: 'Төрөл', render: (r) => (r.isCc ? 'CC' : 'Үндсэн') },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <IconBtn label="Устгах" danger icon={<Trash2 className="size-4" />} onClick={() => window.confirm(`${r.email} хаягийг устгах уу?`) && removeRecipient.mutate(r.id)} />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <Panel title="Ерөнхий тохиргоо" className="xl:col-span-2">
        <div className="space-y-4">
          <Field label="Норм хэтрэлтийн босго (%)" hint="Дундаж/нормоос энэ хувиас их бол alert үүснэ">
            <TextInput inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/[^\d.]/g, ''))} />
          </Field>
          <Field label="Тооцох хугацаа (хоног)" hint="1–31 хоног">
            <TextInput inputMode="numeric" value={windowDays} onChange={(e) => setWindowDays(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label="АКТ дугаарын угтвар" hint="Жишээ: ACT → ACT-2026-0001">
            <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          </Field>
          <ActiveToggle value={emailEnabled} onChange={setEmailEnabled} label="Норм хэтрэлтийг и-мэйлээр мэдэгдэх" />
          <div className="pt-2">
            <Btn variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
              Хадгалах
            </Btn>
          </div>
        </div>
      </Panel>

      <Panel
        title="И-мэйл хүлээн авагчид"
        className="xl:col-span-3"
        action={
          <Btn size="sm" variant="primary" icon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>
            Нэмэх
          </Btn>
        }
      >
        <DataTable columns={columns} rows={recipients.data ?? []} rowKey={(r) => r.id} loading={recipients.isLoading} empty="Хүлээн авагч нэмээгүй" emptyDescription="Орлогын АКТ болон норм хэтрэлтийн мэдэгдэл хүлээн авах хаягууд." />
      </Panel>

      {adding && <RecipientDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function RecipientDialog({ onClose }: { onClose: () => void }) {
  const invalidate = useInvalidate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<'act' | 'alert'>('act');
  const [isCc, setIsCc] = useState(false);

  const mutation = useMutation({
    mutationFn: () => fuelService.createRecipient({ email: email.trim(), name: name.trim() || null, purpose, isCc, isActive: true }),
    onSuccess: () => {
      toast.success('Хүлээн авагч нэмэгдлээ');
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="И-мэйл хүлээн авагч нэмэх"
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Нэмэх
          </Btn>
        </>
      }
    >
      <Field label="Зориулалт">
        <Segmented
          value={purpose}
          onChange={setPurpose}
          options={[
            { value: 'act', label: 'Орлогын АКТ' },
            { value: 'alert', label: 'Норм хэтрэлт' },
          ]}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="И-мэйл">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Field>
        <Field label="Нэр">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <ActiveToggle value={isCc} onChange={setIsCc} label="CC-ээр илгээх" />
    </Dialog>
  );
}
