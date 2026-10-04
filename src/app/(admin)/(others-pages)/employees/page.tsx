'use client';


import { useAuth } from '@/components/AuthProvider';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DriverShiftGroupDropdown from '@/components/employee/DriverShiftGroupDropdown';
import EmployeeSidebar from '@/components/employee/EmployeeSidebar';
import {
  renderDisplayNameWithPosition,
  renderUserRole,
} from '@/components/employee/helper';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import Button from '@/components/ui/button/Button';
import StatusDropdown, { statusOptions } from '@/components/ui/StatusDropdown';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import UserAvatar from '@/components/ui/UserAvatar';
import { usePagination } from '@/hooks/pagination';
import employeeService from '@/services/internal/employee';
import {
  driverShiftGroupOptions,
  Employee,
  EmployeePositionMap,
  userRoleOptions,
  UserStatus,
} from '@/services/internal/employee/type';
import { UserRole } from '@/services/roles';
import { employeeActionRoles, hasRole } from '@/services/roles';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FilterX, Search } from 'lucide-react';

type DriverShiftGroupFilter = 'A' | 'B' | 'C' | 'D' | undefined;

const normalizeFilterValue = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('mn-MN');


export default function EmployeePage() {
  const { user } = useAuth();
  const { offset, limit, paginate } = usePagination();

  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(
    undefined
  );
  const [deletingEmployee, setDeletingEmployee] = useState<
    Employee | undefined
  >(undefined);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | undefined>(
    undefined
  );
  const [filterRole, setFilterRole] = useState<UserRole | undefined>(undefined);
  const [filterDriverShiftGroup, setFilterDriverShiftGroup] =
    useState<DriverShiftGroupFilter>(undefined);

  const [filterPosition, setFilterPosition] = useState<string | undefined>(
    undefined
  );
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRegisterNumber, setFilterRegisterNumber] = useState('');
  const [filterPhoneNumber, setFilterPhoneNumber] = useState('');
  const [filterEmail, setFilterEmail] = useState('');

  const [bulkStatus, setBulkStatus] = useState<UserStatus | undefined>(
    undefined
  );

  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);

  // Text filter бүр дээр шууд render/filter хийх ачааллыг багасгана.
  const deferredSearchText = useDeferredValue(searchText);
  const deferredDepartment = useDeferredValue(filterDepartment);
  const deferredRegisterNumber = useDeferredValue(filterRegisterNumber);
  const deferredPhoneNumber = useDeferredValue(filterPhoneNumber);
  const deferredEmail = useDeferredValue(filterEmail);

  const hasActiveFilters = Boolean(
    searchText.trim() ||
      filterStatus ||
      filterRole ||
      filterDriverShiftGroup ||
      filterPosition ||
      filterDepartment.trim() ||
      filterRegisterNumber.trim() ||
      filterPhoneNumber.trim() ||
      filterEmail.trim()
  );

  /**
   * Backend advanced query params-ийг одоогоор бүрэн дэмжихгүй байгаа тул
   * employee list-ийг бүх page-аар татаж аваад FRONTEND дээр filter хийнэ.
   *
   * Ингэснээр зөвхөн current page дээр filter хийхгүй — server-ийн бүх
   * employee list дээр filter хийгдэнэ.
   */
  const {
    data: allEmployees = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['Employees', 'all-for-frontend-filter'],
    queryFn: async () => {
      const pageSize = 100;
      let currentOffset = 0;
      const employees: Employee[] = [];

      while (true) {
        const response = await employeeService.getEmployees({
          offset: currentOffset,
          limit: pageSize,
        });

        const pageRows = response?.data || [];
        employees.push(...pageRows);

        if (pageRows.length === 0) {
          break;
        }

        currentOffset += pageRows.length;

        if (
          typeof response?.totalCount === 'number' &&
          employees.length >= response.totalCount
        ) {
          break;
        }

        if (
          typeof response?.totalCount !== 'number' &&
          pageRows.length < pageSize
        ) {
          break;
        }
      }

      return employees;
    },
    staleTime: 30000,
  });

  const filteredEmployees = useMemo(() => {
    const globalTerms = normalizeFilterValue(deferredSearchText)
      .split(/\s+/)
      .filter(Boolean);

    const departmentSearch = normalizeFilterValue(deferredDepartment);
    const registerSearch = normalizeFilterValue(deferredRegisterNumber);
    const phoneSearch = normalizeFilterValue(deferredPhoneNumber);
    const emailSearch = normalizeFilterValue(deferredEmail);
    const positionSearch = normalizeFilterValue(filterPosition);

    return allEmployees.filter((employee) => {
      // Global search: нэр, овог, утас, email, хэлтэс, регистр,
      // албан тушаал, role, status, ABCD ээлж.
      if (globalTerms.length > 0) {
        const searchableValues = [
          employee.firstName,
          employee.lastName,
          employee.name,
          employee.phoneNumber,
          employee.email,
          employee.department,
          employee.registerNumber,
          employee.position,
          employee.role,
          employee.status,
          employee.driverShiftGroup,
        ].map(normalizeFilterValue);

        const matchesGlobalSearch = globalTerms.every((term) =>
          searchableValues.some((value) => value.includes(term))
        );

        if (!matchesGlobalSearch) {
          return false;
        }
      }

      if (filterStatus && employee.status !== filterStatus) {
        return false;
      }

      if (filterRole && employee.role !== filterRole) {
        return false;
      }

      if (
        filterDriverShiftGroup &&
        employee.driverShiftGroup !== filterDriverShiftGroup
      ) {
        return false;
      }

      if (
        positionSearch &&
        normalizeFilterValue(employee.position) !== positionSearch
      ) {
        return false;
      }

      if (
        departmentSearch &&
        !normalizeFilterValue(employee.department).includes(departmentSearch)
      ) {
        return false;
      }

      if (
        registerSearch &&
        !normalizeFilterValue(employee.registerNumber).includes(registerSearch)
      ) {
        return false;
      }

      if (
        phoneSearch &&
        !normalizeFilterValue(employee.phoneNumber).includes(phoneSearch)
      ) {
        return false;
      }

      if (
        emailSearch &&
        !normalizeFilterValue(employee.email).includes(emailSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [
    allEmployees,
    deferredSearchText,
    filterStatus,
    filterRole,
    filterDriverShiftGroup,
    filterPosition,
    deferredDepartment,
    deferredRegisterNumber,
    deferredPhoneNumber,
    deferredEmail,
  ]);

  const total = filteredEmployees.length;
  const dataSource = filteredEmployees.slice(offset, offset + limit);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const actionRole = hasRole(user?.role, employeeActionRoles);

  const isAllCurrentPageSelected =
    dataSource.length > 0 &&
    dataSource.every((employee) => selectedEmployeeIds.includes(employee.id));

  const toggleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectCurrentPage = () => {
    const currentIds = dataSource.map((employee) => employee.id);

    setSelectedEmployeeIds((prev) => {
      if (currentIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !currentIds.includes(id));
      }

      return Array.from(new Set([...prev, ...currentIds]));
    });
  };

  const clearSelectedEmployees = () => {
    setSelectedEmployeeIds([]);
    setBulkStatus(undefined);
  };

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => employeeService.deleteEmployee(userId),
    onSuccess: () => {
      refetch();
      toast.success('Хэрэглэгч амжилттай устгагдлаа');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Хэрэглэгч устгахад алдаа гарлаа');
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({
      userIds,
      status,
    }: {
      userIds: string[];
      status: UserStatus;
    }) => employeeService.bulkUpdateEmployeeStatus(userIds, status),
    onSuccess: () => {
      toast.success('Сонгосон хэрэглэгчдийн төлөв амжилттай солигдлоо');
      clearSelectedEmployees();
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Төлөв солиход алдаа гарлаа');
    },
  });

  const handleBulkStatusChange = () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error('Эхлээд хэрэглэгч сонгоно уу');
      return;
    }

    if (!bulkStatus) {
      toast.error('Солих төлөв сонгоно уу');
      return;
    }

    bulkStatusMutation.mutate({
      userIds: selectedEmployeeIds,
      status: bulkStatus,
    });
  };

  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setFilterStatus(undefined);
    setFilterRole(undefined);
    setFilterDriverShiftGroup(undefined);
    setFilterPosition(undefined);
    setFilterDepartment('');
    setFilterRegisterNumber('');
    setFilterPhoneNumber('');
    setFilterEmail('');
    clearSelectedEmployees();
    paginate(1, limit);
  }, [limit, paginate]);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsAddSidebarOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setDeletingEmployee(employee);
  };

  const handleCloseSidebar = () => {
    setIsAddSidebarOpen(false);
    setEditingEmployee(undefined);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddSidebarOpen(false);
    setEditingEmployee(undefined);
  };

  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status ? (status as UserStatus) : undefined);
    paginate(1, limit);
  };

  const handleRoleChange = (role: string) => {
    setFilterRole(role ? (role as UserRole) : undefined);
    paginate(1, limit);
  };

  const handleDriverShiftGroupChange = (driverShiftGroup: string) => {
    setFilterDriverShiftGroup(
      driverShiftGroup ? (driverShiftGroup as 'A' | 'B' | 'C' | 'D') : undefined
    );
    paginate(1, limit);
  };

  const handlePositionChange = (position: string) => {
    setFilterPosition(position || undefined);
    paginate(1, limit);
  };

  const columns = useMemo(() => {
    const isDispatcher = user?.role === 'dispatcher';

    const baseColumns = [
      TableColumn.custom<Employee>('select', '', (employee) => (
        <input
          type="checkbox"
          checked={selectedEmployeeIds.includes(employee.id)}
          onChange={() => toggleSelectEmployee(employee.id)}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Хэрэглэгч сонгох"
        />
      )).build(),

      TableColumn.custom<Employee>('imageUrl', '', (employee) => (
        <UserAvatar
          imageUrl={employee.imageUrl}
          name={employee.name || `${employee.firstName} ${employee.lastName}`}
          size="sm"
        />
      )).build(),

      TableColumn.custom<Employee>('firstName', 'Нэр', (employee) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {renderDisplayNameWithPosition({
            position: employee.position,
            name: `${employee.firstName} ${employee.lastName}`,
          })}
        </span>
      )).build(),

      TableColumn.custom<Employee>('email', 'И-мэйл', (employee) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {employee.email && !employee.email.includes('@internal.local')
            ? employee.email
            : '-'}
        </span>
      )).build(),

      TableColumn.custom<Employee>('role', 'Системийн үүрэг', (employee) =>
        renderUserRole(employee.role)
      ).build(),

      TableColumn.custom<Employee>('position', 'Албан тушаал', (employee) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {employee.position || '-'}
        </span>
      )).build(),

      TableColumn.custom<Employee>('department', 'Хэлтэс', (employee) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {employee.department || '-'}
        </span>
      )).build(),

      TableColumn.custom<Employee>(
        'registerNumber',
        'Регистр',
        (employee) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {employee.registerNumber || '-'}
          </span>
        )
      ).build(),
    ];

    baseColumns.push(
      TableColumn.custom<Employee>(
        'driverShiftGroup',
        'ABCD ээлж',
        (employee) => {
          if (!isDispatcher) {
            return employee.driverShiftGroup || '-';
          }

          return (
            <DriverShiftGroupDropdown
              employeeId={employee.id}
              currentDriverShiftGroup={employee.driverShiftGroup}
            />
          );
        }
      ).build()
    );

    baseColumns.push(
      TableColumn.custom<Employee>('status', 'Төлөв', (employee) => (
        <div className="w-36">
          {hasRole(user?.role, employeeActionRoles) ? (
            <StatusDropdown
              employeeId={employee.id}
              currentStatus={employee.status}
            />
          ) : (
            <span>-</span>
          )}
        </div>
      )).build()
    );

    baseColumns.push(
      TableColumn.text<Employee>(
        'phoneNumber',
        'Утасны дугаар',
        'phoneNumber'
      ).build()
    );

    return baseColumns;
  }, [selectedEmployeeIds, user?.role]);

  const actions = actionRole
    ? [
      TableActions.edit<Employee>(handleEdit),
      TableActions.delete<Employee>(handleDelete),
    ]
    : [];

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Хүний нөөц бүртгэл"
        actions={
          actionRole
            ? {
              label: 'Нэмэх',
              onClick: () => {
                setEditingEmployee(undefined);
                setIsAddSidebarOpen(true);
              },
              variant: 'primary',
            }
            : undefined
        }
      />

      <div className="space-y-4">
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-4">
            {/* Global search */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Нэр, овог, утас, и-мэйл, регистр, хэлтэс, албан тушаал, үүрэг, ABCD ээлжээр хайх..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    paginate(1, limit);
                  }}
                  className="pl-9"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="gap-2 lg:w-auto"
              >
                <FilterX className="h-4 w-4" />
                Шүүлтүүр цэвэрлэх
              </Button>
            </div>

            <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Нарийвчилсан шүүлтүүр
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Input
                  type="text"
                  placeholder="Утасны дугаар"
                  value={filterPhoneNumber}
                  onChange={(e) => {
                    setFilterPhoneNumber(e.target.value);
                    paginate(1, limit);
                  }}
                />

                <Input
                  type="text"
                  placeholder="И-мэйл"
                  value={filterEmail}
                  onChange={(e) => {
                    setFilterEmail(e.target.value);
                    paginate(1, limit);
                  }}
                />

                <Input
                  type="text"
                  placeholder="Хэлтэс"
                  value={filterDepartment}
                  onChange={(e) => {
                    setFilterDepartment(e.target.value);
                    paginate(1, limit);
                  }}
                />

                <Input
                  type="text"
                  placeholder="Регистр"
                  value={filterRegisterNumber}
                  onChange={(e) => {
                    setFilterRegisterNumber(e.target.value);
                    paginate(1, limit);
                  }}
                />

                <Select
                  options={statusOptions}
                  placeholder="Төлөв сонгох"
                  value={filterStatus || undefined}
                  onChange={handleStatusFilterChange}
                />

                <Select
                  options={userRoleOptions.filter((r) => r.value !== 'superadmin')}
                  placeholder="Үүрэг сонгох"
                  value={filterRole || undefined}
                  onChange={handleRoleChange}
                />

                <Select
                  options={driverShiftGroupOptions}
                  placeholder="ABCD ээлж"
                  value={filterDriverShiftGroup || undefined}
                  onChange={handleDriverShiftGroupChange}
                />

                <Select
                  options={EmployeePositionMap}
                  placeholder="Албан тушаал"
                  value={filterPosition || undefined}
                  onChange={handlePositionChange}
                />
              </div>
            </div>
          </div>
        </div>

        {actionRole && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  onChange={toggleSelectCurrentPage}
                  className="h-4 w-4 rounded border-gray-300"
                  aria-label="Энэ хуудсын бүх хэрэглэгчийг сонгох"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Сонгосон: {selectedEmployeeIds.length}
                </span>
                {selectedEmployeeIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelectedEmployees}
                    className="text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400"
                  >
                    Сонголт цэвэрлэх
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="w-56">
                  <Select
                    options={statusOptions}
                    placeholder="Төлөв сонгох"
                    value={bulkStatus || undefined}
                    onChange={(value) =>
                      setBulkStatus(value ? (value as UserStatus) : undefined)
                    }
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleBulkStatusChange}
                  disabled={
                    selectedEmployeeIds.length === 0 ||
                    !bulkStatus ||
                    bulkStatusMutation.isPending
                  }
                >
                  {bulkStatusMutation.isPending
                    ? 'Сольж байна...'
                    : 'Сонгосон төлөв солих'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DynamicTable<Employee>
        data={[dataSource]}
        columns={columns}
        isLoading={isLoading}
        actions={actions}
        rowKey="id"
        emptyMessage="Бүртгэл байхгүй"
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

      <EmployeeSidebar
        isOpen={isAddSidebarOpen}
        onSuccess={handleSuccess}
        onClose={handleCloseSidebar}
        editingEmployee={editingEmployee}
      />

      <ConfirmDialog
        open={!!deletingEmployee}
        onOpenChange={() => setDeletingEmployee(undefined)}
        title="Хэрэглэгчийг устгахдаа итгэлтэй байна уу?"
        description={`${deletingEmployee?.firstName} ${deletingEmployee?.lastName} хэрэглэгчийг устгах үйлдлийг буцаах боломжгүй.`}
        onConfirm={() => {
          if (deletingEmployee) {
            deleteMutation.mutate(deletingEmployee.id);
            setDeletingEmployee(undefined);
          }
        }}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
      />
    </div>
  );
}