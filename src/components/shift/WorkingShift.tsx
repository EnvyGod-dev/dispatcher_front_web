'use client';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { WorkLog } from '@/components/shift/types';

interface WorkingShiftProps {
  workLogs: WorkLog[];
  activeWorkLog?: WorkLog;
  isEnding: boolean;
  onStartTrip: () => void;
  onEndTrip: (worklogId: string, status: 'completed' | 'cancelled') => void;
  onEndShift: () => void;
}

export default function WorkingShift({
  workLogs,
  activeWorkLog,
  isEnding,
  onStartTrip,
  onEndTrip,
  onEndShift,
}: WorkingShiftProps) {
  const completedTrips = workLogs.filter(
    (w) => w.status === 'completed'
  ).length;
  const totalAmount = workLogs
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.transportedAmount || '0'), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <PageBreadcrumb pageTitle="Ажиллаж байна" description="Рейс бүртгэх" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Рейс</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {completedTrips}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Нийт тонн
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalAmount.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Active Trip */}
        {activeWorkLog && (
          <ComponentCard title="Идэвхтэй Рейс" className="mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge color="info">Явж байна</Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activeWorkLog.startTime).toLocaleTimeString(
                    'mn-MN',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}{' '}
                  - Одоо
                </span>
              </div>

              {activeWorkLog.notes && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {activeWorkLog.notes}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onEndTrip(activeWorkLog.id, 'cancelled')}
                  className="flex-1"
                >
                  Цуцлах
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onEndTrip(activeWorkLog.id, 'completed')}
                  className="flex-1"
                >
                  Рейс дуусгах
                </Button>
              </div>
            </div>
          </ComponentCard>
        )}

        <ComponentCard title="Рейсийн түүх">
          {workLogs.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Одоогоор Рейс байхгүй байна
              </p>
              <Button
                variant="primary"
                onClick={onStartTrip}
                disabled={!!activeWorkLog}
              >
                Рейс эхлүүлэх
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {parseFloat(log.transportedAmount).toFixed(1)} тонн
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(log.startTime).toLocaleTimeString('mn-MN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {log.endTime && (
                          <>
                            {' - '}
                            {new Date(log.endTime).toLocaleTimeString('mn-MN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </div>
                    </div>
                    <Badge
                      color={
                        log.status === 'completed'
                          ? 'success'
                          : log.status === 'cancelled'
                            ? 'error'
                            : 'info'
                      }
                      size="sm"
                    >
                      {log.status === 'completed'
                        ? 'Дууссан'
                        : log.status === 'cancelled'
                          ? 'Цуцлагдсан'
                          : 'Явж байна'}
                    </Badge>
                  </div>
                  {log.notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {log.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ComponentCard>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {!activeWorkLog && workLogs.length > 0 && (
            <Button variant="primary" onClick={onStartTrip} className="w-full">
              Рейс эхлүүлэх
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onEndShift}
            disabled={isEnding || !!activeWorkLog}
            className="w-full"
          >
            {isEnding ? 'Дуусгаж байна...' : 'Ээлж дуусгах'}
          </Button>
        </div>
      </div>
    </div>
  );
}
