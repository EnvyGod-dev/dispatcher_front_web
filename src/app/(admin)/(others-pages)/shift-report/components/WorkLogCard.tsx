'use client';

import Label from '@/components/form/Label';
import SearchableSelect from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import StockpileLabel from '@/components/stockpile/StockpileTag';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDate, formatDateFull } from '@/lib/time-formatter';
import { DailyPlan } from '@/services/internal/daily-plan/types';
import { ShiftType } from '@/services/internal/shift/types';
import { WorkLog, WorkLogStatus } from '@/services/internal/work-log/types';
import {
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Route as RouteIcon,
  Save,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { EditableWorkLog } from '../hooks/useShiftEditForm';

interface WorkLogCardProps {
  log: EditableWorkLog;
  index: number;
  isEditing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onChange: (field: keyof WorkLog, value: unknown) => void;
  dailyPlans: DailyPlan[];
  isPending?: boolean;
}

const statusOptions = [
  { value: 'in_progress' as WorkLogStatus, label: 'Эхэлсэн' },
  { value: 'completed' as WorkLogStatus, label: 'Дууссан' },
  { value: 'cancelled' as WorkLogStatus, label: 'Цуцлагдсан' },
];

type PlanDisplay = {
  line1: string;
  line2: string;
};

export default function WorkLogCard({
  log,
  index,
  isEditing,
  canEdit,
  onEdit,
  onDelete,
  onSave,
  onChange,
  dailyPlans,
  isPending,
}: WorkLogCardProps) {
  const selectedDailyPlan = dailyPlans.find((plan) => plan.id === log.planId);
  const stockpileOptions = selectedDailyPlan?.stockpiles || [];

  // Excavator нэр — vehicleCode-г эхэлж харуулна
  const excavatorName =
    selectedDailyPlan?.vehicleCode ||
    log.vehicle?.code ||
    log.miningBlock?.name ||
    selectedDailyPlan?.miningBlockName ||
    '-';

  const routeCode = log.route?.routeCode || selectedDailyPlan?.routeCode || '-';
  const stockpileTag =
    stockpileOptions.find((stockpile) => stockpile.id === log.stockpileId) ||
    log.stockPile;
  const planDate = selectedDailyPlan?.date || log.dailyPlan?.date;
  const planShiftType =
    selectedDailyPlan?.shiftType || log.dailyPlan?.shiftType;

  const selectedPlanSummary: PlanDisplay | undefined = selectedDailyPlan
    ? buildPlanDisplay(selectedDailyPlan)
    : undefined;

  const selectedPlanVehicle =
    selectedDailyPlan?.vehicleCode || log.vehicle?.code || 'Техникгүй';

  const planSummary: PlanDisplay =
    selectedPlanSummary ??
    buildPlanSummary({
      vehicleCode: log.vehicle?.code,
      blockName: log.miningBlock?.name,
      shiftType: planShiftType,
    });

  const duration =
    log.startTime && log.endTime
      ? Math.round(
        (new Date(log.endTime).getTime() -
          new Date(log.startTime).getTime()) /
        1000 /
        60
      )
      : null;

  return (
    <Card className="bg-card/95 gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <CardHeader
        className={cn(
          'border-b bg-card py-4',
          isEditing && 'sticky top-0 z-10 shadow-sm'
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Рейс #{index + 1}</Badge>
              <StatusBadge status={log.status} />
              {duration ? (
                <Badge variant="outline">{duration} мин</Badge>
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <CardDescription
                className="line-clamp-1"
                title={planSummary.line2}
              >
                {planSummary.line2}
              </CardDescription>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock />
                {formatDateFull(log.startTime) || '-'}
              </div>
            </div>
          </div>

          {canEdit ? (
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 self-start lg:ml-auto',
                isEditing &&
                'sticky top-4 right-0 z-20 rounded-lg bg-card/95 lg:justify-end'
              )}
            >
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onSave}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <Save data-icon="inline-start" />
                    )}
                    Хадгалах
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onEdit}>
                    <X data-icon="inline-start" />
                    Болих
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={onEdit}>
                    <Pencil data-icon="inline-start" />
                    Засах
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onDelete}>
                    <Trash2 data-icon="inline-start" />
                    Устгах
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4">
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-1">
              <ContextTile label="Сонгосон төлөвлөгөө">
                <span className="font-medium">{selectedPlanVehicle}</span>
              </ContextTile>
            </div>

            <Separator />

            <SectionTitle>Төлөвлөгөө ба овоолго</SectionTitle>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <Label>Экскаватор сонгох</Label>
                <SearchableSelect
                  value={log.planId || ''}
                  onChange={(value) => {
                    onChange('planId', value);
                    if (log.stockpileId) {
                      onChange('stockpileId', '');
                    }
                  }}
                  searchPlaceholder="Экскаватор хайх..."
                  placeholder="Экскаватор сонгох"
                  className="h-auto min-h-14 py-3 text-left"
                  options={dailyPlans.map((plan) => {
                    const summary = buildPlanDisplay(plan);
                    return {
                      value: plan.id,
                      label: <PlanOptionContent plan={plan} />,
                      searchText: `${summary.line1} ${summary.line2}`,
                      keywords: [
                        plan.vehicleCode || '',
                        plan.routeCode || '',
                        plan.miningBlockName || '',
                        plan.date,
                        plan.shiftType === 'day' ? 'Өдөр' : 'Шөнө',
                        ...plan.stockpiles.map((stockpile) =>
                          formatStockpileInline(
                            stockpile.type,
                            stockpile.layerNumber
                          )
                        ),
                      ],
                    };
                  })}
                />
              </div>

              <div>
                <Label>Овоолго</Label>
                <SearchableSelect
                  value={log.stockpileId || ''}
                  onChange={(value) => onChange('stockpileId', value)}
                  disabled={!selectedDailyPlan}
                  searchPlaceholder="Овоолго хайх..."
                  placeholder="Овоолго сонгох"
                  options={stockpileOptions.map((stockpile) => ({
                    value: stockpile.id,
                    label: (
                      <StockpileLabel
                        type={stockpile.type}
                        layerNumber={stockpile.layerNumber}
                      />
                    ),
                    searchText: formatStockpileInline(
                      stockpile.type,
                      stockpile.layerNumber
                    ),
                    keywords: [
                      stockpile.type === 'coal' ? 'Нүүрс' : 'Хөрс',
                      stockpile.layerNumber,
                    ],
                  }))}
                />
              </div>
            </div>

            <Separator />

            <SectionTitle>Цаг ба төлөв</SectionTitle>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <Label>Төлөв</Label>
                <Select
                  value={log.status || ''}
                  onValueChange={(value) =>
                    onChange('status', value as WorkLogStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Төлөв сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Эхлэх цаг</Label>
                <Input
                  type="datetime-local"
                  value={log.startTime ? log.startTime.slice(0, 16) : ''}
                  onChange={(e) => onChange('startTime', e.target.value)}
                />
              </div>

              <div>
                <Label>Дуусах цаг</Label>
                <Input
                  type="datetime-local"
                  value={log.endTime ? log.endTime.slice(0, 16) : ''}
                  onChange={(e) => onChange('endTime', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <SectionTitle>Тэмдэглэл</SectionTitle>
            <div>
              <TextArea
                value={log.notes || ''}
                onChange={(e) => onChange('notes', e)}
                rows={3}
                placeholder="Нэмэлт тэмдэглэл..."
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem
                label="Эхлэх"
                value={formatDateFull(log.startTime) || '-'}
                icon={<Clock />}
              />
              <DetailItem
                label="Дуусах"
                value={formatDateFull(log.endTime) || '-'}
                icon={<Clock />}
              />
              <DetailItem
                label="Экскаватор"
                value={excavatorName}
                icon={<Truck />}
              />
              <DetailItem
                label="Маршрут"
                value={routeCode}
                icon={<RouteIcon />}
              />
              <DetailItem
                label="Овоолго"
                value={
                  stockpileTag ? (
                    <StockpileLabel
                      type={stockpileTag.type}
                      layerNumber={stockpileTag.layerNumber}
                    />
                  ) : (
                    '-'
                  )
                }
              />
              <DetailItem
                label="Төлөв"
                value={<StatusBadge status={log.status} />}
              />
            </div>

            {log.notes ? (
              <ContextTile label="Тэмдэглэл">{log.notes}</ContextTile>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContextTile({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background/80 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex min-h-6 items-center gap-2 text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background/80 px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function PlanOptionContent({ plan }: { plan: DailyPlan }) {
  const summary = buildPlanDisplay(plan);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
      <span className="truncate font-medium text-foreground" title={summary.line1}>
        {summary.line1}
      </span>
      <span className="truncate text-xs text-muted-foreground" title={summary.line2}>
        {summary.line2}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status?: WorkLogStatus }) {
  const config =
    status === 'completed'
      ? { label: 'Дууссан', variant: 'secondary' as const }
      : status === 'cancelled'
        ? { label: 'Цуцлагдсан', variant: 'destructive' as const }
        : { label: 'Үргэлжилж байна', variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function buildPlanSummary({
  blockName,
  shiftType,
  vehicleCode,
}: {
  blockName?: string | null;
  shiftType?: ShiftType;
  vehicleCode?: string | null;
}) {
  const line2 = [
    vehicleCode || blockName || undefined,
    shiftType ? (shiftType === 'day' ? 'Өдөр' : 'Шөнө') : undefined,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    line1: vehicleCode || 'Төлөвлөгөө сонгогдоогүй',
    line2: line2 || 'Төлөвлөгөөний дэлгэрэнгүй мэдээлэл байхгүй',
  };
}

function buildPlanDisplay(plan: DailyPlan): PlanDisplay {
  return {
    line1: plan.vehicleCode || 'Техникгүй',
    line2: [
      plan.miningBlockName || 'Блокгүй',
      plan.shiftType === 'day' ? 'Өдөр' : 'Шөнө',
    ]
      .filter(Boolean)
      .join(' • '),
  };
}

function formatStockpileInline(type: 'coal' | 'soil', layerNumber: string) {
  return `${type === 'coal' ? 'Нүүрс' : 'Хөрс'} #${layerNumber}`;
}