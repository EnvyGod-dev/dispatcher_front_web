import VehicleInspectionTable from '@/components/inspection/VehicleInspectionTable';
import WorkLogsTable from '@/components/shift-report/WorklogTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import shiftReportService from '@/services/internal/shift-report';
import { ShiftReport } from '@/services/internal/shift-report/types';
import { useQuery } from '@tanstack/react-query';
import { Activity, ClipboardCheck, Gauge, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { shiftReportKeys } from './queryKeys';

interface ShiftExpandedRowProps {
  shift: ShiftReport;
}

const SectionHeader = ({ title, badge }: { title: string; badge?: string }) => {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h4 className="text-sm font-semibold text-foreground sm:text-base">
        {title}
        {badge && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({badge})
          </span>
        )}
      </h4>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-border bg-card p-6 text-center dark:bg-white/[0.03]">
    <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default function ShiftExpandedRow({ shift }: ShiftExpandedRowProps) {
  const [activeTab, setActiveTab] = useState('inspections');

  const { data: shiftDetails, isLoading } = useQuery({
    queryKey: shiftReportKeys.detail(shift.id),
    queryFn: () => shiftReportService.getShiftDetail({ shiftId: shift.id }),
    staleTime: 30000,
  });

  const hasWorkLogs =
    shiftDetails?.workLogs && shiftDetails.workLogs.length > 0;
  const hasInspections =
    shiftDetails?.inspections && shiftDetails.inspections.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">
          Дэлгэрэнгүй мэдээлэл ачааллаж байна...
        </span>
      </div>
    );
  }

  if (!shiftDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Дэлгэрэнгүй мэдээлэл олдсонгүй
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-[50vw]">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inspections" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Үзлэг {hasInspections && `(${shiftDetails.inspections.length})`}
          </TabsTrigger>
          <TabsTrigger value="worklogs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Рейс {hasWorkLogs && `(${shiftDetails.workLogs.length})`}
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Дэлгэрэнгүй
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="space-y-3">
          {hasInspections ? (
            <VehicleInspectionTable
              shiftInspections={shiftDetails.inspections}
            />
          ) : (
            <EmptyState message="Үзлэгийн мэдээлэл олдсонгүй" />
          )}
        </TabsContent>

        <TabsContent value="worklogs" className="space-y-3">
          {hasWorkLogs ? (
            <WorkLogsTable workLogs={shiftDetails.workLogs} />
          ) : (
            <EmptyState message="Рейсийн мэдээлэл олдсонгүй" />
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* mileage and moto hours */}
          <div className="rounded-lg border border-border p-3 sm:p-4">
            <SectionHeader title="Гүйлт ба мото цагийн мэдээлэл" />

            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {/* mileage section */}
              <div className="space-y-2">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  Гүйлтийн мэдээлэл
                </div>

                <div className="flex items-center justify-between rounded bg-muted/50 p-2 dark:bg-white/[0.03]">
                  <span className="text-xs text-muted-foreground">Эхлэх</span>
                  <span className="text-xs font-semibold text-foreground">
                    {shift.mileageStart} км
                  </span>
                </div>

                {shift.mileageEnd && (
                  <>
                    <div className="flex items-center justify-between rounded bg-muted/50 p-2 dark:bg-white/[0.03]">
                      <span className="text-xs text-muted-foreground">
                        Дуусах
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {shift.mileageEnd} км
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-2.5 dark:bg-white/[0.03]">
                      <span className="text-xs font-medium">Нийт</span>
                      <span className="text-sm font-bold">
                        {(
                          Number(shift.mileageEnd) - Number(shift.mileageStart)
                        ).toFixed(2)}{' '}
                        км
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* engine hours section */}
              <div className="space-y-2">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Мото цагийн мэдээлэл
                </div>

                <div className="flex items-center justify-between rounded bg-muted/50 p-2 dark:bg-white/[0.03]">
                  <span className="text-xs text-muted-foreground">Эхлэх</span>
                  <span className="text-xs font-semibold text-foreground">
                    {shift.motoStart} цаг
                  </span>
                </div>

                {shift.motoEnd && (
                  <>
                    <div className="flex items-center justify-between rounded bg-muted/50 p-2 dark:bg-white/[0.03]">
                      <span className="text-xs text-muted-foreground">
                        Дуусах
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {shift.motoEnd} цаг
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-2.5 dark:bg-white/[0.03]">
                      <span className="text-xs font-medium">Зарцуулсан</span>
                      <span className="text-sm font-bold">
                        {(
                          Number(shift.motoEnd) - Number(shift.motoStart)
                        ).toFixed(2)}{' '}
                        цаг
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* shift notes */}
          {shift.notes && (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 sm:p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold text-warning">
                    Ээлжийн тэмдэглэл
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {shift.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
