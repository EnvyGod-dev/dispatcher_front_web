'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Pagination from '@/components/tables/Pagination';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import { usePagination } from '@/hooks/pagination';
import markshaderReportService, { MarkshaderReport } from '@/services/internal/markshader-report';
import MarkshaderReportFormSidebar from './Sidebar';
import { useAuth } from '@/components/AuthProvider';
import { hasRole, markscheiderReportActionRoles } from '@/services/roles';
import MarkshaderImportExport from './ImportExport';

function getDateOptions(days = 30): { label: string; value: string }[] {
  const options = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    options.push({ label: d.toLocaleDateString('en-CA'), value: d.toLocaleDateString('en-CA') });
  }
  return options;
}

const formatVolume = (value: string | null | undefined) => {
  if (!value || value === '0') return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return <span>{parseFloat(value).toLocaleString('mn-MN', { maximumFractionDigits: 1 })} м³</span>;
};

const formatDiscrepancy = (value: string | null | undefined) => {
  if (!value) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  const num = parseFloat(value);
  const color = num >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  return (
    <span className={`font-semibold ${color}`}>
      {num > 0 ? '+' : ''}{num.toLocaleString('mn-MN', { maximumFractionDigits: 1 })}
    </span>
  );
};

export default function MarkshaderReportsPage() {
  const { user } = useAuth();
  const { offset, limit, paginate } = usePagination();

  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  })();
  const dateOptions = getDateOptions(30);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [editingReport, setEditingReport] = useState<MarkshaderReport | undefined>();
  const [deletingReport, setDeletingReport] = useState<MarkshaderReport | undefined>();

  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(today);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const { data: excavators } = useQuery({
    queryKey: ['excavators-filter', startDate],
    queryFn: () => markshaderReportService.getExcavatorsByDate(startDate),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['markshader-reports', { offset, limit, startDate, endDate }],
    queryFn: () =>
      markshaderReportService.getReports({ offset, limit, startDate, endDate }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => markshaderReportService.deleteReport(id),
    onSuccess: () => {
      toast.success('Хэмжилт амжилттай устгагдлаа');
      refetch();
    },
    onError: () => {
      toast.error('Хэмжилт устгахад алдаа гарлаа');
    },
  });

  const handleEdit = (report: MarkshaderReport) => {
    setEditingReport(report);
    setIsSidebarOpen(true);
  };

  const handleDelete = (report: MarkshaderReport) => {
    setDeletingReport(report);
  };

  const handleSuccess = () => {
    refetch();
    setEditingReport(undefined);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingReport(undefined);
  };

  const allData = data?.data ?? [];
  const dataSource = allData.filter((r) => {
    return !selectedVehicleId || r.vehicleId === selectedVehicleId;
  });

  const total = data?.totalCount ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const isDefaultFilter = startDate === yesterday && endDate === today && !selectedVehicleId;

  const canAction = hasRole(user?.role, markscheiderReportActionRoles);

  const selectClass =
    'h-8 px-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500';

  const thClass =
    'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60';

  const tdClass =
    'px-3 py-2 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap border-b border-gray-100 dark:border-gray-800';

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Маркшейдерийн хэмжилт"
        description="Өдөр тутмын маркшейдерийн хэмжилт"
        actions={
          canAction
            ? {
              label: 'Хэмжилт нэмэх',
              onClick: () => setIsSidebarOpen(true),
              variant: 'primary',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
            }
            : undefined
        }
      />

      {/* Шүүлт */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectClass}>
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <span className="text-gray-400 text-xs">—</span>

        <select value={endDate} onChange={(e) => setEndDate(e.target.value)} className={selectClass}>
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className={selectClass}
        >
          <option value="">Бүх Excavator</option>
          {excavators?.map((ex) => (
            <option key={ex.vehicleId} value={ex.vehicleId}>
              {ex.mineNumber ?? ex.vehicleName}
            </option>
          ))}
        </select>

        {!isDefaultFilter && (
          <button
            onClick={() => {
              setStartDate(yesterday);
              setEndDate(today);
              setSelectedVehicleId('');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Арилгах
          </button>
        )}

        <div className="ml-auto">
          <button
            onClick={() => setShowImportExport((v) => !v)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import / Export
          </button>
        </div>
      </div>

      {showImportExport && (
        <div className="mb-3">
          <MarkshaderImportExport onImportSuccess={refetch} />
        </div>
      )}

      {/* Хүснэгт */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={thClass}>Огноо</th>
                <th className={thClass}>Excavator</th>
                <th className={thClass}>Блок №</th>
                <th className={`${thClass} text-right`}>Марк бүтээл</th>
                <th className={`${thClass} text-right`}>ДИС Хөрс</th>
                <th className={`${thClass} text-right`}>ДИС Нүүрс</th>
                <th className={`${thClass} text-right`}>Бодит нийт</th>
                <th className={`${thClass} text-right`}>Рейс х/н</th>
                <th className={`${thClass} text-right`}>Зөрүү</th>
                <th className={`${thClass} text-right`}>ДИС коэф</th>
                {canAction && <th className={thClass}></th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: canAction ? 11 : 10 }).map((_, j) => (
                      <td key={j} className={tdClass}>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : dataSource.length === 0 ? (
                <tr>
                  <td
                    colSpan={canAction ? 11 : 10}
                    className="px-4 py-10 text-center text-xs text-gray-400 dark:text-gray-600"
                  >
                    Хэмжилт олдсонгүй
                  </td>
                </tr>
              ) : (
                dataSource.map((report, idx) => (
                  <tr
                    key={report.id}
                    className={`group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
                  >
                    <td className={tdClass}>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {report.reportDate}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {report.vehicle?.mineNumber ?? report.vehicle?.name ?? '—'}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span className="text-gray-500 dark:text-gray-400">
                        {report.blockNumbers?.join(', ') || '—'}
                      </span>
                    </td>

                    <td className={`${tdClass} text-right font-semibold text-gray-800 dark:text-gray-200`}>
                      {formatVolume(report.markProduction)}
                    </td>

                    <td className={`${tdClass} text-right`}>
                      {formatVolume(report.disSoil)}
                    </td>

                    <td className={`${tdClass} text-right`}>
                      {formatVolume(report.disCoal)}
                    </td>

                    <td className={`${tdClass} text-right font-medium text-gray-700 dark:text-gray-300`}>
                      {formatVolume(report.disTotalProduction)}
                    </td>

                    <td className={`${tdClass} text-right`}>
                      <span className="text-gray-500 dark:text-gray-400">
                        {report.disReisSoil ?? 0} / {report.disReisCoal ?? 0}
                      </span>
                    </td>

                    <td className={`${tdClass} text-right`}>
                      {formatDiscrepancy(report.markDisDiscrepancy)}
                    </td>

                    <td className={`${tdClass} text-right`}>
                      {report.disCoefficient ? (
                        <span className="text-gray-500 dark:text-gray-400">
                          {parseFloat(report.disCoefficient).toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>

                    {canAction && (
                      <td className={`${tdClass} text-right`}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(report)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Засах"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(report)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                            title="Устгах"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(page) => paginate(page, limit)}
          isLoading={isLoading}
        />
      </div>

      <MarkshaderReportFormSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onSuccess={handleSuccess}
        editingReport={editingReport}
      />

      <ConfirmDialog
        open={!!deletingReport}
        onOpenChange={() => setDeletingReport(undefined)}
        title="Маркшейдерийн хэмжилт устгах уу?"
        description={`${deletingReport?.reportDate ?? ''} өдрийн хэмжилт устгах үйлдлийг буцаах боломжгүй.`}
        variant="destructive"
        onConfirm={() => {
          if (deletingReport) {
            deleteMutation.mutate(deletingReport.id);
            setDeletingReport(undefined);
          }
        }}
      />
    </div>
  );
}