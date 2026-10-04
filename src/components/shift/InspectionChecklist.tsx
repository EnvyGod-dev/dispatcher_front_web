'use client';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import InspectionItem from './InspectionItem';
import { InspectionResult, InspectionStats } from './types';
import { ShiftType } from '@/services/internal/shift/types';
import { Inspection } from '@/services/internal/inspection/types';

interface InspectionChecklistProps {
  inspections: Inspection[];
  inspectionResults: Record<string, InspectionResult>;
  shiftType: ShiftType;
  vehicleName: string;
  inspectionLoading: boolean;
  onInspectionChange: (
    inspectionId: string,
    field: keyof InspectionResult,
    value: any
  ) => void;
  onComplete: () => void;
  onSkip: () => void;
  stats: InspectionStats;
}

export default function InspectionChecklist({
  inspections,
  inspectionResults,
  shiftType,
  vehicleName,
  inspectionLoading,
  onInspectionChange,
  onComplete,
  onSkip,
  stats,
}: InspectionChecklistProps) {
  if (inspectionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">
              Үзлэгийн жагсаалт уншиж байна...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!inspections || inspections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-4xl mx-auto">
          <PageBreadcrumb
            pageTitle="Техникийн үзлэг"
            description={`${vehicleName} | ${shiftType === 'day' ? 'Өдрийн' : 'Шөнийн'} Ээлж`}
          />
          <ComponentCard title="Үзлэгийн жагсаалт олдсонгүй">
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Тухайн техникийн төрөлд үзлэгийн жагсаалт олдсонгүй.
              </p>
              <Button variant="primary" onClick={onSkip}>
                Үзлэгийн хэсгийг алгасах
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  // Group inspections by type
  const groupedInspections = inspections.reduce(
    (acc, inspection) => {
      const type = inspection.type || 'Бусад';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(inspection);
      return acc;
    },
    {} as Record<string, Inspection[]>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <PageBreadcrumb
          pageTitle="Техникийн үзлэг"
          description={`${vehicleName} | ${shiftType === 'day' ? 'Өдрийн' : 'Шөнийн'} Ээлж`}
        />

        {/* Inspection Progress */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Техникийн үзлэг
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats.completed}/{stats.total} үзлэг
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Ажил эхлэхээсээ өмнө техникийн бүх үзлэгийг гүйцэтгэнэ үү
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge size="sm">{stats.total} нийт</Badge>
            {stats.completed > 0 && (
              <Badge size="sm" color="success">
                {stats.completed} хийсэн
              </Badge>
            )}
            {stats.issues > 0 && (
              <Badge size="sm" color="warning">
                {stats.issues} аюултай
              </Badge>
            )}
            {stats.needsInspection > 0 && (
              <Badge size="sm" color="error">
                {stats.needsInspection} шалгах шаардлагатай
              </Badge>
            )}
          </div>
        </div>

        {/* Inspection Items grouped by type */}
        <div className="space-y-6">
          {Object.entries(groupedInspections).map(([type, items]) => (
            <ComponentCard key={type} title={type}>
              <div className="space-y-4">
                {items.map((inspection) => (
                  <InspectionItem
                    key={inspection.id}
                    inspection={inspection}
                    result={inspectionResults[inspection.id]}
                    onChange={onInspectionChange}
                  />
                ))}
              </div>
            </ComponentCard>
          ))}

          <div className="sticky bottom-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.completed}
                </span>
                /{stats.total} үзлэг гүйцэтгэсэн
              </div>
              {stats.completed === stats.total && (
                <Badge size="sm" color="success">
                  Бүгд бөглөгдсөн
                </Badge>
              )}
            </div>
            <Button
              variant="primary"
              onClick={onComplete}
              className="w-full"
              disabled={stats.completed < stats.total}
            >
              {stats.completed < stats.total
                ? `Үзлэг дуусгах (${stats.total - stats.completed} үлдсэн)`
                : 'Үзлэг дуусгах'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
