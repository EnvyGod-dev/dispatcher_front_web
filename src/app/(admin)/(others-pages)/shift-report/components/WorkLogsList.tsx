'use client';

import ShiftTypeBadge from '@/components/shift-report/ShiftType';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DailyPlan } from '@/services/internal/daily-plan/types';
import { ShiftType } from '@/services/internal/shift/types';
import { WorkLog } from '@/services/internal/work-log/types';
import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { EditableWorkLog } from '../hooks/useShiftEditForm';
import WorkLogCard from './WorkLogCard';

interface WorkLogsListProps {
  workLogs: EditableWorkLog[];
  operationalDate?: string;
  shiftType: ShiftType;
  onWorkLogChange: (
    index: number,
    field: keyof WorkLog,
    value: unknown
  ) => void;
  onWorkLogSave: (index: number) => Promise<void>;
  onWorkLogDelete: (index: number) => void;
  onWorkLogAdd: () => void;
  dailyPlans: DailyPlan[];
  canEdit: boolean;
  isPending?: boolean;
}

export default function WorkLogsList({
  workLogs,
  operationalDate,
  shiftType,
  onWorkLogChange,
  onWorkLogSave,
  onWorkLogDelete,
  onWorkLogAdd,
  dailyPlans,
  canEdit,
  isPending,
}: WorkLogsListProps) {
  const [editingLogIndex, setEditingLogIndex] = useState<number | null>(null);

  const handleEdit = (index: number) => {
    setEditingLogIndex(editingLogIndex === index ? null : index);
  };

  const handleSave = async (index: number) => {
    await onWorkLogSave(index);
    setEditingLogIndex(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-card/95">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Рейсүүд</CardTitle>
              <CardDescription>
                Төлөвлөгөө, цаг, овоолго, тэмдэглэлийг нэг дороос засна.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{workLogs.length} Рейс</Badge>
              <ShiftTypeBadge type={shiftType} />
              {operationalDate ? (
                <Badge variant="outline">
                  <CalendarDays data-icon="inline-start" />
                  {operationalDate}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays />
              Ээлжийн огноо: {operationalDate || 'Тохируулагдаагүй'}
            </span>
            <span>Тухайн өдрийн төлөвлөгөөнөөс сонгоно.</span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-muted-foreground">
              Зөрүүтэй Рейсийг зөв төлөвлөгөө рүү шилжүүлж хадгална.
            </div>
            {canEdit ? (
              <Button size="sm" onClick={onWorkLogAdd}>
                <Plus data-icon="inline-start" />
                Рейс нэмэх
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {workLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Энэ ээлжинд Рейс бүртгэгдээгүй байна.
            </p>
            {canEdit ? (
              <Button variant="outline" size="sm" onClick={onWorkLogAdd}>
                <Plus data-icon="inline-start" />
                Эхний Рейс нэмэх
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {workLogs.map((log, index) => (
            <WorkLogCard
              key={log.id || log.localId || index}
              log={log}
              index={index}
              isEditing={editingLogIndex === index || !log.id}
              canEdit={canEdit}
              onEdit={() => handleEdit(index)}
              onDelete={() => onWorkLogDelete(index)}
              onSave={() => handleSave(index)}
              onChange={(field, value) => onWorkLogChange(index, field, value)}
              dailyPlans={dailyPlans}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
