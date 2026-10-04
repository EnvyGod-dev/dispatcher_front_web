import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { useState } from 'react';

import ImageModal from '@/app/(admin)/(others-pages)/inspection-report/components/ImageModal';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Inspection,
  ShiftInspection,
} from '@/services/internal/inspection/types';
import { cn } from '@/lib/utils';

interface VehicleInspectionTableProps {
  shiftInspections: (ShiftInspection & {
    inspection: Inspection;
  })[];
  inspectionNameClassName?: string;
  textSizeClassName?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'normal':
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Хэвийн
        </Badge>
      );
    case 'issue':
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Аюултай
        </Badge>
      );
    case 'needs_inspection':
      return (
        <Badge
          variant="outline"
          className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Анхаарах
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function VehicleInspectionTable({
  shiftInspections,
  inspectionNameClassName,
  textSizeClassName = 'text-xs',
}: VehicleInspectionTableProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = (photoUrl: string) => {
    setSelectedImage(photoUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const groupedInspections = shiftInspections.reduce(
    (acc, inspection) => {
      const type = inspection.inspection?.type || 'Бусад';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(inspection);
      return acc;
    },
    {} as Record<string, (ShiftInspection & { inspection: Inspection })[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedInspections).map(([type, inspections]) => (
        <div key={type} className="space-y-3">
          <div
            className={cn(
              'flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300',
              textSizeClassName
            )}
          >
            <Activity className="w-4 h-4" />
            {type} ({inspections.length})
          </div>

          <div className="border rounded-lg overflow-hidden dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow
                  className={cn(
                    'bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300',
                    textSizeClassName
                  )}
                >
                  <TableHead
                    className={cn('w-12 text-center', textSizeClassName)}
                  >
                    #
                  </TableHead>
                  <TableHead>Үзлэг</TableHead>
                  <TableHead className={cn('w-32', textSizeClassName)}>
                    Төлөв
                  </TableHead>
                  <TableHead className={cn('w-48', textSizeClassName)}>
                    Тэмдэглэл
                  </TableHead>
                  <TableHead
                    className={cn('w-20 text-center', textSizeClassName)}
                  >
                    Зураг
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((shiftInspection, index) => (
                  <TableRow
                    key={shiftInspection.id}
                    className={cn(
                      'transition-colors hover:bg-gray-50 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/50',
                      textSizeClassName
                    )}
                  >
                    <TableCell
                      className={cn(
                        'text-center text-gray-500',
                        textSizeClassName
                      )}
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'whitespace-normal break-words',
                        inspectionNameClassName
                      )}
                    >
                      {shiftInspection.inspection?.name || 'Тодорхойгүй'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shiftInspection.status)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {shiftInspection.notes ? (
                        <span
                          className={cn(
                            'whitespace-normal break-words text-gray-600 dark:text-gray-400',
                            textSizeClassName
                          )}
                        >
                          {shiftInspection.notes}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'italic whitespace-normal break-words text-gray-400 dark:text-gray-600',
                            textSizeClassName
                          )}
                        >
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {shiftInspection.photoUrl ? (
                        <button
                          onClick={() =>
                            handleImageClick(shiftInspection.photoUrl!)
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300',
                            textSizeClassName
                          )}
                        >
                          <Eye size={14} />
                          Үзэх
                        </button>
                      ) : (
                        <span
                          className={cn(
                            'text-gray-400 dark:text-gray-600',
                            textSizeClassName
                          )}
                        >
                          -
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        imageUrl={selectedImage}
        onClose={handleCloseModal}
      />
    </div>
  );
}
