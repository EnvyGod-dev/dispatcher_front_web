'use client';

import Loading from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DynamicTable from '@/components/tables/DynamicTable';
import { ColumnDef } from '@/components/ui/table/builder';
import Pagination from '@/components/tables/Pagination';
import { usePagination } from '@/hooks/pagination';
import { formatDate, formatDateFull } from '@/lib/time-formatter';
import inspectionService from '@/services/internal/inspection';
import vehicleService from '@/services/internal/vehicle';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Bell,
  Image as ImageIcon,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { InspectionStatus } from '@/services/internal/inspection/types';
import ImageModal from '../components/ImageModal';
import ShiftTypeBadge from '@/components/shift-report/ShiftType';
import { ShiftType } from '@/services/internal/shift/types';
import { vehicleTypeLabels } from '@/services/internal/vehicle/types';

export interface VehicleInspectionProps {
  params: Promise<{
    id: string;
  }>;
}

export interface InspectionDetail {
  inspectionId: string;
  inspectionName: string;
  status: InspectionStatus;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface ShiftWithInspections {
  shiftId: string;
  shiftStart: string;
  shiftEnd: string | null;
  shiftType: ShiftType;
  driverName: string;
  driverFirstName: string;
  driverLastName: string;
  totalInspections: number;
  normalCount: number;
  issueCount: number;
  needsInspectionCount: number;
  inspectionsByType: Record<string, InspectionDetail[]>;
}

export default function VehicleInspectionDetailsPage({
  params,
}: VehicleInspectionProps) {
  const { id } = use(params);
  const router = useRouter();
  const { offset, limit, paginate } = usePagination();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedShifts, setExpandedShifts] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicle(id),
  });

  const { data: inspectionData, isLoading } = useQuery({
    queryKey: ['vehicle-inspections-by-shift', id, offset, limit],
    queryFn: () =>
      inspectionService.getShiftInspections({
        vehicleId: id,
        offset,
        limit,
      }),
  });

  const vehicle = vehicleData?.body;
  const shifts = (inspectionData?.data || []) as ShiftWithInspections[];
  const total = inspectionData?.totalCount || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const toggleShift = (shiftId: string) => {
    setExpandedShifts((prev) => {
      const next = new Set(prev);
      if (next.has(shiftId)) {
        next.delete(shiftId);
      } else {
        next.add(shiftId);
      }
      return next;
    });
  };

  const statusConfig = {
    normal: {
      label: 'Хэвийн',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-200',
      dotColor: 'bg-green-500',
    },
    needs_inspection: {
      label: 'Анхаарах',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-200',
      dotColor: 'bg-orange-500',
    },
    issue: {
      label: 'Аюултай',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-200',
      dotColor: 'bg-red-500',
    },
  };

  const columns: ColumnDef<InspectionDetail>[] = [
    {
      key: 'name',
      header: 'Үзлэгийн нэр',
      render: (item) => (
        <div className="w-48">
          <div className="font-medium">{item.inspectionName}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Төлөв',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].bgColor} ${statusConfig[item.status].textColor}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusConfig[item.status].dotColor}`}
          />
          {statusConfig[item.status].label}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Тэмдэглэл',
      render: (item) => (
        <div className="w-64">
          <span className="text-sm text-muted-foreground">
            {item.notes || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Огноо',
      render: (item) => (
        <span className="block w-48 text-sm text-muted-foreground">
          {formatDateFull(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'photo',
      header: 'Зураг',
      render: (item) => (
        <div className="w-20">
          {item.photoUrl ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedImage(item.photoUrl);
                setIsModalOpen(true);
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <Loading />;
  }

  if (!vehicle) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Техникийн мэдээлэл олдсонгүй</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Буцах
          </Button>
        </div>

        {/* Vehicle Info Card */}
        <div className="rounded-lg border border-border bg-card p-6 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{vehicle.code}</h1>
            </div>
            <Badge variant="outline" className="text-sm">
              {vehicleTypeLabels[vehicle.type]}
            </Badge>
          </div>
        </div>

        {/* Shifts with Inspections */}
        <div className="space-y-4 dark:bg-white/[0.03]">
          {shifts.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
              <p className="text-muted-foreground">
                Энэ техникт үзлэг хийгдээгүй байна
              </p>
            </div>
          ) : (
            shifts.map((shift) => {
              const isExpanded = expandedShifts.has(shift.shiftId);
              const driverName =
                `${shift.driverFirstName || ''} ${shift.driverLastName || ''}`.trim() ||
                shift.driverName;
              const typeGroups = Object.entries(shift.inspectionsByType);

              return (
                <div
                  key={shift.shiftId}
                  className="overflow-hidden rounded-lg border border-border dark:bg-white/[0.03]"
                >
                  {/* Shift Header - Collapsible */}
                  <button
                    onClick={() => toggleShift(shift.shiftId)}
                    className="w-full border-b border-border bg-muted/30 px-6 py-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-semibold">
                                {formatDate(shift.shiftStart)}
                              </div>
                              <ShiftTypeBadge type={shift.shiftType} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-l border-border pl-6">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDateFull(shift.shiftStart)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 border-l border-border pl-6">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {driverName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                          Нийт:{' '}
                          <span className="font-semibold">
                            {shift.totalInspections}
                          </span>
                        </div>
                        {shift.normalCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">
                              {shift.normalCount} хэвийн
                            </span>
                          </div>
                        )}
                        {shift.issueCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">
                              {shift.issueCount} аюултай
                            </span>
                          </div>
                        )}
                        {shift.needsInspectionCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-yellow-600">
                            <Bell className="h-4 w-4" />
                            <span className="font-medium">
                              {shift.needsInspectionCount} анхаарах
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Inspection Types & Tables */}
                  {isExpanded && (
                    <div className="space-y-6 p-6">
                      {typeGroups.map(([type, inspections]) => (
                        <div key={type} className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              {type}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {inspections.length} үзлэг
                            </Badge>
                          </div>

                          <DynamicTable
                            data={[inspections]}
                            columns={columns}
                            isLoading={false}
                            rowKey="inspectionId"
                            emptyMessage="Үзлэг олдсонгүй"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(page) => paginate(page, limit)}
          isLoading={isLoading}
        />

        <ImageModal
          isOpen={isModalOpen}
          imageUrl={selectedImage}
          onClose={handleCloseModal}
        />
      </div>
    </>
  );
}
