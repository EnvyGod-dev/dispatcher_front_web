'use client';

import {
    useMemo,
    useState,
} from 'react';

import {
    useQuery,
} from '@tanstack/react-query';

import {
    Pencil,
    Plus,
    Search,
    Wrench,
} from 'lucide-react';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Pagination from '@/components/tables/Pagination';
import Button from '@/components/ui/button/Button';

import {
    usePagination,
} from '@/hooks/pagination';

import equipmentShiftLogService, {
    ShiftLog,
} from '@/services/internal/equipment-shift-log';

import RepairSidebar from './RepairSidebar';

// ============================================================
// HELPERS
// ============================================================

function toNumber(
    value:
        | string
        | number
        | null
        | undefined
) {
    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : 0;
}

function formatHours(
    value:
        | string
        | number
        | null
        | undefined
) {
    return toNumber(
        value
    ).toFixed(1);
}

function formatDate(
    value:
        | string
        | null
        | undefined
) {
    if (!value) {
        return '-';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'mn-MN',
        {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }
    ).format(date);
}

function getVehicleLabel(
    log: ShiftLog
) {
    if (!log.vehicle) {
        return '-';
    }

    if (
        log.vehicle.mineNumber
    ) {
        return `${log.vehicle.name} (${log.vehicle.mineNumber})`;
    }

    return (
        log.vehicle.name ||
        '-'
    );
}

function getShiftLabel(
    shiftType:
        | string
        | null
        | undefined
) {
    if (
        shiftType === 'day' ||
        shiftType === 'DAY'
    ) {
        return 'Өдөр';
    }

    if (
        shiftType === 'night' ||
        shiftType === 'NIGHT'
    ) {
        return 'Шөнө';
    }

    return (
        shiftType ||
        '-'
    );
}

// ============================================================
// PAGE
// ============================================================

export default function RepairPage() {
    const {
        offset,
        limit,
        paginate,
    } = usePagination();

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        startDate,
        setStartDate,
    ] = useState('');

    const [
        endDate,
        setEndDate,
    ] = useState('');

    const [
        sidebarOpen,
        setSidebarOpen,
    ] = useState(false);

    const [
        editingLog,
        setEditingLog,
    ] =
        useState<
            ShiftLog | undefined
        >(undefined);

    // ========================================================
    // QUERY
    // ========================================================

    const {
        data,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: [
            'repair-shift-logs',
            offset,
            limit,
            startDate,
            endDate,
        ],

        queryFn: () =>
            equipmentShiftLogService
                .getLogs({
                    offset,
                    limit,

                    startDate:
                        startDate ||
                        undefined,

                    endDate:
                        endDate ||
                        undefined,
                }),
    });

    const logs =
        data?.data ?? [];

    const repairLogs =
        useMemo(
            () =>
                logs.filter(
                    (log) =>
                        toNumber(
                            log.repairHours
                        ) > 0
                ),
            [logs]
        );

    const filteredLogs =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return repairLogs;
            }

            return repairLogs.filter(
                (log) => {
                    const vehicle =
                        getVehicleLabel(
                            log
                        )
                            .toLowerCase();

                    const notes =
                        (
                            log.notes ??
                            ''
                        ).toLowerCase();

                    return (
                        vehicle.includes(
                            keyword
                        ) ||
                        notes.includes(
                            keyword
                        )
                    );
                }
            );
        }, [
            repairLogs,
            search,
        ]);

    // ========================================================
    // SUMMARY
    // ========================================================

    const totalRepairHours =
        useMemo(
            () =>
                repairLogs.reduce(
                    (
                        total,
                        log
                    ) =>
                        total +
                        toNumber(
                            log.repairHours
                        ),
                    0
                ),
            [repairLogs]
        );

    const vehicleCount =
        useMemo(() => {
            const ids =
                new Set<string>();

            for (
                const log of
                repairLogs
            ) {
                if (
                    log.vehicleId
                ) {
                    ids.add(
                        log.vehicleId
                    );
                }
            }

            return ids.size;
        }, [repairLogs]);

    // ========================================================
    // PAGINATION
    // ========================================================

    const total =
        data?.totalCount ?? 0;

    const currentPage =
        Math.floor(
            offset / limit
        ) + 1;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total / limit
            )
        );

    // ========================================================
    // ACTIONS
    // ========================================================

    const handleAdd = () => {
        setEditingLog(
            undefined
        );

        setSidebarOpen(
            true
        );
    };

    const handleEdit = (
        log: ShiftLog
    ) => {
        setEditingLog(
            log
        );

        setSidebarOpen(
            true
        );
    };

    const handleClose =
        () => {
            setSidebarOpen(
                false
            );

            setEditingLog(
                undefined
            );
        };

    const handleSuccess =
        async () => {
            handleClose();

            await refetch();
        };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <>
            <PageBreadcrumb
                pageTitle="Засварын хэлтэс"
            />

            <div className="space-y-5">

                {/* HEADER */}

                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                <Wrench
                                    size={20}
                                />
                            </div>

                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Засварын бүртгэл
                                </h1>

                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Техникийн эвдрэл, засварын мэдээлэл
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={
                            handleAdd
                        }
                    >
                        <span className="flex items-center gap-2">
                            <Plus
                                size={16}
                            />

                            Засвар нэмэх
                        </span>
                    </Button>
                </div>

                {/* SUMMARY */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryCard
                        label="Засварын бүртгэл"
                        value={`${repairLogs.length}`}
                    />

                    <SummaryCard
                        label="Нийт засварын цаг"
                        value={`${totalRepairHours.toFixed(
                            1
                        )} цаг`}
                    />

                    <SummaryCard
                        label="Засварт орсон техник"
                        value={`${vehicleCount}`}
                    />
                </div>

                {/* FILTER */}

                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Техник хайх..."
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                            />
                        </div>

                        <input
                            type="date"
                            value={
                                startDate
                            }
                            onChange={(
                                event
                            ) => {
                                setStartDate(
                                    event
                                        .target
                                        .value
                                );

                                paginate(
                                    1,
                                    limit
                                );
                            }}
                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        />

                        <input
                            type="date"
                            value={
                                endDate
                            }
                            onChange={(
                                event
                            ) => {
                                setEndDate(
                                    event
                                        .target
                                        .value
                                );

                                paginate(
                                    1,
                                    limit
                                );
                            }}
                            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        />

                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');

                                setStartDate('');

                                setEndDate('');

                                paginate(
                                    1,
                                    limit
                                );
                            }}
                            className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Цэвэрлэх
                        </button>
                    </div>
                </div>

                {/* TABLE */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-950/40">
                                <tr>
                                    <TableHead>
                                        Огноо
                                    </TableHead>

                                    <TableHead>
                                        Ээлж
                                    </TableHead>

                                    <TableHead>
                                        Техник
                                    </TableHead>

                                    <TableHead>
                                        Засварын цаг
                                    </TableHead>

                                    <TableHead>
                                        Тэмдэглэл
                                    </TableHead>

                                    <TableHead align="right">
                                        Үйлдэл
                                    </TableHead>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {isLoading ||
                                    isFetching ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-sm text-gray-400"
                                        >
                                            Ачааллаж байна...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center"
                                        >
                                            <Wrench
                                                size={28}
                                                className="mx-auto mb-2 text-gray-300"
                                            />

                                            <p className="text-sm text-gray-400">
                                                Засварын бүртгэл алга байна.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(
                                        (
                                            log
                                        ) => (
                                            <tr
                                                key={
                                                    log.id
                                                }
                                                className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                            >
                                                <TableCell>
                                                    {formatDate(
                                                        log.operationalDate
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {getShiftLabel(
                                                        log.shiftType
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {getVehicleLabel(
                                                            log
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                        {formatHours(
                                                            log.repairHours
                                                        )}{' '}
                                                        цаг
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <span className="line-clamp-2 max-w-[300px] text-gray-500 dark:text-gray-400">
                                                        {log.notes ||
                                                            '-'}
                                                    </span>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                log
                                                            )
                                                        }
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:hover:bg-blue-500/10"
                                                    >
                                                        <Pencil
                                                            size={15}
                                                        />
                                                    </button>
                                                </TableCell>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                        <Pagination
                            currentPage={
                                currentPage
                            }
                            totalPages={
                                totalPages
                            }
                            total={
                                total
                            }
                            limit={
                                limit
                            }
                            onPageChange={(
                                page
                            ) =>
                                paginate(
                                    page,
                                    limit
                                )
                            }
                            isLoading={
                                isLoading ||
                                isFetching
                            }
                        />
                    </div>
                </div>
            </div>

            {/* SIDEBAR */}

            <RepairSidebar
                isOpen={
                    sidebarOpen
                }
                editingLog={
                    editingLog
                }
                onClose={
                    handleClose
                }
                onSuccess={
                    handleSuccess
                }
            />
        </>
    );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

function TableHead({
    children,
    align = 'left',
}: {
    children:
    React.ReactNode;

    align?:
    | 'left'
    | 'right';
}) {
    return (
        <th
            className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 ${align === 'right'
                ? 'text-right'
                : 'text-left'
                }`}
        >
            {children}
        </th>
    );
}

function TableCell({
    children,
    align = 'left',
}: {
    children:
    React.ReactNode;

    align?:
    | 'left'
    | 'right';
}) {
    return (
        <td
            className={`whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300 ${align === 'right'
                ? 'text-right'
                : 'text-left'
                }`}
        >
            {children}
        </td>
    );
}
