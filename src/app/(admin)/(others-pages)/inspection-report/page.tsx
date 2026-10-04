"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DatePicker from "@/components/form/date-picker";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DynamicTable from "@/components/tables/DynamicTable";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import { ColumnDef } from "@/components/ui/table/builder";
import { TableActions } from "@/components/ui/table/TableActions";
import { usePagination } from "@/hooks/pagination";
import { formatDate, formatDateFull } from "@/lib/time-formatter";
import employeeService from "@/services/internal/employee";
import { Employee } from "@/services/internal/employee/type";
import inspectionService from "@/services/internal/inspection";
import { VehicleInspectionSummary } from "@/services/internal/inspection/types";
import { ShiftType, shiftTypeItems } from "@/services/internal/shift/types";
import vehicleService from "@/services/internal/vehicle";
import vehicleOrganizationService from "@/services/internal/vehicle-organization";
import { VehicleOrganization } from "@/services/internal/vehicle-organization/types";
import { Vehicle } from "@/services/internal/vehicle/types";
import {
  vehicleStatusLabels,
  VehicleType,
  vehicleTypeLabels,
  vehicleTypeMap,
} from "@/services/internal/vehicle/types";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InspectionReportsPage() {
  const { offset, limit, paginate } = usePagination();
  const [driver, setDriver] = useState<Employee | undefined>(undefined);
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
  const [vehicleOrganization, setVehicleOrganization] = useState<
    VehicleOrganization | undefined
  >(undefined);

  const router = useRouter();

  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    vehicleType?: VehicleType;
    vehicleOrganizationId?: string;
    vehicleId?: string;
    shiftType?: ShiftType;
    driverId?: string;
  }>({});

  const { data, isLoading } = useQuery({
    queryKey: ["inspection-reports-summary", offset, limit, filters],
    queryFn: () =>
      inspectionService.getVehicleInspectionSummary({
        offset,
        limit,
        startDate: filters.startDate,
        endDate: filters.endDate,
        vehicleType: filters.vehicleType,
        vehicleOrganizationId: filters.vehicleOrganizationId,
        vehicleId: filters.vehicleId,
        shiftType: filters.shiftType,
        driverId: filters.driverId,
      }),
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["Employees"],
    queryFn: () => employeeService.getEmployees({ offset: 0, limit: 300 }),
  });

  const { data: vehiclesData, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ["vehicles-filter"],
    queryFn: () => vehicleService.getVehicles({ offset: 0, limit: 500 }),
  });

  const { data: vehicleOrganizationsData, isLoading: isVehicleOrganizationsLoading } =
    useQuery({
      queryKey: ["vehicle-organizations-filter"],
      queryFn: () =>
        vehicleOrganizationService.getVehicleOrganizations({ offset: 0, limit: 500 }),
    });

  const users = usersData?.data;
  const vehiclesList = vehiclesData?.data;
  const vehicleOrganizations = vehicleOrganizationsData?.data;

  const vehicleSummaries = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handleFilterChange = <K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    paginate(1, limit); // reset to first page
  };

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.vehicleType ||
    filters.vehicleOrganizationId ||
    filters.vehicleId ||
    filters.shiftType ||
    filters.driverId;

  const columns: ColumnDef<VehicleInspectionSummary>[] = [
    {
      key: "vehicleCode",
      header: "Техник",
      render: (item) => (
        <div>
          <div className="font-medium">{item.vehicleCode}</div>
          <div className="text-xs text-muted-foreground">
            {item.vehicleName}
          </div>
        </div>
      ),
    },
    {
      key: "vehicleType",
      header: "Төрөл",
      render: (item) => (
        <Badge size="sm" color="primary">
          {vehicleTypeLabels[item.vehicleType]}
        </Badge>
      ),
    },
    {
      key: "vehicleStatus",
      header: "Техникийн төлөв",
      render: (item) => (
        <Badge
          size="sm"
          color={
            item.vehicleStatus === "active"
              ? "success"
              : item.vehicleStatus === "maintenance"
                ? "warning"
                : "error"
          }
        >
          {vehicleStatusLabels[item.vehicleStatus]}
        </Badge>
      ),
    },
    {
      key: "totalInspections",
      header: "Нийт үзлэг",
      render: (item) => (
        <span className="font-sm">{item.totalInspections}</span>
      ),
    },
    {
      key: "normalCount",
      header: "Хэвийн",
      render: (item) =>
        Number(item.normalCount) > 0 ? (
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {item.normalCount}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "issueCount",
      header: "Аюултай",
      render: (item) =>
        Number(item.issueCount) > 0 ? (
          <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
            {item.issueCount}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "needsInspectionCount",
      header: "Анхаарах",
      render: (item) =>
        Number(item.needsInspectionCount) > 0 ? (
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            {item.needsInspectionCount}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "shiftsWithoutInspection",
      header: "Үзлэг хийгдсэн эсэх",
      render: (item) => {
        const hasInspection =
          Number(item.totalInspections) > 0 || Boolean(item.lastInspectionDate);

        return (
          <span
            className={`text-sm ${hasInspection ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
          >
            {hasInspection ? "Тийм" : "Үгүй"}
          </span>
        );
      },
    },
    {
      key: "shiftsWithoutInspectionCount",
      header: "Үзлэггүй ээлж",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {Number(item.shiftsWithoutInspection)}
        </span>
      ),
    },
    {
      key: "lastInspectionDate",
      header: "Сүүлийн үзлэг",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-gray-300 ">
          {item.lastInspectionDate
            ? formatDateFull(item.lastInspectionDate)
            : "-"}
        </span>
      ),
    },
  ];

  const actions = [
    TableActions.view<VehicleInspectionSummary>((inspectionSummary) => {
      router.push(`/inspection-report/${inspectionSummary.vehicleId}`);
    }),
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Техникийн үзлэгийн тайлан"
        description="Техник тус бүрийн үзлэгийн дүнг харах"
      />

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-3 dark:bg-gray-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Компани</Label>
            <Select
              value={filters.vehicleOrganizationId || ""}
              onChange={(value) => {
                handleFilterChange("vehicleOrganizationId", value || undefined);
                setVehicleOrganization(
                  vehicleOrganizations?.find((org) => org.id === value),
                );
              }}
              placeholder="Бүгд"
              disabled={isVehicleOrganizationsLoading}
              options={
                vehicleOrganizations
                  ? vehicleOrganizations.map((org) => ({
                      value: org.id,
                      label: org.name,
                      keywords: [org.name],
                    }))
                  : []
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Оператор</Label>
            <Select
              value={filters.driverId || ""}
              onChange={(value) => {
                handleFilterChange("driverId", value);
                setDriver(users?.find((u) => u.id === value));
              }}
              placeholder="Бүгд"
              disabled={isUsersLoading}
              options={
                users
                  ? users.map((u) => {
                      return {
                        value: u.id,
                        label: `${u.firstName} ${u.lastName}`,
                        keywords: [
                          u.firstName,
                          u.lastName,
                          `${u.firstName} ${u.lastName}`,
                        ],
                      };
                    })
                  : []
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Техникийн төрөл</Label>
            <Select
              value={filters.vehicleType || ""}
              onChange={(value) =>
                handleFilterChange("vehicleType", value as VehicleType)
              }
              placeholder="Бүгд"
              options={vehicleTypeMap}
            />
          </div>

          <div className="space-y-2">
            <Label>Техник</Label>
            <Select
              value={filters.vehicleId || ""}
              onChange={(value) => {
                handleFilterChange("vehicleId", value);
                setVehicle(vehiclesList?.find((v) => v.id === value));
              }}
              placeholder="Бүгд"
              disabled={isVehiclesLoading}
              options={
                vehiclesList
                  ? vehiclesList.map((v) => ({
                      value: v.id,
                      label: `${v.code} - ${v.name}`,
                      keywords: [v.code, v.name, v.vehicleNumber],
                    }))
                  : []
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Ээлжийн төрөл</Label>
            <Select
              value={filters.shiftType || ""}
              onChange={(value) =>
                handleFilterChange("shiftType", value as ShiftType)
              }
              placeholder="Бүгд"
              options={shiftTypeItems}
            />
          </div>

          <div className="space-y-2">
            <Label>Эхлэх огноо</Label>
            <DatePicker
              id="start-date-picker"
              placeholder="Эхлэх огноо"
              mode="single"
              defaultDate={
                filters.startDate ? new Date(filters.startDate) : undefined
              }
              onChange={(dates) =>
                handleFilterChange(
                  "startDate",
                  dates?.[0] ? dates[0].toISOString() : undefined,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Дуусах огноо</Label>
            <DatePicker
              id="end-date-picker"
              placeholder="Дуусах огноо"
              mode="single"
              defaultDate={
                filters.endDate ? new Date(filters.endDate) : undefined
              }
              onChange={(dates) =>
                handleFilterChange(
                  "endDate",
                  dates?.[0] ? dates[0].toISOString() : undefined,
                )
              }
            />
          </div>
        </div>

        {/* Active filters badge */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Идэвхтэй шүүлт:
            </span>
            {filters.vehicleOrganizationId && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="font-medium">
                  {vehicleOrganization?.name || filters.vehicleOrganizationId}
                </span>
                <button
                  onClick={() => {
                    handleFilterChange("vehicleOrganizationId", undefined);
                    setVehicleOrganization(undefined);
                  }}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.vehicleType && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="font-medium">
                  {vehicleTypeLabels[filters.vehicleType]}
                </span>
                <button
                  onClick={() => handleFilterChange("vehicleType", undefined)}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.vehicleId && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="font-medium">
                  {vehicle
                    ? `${vehicle.code} - ${vehicle.name}`
                    : filters.vehicleId}
                </span>
                <button
                  onClick={() => handleFilterChange("vehicleId", undefined)}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.driverId && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="font-medium">{`${driver?.firstName} ${driver?.lastName}`}</span>
                <button
                  onClick={() => handleFilterChange("driverId", undefined)}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.shiftType && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="font-medium">
                  {filters.shiftType === "day" ? "Өдөр" : "Шөнө"}
                </span>
                <button
                  onClick={() => handleFilterChange("shiftType", undefined)}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.startDate && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="text-muted-foreground">Эхлэх:</span>
                <span className="font-medium">
                  {formatDate(filters.startDate)}
                </span>
                <button
                  onClick={() => handleFilterChange("startDate", undefined)}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.endDate && (
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                <span className="text-muted-foreground">Дуусах:</span>
                <span className="font-medium">
                  {formatDate(filters.endDate)}
                </span>
                <button
                  onClick={() => handleFilterChange("endDate", undefined)}
                  className="ml-1 rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <DynamicTable
        data={[vehicleSummaries]}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        rowKey="vehicleId"
        emptyMessage="Үзлэгийн мэдээлэл олдсонгүй"
        footer={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalCount}
            limit={limit}
            onPageChange={(page) => paginate(page, limit)}
            isLoading={isLoading}
          />
        }
        footerClassName="p-4 pt-2"
      />
    </div>
  );
}
