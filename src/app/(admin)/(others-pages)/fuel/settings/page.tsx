"use client";

import {
  Btn,
  Column,
  DataTable,
  Dialog,
  Field,
  IconBtn,
  Panel,
  Pill,
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/fuel/ui";
import {
  errorMessage,
  fmtDateTime,
  fmtLiters,
  fmtNumber,
  fuelTypeLabel,
  toNum,
} from "@/lib/fuel/format";
import { useFuelPermissions } from "@/lib/fuel/permissions";
import fuelService from "@/services/internal/fuel";
import type {
  FuelMeasureMethod,
  FuelNorm,
  FuelRecipient,
  FuelSupplier,
  FuelTank,
  FuelType,
} from "@/services/internal/fuel/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gauge, Pencil, Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Section = "tanks" | "suppliers" | "norms" | "general";

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["fuel"] });
};

const activePill = (active: boolean) =>
  active ? <Pill tone="green">Идэвхтэй</Pill> : <Pill>Идэвхгүй</Pill>;

export default function FuelSettingsPage() {
  const { canControl } = useFuelPermissions();
  const [section, setSection] = useState<Section>("tanks");
  if (!canControl) return null;

  return (
    <div className="space-y-6">
      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { value: "tanks", label: "Агуулах" },
          { value: "suppliers", label: "Нийлүүлэгч" },
          { value: "norms", label: "Зарцуулалтын норм" },
          { value: "general", label: "Ерөнхий" },
        ]}
      />
      {section === "tanks" && <TanksSection />}
      {section === "suppliers" && <SuppliersSection />}
      {section === "norms" && <NormsSection />}
      {section === "general" && <GeneralSection />}
    </div>
  );
}

// ─── Tanks ─────────────────────────────────────────────────

function TanksSection() {
  const tanks = useQuery({
    queryKey: ["fuel", "tanks"],
    queryFn: fuelService.getTanks,
  });
  const balances = useQuery({
    queryKey: ["fuel", "balances", "tank"],
    queryFn: () => fuelService.getBalances("tank"),
  });
  const openings = useQuery({
    queryKey: ["fuel", "opening-balances"],
    queryFn: fuelService.getOpeningBalances,
  });
  const [editing, setEditing] = useState<FuelTank | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<FuelTank | null>(null);

  const balanceOf = (id: string) =>
    balances.data?.find((b) => b.holderId === id)?.balance;
  const openingOf = (id: string) => openings.data?.find((o) => o.tankId === id);

  const columns: Column<FuelTank>[] = [
    {
      key: "name",
      header: "Нэр",
      render: (t) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {t.name}
          </p>
          {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
        </div>
      ),
    },
    { key: "type", header: "Түлш", render: (t) => fuelTypeLabel(t.fuelType) },
    {
      key: "capacity",
      header: "Багтаамж",
      align: "right",
      render: (t) => fmtLiters(t.capacity),
    },
    {
      key: "balance",
      header: "Үлдэгдэл",
      align: "right",
      render: (t) => (
        <div>
          <p className="font-semibold tabular-nums">
            {fmtLiters(balanceOf(t.id))}
          </p>
          {!openingOf(t.id) && !openings.isLoading && (
            <p className="text-xs text-warning-600 dark:text-warning-400">
              Эхний үлдэгдэл оруулаагүй
            </p>
          )}
        </div>
      ),
    },
    { key: "active", header: "Төлөв", render: (t) => activePill(t.isActive) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => (
        <div className="flex justify-end gap-0.5">
          <IconBtn
            label="Үлдэгдэл оруулах / тохируулах"
            icon={<Gauge className="size-4" />}
            onClick={() => setAdjusting(t)}
          />
          <IconBtn
            label="Засах"
            icon={<Pencil className="size-4" />}
            onClick={() => setEditing(t)}
          />
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="Түлшний агуулах"
      description="Шинэ агуулах бүртгэхдээ эхний үлдэгдлийг оруулна. Дараа нь бодит хэмжилтээр үлдэгдлийг тохируулж болно."
      action={
        <Btn
          variant="primary"
          icon={<Plus className="size-4" />}
          onClick={() => setEditing("new")}
        >
          Агуулах нэмэх
        </Btn>
      }
    >
      <DataTable
        columns={columns}
        rows={tanks.data ?? []}
        rowKey={(t) => t.id}
        loading={tanks.isLoading}
        empty="Агуулах бүртгэгдээгүй"
      />
      {editing && (
        <TankDialog
          tank={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {adjusting && (
        <TankBalanceDialog
          tank={adjusting}
          balance={balanceOf(adjusting.id) ?? 0}
          hasOpening={!!openingOf(adjusting.id)}
          hasMovements={
            !!balances.data?.find((b) => b.holderId === adjusting.id)
              ?.lastMovementAt
          }
          onClose={() => setAdjusting(null)}
        />
      )}
    </Panel>
  );
}

function TankDialog({
  tank,
  onClose,
}: {
  tank: FuelTank | null;
  onClose: () => void;
}) {
  const invalidate = useInvalidate();
  const [name, setName] = useState(tank?.name ?? "");
  const [location, setLocation] = useState(tank?.location ?? "");
  const [capacity, setCapacity] = useState(
    tank?.capacity ? String(toNum(tank.capacity)) : "",
  );
  const [fuelType, setFuelType] = useState<FuelType>(
    tank?.fuelType ?? "diesel",
  );
  const [isActive, setIsActive] = useState(tank?.isActive ?? true);
  const [opening, setOpening] = useState("");
  const [openingAt, setOpeningAt] = useState(
    dayjs().format("YYYY-MM-DDTHH:mm"),
  );
  const [method, setMethod] = useState<FuelMeasureMethod>("gauge");

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        name: name.trim(),
        location: location.trim() || null,
        capacity: capacity ? toNum(capacity) : null,
        fuelType,
        isActive,
      };
      if (tank)
        return {
          tank: (await fuelService.updateTank(tank.id, input)).body,
          openingError: null,
        };

      const created = (await fuelService.createTank(input)).body;
      let openingError: string | null = null;
      if (opening) {
        try {
          await fuelService.createOpeningBalance({
            holderId: created.id,
            balanceAt: dayjs(openingAt).toISOString(),
            quantity: toNum(opening),
            method,
          });
        } catch (e) {
          openingError = errorMessage(e);
        }
      }
      return { tank: created, openingError };
    },
    onSuccess: ({ openingError }) => {
      if (openingError)
        toast.error(
          `Агуулах нэмэгдсэн ч эхний үлдэгдэл хадгалагдсангүй: ${openingError}`,
        );
      else toast.success(tank ? "Агуулах шинэчлэгдлээ" : "Агуулах нэмэгдлээ");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const overCapacity =
    !!opening && !!capacity && toNum(opening) > toNum(capacity);

  return (
    <Dialog
      open
      onClose={onClose}
      title={tank ? "Агуулах засах" : "Агуулах нэмэх"}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn
            variant="primary"
            disabled={!name.trim()}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field label="Нэр">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Жишээ: Үндсэн агуулах"
          autoFocus
        />
      </Field>
      <Field label="Байршил">
        <TextInput
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Багтаамж (литр)">
          <TextInput
            inputMode="decimal"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </Field>
        <Field label="Түлшний төрөл">
          <SelectInput
            value={fuelType}
            onChange={(v) => setFuelType(v as FuelType)}
            options={[
              { value: "diesel", label: "Дизель" },
              { value: "gasoline", label: "Бензин" },
            ]}
          />
        </Field>
      </div>
      {!tank && (
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            Эхний үлдэгдэл
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Одоо агуулахад байгаа түлш. Олголт үүнээс хасагдана.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Хэмжээ (литр)">
              <TextInput
                inputMode="decimal"
                value={opening}
                onChange={(e) =>
                  setOpening(e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="0"
              />
            </Field>
            <Field label="Хэмжсэн огноо">
              <TextInput
                type="datetime-local"
                value={openingAt}
                onChange={(e) => setOpeningAt(e.target.value)}
              />
            </Field>
            <Field label="Хэмжсэн арга" className="col-span-2">
              <MethodSelect value={method} onChange={setMethod} />
            </Field>
          </div>
          {overCapacity && (
            <p className="mt-2 text-xs text-error-600">Багтаамжаас их байна.</p>
          )}
        </div>
      )}
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </Dialog>
  );
}

const methodOptions: { value: FuelMeasureMethod; label: string }[] = [
  { value: "gauge", label: "Хэмжүүр (шугам)" },
  { value: "meter", label: "Тоолуур" },
  { value: "sensor", label: "Мэдрэгч" },
  { value: "manual", label: "Гараар" },
];

function MethodSelect({
  value,
  onChange,
}: {
  value: FuelMeasureMethod;
  onChange: (v: FuelMeasureMethod) => void;
}) {
  return (
    <SelectInput
      value={value}
      onChange={(v) => onChange(v as FuelMeasureMethod)}
      options={methodOptions}
    />
  );
}

/**
 * Агуулахын үлдэгдэл:
 *  - Эхний үлдэгдэл: агуулахад хөдөлгөөн эхлэхээс өмнөх гарааны үлдэгдэл (нэг удаа).
 *  - Хэмжилт: бодит хэмжсэн үлдэгдлийг оруулж, системийн тооцоог түүнтэй тэнцүүлэх тохируулга хийнэ.
 */
function TankBalanceDialog({
  tank,
  balance,
  hasOpening,
  hasMovements,
  onClose,
}: {
  tank: FuelTank;
  balance: number;
  hasOpening: boolean;
  hasMovements: boolean;
  onClose: () => void;
}) {
  const invalidate = useInvalidate();
  const canOpening = !hasOpening;
  const [mode, setMode] = useState<"opening" | "measure">(
    canOpening && !hasMovements ? "opening" : "measure",
  );
  const [quantity, setQuantity] = useState("");
  const [at, setAt] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
  const [method, setMethod] = useState<FuelMeasureMethod>("gauge");
  const [apply, setApply] = useState(true);
  const [notes, setNotes] = useState("");

  const history = useQuery({
    queryKey: ["fuel", "measurements", tank.id],
    queryFn: () => fuelService.getMeasurements(tank.id),
  });

  const diff = quantity ? toNum(quantity) - balance : null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "opening") {
        await fuelService.createOpeningBalance({
          holderId: tank.id,
          balanceAt: dayjs(at).toISOString(),
          quantity: toNum(quantity),
          method,
          notes: notes.trim() || null,
        });
        return;
      }
      await fuelService.createMeasurement({
        holderId: tank.id,
        measuredAt: dayjs(at).toISOString(),
        measuredQuantity: toNum(quantity),
        method,
        applyAdjustment: apply,
        notes: notes.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success(
        mode === "opening"
          ? "Эхний үлдэгдэл хадгалагдлаа"
          : apply
            ? "Үлдэгдэл тохируулагдлаа"
            : "Хэмжилт хадгалагдлаа",
      );
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${tank.name} · үлдэгдэл`}
      description={`Системийн тооцоолсон үлдэгдэл: ${fmtLiters(balance)}`}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn
            variant="primary"
            disabled={!quantity || !at}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Хадгалах
          </Btn>
        </>
      }
    >
      {canOpening && (
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "opening", label: "Эхний үлдэгдэл" },
            { value: "measure", label: "Хэмжилтээр тохируулах" },
          ]}
        />
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {mode === "opening"
          ? "Гарааны үлдэгдлийг нэг л удаа оруулна. Огноо нь энэ агуулахын анхны орлого/олголтоос өмнө байх ёстой."
          : "Агуулахыг бодитоор хэмжсэн үлдэгдлийг оруулна. Зөрүүг тохируулгаар засаж, аудитад бүртгэнэ."}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={
            mode === "opening"
              ? "Эхний үлдэгдэл (литр)"
              : "Хэмжсэн үлдэгдэл (литр)"
          }
        >
          <TextInput
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ""))}
            autoFocus
          />
        </Field>
        <Field label="Огноо">
          <TextInput
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
          />
        </Field>
        <Field label="Хэмжсэн арга" className="col-span-2">
          <MethodSelect value={method} onChange={setMethod} />
        </Field>
      </div>
      {mode === "measure" && diff !== null && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-white/[0.03]">
          Зөрүү:{" "}
          <span
            className={
              diff < 0
                ? "font-semibold text-error-600"
                : "font-semibold text-success-600"
            }
          >
            {diff > 0 ? "+" : ""}
            {fmtLiters(diff)}
          </span>
        </div>
      )}
      {mode === "measure" && (
        <ActiveToggle
          value={apply}
          onChange={setApply}
          label="Системийн үлдэгдлийг хэмжсэнээр засах"
        />
      )}
      <Field label="Тайлбар">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {!!history.data?.length && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Сүүлийн хэмжилтүүд
          </p>
          <ul className="divide-y divide-gray-100 text-xs dark:divide-gray-800">
            {history.data.slice(0, 5).map((m) => (
              <li key={m.id} className="flex justify-between gap-3 py-2">
                <span className="text-gray-500">
                  {fmtDateTime(m.measuredAt)}
                </span>
                <span className="tabular-nums">
                  {fmtLiters(m.measuredQuantity)}{" "}
                  <span
                    className={
                      toNum(m.difference) < 0
                        ? "text-error-600"
                        : "text-success-600"
                    }
                  >
                    ({toNum(m.difference) > 0 ? "+" : ""}
                    {fmtNumber(m.difference)})
                  </span>
                  {m.applyAdjustment && (
                    <span className="ml-1 text-gray-400">· тохируулсан</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}

function ActiveToggle({
  value,
  onChange,
  label = "Идэвхтэй",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
      />
      {label}
    </label>
  );
}

// ─── Suppliers ─────────────────────────────────────────────

function SuppliersSection() {
  const suppliers = useQuery({
    queryKey: ["fuel", "suppliers"],
    queryFn: fuelService.getSuppliers,
  });
  const [editing, setEditing] = useState<FuelSupplier | "new" | null>(null);

  const columns: Column<FuelSupplier>[] = [
    {
      key: "name",
      header: "Нэр",
      render: (s) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {s.name}
        </span>
      ),
    },
    { key: "phone", header: "Утас", render: (s) => s.contactPhone || "—" },
    { key: "email", header: "И-мэйл", render: (s) => s.contactEmail || "—" },
    { key: "active", header: "Төлөв", render: (s) => activePill(s.isActive) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <IconBtn
          label="Засах"
          icon={<Pencil className="size-4" />}
          onClick={() => setEditing(s)}
        />
      ),
    },
  ];

  return (
    <Panel
      title="Нийлүүлэгч"
      action={
        <Btn
          variant="primary"
          icon={<Plus className="size-4" />}
          onClick={() => setEditing("new")}
        >
          Нийлүүлэгч нэмэх
        </Btn>
      }
    >
      <DataTable
        columns={columns}
        rows={suppliers.data ?? []}
        rowKey={(s) => s.id}
        loading={suppliers.isLoading}
        empty="Нийлүүлэгч бүртгэгдээгүй"
      />
      {editing && (
        <SupplierDialog
          supplier={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Panel>
  );
}

function SupplierDialog({
  supplier,
  onClose,
}: {
  supplier: FuelSupplier | null;
  onClose: () => void;
}) {
  const invalidate = useInvalidate();
  const [name, setName] = useState(supplier?.name ?? "");
  const [phone, setPhone] = useState(supplier?.contactPhone ?? "");
  const [email, setEmail] = useState(supplier?.contactEmail ?? "");
  const [isActive, setIsActive] = useState(supplier?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        contactPhone: phone.trim() || null,
        contactEmail: email.trim() || null,
        isActive,
      };
      return supplier
        ? fuelService.updateSupplier(supplier.id, input)
        : fuelService.createSupplier(input);
    },
    onSuccess: () => {
      toast.success(
        supplier ? "Нийлүүлэгч шинэчлэгдлээ" : "Нийлүүлэгч нэмэгдлээ",
      );
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={supplier ? "Нийлүүлэгч засах" : "Нийлүүлэгч нэмэх"}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn
            variant="primary"
            disabled={!name.trim()}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field label="Нэр">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Утас">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="И-мэйл">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </Dialog>
  );
}

// ─── Norms ─────────────────────────────────────────────────

function NormsSection() {
  const invalidate = useInvalidate();
  const norms = useQuery({
    queryKey: ["fuel", "norms"],
    queryFn: fuelService.getNorms,
  });
  const [editing, setEditing] = useState<FuelNorm | "new" | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => fuelService.deleteNorm(id),
    onSuccess: () => {
      toast.success("Норм устгагдлаа");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelNorm>[] = [
    {
      key: "model",
      header: "Техникийн модел",
      render: (n) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {n.vehicleModel}
        </span>
      ),
    },
    {
      key: "trip",
      header: "л/рейс",
      align: "right",
      render: (n) =>
        n.targetLitersPerTrip ? fmtNumber(n.targetLitersPerTrip, 2) : "—",
    },
    {
      key: "m3",
      header: "л/м³",
      align: "right",
      render: (n) =>
        n.targetLitersPerM3 ? fmtNumber(n.targetLitersPerM3, 3) : "—",
    },
    {
      key: "threshold",
      header: "Босго",
      align: "right",
      render: (n) =>
        n.thresholdPercent ? `${toNum(n.thresholdPercent)}%` : "Ерөнхий",
    },
    { key: "active", header: "Төлөв", render: (n) => activePill(n.isActive) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (n) => (
        <div className="flex justify-end gap-1">
          <IconBtn
            label="Засах"
            icon={<Pencil className="size-4" />}
            onClick={() => setEditing(n)}
          />
          <IconBtn
            label="Устгах"
            danger
            icon={<Trash2 className="size-4" />}
            onClick={() =>
              window.confirm(`${n.vehicleModel} нормыг устгах уу?`) &&
              remove.mutate(n.id)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="Зарцуулалтын норм"
      description="Ижил моделийн 2-оос цөөн техниктэй үед нормтой харьцуулж хэтрэлт тооцно."
      action={
        <Btn
          variant="primary"
          icon={<Plus className="size-4" />}
          onClick={() => setEditing("new")}
        >
          Норм нэмэх
        </Btn>
      }
    >
      <DataTable
        columns={columns}
        rows={norms.data ?? []}
        rowKey={(n) => n.id}
        loading={norms.isLoading}
        empty="Норм тохируулаагүй"
      />
      {editing && (
        <NormDialog
          norm={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Panel>
  );
}

function NormDialog({
  norm,
  onClose,
}: {
  norm: FuelNorm | null;
  onClose: () => void;
}) {
  const invalidate = useInvalidate();
  const [model, setModel] = useState(norm?.vehicleModel ?? "");
  const [perTrip, setPerTrip] = useState(
    norm?.targetLitersPerTrip ? String(toNum(norm.targetLitersPerTrip)) : "",
  );
  const [perM3, setPerM3] = useState(
    norm?.targetLitersPerM3 ? String(toNum(norm.targetLitersPerM3)) : "",
  );
  const [threshold, setThreshold] = useState(
    norm?.thresholdPercent ? String(toNum(norm.thresholdPercent)) : "",
  );
  const [notes, setNotes] = useState(norm?.notes ?? "");
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
      toast.success("Норм хадгалагдлаа");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const num =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(e.target.value.replace(/[^\d.]/g, ""));

  return (
    <Dialog
      open
      onClose={onClose}
      title={norm ? "Норм засах" : "Норм нэмэх"}
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn
            variant="primary"
            disabled={!model.trim()}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Хадгалах
          </Btn>
        </>
      }
    >
      <Field
        label="Техникийн модел"
        hint="Техникийн бүртгэл дэх модел нэртэй яг ижил байна"
      >
        <TextInput
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!!norm}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="л/рейс">
          <TextInput
            inputMode="decimal"
            value={perTrip}
            onChange={num(setPerTrip)}
          />
        </Field>
        <Field label="л/м³">
          <TextInput
            inputMode="decimal"
            value={perM3}
            onChange={num(setPerM3)}
          />
        </Field>
        <Field label="Босго %">
          <TextInput
            inputMode="decimal"
            value={threshold}
            onChange={num(setThreshold)}
            placeholder="Ерөнхий"
          />
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
  const settings = useQuery({
    queryKey: ["fuel", "settings"],
    queryFn: fuelService.getSettings,
  });
  const recipients = useQuery({
    queryKey: ["fuel", "recipients"],
    queryFn: fuelService.getRecipients,
  });

  const [threshold, setThreshold] = useState("");
  const [windowDays, setWindowDays] = useState("");
  const [prefix, setPrefix] = useState("");
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
      toast.success("Тохиргоо хадгалагдлаа");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const removeRecipient = useMutation({
    mutationFn: (id: string) => fuelService.deleteRecipient(id),
    onSuccess: () => {
      toast.success("Хүлээн авагч устгагдлаа");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns: Column<FuelRecipient>[] = [
    {
      key: "email",
      header: "И-мэйл",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {r.email}
          </p>
          {r.name && <p className="text-xs text-gray-500">{r.name}</p>}
        </div>
      ),
    },
    {
      key: "purpose",
      header: "Зориулалт",
      render: (r) => (
        <Pill tone={r.purpose === "act" ? "blue" : "amber"}>
          {r.purpose === "act" ? "Орлогын АКТ" : "Норм хэтрэлт"}
        </Pill>
      ),
    },
    { key: "cc", header: "Төрөл", render: (r) => (r.isCc ? "CC" : "Үндсэн") },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <IconBtn
          label="Устгах"
          danger
          icon={<Trash2 className="size-4" />}
          onClick={() =>
            window.confirm(`${r.email} хаягийг устгах уу?`) &&
            removeRecipient.mutate(r.id)
          }
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <Panel title="Ерөнхий тохиргоо" className="xl:col-span-2">
        <div className="space-y-4">
          <Field
            label="Норм хэтрэлтийн босго (%)"
            hint="Дундаж/нормоос энэ хувиас их бол alert үүснэ"
          >
            <TextInput
              inputMode="decimal"
              value={threshold}
              onChange={(e) =>
                setThreshold(e.target.value.replace(/[^\d.]/g, ""))
              }
            />
          </Field>
          <Field label="Тооцох хугацаа (хоног)" hint="1–31 хоног">
            <TextInput
              inputMode="numeric"
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="АКТ дугаарын угтвар" hint="Жишээ: ACT → ACT-2026-0001">
            <TextInput
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </Field>
          <ActiveToggle
            value={emailEnabled}
            onChange={setEmailEnabled}
            label="Норм хэтрэлтийг и-мэйлээр мэдэгдэх"
          />
          <div className="pt-2">
            <Btn
              variant="primary"
              loading={save.isPending}
              onClick={() => save.mutate()}
            >
              Хадгалах
            </Btn>
          </div>
        </div>
      </Panel>

      <Panel
        title="И-мэйл хүлээн авагчид"
        className="xl:col-span-3"
        action={
          <Btn
            size="sm"
            variant="primary"
            icon={<Plus className="size-3.5" />}
            onClick={() => setAdding(true)}
          >
            Нэмэх
          </Btn>
        }
      >
        <DataTable
          columns={columns}
          rows={recipients.data ?? []}
          rowKey={(r) => r.id}
          loading={recipients.isLoading}
          empty="Хүлээн авагч нэмээгүй"
          emptyDescription="Орлогын АКТ болон норм хэтрэлтийн мэдэгдэл хүлээн авах хаягууд."
        />
      </Panel>

      {adding && <RecipientDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function RecipientDialog({ onClose }: { onClose: () => void }) {
  const invalidate = useInvalidate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState<"act" | "alert">("act");
  const [isCc, setIsCc] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      fuelService.createRecipient({
        email: email.trim(),
        name: name.trim() || null,
        purpose,
        isCc,
        isActive: true,
      }),
    onSuccess: () => {
      toast.success("Хүлээн авагч нэмэгдлээ");
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
          <Btn
            variant="primary"
            disabled={!/^\S+@\S+\.\S+$/.test(email.trim())}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
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
            { value: "act", label: "Орлогын АКТ" },
            { value: "alert", label: "Норм хэтрэлт" },
          ]}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="И-мэйл">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Нэр">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <ActiveToggle value={isCc} onChange={setIsCc} label="CC-ээр илгээх" />
    </Dialog>
  );
}
