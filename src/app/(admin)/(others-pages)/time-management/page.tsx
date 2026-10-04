'use client';

import {
    useMemo,
    useState,
} from 'react';

import {
    useMutation,
    useQuery,
} from '@tanstack/react-query';

import {
    toast,
} from 'sonner';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Pagination from '@/components/tables/Pagination';
import {
    ConfirmDialog,
} from '@/components/ui/alert/Alert';

import {
    usePagination,
} from '@/hooks/pagination';

import {
    useAuth,
} from '@/components/AuthProvider';

import {
    hasRole,
} from '@/services/roles';

import type {
    UserRole,
} from '@/services/roles';

import equipmentShiftLogService, {
    ShiftLog,
} from '@/services/internal/equipment-shift-log';

import TimeManagementSidebar from './Sidebar';

// ============================================================
// HELPERS
// ============================================================

function getDateOptions(
    days = 30
): {
    label: string;
    value: string;
}[] {
    const options = [];

    for (
        let i = 0;
        i < days;
        i++
    ) {
        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        const value =
            date.toLocaleDateString(
                'en-CA'
            );

        options.push({
            label: value,
            value,
        });
    }

    return options;
}

const formatHours = (
    value:
        | string
        | number
        | null
        | undefined
) => {
    if (
        value == null ||
        value === ''
    ) {
        return (
            <span className="text-gray-300 dark:text-gray-600">
                —
            </span>
        );
    }

    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return (
            <span className="text-gray-300 dark:text-gray-600">
                —
            </span>
        );
    }

    return (
        <span>
            {number.toFixed(1)} ц
        </span>
    );
};

const getOperatorName = (
    log: ShiftLog
) => {
    const operator =
        log.operator;

    if (!operator) {
        return '—';
    }

    const fullName = [
        operator.lastName,
        operator.firstName,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return (
        fullName ||
        operator.name ||
        '—'
    );
};

const getVehicleName = (
    log: ShiftLog
) => {
    if (!log.vehicle) {
        return '—';
    }

    if (
        log.vehicle.mineNumber
    ) {
        return `${log.vehicle.name} (${log.vehicle.mineNumber})`;
    }

    return (
        log.vehicle.name ||
        '—'
    );
};

const actionRoles:
    readonly UserRole[] = [
        'admin',
        'dispatcher',
        'mechanic',
    ];

// ============================================================
// PAGE
// ============================================================

export default function TimeManagementPage() {
    const {
        user,
    } = useAuth();

    const {
        offset,
        limit,
        paginate,
    } = usePagination();

    // ========================================================
    // DATE
    // ========================================================

    const today =
        new Date()
            .toLocaleDateString(
                'en-CA'
            );

    const yesterday =
        useMemo(
            () => {
                const date =
                    new Date();

                date.setDate(
                    date.getDate() -
                    1
                );

                return date
                    .toLocaleDateString(
                        'en-CA'
                    );
            },
            []
        );

    const dateOptions =
        useMemo(
            () =>
                getDateOptions(
                    30
                ),
            []
        );

    // ========================================================
    // STATE
    // ========================================================

    const [
        isFormOpen,
        setIsFormOpen,
    ] = useState(false);

    const [
        editingLog,
        setEditingLog,
    ] = useState<
        ShiftLog | undefined
    >();

    const [
        deletingLog,
        setDeletingLog,
    ] = useState<
        ShiftLog | undefined
    >();

    const [
        startDate,
        setStartDate,
    ] = useState(
        yesterday
    );

    const [
        endDate,
        setEndDate,
    ] = useState(
        today
    );

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
            'equipment-shift-logs',
            {
                offset,
                limit,
                startDate,
                endDate,
            },
        ],

        queryFn: () =>
            equipmentShiftLogService
                .getLogs({
                    offset,
                    limit,
                    startDate,
                    endDate,
                }),
    });

    const logs =
        data?.data ?? [];

    const total =
        data?.totalCount ?? 0;

    // ========================================================
    // DELETE
    // ========================================================

    const deleteMutation =
        useMutation({
            mutationFn: (
                id: string
            ) =>
                equipmentShiftLogService
                    .deleteLog(
                        id
                    ),

            onSuccess:
                async () => {
                    toast.success(
                        'Бүртгэл амжилттай устгагдлаа'
                    );

                    setDeletingLog(
                        undefined
                    );

                    await refetch();
                },

            onError: () => {
                toast.error(
                    'Бүртгэл устгахад алдаа гарлаа'
                );
            },
        });

    // ========================================================
    // PAGINATION
    // ========================================================

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
    // PERMISSION
    // ========================================================

    const canAction =
        hasRole(
            user?.role,
            actionRoles
        );

    // ========================================================
    // SUMMARY
    // ========================================================

    const summary =
        useMemo(
            () => {
                return logs.reduce(
                    (
                        result,
                        log
                    ) => {
                        result.total +=
                            Number(
                                log.totalHours ??
                                0
                            );

                        result.worked +=
                            Number(
                                log.workedHours ??
                                0
                            );

                        result.idle +=
                            Number(
                                log.idleHours ??
                                0
                            );

                        return result;
                    },
                    {
                        total: 0,
                        worked: 0,
                        idle: 0,
                    }
                );
            },
            [logs]
        );

    // ========================================================
    // ACTIONS
    // ========================================================

    const handleNew =
        () => {
            setEditingLog(
                undefined
            );

            setIsFormOpen(
                true
            );
        };

    const handleEdit = (
        log: ShiftLog
    ) => {
        setEditingLog(
            log
        );

        setIsFormOpen(
            true
        );
    };

    const handleFormSuccess =
        async () => {
            setIsFormOpen(
                false
            );

            setEditingLog(
                undefined
            );

            await refetch();
        };

    const handleFormCancel =
        () => {
            setIsFormOpen(
                false
            );

            setEditingLog(
                undefined
            );
        };

    // ========================================================
    // STYLES
    // ========================================================

    const selectClass =
        'h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-500 dark:focus:ring-blue-950';

    const thClass =
        'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400';

    const tdClass =
        'px-4 py-3 text-xs text-gray-700 whitespace-nowrap border-b border-gray-100 dark:border-gray-800 dark:text-gray-300';

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="space-y-5">
            <PageBreadcrumb
                pageTitle="Цаг ашиглалт"
                description="Техникийн ажилласан болон сул зогсолтын цагийн бүртгэл"
                actions={
                    canAction
                        ? {
                            label:
                                'Бүртгэл нэмэх',

                            onClick:
                                handleNew,

                            variant:
                                'primary',

                            icon: (
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={
                                            2
                                        }
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            ),
                        }
                        : undefined
                }
            />

            {/* ================================================
                SUMMARY
            ================================================= */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Нийт цаг"
                    value={
                        summary.total
                    }
                    tone="default"
                />

                <SummaryCard
                    label="Ажилласан"
                    value={
                        summary.worked
                    }
                    tone="success"
                />

                <SummaryCard
                    label="Сул зогсолт"
                    value={
                        summary.idle
                    }
                    tone="warning"
                />
            </div>

            {/* ================================================
                DATE FILTER
            ================================================= */}

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <span className="mr-1 text-xs font-medium text-gray-500">
                    Огноо:
                </span>

                <select
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
                    className={
                        selectClass
                    }
                >
                    {dateOptions.map(
                        (
                            option
                        ) => (
                            <option
                                key={
                                    option.value
                                }
                                value={
                                    option.value
                                }
                            >
                                {
                                    option.label
                                }
                            </option>
                        )
                    )}
                </select>

                <span className="text-xs text-gray-400">
                    —
                </span>

                <select
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
                    className={
                        selectClass
                    }
                >
                    {dateOptions.map(
                        (
                            option
                        ) => (
                            <option
                                key={
                                    option.value
                                }
                                value={
                                    option.value
                                }
                            >
                                {
                                    option.label
                                }
                            </option>
                        )
                    )}
                </select>
            </div>

            {/* ================================================
                TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th
                                    className={
                                        thClass
                                    }
                                >
                                    Огноо
                                </th>

                                <th
                                    className={
                                        thClass
                                    }
                                >
                                    Ээлж
                                </th>

                                <th
                                    className={
                                        thClass
                                    }
                                >
                                    Техник
                                </th>

                                <th
                                    className={
                                        thClass
                                    }
                                >
                                    Оператор
                                </th>

                                <th
                                    className={`${thClass} text-right`}
                                >
                                    Нийт
                                </th>

                                <th
                                    className={`${thClass} text-right`}
                                >
                                    Ажилласан
                                </th>

                                <th
                                    className={`${thClass} text-right`}
                                >
                                    Сул
                                </th>

                                <th
                                    className={`${thClass} text-right`}
                                >
                                    Түлш
                                </th>

                                <th
                                    className={
                                        thClass
                                    }
                                >
                                    Тэмдэглэл
                                </th>

                                {canAction && (
                                    <th
                                        className={
                                            thClass
                                        }
                                    />
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ||
                                isFetching ? (
                                <tr>
                                    <td
                                        colSpan={
                                            canAction
                                                ? 10
                                                : 9
                                        }
                                        className="px-6 py-12 text-center text-sm text-gray-400"
                                    >
                                        Ачааллаж байна...
                                    </td>
                                </tr>
                            ) : logs.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            canAction
                                                ? 10
                                                : 9
                                        }
                                        className="px-6 py-12 text-center text-sm text-gray-400"
                                    >
                                        Бүртгэл олдсонгүй.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(
                                    (
                                        log
                                    ) => (
                                        <tr
                                            key={
                                                log.id
                                            }
                                            className="group hover:bg-gray-50 dark:hover:bg-gray-800/30"
                                        >
                                            <td
                                                className={
                                                    tdClass
                                                }
                                            >
                                                {
                                                    log.operationalDate
                                                }
                                            </td>

                                            <td
                                                className={
                                                    tdClass
                                                }
                                            >
                                                {log.shiftType ===
                                                    'day'
                                                    ? 'Өдөр'
                                                    : 'Шөнө'}
                                            </td>

                                            <td
                                                className={
                                                    tdClass
                                                }
                                            >
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {getVehicleName(
                                                        log
                                                    )}
                                                </span>
                                            </td>

                                            <td
                                                className={
                                                    tdClass
                                                }
                                            >
                                                {getOperatorName(
                                                    log
                                                )}
                                            </td>

                                            <td
                                                className={`${tdClass} text-right`}
                                            >
                                                {formatHours(
                                                    log.totalHours
                                                )}
                                            </td>

                                            <td
                                                className={`${tdClass} text-right`}
                                            >
                                                {formatHours(
                                                    log.workedHours
                                                )}
                                            </td>

                                            <td
                                                className={`${tdClass} text-right`}
                                            >
                                                {formatHours(
                                                    log.idleHours
                                                )}
                                            </td>

                                            <td
                                                className={`${tdClass} text-right`}
                                            >
                                                {log.fuelReceived
                                                    ? `${Number(
                                                        log.fuelReceived
                                                    ).toLocaleString()} л`
                                                    : '—'}
                                            </td>

                                            <td
                                                className={`${tdClass} max-w-[240px]`}
                                            >
                                                <span className="block truncate">
                                                    {log.notes ||
                                                        '—'}
                                                </span>
                                            </td>

                                            {canAction && (
                                                <td
                                                    className={`${tdClass} text-right`}
                                                >
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    log
                                                                )
                                                            }
                                                            className="rounded-lg px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                        >
                                                            Засах
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeletingLog(
                                                                    log
                                                                )
                                                            }
                                                            className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        >
                                                            Устгах
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================================================
                PAGINATION
            ================================================= */}

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

            {/* ================================================
                FORM
            ================================================= */}

            <TimeManagementSidebar
                isOpen={
                    isFormOpen
                }
                editingLog={
                    editingLog
                }
                onClose={
                    handleFormCancel
                }
                onSuccess={
                    handleFormSuccess
                }
            />

            {/* ================================================
                DELETE
            ================================================= */}

            <ConfirmDialog
                open={
                    Boolean(
                        deletingLog
                    )
                }
                onOpenChange={(
                    open
                ) => {
                    if (!open) {
                        setDeletingLog(
                            undefined
                        );
                    }
                }}
                title="Цаг ашиглалтын бүртгэл устгах уу?"
                description={`${deletingLog?.operationalDate ?? ''} өдрийн ${deletingLog?.shiftType ===
                        'day'
                        ? 'өдрийн'
                        : 'шөнийн'
                    } ээлжийн ${deletingLog
                        ? getVehicleName(
                            deletingLog
                        )
                        : ''
                    } бүртгэлийг устгах үйлдлийг буцаах боломжгүй.`}
                variant="destructive"
                onConfirm={() => {
                    if (
                        !deletingLog
                    ) {
                        return;
                    }

                    deleteMutation
                        .mutate(
                            deletingLog.id
                        );
                }}
            />
        </div>
    );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;

    tone:
    | 'default'
    | 'success'
    | 'warning';
}) {
    const toneClass = {
        default:
            'text-gray-900 dark:text-white',

        success:
            'text-emerald-600 dark:text-emerald-400',

        warning:
            'text-amber-600 dark:text-amber-400',
    }[tone];

    return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p
                className={`mt-1 text-xl font-semibold ${toneClass}`}
            >
                {value.toFixed(
                    1
                )}

                <span className="ml-1 text-xs font-normal text-gray-400">
                    цаг
                </span>
            </p>
        </div>
    );
}