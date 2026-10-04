'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import markshaderReportService from '@/services/internal/markshader-report';

interface MarkshaderImportExportProps {
    onImportSuccess?: () => void;
}

function getDateOptions(days = 60): { label: string; value: string }[] {
    const options = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const value = d.toLocaleDateString('en-CA');
        options.push({ label: value, value });
    }
    return options;
}

export default function MarkshaderImportExport({ onImportSuccess }: MarkshaderImportExportProps) {
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importYear, setImportYear] = useState(String(new Date().getFullYear()));
    const [importMonth, setImportMonth] = useState(String(new Date().getMonth() + 1));
    const [exportVehicleId, setExportVehicleId] = useState('');

    const today = new Date().toLocaleDateString('en-CA');
    const dateOptions = getDateOptions(60);

    const [exportStartDate, setExportStartDate] = useState(today);
    const [exportEndDate, setExportEndDate] = useState(today);

    const { data: excavatorsRaw } = useQuery({
        queryKey: ['excavators-export', today],
        queryFn: () => markshaderReportService.getExcavatorsByDate(today),
    });

    const excavators = excavatorsRaw
        ? Array.from(new Map(excavatorsRaw.map((ex) => [ex.vehicleId, ex])).values())
        : [];

    const importMutation = useMutation({
        mutationFn: () =>
            markshaderReportService.importFromExcel({
                file: importFile!,
                year: importYear,
                month: importMonth,
            }),
        onSuccess: (result) => {
            if (result.inserted > 0) {
                toast.success(`${result.inserted} бичлэг амжилттай импортлогдлоо`);
                onImportSuccess?.();
            } else if (result.skipped > 0) {
                toast.warning('Бичлэгүүд аль хэдийн бүртгэгдсэн байна');
            } else {
                toast.info('Импортлох өгөгдөл олдсонгүй');
            }
            setImportFile(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const exportMutation = useMutation({
        mutationFn: () =>
            markshaderReportService.exportToExcel({
                startDate: exportStartDate || undefined,
                endDate: exportEndDate || undefined,
                vehicleId: exportVehicleId || undefined,
            }),
        onSuccess: () => toast.success('Excel файл татагдлаа'),
        onError: (err: Error) => toast.error(err.message),
    });

    const inputClass =
        'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* IMPORT */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Excel Import
                </h3>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Он</label>
                            <input
                                type="number"
                                min={2020}
                                max={2100}
                                value={importYear}
                                onChange={(e) => setImportYear(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Сар</label>
                            <select
                                value={importMonth}
                                onChange={(e) => setImportMonth(e.target.value)}
                                className={inputClass}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1)}>
                                        {i + 1}-р сар
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Excel файл (.xlsx)</label>
                        <div
                            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => document.getElementById('import-file-input')?.click()}
                        >
                            {importFile ? (
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {importFile.name}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400">
                                    <svg className="w-6 h-6 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Excel файл сонгох
                                </div>
                            )}
                            <input
                                id="import-file-input"
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => importMutation.mutate()}
                        disabled={!importFile || importMutation.isPending}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {importMutation.isPending ? 'Импортлож байна...' : 'Импортлох'}
                    </button>
                </div>
            </div>

            {/* EXPORT */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Excel Export
                </h3>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Эхлэх огноо</label>
                            <select
                                value={exportStartDate}
                                onChange={(e) => setExportStartDate(e.target.value)}
                                className={inputClass}
                            >
                                {dateOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Дуусах огноо</label>
                            <select
                                value={exportEndDate}
                                onChange={(e) => setExportEndDate(e.target.value)}
                                className={inputClass}
                            >
                                {dateOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Excavator (заавал биш)</label>
                        <select
                            value={exportVehicleId}
                            onChange={(e) => setExportVehicleId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Бүх Excavator</option>
                            {excavators.map((ex) => (
                                <option key={ex.vehicleId} value={ex.vehicleId}>
                                    {ex.mineNumber ?? ex.vehicleName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {exportMutation.isPending ? 'Бэлтгэж байна...' : 'Excel татах'}
                    </button>
                </div>
            </div>
        </div>
    );
}