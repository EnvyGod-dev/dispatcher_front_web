'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Calendar,
  CheckCheck,
  Package,
  Route,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthProvider';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DatePicker from '@/components/form/date-picker';
import Select from '@/components/form/Select';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/badge';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { usePagination } from '@/hooks/pagination';
import { formatDate, formatDateFull } from '@/lib/time-formatter';
import dailyPlanService from '@/services/internal/daily-plan';
import { DailyPlan } from '@/services/internal/daily-plan/types';
import { type ShiftType, shiftTypeItems } from '@/services/internal/shift/types';
import { dailyPlanActionRoles, hasRole } from '@/services/roles';
import DailyPlanFormSidebar from './Sidebar';
import StockpileLabel from '@/components/stockpile/StockpileTag';
import ShiftTypeBadge from '@/components/shift-report/ShiftType';

type ApiError = Error & { status?: number };

export default function DailyPlansPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { offset, limit, paginate } = usePagination();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DailyPlan | undefined>();
  const [deletingPlan, setDeletingPlan] = useState<DailyPlan | undefined>();
  const [reactivationWarningPlan, setReactivationWarningPlan] = useState<
    DailyPlan | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format('YYYY-MM-DD'),
  );
  const [selectedShiftType, setSelectedShiftType] = useState<
    ShiftType | undefined
  >(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'daily-plans',
      { offset, limit, date: selectedDate, shiftType: selectedShiftType },
    ],
    queryFn: () =>
      dailyPlanService.getDailyPlans({
        offset,
        limit,
        date: selectedDate,
        shiftType: selectedShiftType,
      }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dailyPlanService.deleteDailyPlan(id),
    onSuccess: () => {
      toast.success('Өдрийн төлөвлөгөө амжилттай устгагдлаа');
      refetch();
    },
    onError: () => {
      toast.error('Өдрийн төлөвлөгөө устгахад алдаа гарлаа');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (plan: DailyPlan) =>
      dailyPlanService.updateDailyPlan({
        id: plan.id,
        date: plan.date,
        routeId: plan.routeId,
        pickUpBlockId: plan.pickUpBlockId,
        stockpileIds: plan.stockpileIds,
        vehicleId: plan.vehicleId,
        shiftType: plan.shiftType,
        transportAmount: plan.transportAmount ?? undefined,
        status: 'completed',
      }),
    onSuccess: () => {
      toast.success('Өдрийн төлөвлөгөөг дуусгалаа');
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Төлөвлөгөө дуусгахад алдаа гарлаа');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: ({
      plan,
      allowConcurrentActive = false,
    }: {
      plan: DailyPlan;
      allowConcurrentActive?: boolean;
    }) =>
      dailyPlanService.updateDailyPlan({
        id: plan.id,
        date: plan.date,
        routeId: plan.routeId,
        pickUpBlockId: plan.pickUpBlockId,
        stockpileIds: plan.stockpileIds,
        vehicleId: plan.vehicleId,
        shiftType: plan.shiftType,
        transportAmount: plan.transportAmount ?? undefined,
        status: 'active',
        allowConcurrentActive,
      }),
    onSuccess: (_, variables) => {
      setReactivationWarningPlan(undefined);
      toast.success(
        variables.allowConcurrentActive
          ? 'Өдрийн төлөвлөгөөг идэвхтэй болголоо. Хоёр төлөвлөгөө хоёул идэвхтэй байна.'
          : 'Өдрийн төлөвлөгөөг идэвхтэй болголоо',
      );
      refetch();
    },
    onError: (error: ApiError, variables) => {
      if (error.status === 409 && !variables.allowConcurrentActive) {
        setReactivationWarningPlan(variables.plan);
        return;
      }

      toast.error(error.message || 'Төлөвлөгөө идэвхжүүлэхэд алдаа гарлаа');
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/signin');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleEdit = (plan: DailyPlan) => {
    setEditingPlan(plan);
    setIsSidebarOpen(true);
  };

  const handleDelete = (plan: DailyPlan) => {
    setDeletingPlan(plan);
  };

  const handleReactivate = (plan: DailyPlan, allowConcurrentActive = false) => {
    reactivateMutation.mutate({ plan, allowConcurrentActive });
  };

  const handleSuccess = () => {
    refetch();
    setEditingPlan(undefined);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingPlan(undefined);
  };

  const columns = [
    TableColumn.custom<DailyPlan>('createdAt', 'Огноо', (plan) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatDate(plan.date)}
        </span>
      </div>
    )).build(),

    TableColumn.custom<DailyPlan>('shiftType', 'Ээлж', (plan: DailyPlan) => (
      <ShiftTypeBadge type={plan.shiftType} />
    )).build(),

    TableColumn.custom<DailyPlan>('status', 'Төлөв', (plan) => (
      <Badge
        variant="outline"
        className={
          plan.status === 'completed'
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
            : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
        }
      >
        {plan.status === 'completed' ? 'Дууссан' : 'Идэвхтэй'}
      </Badge>
    )).build(),

    TableColumn.custom<DailyPlan>('vehicle', 'Техник', (plan) => (
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-0.5">{plan.vehicleCode}</div>
      </div>
    )).build(),

    TableColumn.custom<DailyPlan>('route', 'Маршрут', (plan) => (
      <div className="flex items-center gap-2">
        <Route className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
          {plan.routeCode || '-'}
        </span>
      </div>
    )).build(),

    TableColumn.custom<DailyPlan>('blocks', 'Ачих блок', (plan) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {plan.miningBlockName}
          </span>
        </div>
        {plan.miningBlockLayerNumber && (
          <div className="ml-5 text-xs text-gray-500 dark:text-gray-400">
            Талын зай: {plan.miningBlockLayerNumber}
          </div>
        )}
      </div>
    )).build(),

    TableColumn.custom<DailyPlan>('stockpiles', 'Овоолгууд', (plan) => {
      if (!plan.stockpiles || plan.stockpiles.length === 0) {
        return <span className="text-xs text-gray-400">-</span>;
      }

      return (
        <div className="flex flex-col gap-1.5">
          {plan.stockpiles.map((stockpile) => (
            <StockpileLabel
              key={stockpile.id}
              type={stockpile.type}
              layerNumber={stockpile.layerNumber}
            />
          ))}
        </div>
      );
    }).build(),

    TableColumn.custom<DailyPlan>(
      'transportAmount',
      'Төлөвлөгөөт хэмжээ',
      (plan) => {
        if (plan.transportAmount) {
          return (
            <div>
              <div className="text-sm text-gray-700 dark:text-gray-100">
                {parseFloat(plan.transportAmount).toLocaleString()} м3
              </div>
            </div>
          );
        }
        return (
          <span className="text-sm text-gray-700 dark:text-gray-100">-</span>
        );
      },
    ).build(),
  ];

  const actions = [
    TableActions.custom<DailyPlan>(
      <CheckCheck className="w-4 h-4" />,
      (plan) => completeMutation.mutate(plan),
      {
        variant: 'success',
        title: 'Дууссан болгох',
        isLoading: (plan) =>
          completeMutation.isPending &&
          completeMutation.variables?.id === plan.id,
        isDisabled: (plan) => plan.status === 'completed',
      },
    ),
    TableActions.custom<DailyPlan>(
      <RotateCcw className="w-4 h-4" />,
      (plan) => handleReactivate(plan),
      {
        variant: 'warning',
        title: 'Идэвхтэй болгох',
        isLoading: (plan) =>
          reactivateMutation.isPending &&
          reactivateMutation.variables?.plan.id === plan.id,
        isDisabled: (plan) => plan.status === 'active',
      },
    ),
    TableActions.edit<DailyPlan>(handleEdit),
    TableActions.delete<DailyPlan>(handleDelete),
  ];

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Өдрийн төлөвлөлт"
        description="Диспетчерийн үүсгэсэн өдрийн төлөвлөлт"
        actions={
          hasRole(user.role, dailyPlanActionRoles)
            ? {
                label: 'Төлөвлөгөө үүсгэх',
                onClick: () => setIsSidebarOpen(true),
                variant: 'primary',
                icon: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                ),
              }
            : undefined
        }
      />

      {/* filters section */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Огноо:
            </label>
            <DatePicker
              id="daily-plan-date-picker"
              placeholder="Огноо сонгох"
              mode="single"
              onChange={(currentDateString) => {
                setSelectedDate(
                  dayjs(currentDateString[0]).format('YYYY-MM-DD'),
                );
                paginate(1, limit);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ээлж:
            </label>
            <div className="min-w-[180px]">
              <Select
                value={selectedShiftType || 'all'}
                onChange={(value) => {
                  setSelectedShiftType(
                    value === 'all' || value === ''
                      ? undefined
                      : (value as ShiftType)
                  );
                  paginate(1, limit);
                }}
                placeholder="Бүх ээлж"
                options={[
                  { value: 'all', label: 'Бүх ээлж' },
                  ...shiftTypeItems,
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5 dark:bg-gray-900">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Нийт:
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {total}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            төлөвлөгөө
          </span>
        </div>
      </div>

      {/* table section */}
      <div className="space-y-4">
        <DynamicTable<DailyPlan>
          data={[dataSource]}
          columns={columns}
          actions={
            hasRole(user.role, dailyPlanActionRoles) ? actions : undefined
          }
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Төлөвлөлт үүсээгүй байна."
          indexOffset={offset}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(page) => paginate(page, limit)}
          isLoading={isLoading}
        />
      </div>

      <DailyPlanFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingPlan={editingPlan}
      />

      <ConfirmDialog
        open={!!deletingPlan}
        onOpenChange={() => setDeletingPlan(undefined)}
        title="Өдрийн төлөвлөгөөг устгах уу?"
        description={`${deletingPlan ? formatDateFull(deletingPlan.createdAt) : ''} өдрийн төлөвлөгөөг устгах үйлдлийг буцаах боломжгүй.`}
        variant="destructive"
        onConfirm={() => {
          if (deletingPlan) {
            deleteMutation.mutate(deletingPlan.id);
            setDeletingPlan(undefined);
          }
        }}
      />

      <ConfirmDialog
        open={!!reactivationWarningPlan}
        onOpenChange={() => setReactivationWarningPlan(undefined)}
        title="Анхааруулга"
        description="Ижил техник, огноо, ээлжтэй өөр идэвхтэй төлөвлөгөө байна. Үргэлжлүүлбэл хоёр төлөвлөгөө хоёул идэвхтэй болно. Үргэлжлүүлэх үү?"
        onConfirm={() => {
          if (reactivationWarningPlan) {
            handleReactivate(reactivationWarningPlan, true);
          }
        }}
        confirmText="Тийм, идэвхжүүлэх"
        cancelText="Болих"
      />
    </div>
  );
}
