'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthProvider';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { usePagination } from '@/hooks/pagination';
import { formatDateFull } from '@/lib/time-formatter';
import monthlyPlanService from '@/services/internal/monthly-plan';
import { MonthlyPlan } from '@/services/internal/monthly-plan/types';
import { dailyPlanActionRoles, hasRole } from '@/services/roles';
import { Calendar } from 'lucide-react';
import MonthlyPlanFormSidebar from './Sidebar';

export default function MonthlyPlansPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MonthlyPlan | undefined>();
  const [deletingPlan, setDeletingPlan] = useState<MonthlyPlan | undefined>();

  const { offset, limit, paginate } = usePagination();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['monthly-plans', { offset, limit }],
    queryFn: () =>
      monthlyPlanService.getMonthlyPlans({
        offset,
        limit,
      }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => monthlyPlanService.deleteMonthlyPlan(id),
    onSuccess: () => {
      toast.success('Төлөвлөгөө амжилттай устгагдлаа');
      refetch();
    },
    onError: () => {
      toast.error('Төлөвлөгөө устгахад алдаа гарлаа');
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

  const handleEdit = (plan: MonthlyPlan) => {
    setEditingPlan(plan);
    setIsSidebarOpen(true);
  };

  const handleDelete = (plan: MonthlyPlan) => {
    setDeletingPlan(plan);
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
    TableColumn.custom<MonthlyPlan>('createdAt', 'Огноо', (plan) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {plan.year} - {plan.month}
        </span>
      </div>
    )).build(),

    TableColumn.custom<MonthlyPlan>(
      'soilAmount',
      'Төлөвлөгөөт хөрс (м3)',
      (plan) => (
        <div className="flex items-start gap-2.5">
          <div className="space-y-0.5">{plan.soilAmount}</div>
        </div>
      )
    ).build(),

    TableColumn.custom<MonthlyPlan>(
      'coalAmount',
      'Төлөвлөгөөт нүүрс (м3)',
      (plan) => (
        <div className="flex items-start gap-2.5">
          <div className="space-y-0.5">{plan.coalAmount}</div>
        </div>
      )
    ).build(),
  ];

  const actions = [
    TableActions.edit<MonthlyPlan>(handleEdit),
    TableActions.delete<MonthlyPlan>(handleDelete),
  ];

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Сарын төлөвлөлт"
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

      <div className="space-y-4">
        <DynamicTable<MonthlyPlan>
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

      <MonthlyPlanFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingPlan={editingPlan}
      />

      <ConfirmDialog
        open={!!deletingPlan}
        onOpenChange={() => setDeletingPlan(undefined)}
        title="Сарын төлөвлөгөөг устгах уу?"
        description={`${deletingPlan ? formatDateFull(deletingPlan.createdAt) : ''} төлөвлөгөөг устгах үйлдлийг буцаах боломжгүй.`}
        variant="destructive"
        onConfirm={() => {
          if (deletingPlan) {
            deleteMutation.mutate(deletingPlan.id);
            setDeletingPlan(undefined);
          }
        }}
      />
    </div>
  );
}
