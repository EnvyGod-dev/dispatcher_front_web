// app/driver/shift/components/ShiftSummary.tsx
'use client';

import ComponentCard from '@/components/common/ComponentCard';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { InspectionStats, ShiftData, WorkLog } from './types';

interface ShiftSummaryProps {
  shiftData: ShiftData;
  workLogs: WorkLog[];
  stats: InspectionStats;
  getVehicleName: (id: string) => string;
  onStartNewShift: () => void;
}

export default function ShiftSummary({
  shiftData,
  workLogs,
  stats,
  getVehicleName,
  onStartNewShift,
}: ShiftSummaryProps) {
  const totalTonnage = workLogs.reduce(
    (sum, log) => sum + parseFloat(log.transportedAmount || '0'),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-success-100 dark:bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-success-600 dark:text-success-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Ээлж дууслаа!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ээлж амжилттай дуусгалаа
          </p>
        </div>

        <ComponentCard title="Ээлжийн бүртгэл">
          <div className="space-y-4">
            <SummaryRow
              label="Техник:"
              value={getVehicleName(shiftData.vehicleId)}
            />
            <SummaryRow
              label="Ээлжийн Төрөл:"
              value={shiftData.shiftType}
              className="capitalize"
            />

            {stats.total > 0 && (
              <>
                <SummaryRow
                  label="Техникийн үзлэг:"
                  value={`${stats.completed} checked`}
                />
                {stats.issues > 0 && (
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Аюултай:
                    </span>
                    <Badge size="sm" color="warning">
                      {stats.issues}
                    </Badge>
                  </div>
                )}
                {stats.issues > 0 && (
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Аюултай:
                    </span>
                    <Badge size="sm" color="error">
                      {stats.issues}
                    </Badge>
                  </div>
                )}
              </>
            )}

            <SummaryRow label="Нийт Рейс:" value={workLogs.length.toString()} />
            <SummaryRow
              label="Нийт Хэмжээ:"
              value={`${totalTonnage.toFixed(2)} tons`}
            />
            <SummaryRow
              label="Mileage:"
              value={`${shiftData.mileageStart} - ${shiftData.mileageEnd} km`}
              isLast
            />

            <Button
              variant="primary"
              onClick={onStartNewShift}
              className="w-full mt-6"
            >
              Ажлын ээлж эхлүүлэх
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  className?: string;
  isLast?: boolean;
}

function SummaryRow({
  label,
  value,
  className = '',
  isLast = false,
}: SummaryRowProps) {
  return (
    <div
      className={`flex justify-between py-3 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
    >
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={`font-semibold text-gray-800 dark:text-white ${className}`}
      >
        {value}
      </span>
    </div>
  );
}
