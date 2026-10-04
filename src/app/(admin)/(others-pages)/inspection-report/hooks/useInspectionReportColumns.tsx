import Badge from '@/components/ui/badge/Badge';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { formatDateFull } from '@/lib/time-formatter';
import { Employee } from '@/services/internal/employee/type';
import { ShiftInspection } from '@/services/internal/inspection/types';
import { Vehicle } from '@/services/internal/vehicle/types';
import { Eye } from 'lucide-react';

interface ShiftInspectionWithDetails extends ShiftInspection {
  vehicle: Vehicle;
  user: Employee;
}

interface UseInspectionReportColumnsProps {
  onImageClick: (url: string) => void;
}

export const useInspectionReportColumns = ({
  onImageClick,
}: UseInspectionReportColumnsProps) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'issue':
        return 'error';
      case 'needs_inspection':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal':
        return 'Хэвийн';
      case 'issue':
        return 'Аюултай';
      case 'needs_inspection':
        return 'Үзлэг шаардлагатай';
      default:
        return status;
    }
  };

  const getColumns = () => [
    TableColumn.custom<ShiftInspectionWithDetails>(
      'createdAt',
      'Огноо',
      (inspection) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDateFull(inspection.createdAt)}
        </span>
      )
    ).build(),

    TableColumn.custom<ShiftInspectionWithDetails>(
      'user',
      'Үзлэг хийсэн',
      (inspection) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {inspection.user
            ? `${inspection.user.firstName} ${inspection.user.lastName}`
            : '-'}
        </span>
      )
    ).build(),

    TableColumn.custom<ShiftInspectionWithDetails>(
      'vehicle',
      'Техник',
      (inspection) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {inspection.vehicle?.code || '-'}
        </span>
      )
    ).build(),

    TableColumn.custom<ShiftInspectionWithDetails>(
      'status',
      'Төлөв',
      (inspection) => (
        <Badge color={getStatusBadgeColor(inspection.status)}>
          {getStatusLabel(inspection.status)}
        </Badge>
      )
    ).build(),

    TableColumn.custom<ShiftInspectionWithDetails>(
      'inspection',
      'Үзлэг',
      (inspection) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {inspection.inspection?.type || '-'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {inspection.inspection?.name || '-'}
          </div>
        </div>
      )
    ).build(),

    TableColumn.custom<ShiftInspectionWithDetails>(
      'photoUrl',
      'Зураг',
      (inspection) => {
        if (!inspection.photoUrl) {
          return <div className="flex items-center text-gray-400">-</div>;
        }

        return (
          <button
            onClick={() => onImageClick(inspection.photoUrl!)}
            className="flex gap-2 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors text-sm font-medium"
          >
            <Eye size={18} />
          </button>
        );
      }
    ).build(),
  ];

  return {
    getColumns,
  };
};
