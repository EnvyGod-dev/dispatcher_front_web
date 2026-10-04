import { usePagination } from '@/hooks/pagination';
import vehicleService from '@/services/internal/vehicle';
import {
  Vehicle,
  VehicleStatus,
  vehicleStatusLabels,
  vehicleStatusOptions,
  VehicleType,
  vehicleTypeLabels,
  vehicleTypeMap,
} from '@/services/internal/vehicle/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import Badge from '@/components/ui/badge/Badge';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import VehicleSidebar from '@/components/ui/vehicle/Sidebar';
import { formatDate } from '@/lib/time-formatter';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/alert/Alert';
import vehicleOrganizationService from '@/services/internal/vehicle-organization';
import Select from '../form/Select';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import ColumnSettings, { ColumnOption } from './ColumnSettings';

const STORAGE_KEY = 'vehicles_visible_columns';

const availableColumns: ColumnOption[] = [
  {
    key: 'commissioningDate',
    label: 'Ашиглалтанд авсан',
    defaultVisible: true,
  },
  { key: 'name', label: 'Техникийн марк', defaultVisible: true },
  { key: 'code', label: 'Нэр', defaultVisible: true },
  { key: 'type', label: 'Төрөл', defaultVisible: true },
  { key: 'organization', label: 'Байгууллага', defaultVisible: true },
  { key: 'miningSection', label: 'Уулын хэсэг', defaultVisible: false },
  {
    key: 'coalCoefficient',
    label: 'Нүүрсний тэвшний багтаамж.',
    defaultVisible: false,
  },
  {
    key: 'soilCoefficient',
    label: 'Хөрсний тэвшний багтаамж.',
    defaultVisible: false,
  },
  { key: 'gps', label: 'GPS', defaultVisible: true },
  { key: 'status', label: 'Төлөв', defaultVisible: true },
  {
    key: 'decommissioningDate',
    label: 'Ашиглалтнаас гарсан огноо',
    defaultVisible: false,
  },
  {
    key: 'stoppedMotoHours',
    label: 'Зогссон мото цаг',
    defaultVisible: false,
  },
  {
    key: 'insuranceExpiryDate',
    label: 'Техникийн даатгалын хугацаа',
    defaultVisible: false,
  },
  {
    key: 'serialNumber',
    label: 'URL дугаар',
    defaultVisible: false,
  },
  {
    key: 'engineNumber',
    label: 'СТАНЦ ID',
    defaultVisible: false,
  },
];

export default function VehiclesPage() {
  const { offset, limit, paginate } = usePagination();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isAddSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(
    undefined
  );

  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterVehicleNumber, setFilterVehicleNumber] = useState('');
  const [filterType, setFilterType] = useState<VehicleType | undefined>(
    undefined
  );
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | undefined>(
    undefined
  );
  const [filterVehicleOrganizationId, setFilterVehicleOrganizationId] =
    useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return availableColumns
      .filter((col) => col.defaultVisible)
      .map((col) => col.key);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'vehicles',
      {
        offset,
        limit,
        name: filterName,
        code: filterCode,
        vehicleNumber: filterVehicleNumber,
        type: filterType,
        status: filterStatus,
        vehicleOrganizationId: filterVehicleOrganizationId,
        sortColumn,
        sortOrder,
      },
    ],
    queryFn: () =>
      vehicleService.getVehicles({
        offset,
        limit,
        name: filterName || undefined,
        code: filterCode || undefined,
        vehicleNumber: filterVehicleNumber || undefined,
        type: filterType,
        status: filterStatus,
        vehicleOrganizationId: filterVehicleOrganizationId,
        sortColumn,
        sortOrder,
      }),
  });

  const { data: vehicleOrganizations } = useQuery({
    queryKey: ['vehicleOrganizations'],
    queryFn: () =>
      vehicleOrganizationService.getVehicleOrganizations({
        offset: 0,
        limit: 50,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: vehicleService.deleteVehicle,
    onSuccess: () => {
      toast.success('Техник устгагдаа.');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingVehicle(undefined);
  };

  const handleSuccess = () => {
    refetch();
    setEditingVehicle(undefined);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsSidebarOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setDeleteVehicle(vehicle);
  };

  const handleSaveColumns = (newVisibleColumns: string[]) => {
    setVisibleColumns(newVisibleColumns);
  };

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortOrder(order);
    paginate(1, limit);
  };

  const handleClearFilters = useCallback(() => {
    setFilterName('');
    setFilterCode('');
    setFilterVehicleNumber('');
    setFilterType(undefined);
    setFilterStatus(undefined);
    setFilterVehicleOrganizationId(undefined);
    paginate(1, limit);
  }, [limit, paginate]);

  const actions = [
    TableActions.edit<Vehicle>(handleEdit),
    TableActions.delete<Vehicle>(handleDelete),
    TableActions.view<Vehicle>((vehicle) => {
      router.push(`/vehicles/${vehicle.id}`);
    }),
  ];

  const allColumns = {
    commissioningDate: TableColumn.custom<Vehicle>(
      'commissioningDate',
      'Ашиглалтанд авсан',
      (vehicle) => (
        <div className="space-y-0.5">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {formatDate(vehicle.commissioningDate)}
          </div>
        </div>
      )
    ).sortable().build(),
    name: TableColumn.avatar<Vehicle>('name', 'Техникийн марк', {
      image: 'pictureUrl',
      name: 'name',
      subtitle: 'vehicleNumber',
    }).sortable().build(),
    code: TableColumn.text<Vehicle>('code', 'Нэр', 'code').sortable().build(),
    fuelConsumptionPerHour: TableColumn.text(
      'fuelConsumptionPerHour',
      'Түлш зарцуулалт',
      'fuelConsumptionPerHour'
    ).build(),
    type: TableColumn.custom<Vehicle>('type', 'Төрөл', (vehicle) => (
      <Badge size="sm" color="primary">
        {vehicleTypeLabels[vehicle.type]}
      </Badge>
    )).sortable().build(),
    organization: TableColumn.custom<Vehicle>(
      'organization',
      'Байгууллага',
      (vehicle) => (
        <span className="text-gray-800 text-theme-sm dark:text-white/90">
          {vehicle.vehicleOrganizationName || '-'}
        </span>
      )
    ).build(),
    miningSection: TableColumn.custom<Vehicle>(
      'miningSection',
      'Уулын хэсэг',
      (vehicle) => (
        <span className="text-gray-800 text-theme-sm dark:text-white/90">
          {vehicle.miningSectionName || '-'}
        </span>
      )
    ).build(),
    coalCoefficient: TableColumn.text<Vehicle>(
      'coalCoefficient',
      'Нүүрсний тэвшний багтаамж',
      'coalCoefficient'
    ).build(),
    soilCoefficient: TableColumn.text<Vehicle>(
      'soilCoefficient',
      'Хөрсний тэвшний багтаамж',
      'soilCoefficient'
    ).build(),
    gps: TableColumn.custom<Vehicle>('gps', 'GPS', (vehicle) => (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
          vehicle.hasGps
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${vehicle.hasGps ? 'bg-green-600' : 'bg-gray-400'}`}
        ></span>
        {vehicle.hasGps ? 'Байгаа' : 'Байхгүй'}
      </span>
    )).build(),
    status: TableColumn.custom<Vehicle>('status', 'Төлөв', (vehicle) => (
      <div>
        <Badge
          color={
            vehicle.status === 'active'
              ? 'success'
              : vehicle.status === 'maintenance'
                ? 'warning'
                : 'error'
          }
        >
          {vehicleStatusLabels[vehicle.status]}
        </Badge>
      </div>
    )).sortable().build(),
    decommissioningDate: TableColumn.custom<Vehicle>(
      'decommissioningDate',
      'Ашиглалтнаас гарсан огноо',
      (vehicle) => (
        <div className="space-y-0.5">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {formatDate(vehicle.decommissioningDate) ?? '-'}
          </div>
        </div>
      )
    ).build(),
    insuranceExpiryDate: TableColumn.custom<Vehicle>(
      'insuranceExpiryDate',
      'Техникийн даатгалын хугацаа',
      (vehicle) => (
        <div className="space-y-0.5">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {formatDate(vehicle.insuranceExpiryDate) ?? '-'}
          </div>
        </div>
      )
    ).build(),
    stoppedMotoHours: TableColumn.text<Vehicle>(
      'stoppedMotoHours',
      'Зогссон мото цаг',
      'stoppedMotoHours'
    ).build(),
    serialNumber: TableColumn.text<Vehicle>(
      'serialNumber',
      'Арлын дугаар',
      'serialNumber'
    ).build(),
    engineNumber: TableColumn.text<Vehicle>(
      'engineNumber',
      'СТАНЦ ID',
      'engineNumber'
    ).build(),
  };

  const columns = visibleColumns
    .map((key) => allColumns[key as keyof typeof allColumns])
    .filter(Boolean);

  const handleRowClick = (vehicle: Vehicle) => {
    router.push(`/vehicles/${vehicle.id}`);
  };

  const dataSource = data?.data || [];
  const total = data?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const vehicleOrganizationOptions =
    vehicleOrganizations?.data?.map((org) => ({
      value: org.id,
      label: org.name,
    })) || [];

  const hasActiveFilters =
    filterName ||
    filterCode ||
    filterVehicleNumber ||
    filterType ||
    filterStatus ||
    filterVehicleOrganizationId;

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Техник бүртгэл"
        actions={{
          label: 'Нэмэх',
          onClick: () => setIsSidebarOpen(true),
          variant: 'primary',
        }}
      />

      <div className="space-y-4">
        {/* filters */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Шүүлтүүр
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-brand-500 text-white rounded-full">
                {
                  [
                    filterName,
                    filterCode,
                    filterVehicleNumber,
                    filterType,
                    filterStatus,
                    filterVehicleOrganizationId,
                  ].filter(Boolean).length
                }
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2 text-gray-600 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
              Цэвэрлэх
            </Button>
          )}
          <ColumnSettings
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onSave={handleSaveColumns}
          />
        </div>

        {/* Filters - Collapsible */}
        {showFilters && (
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              {/* Row 1: Text Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Техникийн марк
                  </label>
                  <Input
                    type="text"
                    placeholder="Техникийн маркаар хайх..."
                    value={filterName}
                    onChange={(e) => {
                      setFilterName(e.target.value);
                      paginate(1, limit);
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Нэр
                  </label>
                  <Input
                    type="text"
                    placeholder="Нэрээр хайх..."
                    value={filterCode}
                    onChange={(e) => {
                      setFilterCode(e.target.value);
                      paginate(1, limit);
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Улсын дугаар
                  </label>
                  <Input
                    type="text"
                    placeholder="Улсын дугаараар хайх..."
                    value={filterVehicleNumber}
                    onChange={(e) => {
                      setFilterVehicleNumber(e.target.value);
                      paginate(1, limit);
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Select Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Төрөл
                  </label>
                  <Select
                    options={vehicleTypeMap}
                    placeholder="Бүгд"
                    value={filterType || ''}
                    onChange={(value) => {
                      setFilterType((value || undefined) as VehicleType);
                      paginate(1, limit);
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Төлөв
                  </label>
                  <Select
                    options={vehicleStatusOptions}
                    placeholder="Бүгд"
                    value={filterStatus || ''}
                    onChange={(value) => {
                      setFilterStatus((value || undefined) as VehicleStatus);
                      paginate(1, limit);
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Байгууллага
                  </label>
                  <Select
                    options={vehicleOrganizationOptions}
                    placeholder="Бүгд"
                    value={filterVehicleOrganizationId || ''}
                    onChange={(value) => {
                      setFilterVehicleOrganizationId(value || undefined);
                      paginate(1, limit);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filterName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
                Техникийн марк: {filterName}
                <button
                  onClick={() => {
                    setFilterName('');
                    paginate(1, limit);
                  }}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterCode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
                Нэр: {filterCode}
                <button
                  onClick={() => {
                    setFilterCode('');
                    paginate(1, limit);
                  }}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterVehicleNumber && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
                Улсын дугаар: {filterVehicleNumber}
                <button
                  onClick={() => {
                    setFilterVehicleNumber('');
                    paginate(1, limit);
                  }}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
                Төрөл: {vehicleTypeLabels[filterType]}
                <button
                  onClick={() => {
                    setFilterType(undefined);
                    paginate(1, limit);
                  }}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterStatus && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
                Төлөв: {vehicleStatusLabels[filterStatus]}
                <button
                  onClick={() => {
                    setFilterStatus(undefined);
                    paginate(1, limit);
                  }}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterVehicleOrganizationId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
                Байгууллага:{' '}
                {
                  vehicleOrganizationOptions.find(
                    (o) => o.value === filterVehicleOrganizationId
                  )?.label
                }
                <button
                  onClick={() => {
                    setFilterVehicleOrganizationId(undefined);
                    paginate(1, limit);
                  }}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        <DynamicTable<Vehicle>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Бүртгэлтэй техник олдсонгүй"
          onRowClick={handleRowClick}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
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

      <VehicleSidebar
        isOpen={isAddSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingVehicle={editingVehicle}
      />

      <ConfirmDialog
        open={!!deleteVehicle}
        onOpenChange={() => setDeleteVehicle(null)}
        title="Техникийг устгах уу?"
        description={`${deleteVehicle?.name} техникийн төлөв 'Идэвхгүй' болно.`}
        onConfirm={() => {
          deleteMutation.mutate(deleteVehicle!.id);
          setDeleteVehicle(null);
        }}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
      />
    </div>
  );
}
