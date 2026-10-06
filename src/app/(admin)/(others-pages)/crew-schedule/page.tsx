'use client';

import { useAuth } from '@/components/AuthProvider';
import { Btn, Dialog, EmptyState, Field, IconBtn, LoadingRows, Panel, Pill, ReasonDialog, SelectInput, TextArea, TextInput } from '@/components/fuel/ui';
import { errorMessage } from '@/lib/fuel/format';
import { cn } from '@/lib/utils';
import miningReportService from '@/services/internal/mining-report';
import type { Crew, CrewPeriod, CrewSegment } from '@/services/internal/mining-report/types';
import { crewScheduleManageRoles, miningReportRoles, UserRole } from '@/services/roles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CalendarDays, CalendarPlus, Pencil, Trash2, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const CREWS: Crew[] = ['A', 'B', 'C', 'D'];
const LABELS: Record<Crew, string> = { A: 'А', B: 'Б', C: 'В', D: 'Г' };
const crewOptions = CREWS.map((c) => ({ value: c, label: `${LABELS[c]} ээлж` }));
const SHIFT_COLORS = { day: '#c58a12', night: '#35507a' };
/** Уурхайн одоогийн дараалал: өдөр А → Б → Г → В. */
const DEFAULT_ORDER: Crew[] = ['A', 'B', 'D', 'C'];

const fmt = (d: string) => dayjs(d).format('YYYY.MM.DD');
const weekday = (d: string) => ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'][dayjs(d).day()];

/** Өгсөн өдөр буюу түүнээс өмнөх хамгийн ойрын Мягмар. */
const tuesdayOnOrBefore = (date: dayjs.Dayjs) => date.subtract((date.day() - 2 + 7) % 7, 'day');

function CrewBadge({ crew, night, size = 'md' }: { crew: Crew; night?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white',
        size === 'sm' && 'size-6 text-xs',
        size === 'md' && 'size-8 text-sm',
        size === 'lg' && 'size-11 text-lg',
      )}
      style={{ backgroundColor: night ? SHIFT_COLORS.night : SHIFT_COLORS.day }}
    >
      {LABELS[crew]}
    </span>
  );
}

export default function CrewSchedulePage() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const canView = !!role && (miningReportRoles as readonly string[]).includes(role);
  const canManage = !!role && (crewScheduleManageRoles as readonly string[]).includes(role);
  const queryClient = useQueryClient();

  const from = useMemo(() => tuesdayOnOrBefore(dayjs()).subtract(14, 'day').format('YYYY-MM-DD'), []);

  const schedule = useQuery({
    queryKey: ['crew-schedule', 'calendar', from],
    queryFn: () => miningReportService.getCrewSchedule(16, from),
    enabled: canView,
  });
  const periods = useQuery({
    queryKey: ['crew-schedule', 'periods'],
    queryFn: () => miningReportService.getCrewPeriods(),
    enabled: canView,
  });

  const [editing, setEditing] = useState<CrewPeriod | 'new' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<CrewPeriod | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['crew-schedule'] });
    queryClient.invalidateQueries({ queryKey: ['mining-report'] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => miningReportService.deleteCrewPeriod(id),
    onSuccess: () => {
      toast.success('Хуваарь устгагдлаа');
      setDeleting(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (user && !canView) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <CalendarDays className="size-8 text-gray-300" />
        <p className="font-medium text-gray-700 dark:text-gray-300">Ээлжийн хуваарь харах эрхгүй байна</p>
      </div>
    );
  }

  const current = schedule.data?.current;
  const segments: CrewSegment[] = schedule.data?.segments ?? [];
  const periodById = new Map((periods.data ?? []).map((p) => [p.id, p]));
  const findPeriod = (seg: CrewSegment) =>
    (periods.data ?? []).find((p) => p.startDate <= seg.start && p.endDate >= seg.end) ?? null;
  const today = current?.operationalDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Ээлжийн хуваарь</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Тухайн өдөр ээлжинд гарсан техник, бүтээл, түлш тэр ээлжинд (А/Б/В/Г) автоматаар хамаарна
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Btn icon={<CalendarPlus className="size-4" />} onClick={() => setEditing('new')}>
              Хугацаа нэмэх
            </Btn>
            <Btn variant="primary" icon={<Wand2 className="size-4" />} onClick={() => setGenerating(true)}>
              Долоо хоногоор үүсгэх
            </Btn>
          </div>
        )}
      </div>

      {current?.crew && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <CrewBadge crew={current.crew} night={current.shiftType === 'night'} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              Одоо: {LABELS[current.crew]} ээлж · {current.shiftType === 'day' ? 'өдрийн' : 'шөнийн'} ээлж
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ажлын өдөр {fmt(current.operationalDate)} · өдөр {current.dayCrew ? LABELS[current.dayCrew] : '—'}, шөнө{' '}
              {current.nightCrew ? LABELS[current.nightCrew] : '—'}. Шөнийн ээлж эхэлсэн өдрөөрөө бүртгэгдэнэ (жишээ нь 10.05 18:30 → 10.06 06:30 бол 10.05).
            </p>
          </div>
          <Pill tone={current.source === 'manual' ? 'brand' : 'gray'}>{current.source === 'manual' ? 'Гараар оруулсан' : 'Үндсэн дүрэм'}</Pill>
        </div>
      )}

      <Panel
        title="Хуваарь"
        description="Гараар оруулаагүй хугацаанд үндсэн дүрэм (7 хоног тутам Мягмарт солигдох; өдөр А → Б → Г → В, шөнө = өмнөх долоо хоногийн өдөр) хэрэглэгдэнэ."
      >
        {schedule.isLoading ? (
          <LoadingRows rows={8} />
        ) : schedule.isError ? (
          <p className="text-sm text-error-600">{errorMessage(schedule.error)}</p>
        ) : !segments.length ? (
          <EmptyState title="Хуваарь олдсонгүй" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                  <th className="py-2.5 pr-4 font-medium">Хугацаа</th>
                  <th className="py-2.5 pr-4 font-medium">Өдөр</th>
                  <th className="py-2.5 pr-4 font-medium">Шөнө</th>
                  <th className="py-2.5 pr-4 font-medium">Амрах</th>
                  <th className="py-2.5 pr-4 font-medium">Эх сурвалж</th>
                  {canManage && <th className="py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {segments.map((seg) => {
                  const isCurrent = !!today && seg.start <= today && seg.end >= today;
                  const period = seg.source === 'manual' ? findPeriod(seg) : null;
                  return (
                    <tr
                      key={`${seg.start}-${seg.source}`}
                      className={cn('border-b border-gray-50 last:border-0 dark:border-gray-800/60', isCurrent && 'bg-brand-50/60 dark:bg-brand-500/10')}
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {fmt(seg.start)} {weekday(seg.start)} – {fmt(seg.end)} {weekday(seg.end)}
                        </p>
                        {isCurrent && <p className="text-xs text-brand-600 dark:text-brand-400">Одоогийн</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <CrewBadge crew={seg.day} size="sm" />
                          <span>{seg.dayLabel} ээлж</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <CrewBadge crew={seg.night} night size="sm" />
                          <span>{seg.nightLabel} ээлж</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{seg.restingLabels.join(', ')}</td>
                      <td className="py-3 pr-4">
                        <Pill tone={seg.source === 'manual' ? 'brand' : 'gray'}>{seg.source === 'manual' ? 'Гараар' : 'Үндсэн дүрэм'}</Pill>
                      </td>
                      {canManage && (
                        <td className="py-3 text-right">
                          {period ? (
                            <div className="flex justify-end gap-0.5">
                              <IconBtn label="Засах" icon={<Pencil className="size-4" />} onClick={() => setEditing(periodById.get(period.id) ?? period)} />
                              <IconBtn label="Устгах" icon={<Trash2 className="size-4" />} onClick={() => setDeleting(period)} />
                            </div>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && <PeriodDialog period={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={invalidate} />}
      {generating && (
        <GenerateDialog days={schedule.data?.days ?? []} onClose={() => setGenerating(false)} onSaved={invalidate} />
      )}
      <ReasonDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Хуваарь устгах"
        description={
          deleting
            ? `${fmt(deleting.startDate)} – ${fmt(deleting.endDate)}: өдөр ${LABELS[deleting.dayCrew]}, шөнө ${LABELS[deleting.nightCrew]}. Устгасны дараа энэ хугацаанд үндсэн дүрэм хэрэглэгдэнэ.`
            : undefined
        }
        confirmText="Устгах"
        danger
        required={false}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

function PeriodDialog({ period, onClose, onSaved }: { period: CrewPeriod | null; onClose: () => void; onSaved: () => void }) {
  const start = tuesdayOnOrBefore(dayjs());
  const [startDate, setStartDate] = useState(period?.startDate ?? start.format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(period?.endDate ?? start.add(6, 'day').format('YYYY-MM-DD'));
  const [dayCrew, setDayCrew] = useState<Crew | ''>(period?.dayCrew ?? '');
  const [nightCrew, setNightCrew] = useState<Crew | ''>(period?.nightCrew ?? '');
  const [notes, setNotes] = useState(period?.notes ?? '');

  const mutation = useMutation({
    mutationFn: () => {
      const input = { startDate, endDate, dayCrew: dayCrew as Crew, nightCrew: nightCrew as Crew, notes: notes.trim() || null };
      return period ? miningReportService.updateCrewPeriod(period.id, input) : miningReportService.createCrewPeriod(input);
    },
    onSuccess: () => {
      toast.success('Хуваарь хадгалагдлаа. Тухайн хугацааны ээлжүүд шинэчлэгдлээ.');
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const error =
    !startDate || !endDate
      ? 'Огноо оруулна уу'
      : endDate < startDate
        ? 'Дуусах огноо эхлэх огнооноос өмнө байна'
        : !dayCrew || !nightCrew
          ? 'Өдөр, шөнийн ээлжийг сонгоно уу'
          : dayCrew === nightCrew
            ? 'Өдөр, шөнийн ээлж өөр байх ёстой'
            : null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={period ? 'Хуваарь засах' : 'Хугацаа нэмэх'}
      description="Энэ хугацаанд өдөр ба шөнө ажиллах ээлж. Шөнийн ээлж эхэлсэн өдрөөрөө тооцогдоно."
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={!!error} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Хадгалах
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Эхлэх огноо">
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Дуусах огноо">
          <TextInput type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label="Өдрийн ээлж">
          <SelectInput value={dayCrew} onChange={(v) => setDayCrew(v as Crew)} placeholder="Сонгох" options={crewOptions} />
        </Field>
        <Field label="Шөнийн ээлж">
          <SelectInput value={nightCrew} onChange={(v) => setNightCrew(v as Crew)} placeholder="Сонгох" options={crewOptions} />
        </Field>
      </div>
      <Field label="Тайлбар">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <p className="text-xs text-gray-500">{error}</p>}
    </Dialog>
  );
}

/**
 * Эхлэх өдрөөс хойшхи 4 долоо хоногийн өдрийн ээлжийг одоо хүчинтэй хуваариас уншина,
 * ингэснээр анхдагч утгаар үүсгэхэд хуваарь хазайхгүй. Мэдээлэл хүрэлцэхгүй бол
 * үндсэн дүрмийн (2026-09-29-нөөс А, Б, Г, В) дарааллыг тухайн долоо хоногоос эргүүлнэ.
 */
const orderFromSchedule = (start: string, days: { date: string; day: Crew }[]): Crew[] => {
  const byDate = new Map(days.map((d) => [d.date, d.day]));
  const fromSchedule = [0, 7, 14, 21].map((k) => byDate.get(dayjs(start).add(k, 'day').format('YYYY-MM-DD')));

  if (fromSchedule.every(Boolean) && new Set(fromSchedule).size === 4) return fromSchedule as Crew[];

  const week = Math.floor(dayjs(start).diff(dayjs('2026-09-29'), 'day') / 7);
  return [0, 1, 2, 3].map((i) => DEFAULT_ORDER[(((week + i) % 4) + 4) % 4]);
};

function GenerateDialog({
  days,
  onClose,
  onSaved,
}: {
  days: { date: string; day: Crew }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialStart = tuesdayOnOrBefore(dayjs()).format('YYYY-MM-DD');
  const [startDate, setStartDateRaw] = useState(initialStart);
  const [weeks, setWeeks] = useState('8');
  const [order, setOrder] = useState<Crew[]>(() => orderFromSchedule(initialStart, days));
  const [orderTouched, setOrderTouched] = useState(false);
  const [replace, setReplace] = useState(true);

  const setStartDate = (value: string) => {
    setStartDateRaw(value);
    // Дарааллыг гараар өөрчлөөгүй бол шинэ эхлэх өдрийн хуваариар шинэчилнэ.
    if (!orderTouched && value) setOrder(orderFromSchedule(value, days));
  };

  const weekCount = Number(weeks);
  const orderValid = new Set(order).size === 4;
  const valid = !!startDate && Number.isInteger(weekCount) && weekCount >= 1 && weekCount <= 104 && orderValid;

  const preview = valid
    ? Array.from({ length: Math.min(weekCount, 8) }, (_, i) => ({
        start: dayjs(startDate).add(i * 7, 'day'),
        day: order[i % 4],
        night: order[(i + 3) % 4],
      }))
    : [];

  const mutation = useMutation({
    mutationFn: () => miningReportService.generateCrewPeriods({ startDate, weeks: weekCount, dayOrder: order, replace }),
    onSuccess: (res) => {
      toast.success(`${res.body.length} долоо хоногийн хуваарь үүслээ`);
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      width="max-w-xl"
      title="Долоо хоногоор үүсгэх"
      description="Ээлж бүр 1 долоо хоног өдөр, дараа нь 1 долоо хоног шөнө ажиллаад 2 долоо хоног амарна. Шөнийн ээлж = өмнөх долоо хоногийн өдрийн ээлж."
      footer={
        <>
          <Btn onClick={onClose}>Болих</Btn>
          <Btn variant="primary" disabled={!valid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Үүсгэх
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Эхлэх өдөр" hint={startDate && dayjs(startDate).day() !== 2 ? 'Анхаар: Мягмар гараг биш байна' : 'Мягмар гараг'}>
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Хэдэн долоо хоног">
          <TextInput inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Өдрийн ээлжийн дараалал (долоо хоног бүр)</span>
        <div className="grid grid-cols-4 gap-2">
          {order.map((c, i) => (
            <SelectInput
              key={i}
              value={c}
              onChange={(v) => {
                setOrderTouched(true);
                setOrder((prev) => prev.map((x, j) => (j === i ? (v as Crew) : x)));
              }}
              options={crewOptions.map((o) => ({ ...o, label: `${i + 1}. ${o.label}` }))}
            />
          ))}
        </div>
        {!orderValid ? (
          <p className="mt-1 text-xs text-error-600">4 ээлжийг давхардуулахгүй сонгоно уу</p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">Анхдагч утга нь одоо хүчинтэй хуваарийн дараалал. Хуваарь өөрчлөгдөх үед л засна.</p>
        )}
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" className="mt-0.5" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
        <span>Энэ хугацаанд өмнө оруулсан хуваарийг солих (давхацсан хэсгийг тайрна)</span>
      </label>
      {preview.length > 0 && (
        <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          <p className="mb-2 text-xs font-medium text-gray-500">Урьдчилж харах{weekCount > 8 ? ` (эхний 8 / ${weekCount})` : ''}</p>
          <ul className="space-y-1.5 text-sm">
            {preview.map((w) => (
              <li key={w.start.format('YYYY-MM-DD')} className="flex items-center gap-3">
                <span className="w-44 text-gray-600 dark:text-gray-400">
                  {w.start.format('MM.DD')} – {w.start.add(6, 'day').format('MM.DD')}
                </span>
                <CrewBadge crew={w.day} size="sm" />
                <span className="text-xs text-gray-500">өдөр</span>
                <CrewBadge crew={w.night} night size="sm" />
                <span className="text-xs text-gray-500">шөнө</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}
