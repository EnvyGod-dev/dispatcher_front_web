'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { TableColumn } from '@/components/ui/table/TableColumn';
import UserAvatar from '@/components/ui/UserAvatar';
import OrganizationLogo from '@/components/ui/OrganizationLogo';
import { usePagination } from '@/hooks/pagination';
import employeeService from '@/services/internal/employee';
import { Employee } from '@/services/internal/employee/type';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import CreateAdminSidebar from './Sidebar';
import Badge from '@/components/ui/badge/Badge';

const EMPLOYEES_QUERY_KEY = 'Employees';

export default function OrganizationManagementPage() {
  const { offset, limit, paginate } = usePagination();
  const queryClient = useQueryClient();
  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [EMPLOYEES_QUERY_KEY, { offset, limit }],
    queryFn: () => employeeService.getEmployees({ offset, limit }),
  });

  const dataSource = data?.data || [];
  const total = data?.totalCount || dataSource.length;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const columns = [
    TableColumn.custom<Employee>('imageUrl', '', (employee) => (
      <UserAvatar
        imageUrl={employee.imageUrl}
        name={employee.name || `${employee.firstName} ${employee.lastName}`}
        size="sm"
      />
    )).build(),
    TableColumn.custom<Employee>('createdAt', 'Элссэн огноо', (employee) => (
      <span className="text-gray-800 text-theme-sm dark:text-white/90">
        {new Date(employee.createdAt).toLocaleDateString()}
      </span>
    )).build(),
    TableColumn.custom<Employee>(
      'organization.name',
      'Байгууллага',
      (employee) => (
        <div className="flex items-center gap-2">
          <OrganizationLogo
            logoUrl={employee.organization?.logoUrl}
            name={employee.organization?.name}
            size="sm"
          />
          <span className="text-gray-800 text-theme-sm dark:text-white/90 italic">
            {employee.organization?.name || '-'}
          </span>
        </div>
      )
    ).build(),
    TableColumn.custom<Employee>('name', 'Нэр', (employee) => (
      <div>
        <span className="text-gray-800 text-theme-sm dark:text-white/90">
          {employee.firstName} {employee.lastName}
        </span>
      </div>
    )).build(),
    TableColumn.text<Employee>('phoneNumber', 'Дугаар', 'phoneNumber').build(),
    TableColumn.text<Employee>('role', 'Системийн үүрэг', 'role').build(),
    TableColumn.custom<Employee>('status', 'Төлөв', (employee) => (
      <div>
        <span className="text-gray-800 text-theme-sm dark:text-white/90">
          {employee.status === 'inactive' ? (
            <Badge color="error">Идэвхгүй</Badge>
          ) : (
            <Badge color="success">Идэвхтэй</Badge>
          )}
        </span>
      </div>
    )).build(),
  ];

  const handleCloseSidebar = () => {
    setIsAddSidebarOpen(false);
  };

  const handleEmployeeAdded = () => {
    queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
    setIsAddSidebarOpen(false);
  };

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Уурхайн админ бүртгэл"
        actions={{
          label: 'Нэмэх',
          onClick: () => setIsAddSidebarOpen(true),
          variant: 'primary',
        }}
      />

      <div className="space-y-4">
        <DynamicTable<Employee>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Бүртгэл байхгүй"
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

      <CreateAdminSidebar
        isOpen={isAddSidebarOpen}
        onSuccess={handleEmployeeAdded}
        onClose={handleCloseSidebar}
      />
    </div>
  );
}