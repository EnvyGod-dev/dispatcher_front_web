"use client";

import { useAuth } from "@/components/AuthProvider";
import VehicleInspectionTable from "@/components/inspection/VehicleInspectionTable";
import { ConfirmDialog } from "@/components/ui/alert/Alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveOperationalDateForShift } from "@/lib/operational-date";
import { formatDateFull } from "@/lib/time-formatter";
import dailyPlanService from "@/services/internal/daily-plan";
import shiftReportService from "@/services/internal/shift-report";
import { ShiftReport } from "@/services/internal/shift-report/types";
import worklogService from "@/services/internal/work-log";
import { CreateWorkLogInput } from "@/services/internal/work-log/types";
import { hasRole, stockpileActionRoles } from "@/services/roles";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, ClipboardCheck, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ShiftEditForm from "./components/ShiftEditForm";
import WorkLogsList from "./components/WorkLogsList";
import { useShiftEditForm } from "./hooks/useShiftEditForm";
import {
  useMutationToastMessages,
  useShiftReportInvalidation,
} from "./hooks/useShiftReportMutations";
import { shiftReportKeys } from "./queryKeys";

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftReport;
  onSuccess: () => void;
}

type UpdateShiftPayload = Parameters<typeof shiftReportService.updateShift>[1];
type UpdateWorkLogPayload = Parameters<typeof worklogService.updateWorkLog>[1];

const toDateTimeLocal = (value?: string) => value?.slice(0, 16) || "";

export default function ShiftEditModal({
  isOpen,
  onClose,
  shift,
  onSuccess,
}: ShiftEditModalProps) {
  const { user } = useAuth();
  const canEdit = hasRole(user?.role, stockpileActionRoles);
  const invalidateShiftReport = useShiftReportInvalidation();
  const messages = useMutationToastMessages();

  const [deletingShift, setDeletingShift] = useState(false);
  const [deletingWorkLogIndex, setDeletingWorkLogIndex] = useState<
    number | null
  >(null);

  const { data: shiftDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: shiftReportKeys.detail(shift.id),
    queryFn: () => shiftReportService.getShiftDetail({ shiftId: shift.id }),
    staleTime: 30000,
    enabled: isOpen,
  });

  const {
    shiftData,
    workLogs,
    updateShiftField,
    updateWorkLog,
    addWorkLog,
    deleteWorkLog,
  } = useShiftEditForm({ shift, shiftDetails });

  const operationalDate =
    shiftData.operationalDate ||
    shift.operationalDate ||
    resolveOperationalDateForShift({
      value: shift.shiftStart || shift.createdAt,
      shiftType: shiftData.shiftType || shift.shiftType,
    });
  const currentShiftType = shiftData.shiftType || shift.shiftType;

  const { data: dailyPlansData } = useQuery({
    queryKey: shiftReportKeys.dailyPlans(
      `${operationalDate}-${currentShiftType}`
    ),
    queryFn: () =>
      dailyPlanService.getDailyPlans({
        date: operationalDate,
        shiftType: currentShiftType,
      }),
    enabled: isOpen && !!operationalDate && !!currentShiftType,
    staleTime: 30000,
  });

  const updateShiftMutation = useMutation({
    mutationFn: (data: UpdateShiftPayload) =>
      shiftReportService.updateShift(shift.id, data),
    onSuccess: async () => {
      messages.onShiftSaved();
      await invalidateShiftReport({ shiftId: shift.id });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ээлж хадгалахад алдаа гарлаа");
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: () => shiftReportService.deleteShift(shift.id),
    onSuccess: async () => {
      messages.onShiftDeleted();
      await invalidateShiftReport();
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ээлж устгахад алдаа гарлаа");
    },
  });

  const createWorkLogMutation = useMutation({
    mutationFn: (data: CreateWorkLogInput) =>
      worklogService.createWorkLog(data),
    onSuccess: async () => {
      messages.onWorkLogSaved();
      await invalidateShiftReport({ shiftId: shift.id });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Рейс бүртгэхэд алдаа гарлаа");
    },
  });

  const updateWorkLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkLogPayload }) =>
      worklogService.updateWorkLog(id, data),
    onSuccess: async () => {
      messages.onWorkLogSaved();
      await invalidateShiftReport({ shiftId: shift.id });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Рейс хадгалахад алдаа гарлаа");
    },
  });

  const deleteWorkLogMutation = useMutation({
    mutationFn: (id: string) => worklogService.deleteWorkLog(id),
    onSuccess: async () => {
      messages.onWorkLogDeleted();
      await invalidateShiftReport({ shiftId: shift.id });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Рейс устгахад алдаа гарлаа");
    },
  });

  const handleSaveShift = () => {
    if (!canEdit) {
      toast.error("Та ээлж засах эрхгүй байна");
      return;
    }

    updateShiftMutation.mutate({
      ...shiftData,
      operationalDate: shiftData.operationalDate || undefined,
      driverShiftGroup: shiftData.driverShiftGroup || undefined,
    });
  };

  const handleWorkLogSave = async (index: number) => {
    if (!canEdit) {
      toast.error("Та Рейс засах эрхгүй байна");
      return;
    }

    const workLog = workLogs[index];

    if (
      !workLog.planId ||
      !workLog.stockpileId ||
      !workLog.startTime ||
      !workLog.endTime ||
      !workLog.status
    ) {
      toast.error("Рейсийн шаардлагатай мэдээллийг бүрэн оруулна уу");
      return;
    }

    const payload = {
      planId: workLog.planId,
      stockpileId: workLog.stockpileId,
      startTime: workLog.startTime,
      endTime: workLog.endTime,
      status: workLog.status,
      notes: workLog.notes || undefined,
    };

    if (!workLog.id) {
      await createWorkLogMutation.mutateAsync({
        shiftId: shift.id,
        ...payload,
      });
      return;
    }

    await updateWorkLogMutation.mutateAsync({
      id: workLog.id,
      data: payload,
    });
  };

  const handleWorkLogDelete = (index: number) => {
    if (!canEdit) {
      toast.error("Та Рейс устгах эрхгүй байна");
      return;
    }

    setDeletingWorkLogIndex(index);
  };

  const confirmDeleteWorkLog = async () => {
    if (deletingWorkLogIndex === null) return;

    const workLog = workLogs[deletingWorkLogIndex];

    if (workLog.id) {
      await deleteWorkLogMutation.mutateAsync(workLog.id);
    } else {
      deleteWorkLog(deletingWorkLogIndex);
      messages.onWorkLogDeleted();
    }

    setDeletingWorkLogIndex(null);
  };

  const dailyPlans = dailyPlansData?.data || [];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-3xl"
        >
          <SheetHeader className="border-b bg-muted/30 px-6 py-5 pr-16 text-left sm:pr-20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-xl">
                  {shift.vehicle?.code} - {shift.driver?.lastName}{" "}
                  {shift.driver?.firstName}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  {formatDateFull(shift.createdAt)} ·{" "}
                  {canEdit ? "Засах горим" : "Харах горим"}
                </SheetDescription>
              </div>

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingShift(true)}
                  className="mr-2 gap-2 text-red-600 sm:mr-4"
                >
                  <Trash2 className="h-4 w-4" />
                  Ээлж устгах
                </Button>
              )}
            </div>
          </SheetHeader>

          {isLoadingDetails ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Дэлгэрэнгүй мэдээлэл ачааллаж байна...
            </div>
          ) : (
            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-4">
                <InfoCard
                  label="Төлөв"
                  value={
                    shift.status === "started"
                      ? "Ажиллаж байгаа"
                      : shift.status === "completed"
                        ? "Дууссан"
                        : "Цуцлагдсан"
                  }
                />
                <InfoCard
                  label="Ээлж"
                  value={shift.shiftType === "day" ? "Өдрийн" : "Шөнийн"}
                />
                <InfoCard label="Рейс" value={String(workLogs.length)} />
                <InfoCard
                  label="Үзлэг"
                  value={String(shiftDetails?.inspections?.length || 0)}
                />
              </div>

              <Tabs defaultValue="shift" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="shift">Ээлж</TabsTrigger>
                  <TabsTrigger value="worklogs" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Рейсүүд
                  </TabsTrigger>
                  <TabsTrigger value="inspections" className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Үзлэг
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="shift" className="space-y-4">
                  <ShiftEditForm
                    shiftData={shiftData}
                    onChange={updateShiftField}
                    onSave={handleSaveShift}
                    canEdit={canEdit}
                    isPending={updateShiftMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="worklogs" className="space-y-4">
                  <WorkLogsList
                    workLogs={workLogs}
                    operationalDate={operationalDate}
                    shiftType={currentShiftType}
                    onWorkLogChange={updateWorkLog}
                    onWorkLogSave={handleWorkLogSave}
                    onWorkLogDelete={handleWorkLogDelete}
                    onWorkLogAdd={() =>
                      addWorkLog({
                        startTime: toDateTimeLocal(shift.createdAt),
                        endTime: toDateTimeLocal(shift.createdAt),
                        status: "completed",
                      })
                    }
                    dailyPlans={dailyPlans}
                    canEdit={canEdit}
                    isPending={
                      updateWorkLogMutation.isPending ||
                      createWorkLogMutation.isPending
                    }
                  />
                </TabsContent>

                <TabsContent value="inspections">
                  {shiftDetails?.inspections?.length ? (
                    <VehicleInspectionTable
                      shiftInspections={shiftDetails.inspections}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                      Үзлэг хийгдээгүй.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deletingShift}
        onOpenChange={() => setDeletingShift(false)}
        title="Ээлж устгах уу?"
        description="Энэ үйлдлийг буцаах боломжгүй. Ээлжтэй холбоотой Рейс болон үзлэгийн мэдээлэл мөн устна."
        variant="destructive"
        onConfirm={() => {
          deleteShiftMutation.mutate();
          setDeletingShift(false);
        }}
      />

      <ConfirmDialog
        open={deletingWorkLogIndex !== null}
        onOpenChange={() => setDeletingWorkLogIndex(null)}
        title="Рейс устгах уу?"
        description="Энэ үйлдлийг буцаах боломжгүй."
        variant="destructive"
        onConfirm={confirmDeleteWorkLog}
      />
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
