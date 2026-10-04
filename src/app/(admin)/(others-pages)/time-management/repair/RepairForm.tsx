'use client';

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import {
    Plus,
    Trash2,
    Wrench,
} from 'lucide-react';

import equipmentShiftLogService, {
    EquipmentUserOption,
    RepairEntryPayload,
    RepairReasonType,
    ShiftLog,
    ShiftType,
    VehicleOption,
} from '@/services/internal/equipment-shift-log';

// ============================================================
// TYPES
// ============================================================

interface Props {
    editingLog?: ShiftLog;
    onCancel: () => void;
    onSuccess: () => void;
}

type RepairRow = {
    key: string;
    repairReasonId: string;
    mechanicId: string;
    hours: string;
    notes: string;
};

// ============================================================
// HELPERS
// ============================================================

function createKey(): string {
    return `${Date.now()}-${Math.random()}`;
}

function emptyRepairRow(): RepairRow {
    return {
        key: createKey(),
        repairReasonId: '',
        mechanicId: '',
        hours: '',
        notes: '',
    };
}

function numberOrZero(
    value:
        | string
        | number
        | null
        | undefined
): number {
    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : 0;
}

function getToday(): string {
    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, '0');

    const day =
        String(
            now.getDate()
        ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function userLabel(
    user: EquipmentUserOption
): string {
    const fullName = [
        user.lastName,
        user.firstName,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    const name =
        fullName ||
        user.name ||
        user.id;

    if (user.position) {
        return `${name} - ${user.position}`;
    }

    return name;
}

function vehicleLabel(
    vehicle: VehicleOption
): string {
    if (vehicle.mineNumber) {
        return `${vehicle.name} (${vehicle.mineNumber})`;
    }

    return vehicle.name;
}

function showMessage(
    message: string
) {
    window.alert(message);
}

// ============================================================
// COMPONENT
// ============================================================

export default function RepairForm({
    editingLog,
    onCancel,
    onSuccess,
}: Props) {
    const queryClient =
        useQueryClient();

    const isEditMode =
        Boolean(editingLog?.id);

    // ========================================================
    // STATE
    // ========================================================

    const [
        operationalDate,
        setOperationalDate,
    ] = useState<string>(
        getToday()
    );

    const [
        shiftType,
        setShiftType,
    ] = useState<ShiftType>(
        'day'
    );

    const [
        vehicleId,
        setVehicleId,
    ] = useState<string>('');

    const [
        rows,
        setRows,
    ] = useState<RepairRow[]>([
        emptyRepairRow(),
    ]);

    // ========================================================
    // CREATE REASON STATE
    // ========================================================

    const [
        reasonModalOpen,
        setReasonModalOpen,
    ] = useState(false);

    const [
        newReasonName,
        setNewReasonName,
    ] = useState('');

    const [
        reasonTargetRowKey,
        setReasonTargetRowKey,
    ] = useState<string | null>(
        null
    );

    // ========================================================
    // VEHICLES
    // ========================================================

    const {
        data: vehicles = [],
        isLoading:
        isLoadingVehicles,
    } = useQuery<
        VehicleOption[]
    >({
        queryKey: [
            'repair-vehicles',
            operationalDate,
        ],

        queryFn: () =>
            equipmentShiftLogService
                .getVehiclesByDate(
                    operationalDate
                ),

        enabled:
            Boolean(
                operationalDate
            ),
    });

    // ========================================================
    // MECHANICS
    // ========================================================

    const {
        data: mechanics = [],
        isLoading:
        isLoadingMechanics,
    } = useQuery<
        EquipmentUserOption[]
    >({
        queryKey: [
            'repair-mechanics',
        ],

        queryFn: () =>
            equipmentShiftLogService
                .getMechanics(),
    });

    // ========================================================
    // SELECTED VEHICLE
    // ========================================================

    const selectedVehicle =
        useMemo(
            () =>
                vehicles.find(
                    (vehicle) =>
                        vehicle.id ===
                        vehicleId
                ) ?? null,
            [
                vehicles,
                vehicleId,
            ]
        );

    // ========================================================
    // REPAIR REASONS
    // ========================================================

    const {
        data: repairReasons = [],
        isLoading:
        isLoadingReasons,
    } = useQuery<
        RepairReasonType[]
    >({
        queryKey: [
            'repair-reasons',
            selectedVehicle?.type,
        ],

        queryFn: () =>
            equipmentShiftLogService
                .getRepairReasonTypes(
                    selectedVehicle
                        ?.type ??
                    undefined
                ),

        enabled:
            Boolean(vehicleId),
    });

    // ========================================================
    // EDIT DETAIL
    // ========================================================

    const {
        data: detail,
        isLoading:
        isLoadingDetail,
    } = useQuery({
        queryKey: [
            'repair-detail',
            editingLog?.id,
        ],

        queryFn: () =>
            equipmentShiftLogService
                .getLogById(
                    editingLog!.id
                ),

        enabled:
            Boolean(
                editingLog?.id
            ),
    });

    // ========================================================
    // INITIAL EDITING LOG
    // ========================================================

    useEffect(() => {
        if (!editingLog) {
            return;
        }

        if (
            editingLog.operationalDate
        ) {
            setOperationalDate(
                editingLog.operationalDate
                    .slice(0, 10)
            );
        }

        setShiftType(
            editingLog.shiftType
        );

        setVehicleId(
            editingLog.vehicleId
        );
    }, [editingLog]);

    // ========================================================
    // DETAIL HYDRATE
    // ========================================================

    useEffect(() => {
        if (!detail) {
            return;
        }

        if (
            detail.operationalDate
        ) {
            setOperationalDate(
                detail.operationalDate
                    .slice(0, 10)
            );
        }

        setShiftType(
            detail.shiftType
        );

        setVehicleId(
            detail.vehicleId
        );

        const entries =
            detail.repairEntries ??
            [];

        if (
            entries.length === 0
        ) {
            setRows([
                emptyRepairRow(),
            ]);

            return;
        }

        setRows(
            entries.map(
                (entry) => ({
                    key:
                        entry.id ||
                        createKey(),

                    repairReasonId:
                        entry.repairReasonId ??
                        '',

                    mechanicId:
                        entry.mechanicId ??
                        entry.mechanic
                            ?.id ??
                        '',

                    hours:
                        entry.hours ??
                        '',

                    notes:
                        entry.notes ??
                        '',
                })
            )
        );
    }, [detail]);

    // ========================================================
    // TOTAL REPAIR HOURS
    // ========================================================

    const totalRepairHours =
        useMemo(
            () =>
                rows.reduce(
                    (
                        total,
                        row
                    ) =>
                        total +
                        numberOrZero(
                            row.hours
                        ),
                    0
                ),
            [rows]
        );

    // ========================================================
    // ROW METHODS
    // ========================================================

    const addRow = () => {
        setRows(
            (previous) => [
                ...previous,
                emptyRepairRow(),
            ]
        );
    };

    const removeRow = (
        key: string
    ) => {
        setRows(
            (previous) => {
                const next =
                    previous.filter(
                        (row) =>
                            row.key !==
                            key
                    );

                if (
                    next.length === 0
                ) {
                    return [
                        emptyRepairRow(),
                    ];
                }

                return next;
            }
        );
    };

    const updateRow = (
        key: string,
        field:
            | 'repairReasonId'
            | 'mechanicId'
            | 'hours'
            | 'notes',
        value: string
    ) => {
        setRows(
            (previous) =>
                previous.map(
                    (row) =>
                        row.key === key
                            ? {
                                ...row,
                                [field]:
                                    value,
                            }
                            : row
                )
        );
    };

    // ========================================================
    // REPAIR PAYLOAD
    // ========================================================

    const buildRepairEntries =
        (): RepairEntryPayload[] =>
            rows
                .map(
                    (
                        row
                    ): RepairEntryPayload => ({
                        repairReasonId:
                            row.repairReasonId ||
                            null,

                        mechanicId:
                            row.mechanicId ||
                            null,

                        hours:
                            numberOrZero(
                                row.hours
                            ),

                        notes:
                            row.notes
                                .trim() ||
                            null,
                    })
                )
                .filter(
                    (entry) =>
                        entry.hours > 0
                );

    // ========================================================
    // VALIDATE
    // ========================================================

    const validate =
        (): boolean => {
            if (
                !operationalDate
            ) {
                showMessage(
                    'Огноо сонгоно уу'
                );

                return false;
            }

            if (!vehicleId) {
                showMessage(
                    'Техник сонгоно уу'
                );

                return false;
            }

            const activeRows =
                rows.filter(
                    (row) =>
                        numberOrZero(
                            row.hours
                        ) > 0
                );

            if (
                activeRows.length ===
                0
            ) {
                showMessage(
                    'Засварын цаг оруулна уу'
                );

                return false;
            }

            const missingReason =
                activeRows.find(
                    (row) =>
                        !row.repairReasonId
                );

            if (
                missingReason
            ) {
                showMessage(
                    'Эвдрэлийн шалтгаан сонгоно уу'
                );

                return false;
            }

            const missingMechanic =
                activeRows.find(
                    (row) =>
                        !row.mechanicId
                );

            if (
                missingMechanic
            ) {
                showMessage(
                    'Засвар хийсэн хүн сонгоно уу'
                );

                return false;
            }

            const invalidHours =
                activeRows.find(
                    (row) => {
                        const hours =
                            numberOrZero(
                                row.hours
                            );

                        const rounded =
                            Math.round(
                                hours * 10
                            ) / 10;

                        return (
                            hours <= 0 ||
                            Math.abs(
                                hours -
                                rounded
                            ) > 0.000001
                        );
                    }
                );

            if (
                invalidHours
            ) {
                showMessage(
                    'Засварын цаг 0.1-ийн алхамтай байна'
                );

                return false;
            }

            return true;
        };

    // ========================================================
    // CREATE REPAIR REASON
    // ========================================================

    const createReasonMutation =
        useMutation({
            mutationFn: async () => {
                const name =
                    newReasonName.trim();

                if (!name) {
                    throw new Error(
                        'Шалтгааны нэр оруулна уу'
                    );
                }

                return equipmentShiftLogService
                    .createRepairReasonType({
                        name,

                        vehicleTypes:
                            selectedVehicle?.type
                                ? [
                                    selectedVehicle.type,
                                ]
                                : [],
                    });
            },

            onSuccess: async (
                createdReason
            ) => {
                await queryClient
                    .invalidateQueries({
                        queryKey: [
                            'repair-reasons',
                        ],
                    });

                if (
                    reasonTargetRowKey
                ) {
                    updateRow(
                        reasonTargetRowKey,
                        'repairReasonId',
                        createdReason.id
                    );
                }

                setNewReasonName('');
                setReasonTargetRowKey(
                    null
                );
                setReasonModalOpen(
                    false
                );
            },

            onError: (error) => {
                console.error(
                    'Create repair reason error:',
                    error
                );

                showMessage(
                    'Эвдрэлийн шалтгаан нэмэхэд алдаа гарлаа'
                );
            },
        });

    // ========================================================
    // SAVE
    // ========================================================

    const saveMutation =
        useMutation({
            mutationFn:
                async () => {
                    const repairEntries =
                        buildRepairEntries();

                    // EDIT
                    if (
                        isEditMode &&
                        editingLog
                    ) {
                        return equipmentShiftLogService
                            .updateLog(
                                editingLog.id,
                                {
                                    repairHours:
                                        totalRepairHours,

                                    repairEntries,
                                }
                            );
                    }

                    // CREATE / APPEND
                    return equipmentShiftLogService
                        .createOrAppendRepair({
                            vehicleId,

                            operatorId:
                                null,

                            shiftId:
                                null,

                            operationalDate,

                            shiftType,

                            repairEntries,
                        });
                },

            onSuccess:
                async () => {
                    await Promise.all([
                        queryClient
                            .invalidateQueries({
                                queryKey: [
                                    'repair-shift-logs',
                                ],
                            }),

                        queryClient
                            .invalidateQueries({
                                queryKey: [
                                    'equipment-shift-logs',
                                ],
                            }),
                    ]);

                    showMessage(
                        isEditMode
                            ? 'Засварын бүртгэл амжилттай засагдлаа'
                            : 'Засварын бүртгэл амжилттай нэмэгдлээ'
                    );

                    onSuccess();
                },

            onError: (
                error
            ) => {
                console.error(
                    'Repair save error:',
                    error
                );

                showMessage(
                    'Засварын бүртгэл хадгалахад алдаа гарлаа'
                );
            },
        });

    // ========================================================
    // SUBMIT
    // ========================================================

    const handleSubmit = (
        event:
            FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        saveMutation.mutate();
    };

    // ========================================================
    // DATE CHANGE
    // ========================================================

    const handleDateChange = (
        value: string
    ) => {
        setOperationalDate(
            value
        );

        setVehicleId('');

        setRows([
            emptyRepairRow(),
        ]);
    };

    // ========================================================
    // VEHICLE CHANGE
    // ========================================================

    const handleVehicleChange = (
        value: string
    ) => {
        setVehicleId(
            value
        );

        setRows([
            emptyRepairRow(),
        ]);
    };

    // ========================================================
    // REASON MODAL
    // ========================================================

    const openReasonModal = (
        rowKey: string
    ) => {
        if (!vehicleId) {
            showMessage(
                'Эхлээд техник сонгоно уу'
            );

            return;
        }

        setReasonTargetRowKey(
            rowKey
        );

        setNewReasonName('');

        setReasonModalOpen(
            true
        );
    };

    const closeReasonModal =
        () => {
            if (
                createReasonMutation
                    .isPending
            ) {
                return;
            }

            setReasonModalOpen(
                false
            );

            setNewReasonName('');

            setReasonTargetRowKey(
                null
            );
        };

    // ========================================================
    // LOADING
    // ========================================================

    const loading =
        isLoadingVehicles ||
        isLoadingMechanics ||
        isLoadingDetail;

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <>
            <form
                onSubmit={
                    handleSubmit
                }
                className="space-y-6"
            >
                {/* ============================================
                    BASIC INFORMATION
                ============================================= */}

                <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
                            <Wrench
                                size={18}
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Засварын мэдээлэл
                            </h3>

                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                Огноо, ээлж болон техникийг сонгоно.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Field
                            label="Огноо"
                            required
                        >
                            <input
                                type="date"
                                value={
                                    operationalDate
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleDateChange(
                                        event
                                            .currentTarget
                                            .value
                                    )
                                }
                                disabled={
                                    saveMutation
                                        .isPending
                                }
                                className={`${inputClass} cursor-pointer`}
                            />
                        </Field>

                        <Field
                            label="Ээлж"
                            required
                        >
                            <select
                                value={
                                    shiftType
                                }
                                onChange={(
                                    event
                                ) =>
                                    setShiftType(
                                        event
                                            .target
                                            .value as ShiftType
                                    )
                                }
                                disabled={
                                    saveMutation
                                        .isPending
                                }
                                className={
                                    inputClass
                                }
                            >
                                <option value="day">
                                    Өдөр
                                </option>

                                <option value="night">
                                    Шөнө
                                </option>
                            </select>
                        </Field>

                        <Field
                            label="Техник"
                            required
                        >
                            <select
                                value={
                                    vehicleId
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleVehicleChange(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                disabled={
                                    isLoadingVehicles ||
                                    saveMutation
                                        .isPending
                                }
                                className={
                                    inputClass
                                }
                            >
                                <option value="">
                                    {isLoadingVehicles
                                        ? 'Техник ачааллаж байна...'
                                        : 'Техник сонгох'}
                                </option>

                                {vehicles.map(
                                    (
                                        vehicle
                                    ) => (
                                        <option
                                            key={
                                                vehicle.id
                                            }
                                            value={
                                                vehicle.id
                                            }
                                        >
                                            {vehicleLabel(
                                                vehicle
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </Field>
                    </div>
                </section>

                {/* ============================================
                    REPAIR ENTRIES
                ============================================= */}

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Эвдрэл, гэмтлийн бүртгэл
                            </h3>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Эвдрэлийн шалтгаан, засвар хийсэн хүн, цаг болон тэмдэглэлийг оруулна.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                addRow
                            }
                            disabled={
                                !vehicleId ||
                                saveMutation
                                    .isPending
                            }
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            <Plus
                                size={15}
                            />

                            Эвдрэл нэмэх
                        </button>
                    </div>

                    <div className="hidden grid-cols-[minmax(220px,1.2fr)_minmax(180px,1fr)_110px_minmax(180px,1fr)_40px] gap-3 border-b border-gray-200 bg-gray-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950/30 lg:grid">
                        <span>
                            Эвдрэлийн шалтгаан
                        </span>

                        <span>
                            Засвар хийсэн хүн
                        </span>

                        <span>
                            Цаг
                        </span>

                        <span>
                            Тэмдэглэл
                        </span>

                        <span />
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-400">
                                Ачааллаж байна...
                            </div>
                        ) : (
                            rows.map(
                                (
                                    row,
                                    index
                                ) => (
                                    <div
                                        key={
                                            row.key
                                        }
                                        className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(220px,1.2fr)_minmax(180px,1fr)_110px_minmax(180px,1fr)_40px] lg:items-start"
                                    >
                                        {/* REASON */}

                                        <Field
                                            label="Эвдрэлийн шалтгаан"
                                            mobileOnly
                                        >
                                            <div className="flex gap-2">
                                                <select
                                                    value={
                                                        row.repairReasonId
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateRow(
                                                            row.key,
                                                            'repairReasonId',
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    disabled={
                                                        !vehicleId ||
                                                        isLoadingReasons ||
                                                        saveMutation
                                                            .isPending
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                >
                                                    <option value="">
                                                        {!vehicleId
                                                            ? 'Эхлээд техник сонгоно уу'
                                                            : isLoadingReasons
                                                                ? 'Шалтгаан ачааллаж байна...'
                                                                : 'Шалтгаан сонгох'}
                                                    </option>

                                                    {repairReasons.map(
                                                        (
                                                            reason
                                                        ) => (
                                                            <option
                                                                key={
                                                                    reason.id
                                                                }
                                                                value={
                                                                    reason.id
                                                                }
                                                            >
                                                                {reason.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openReasonModal(
                                                            row.key
                                                        )
                                                    }
                                                    disabled={
                                                        !vehicleId ||
                                                        saveMutation
                                                            .isPending
                                                    }
                                                    title="Шинэ шалтгаан нэмэх"
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:hover:border-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                                >
                                                    <Plus
                                                        size={17}
                                                    />
                                                </button>
                                            </div>
                                        </Field>

                                        {/* MECHANIC */}

                                        <Field
                                            label="Засвар хийсэн хүн"
                                            mobileOnly
                                        >
                                            <select
                                                value={
                                                    row.mechanicId
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateRow(
                                                        row.key,
                                                        'mechanicId',
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    isLoadingMechanics ||
                                                    saveMutation
                                                        .isPending
                                                }
                                                className={
                                                    inputClass
                                                }
                                            >
                                                <option value="">
                                                    {isLoadingMechanics
                                                        ? 'Засварчин ачааллаж байна...'
                                                        : 'Засварчин сонгох'}
                                                </option>

                                                {mechanics.map(
                                                    (
                                                        mechanic
                                                    ) => (
                                                        <option
                                                            key={
                                                                mechanic.id
                                                            }
                                                            value={
                                                                mechanic.id
                                                            }
                                                        >
                                                            {userLabel(
                                                                mechanic
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Field>

                                        {/* HOURS */}

                                        <Field
                                            label="Цаг"
                                            mobileOnly
                                        >
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={
                                                    row.hours
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateRow(
                                                        row.key,
                                                        'hours',
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    saveMutation
                                                        .isPending
                                                }
                                                placeholder="0.0"
                                                className={
                                                    inputClass
                                                }
                                            />
                                        </Field>

                                        {/* NOTES */}

                                        <Field
                                            label="Тэмдэглэл"
                                            mobileOnly
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    row.notes
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateRow(
                                                        row.key,
                                                        'notes',
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                disabled={
                                                    saveMutation
                                                        .isPending
                                                }
                                                placeholder="Тэмдэглэл"
                                                className={
                                                    inputClass
                                                }
                                            />
                                        </Field>

                                        {/* DELETE */}

                                        <div className="flex h-10 items-center justify-end lg:justify-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeRow(
                                                        row.key
                                                    )
                                                }
                                                disabled={
                                                    saveMutation
                                                        .isPending
                                                }
                                                title={`${index + 1}-р мөр устгах`}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2
                                                    size={16}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>

                    {/* TOTAL */}

                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/30">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Нийт засварын цаг
                        </span>

                        <span className="text-xl font-semibold text-red-500">
                            {totalRepairHours.toFixed(
                                1
                            )}{' '}
                            цаг
                        </span>
                    </div>
                </section>

                {/* ACTIONS */}

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={
                            onCancel
                        }
                        disabled={
                            saveMutation
                                .isPending
                        }
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                        Болих
                    </button>

                    <button
                        type="submit"
                        disabled={
                            saveMutation
                                .isPending ||
                            loading
                        }
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saveMutation
                            .isPending
                            ? 'Хадгалж байна...'
                            : isEditMode
                                ? 'Өөрчлөлт хадгалах'
                                : 'Засвар бүртгэх'}
                    </button>
                </div>
            </form>

            {/* ================================================
                CREATE REPAIR REASON MODAL
            ================================================= */}

            {reasonModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeReasonModal();
                        }
                    }}
                >
                    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                <Wrench
                                    size={18}
                                />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Шинэ эвдрэлийн шалтгаан
                                </h3>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {selectedVehicle
                                        ? `${vehicleLabel(
                                            selectedVehicle
                                        )} техникт ашиглах шалтгаан`
                                        : 'Эвдрэлийн шалтгаан нэмэх'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
                                Шалтгааны нэр

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                autoFocus
                                value={
                                    newReasonName
                                }
                                onChange={(
                                    event
                                ) =>
                                    setNewReasonName(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        'Enter'
                                    ) {
                                        event.preventDefault();

                                        if (
                                            newReasonName
                                                .trim() &&
                                            !createReasonMutation
                                                .isPending
                                        ) {
                                            createReasonMutation
                                                .mutate();
                                        }
                                    }

                                    if (
                                        event.key ===
                                        'Escape'
                                    ) {
                                        closeReasonModal();
                                    }
                                }}
                                disabled={
                                    createReasonMutation
                                        .isPending
                                }
                                placeholder="Жишээ: Гидрийн систем"
                                className={
                                    inputClass
                                }
                            />
                        </div>

                        {selectedVehicle?.type && (
                            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-950/50 dark:text-gray-400">
                                Техникийн төрөл:{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                    {selectedVehicle.type}
                                </span>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={
                                    closeReasonModal
                                }
                                disabled={
                                    createReasonMutation
                                        .isPending
                                }
                                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Болих
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    createReasonMutation
                                        .mutate()
                                }
                                disabled={
                                    !newReasonName
                                        .trim() ||
                                    createReasonMutation
                                        .isPending
                                }
                                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {createReasonMutation
                                    .isPending
                                    ? 'Нэмж байна...'
                                    : 'Нэмэх'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================================
// FIELD
// ============================================================

function Field({
    label,
    required = false,
    mobileOnly = false,
    children,
}: {
    label: string;
    required?: boolean;
    mobileOnly?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label
                className={`mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 ${mobileOnly
                    ? 'block lg:hidden'
                    : 'block'
                    }`}
            >
                {label}

                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </label>

            {children}
        </div>
    );
}

// ============================================================
// STYLE
// ============================================================

const inputClass =
    'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/10';