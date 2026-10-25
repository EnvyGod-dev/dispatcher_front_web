'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthProvider';
import Input from '@/components/form/input/InputField';
import DynamicTable from '@/components/tables/DynamicTable';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import Button from '@/components/ui/button/Button';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { formatDate } from '@/lib/time-formatter';
import routeService from '@/services/internal/routes';
import { Route } from '@/services/internal/routes/types';
import { hasRole, miningRouteActionRoles } from '@/services/roles';
import RouteFormSidebar from './Sidebar';
import DateRangeInputs, { type OptionalDateRange, type ShiftFilterValue } from '@/components/form/DateRangeInputs';
import { matchesCreated } from '@/lib/export/date-paged';

/** Маршрутын жагсаалт — овоолгын хуудасны "Маршрут" таб дотор харагдана. */
export default function RoutesPanel() {
  const { user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | undefined>();
  const [deletingRoute, setDeletingRoute] = useState<Route | undefined>();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<OptionalDateRange>({});
  const [shiftFilter, setShiftFilter] = useState<ShiftFilterValue>('');

  // Маршрут цөөхөн тул бүгдийг татаж хайлтыг шууд хийнэ.
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn: () => routeService.getRoutes({ offset: 0, limit: 1000 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routeService.deleteRoute(id),
    onSuccess: () => {
      toast.success('Маршрут амжилттай устгагдлаа');
      refetch();
    },
    onError: () => {
      toast.error('Маршрут устгахад алдаа гарлаа');
    },
  });

  const routes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = (data?.data || []).filter((route) => matchesCreated(route.createdAt, dateRange, shiftFilter));

    if (!query) return rows;

    return rows.filter(
      (route) =>
        route.routeCode.toLowerCase().includes(query) ||
        (route.description || '').toLowerCase().includes(query),
    );
  }, [data, search, dateRange, shiftFilter]);

  const canManage = hasRole(user?.role, miningRouteActionRoles);

  const columns = [
    TableColumn.custom<Route>('code', 'Код', (route) => (
      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
        {route.routeCode}
      </span>
    )).build(),

    TableColumn.custom<Route>('description', 'Тайлбар', (route) =>
      route.description ? (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {route.description}
        </span>
      ) : (
        <span className="text-xs text-gray-400">-</span>
      ),
    ).build(),

    TableColumn.custom<Route>('createdAt', 'Үүсгэсэн огноо', (route) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {formatDate(route.createdAt)}
      </span>
    )).build(),
  ];

  const actions = canManage
    ? [
        TableActions.edit<Route>((route) => {
          setEditingRoute(route);
          setIsSidebarOpen(true);
        }),
        TableActions.delete<Route>(
          (route) => setDeletingRoute(route),
          'Delete',
          (route) =>
            deleteMutation.isPending && deleteMutation.variables === route.id,
        ),
      ]
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Маршрутын код, тайлбараар хайх"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DateRangeInputs label="Бүртгэсэн огноо" value={dateRange}
              shift={shiftFilter}
              onShiftChange={(value) => {
                setShiftFilter(value);
                
              }} onChange={setDateRange} />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Нийт{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {data?.data?.length ?? 0}
          </span>{' '}
          маршрут
        </span>
        {canManage && (
          <Button
            size="sm"
            variant="primary"
            startIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingRoute(undefined);
              setIsSidebarOpen(true);
            }}
          >
            Маршрут нэмэх
          </Button>
        )}
      </div>

      <DynamicTable<Route>
        data={[routes]}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        rowKey="id"
        emptyMessage={search ? 'Хайлтад тохирох маршрут алга.' : 'Маршрут бүртгэгдээгүй.'}
      />

      <RouteFormSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setEditingRoute(undefined);
        }}
        onSuccess={() => {
          refetch();
          setEditingRoute(undefined);
        }}
        editingRoute={editingRoute}
      />

      <ConfirmDialog
        open={!!deletingRoute}
        onOpenChange={() => setDeletingRoute(undefined)}
        title="Маршрут устгах уу?"
        description={`"${deletingRoute?.routeCode ?? ''}" маршрутыг устгах үйлдлийг буцаах боломжгүй.`}
        variant="destructive"
        onConfirm={() => {
          if (deletingRoute) {
            deleteMutation.mutate(deletingRoute.id);
            setDeletingRoute(undefined);
          }
        }}
      />
    </div>
  );
}
