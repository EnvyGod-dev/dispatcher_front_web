'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { usePagination } from '@/hooks/pagination';
import RouteFormSidebar from './Sidebar';
import { Route } from '@/services/internal/routes/types';
import routeService from '@/services/internal/routes';
import { useAuth } from '@/components/AuthProvider';
import { hasRole, miningRouteActionRoles } from '@/services/roles';
import { formatDate } from '@/lib/time-formatter';

export default function RoutesPage() {
  const { user } = useAuth();

  const { offset, limit, paginate } = usePagination();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | undefined>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['routes', { offset, limit }],
    queryFn: () => routeService.getRoutes({ offset, limit }),
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

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setIsSidebarOpen(true);
  };

  const handleDelete = (route: Route) => {
    if (window.confirm(`"${route.routeCode}" маршрутыг устгах уу?`)) {
      deleteMutation.mutate(route.id);
    }
  };

  const handleSuccess = () => {
    refetch();
    setEditingRoute(undefined);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingRoute(undefined);
  };

  const columns = [
    TableColumn.text<Route>('code', 'Код', 'routeCode').build(),

    TableColumn.custom<Route>('description', 'Тайлбар', (route) => {
      if (route.description) {
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {route.description}
          </span>
        );
      }
      return <span className="text-xs text-gray-400">-</span>;
    }).build(),

    TableColumn.custom<Route>('createdAt', 'Үүсгэн огноо', (route) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {formatDate(route.createdAt)}
      </span>
    )).build(),
  ];

  const actions = hasRole(user?.role, miningRouteActionRoles)
    ? [
        TableActions.edit<Route>(handleEdit),
        TableActions.delete<Route>(handleDelete),
      ]
    : [];

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Маршрут"
        description="Уурхайн маршрут бүртгэл"
        actions={
          hasRole(user?.role, miningRouteActionRoles)
            ? {
                label: 'Маршрут нэмэх',
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
        <DynamicTable<Route>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Маршрут олдсонгүй."
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

      <RouteFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingRoute={editingRoute}
      />
    </div>
  );
}
