'use client'
import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { toast } from 'sonner';

import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';

import equipmentShiftLogService, {
    EquipmentUserOption,
    IdleEntryPayload,
    RepairEntryPayload,
    ShiftLog,
    ShiftLogDetail,
    VehicleOption,
    VehicleType,
} from '@/services/internal/equipment-shift-log';

import ReasonEditorModal from './ReasonEditorModal';

// ============================================================
// PROPS
// ============================================================

interface Props {
    editingLog?: ShiftLog;
    onCancel: () => void;
    onSuccess: () => void;
}

// ============================================================
// TYPES
// ============================================================

type ReasonHourMap = Record<
    string,
    {
        hours: string;
        notes: string;
    }
>;

type RepairReasonMap = Record<
    string,
    {
        hours: string;
        notes: string;
        mechanicId: string;
    }
>;

// ============================================================
// HELPERS
// ============================================================

function getDateOptions(
    days = 30
) {
    const options: {
        label: string;
        value: string;
    }[] = [];

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

const numberOrZero = (
    value: string
) => {
    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : 0;
};

const getUserLabel = (
    user: EquipmentUserOption
) => {
    const fullName = [
        user.lastName,
        user.firstName,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return (
        fullName ||
        user.name ||
        user.position ||
        user.id
    );
};

// ============================================================
// COMPONENT
// ============================================================

export default function TimeManagementForm({
    editingLog,
    onCancel,
    onSuccess,
}: Props) {
    const queryClient =
        useQueryClient();

    const isEditMode =
        !!editingLog;

    const today =
        new Date().toLocaleDateString(
            'en-CA'
        );

    const dateOptions =
        useMemo(
            () =>
                getDateOptions(
                    30
                ),
            []
        );

    // ==========================================================
    // MAIN STATE
    // ==========================================================

    const [
        operationalDate,
        setOperationalDate,
    ] = useState(
        today
    );

    const [
        shiftType,
        setShiftType,
    ] = useState<
        'day' | 'night'
    >('day');

    const [
        vehicleId,
        setVehicleId,
    ] = useState('');

    const [
        vehicleType,
        setVehicleType,
    ] = useState<
        VehicleType | undefined
    >();

    const [
        shiftId,
        setShiftId,
    ] = useState('');

    const [
        operatorId,
        setOperatorId,
    ] = useState('');

    const [
        totalHours,
        setTotalHours,
    ] = useState('10');

    const [
        workedHours,
        setWorkedHours,
    ] = useState('');

    const [
        fuelReceived,
        setFuelReceived,
    ] = useState('');

    const [
        notes,
        setNotes,
    ] = useState('');

    // ==========================================================
    // IDLE STATE
    // ==========================================================

    const [
        idleValues,
        setIdleValues,
    ] =
        useState<ReasonHourMap>(
            {}
        );

    // ==========================================================
    // REPAIR STATE
    // ==========================================================

    const [
        repairValues,
        setRepairValues,
    ] =
        useState<RepairReasonMap>(
            {}
        );

    // ==========================================================
    // MODAL STATE
    // ==========================================================

    const [
        idleModalOpen,
        setIdleModalOpen,
    ] = useState(false);

    const [
        repairModalOpen,
        setRepairModalOpen,
    ] = useState(false);

    const [
        newIdleReason,
        setNewIdleReason,
    ] = useState('');

    const [
        newRepairReason,
        setNewRepairReason,
    ] = useState('');

    // ==========================================================
    // VEHICLES
    // ==========================================================

    const {
        data:
        vehicleOptions = [],
        isLoading:
        isLoadingVehicles,
    } =
        useQuery<
            VehicleOption[]
        >({
            queryKey: [
                'equipment-vehicles-by-date',
                operationalDate,
            ],

            queryFn: () =>
                equipmentShiftLogService.getVehiclesByDate(
                    operationalDate
                ),

            enabled:
                !isEditMode &&
                !!operationalDate,

            staleTime:
                60_000,
        });

    // ==========================================================
    // IDLE REASONS
    // ==========================================================

    const {
        data:
        idleReasons = [],
        isLoading:
        isLoadingIdleReasons,
    } = useQuery({
        queryKey: [
            'equipment-idle-reasons',
            vehicleType,
        ],

        queryFn: () =>
            equipmentShiftLogService.getIdleReasonTypes(
                vehicleType
            ),

        staleTime:
            60_000,
    });

    // ==========================================================
    // REPAIR REASONS
    // ==========================================================

    const {
        data:
        repairReasons = [],
        isLoading:
        isLoadingRepairReasons,
    } = useQuery({
        queryKey: [
            'equipment-repair-reasons',
            vehicleType,
        ],

        queryFn: () =>
            equipmentShiftLogService.getRepairReasonTypes(
                vehicleType
            ),

        staleTime:
            60_000,
    });

    // ==========================================================
    // OPERATORS
    // ==========================================================

    const {
        data:
        operators = [],
    } = useQuery({
        queryKey: [
            'equipment-shift-operators',
        ],

        queryFn:
            equipmentShiftLogService
                .getOperators,

        staleTime:
            60_000,
    });

    // ==========================================================
    // MECHANICS
    // ==========================================================

    const {
        data:
        mechanics = [],
        isLoading:
        isLoadingMechanics,
    } =
        useQuery<
            EquipmentUserOption[]
        >({
            queryKey: [
                'equipment-shift-mechanics',
            ],

            queryFn:
                equipmentShiftLogService
                    .getMechanics,

            staleTime:
                60_000,
        });

    // ==========================================================
    // DETAIL
    // ==========================================================

    const {
        data: detail,
        isLoading:
        isLoadingDetail,
    } =
        useQuery<ShiftLogDetail>(
            {
                queryKey: [
                    'equipment-shift-log-detail',
                    editingLog?.id,
                ],

                queryFn: () =>
                    equipmentShiftLogService.getLogById(
                        editingLog!.id
                    ),

                enabled:
                    isEditMode &&
                    !!editingLog?.id,
            }
        );

    // ==========================================================
    // INITIAL EDIT DATA
    // ==========================================================

    useEffect(() => {
        if (
            !editingLog
        ) {
            return;
        }

        setOperationalDate(
            editingLog.operationalDate
        );

        setShiftType(
            editingLog.shiftType
        );

        setVehicleId(
            editingLog.vehicleId
        );

        setVehicleType(
            editingLog.vehicle
                ?.type ??
            undefined
        );

        setShiftId(
            editingLog.shiftId ??
            ''
        );

        setOperatorId(
            editingLog.operatorId ??
            ''
        );

        setTotalHours(
            editingLog.totalHours ??
            '10'
        );

        setWorkedHours(
            editingLog.workedHours ??
            ''
        );

        setFuelReceived(
            editingLog.fuelReceived ??
            ''
        );

        setNotes(
            editingLog.notes ??
            ''
        );
    }, [
        editingLog,
    ]);

    // ==========================================================
    // LOAD DETAIL
    // ==========================================================

    useEffect(() => {
        if (!detail) {
            return;
        }

        // --------------------------------------------------------
        // IDLE
        // --------------------------------------------------------

        const idleMap:
            ReasonHourMap =
            {};

        for (
            const entry of
            detail.idleEntries
        ) {
            if (
                !entry.idleReasonId
            ) {
                continue;
            }

            idleMap[
                entry.idleReasonId
            ] = {
                hours:
                    entry.hours,

                notes:
                    entry.notes ??
                    '',
            };
        }

        // --------------------------------------------------------
        // REPAIR
        // --------------------------------------------------------

        const repairMap:
            RepairReasonMap =
            {};

        for (
            const entry of
            detail.repairEntries ??
            []
        ) {
            if (
                !entry.repairReasonId
            ) {
                continue;
            }

            repairMap[
                entry.repairReasonId
            ] = {
                hours:
                    entry.hours,

                notes:
                    entry.notes ??
                    '',

                mechanicId:
                    entry.mechanicId ??
                    entry.mechanic?.id ??
                    '',
            };
        }

        setIdleValues(
            idleMap
        );

        setRepairValues(
            repairMap
        );
    }, [
        detail,
    ]);

    // ==========================================================
    // VEHICLE CHANGE
    // ==========================================================

    const handleVehicleChange = (
        id: string
    ) => {
        setVehicleId(
            id
        );

        const selected =
            vehicleOptions.find(
                (
                    vehicle
                ) =>
                    vehicle.id ===
                    id
            );

        setVehicleType(
            selected?.type ??
            undefined
        );

        setIdleValues(
            {}
        );

        setRepairValues(
            {}
        );
    };

    // ==========================================================
    // TOTAL IDLE
    // ==========================================================

    const totalIdleHours =
        useMemo(() => {
            return Object.values(
                idleValues
            ).reduce(
                (
                    sum,
                    entry
                ) =>
                    sum +
                    numberOrZero(
                        entry.hours
                    ),
                0
            );
        }, [
            idleValues,
        ]);

    // ==========================================================
    // TOTAL REPAIR
    // ==========================================================

    const totalRepairHours =
        useMemo(() => {
            return Object.values(
                repairValues
            ).reduce(
                (
                    sum,
                    entry
                ) =>
                    sum +
                    numberOrZero(
                        entry.hours
                    ),
                0
            );
        }, [
            repairValues,
        ]);

    // ==========================================================
    // IDLE VALUE CHANGE
    // ==========================================================

    const setIdleValue = (
        reasonId: string,

        field:
            | 'hours'
            | 'notes',

        value: string
    ) => {
        setIdleValues(
            (
                previous
            ) => ({
                ...previous,

                [reasonId]: {
                    hours:
                        previous[
                            reasonId
                        ]?.hours ??
                        '',

                    notes:
                        previous[
                            reasonId
                        ]?.notes ??
                        '',

                    [field]:
                        value,
                },
            })
        );
    };

    // ==========================================================
    // REPAIR VALUE CHANGE
    // ==========================================================

    const setRepairValue = (
        reasonId: string,

        field:
            | 'hours'
            | 'notes'
            | 'mechanicId',

        value: string
    ) => {
        setRepairValues(
            (
                previous
            ) => ({
                ...previous,

                [reasonId]: {
                    hours:
                        previous[
                            reasonId
                        ]?.hours ??
                        '',

                    notes:
                        previous[
                            reasonId
                        ]?.notes ??
                        '',

                    mechanicId:
                        previous[
                            reasonId
                        ]?.mechanicId ??
                        '',

                    [field]:
                        value,
                },
            })
        );
    };

    // ==========================================================
    // BUILD IDLE PAYLOAD
    // ==========================================================

    const buildIdlePayload =
        (): IdleEntryPayload[] =>
            idleReasons
                .map(
                    (
                        reason
                    ) => {
                        const value =
                            idleValues[
                            reason.id
                            ];

                        return {
                            idleReasonId:
                                reason.id,

                            hours:
                                numberOrZero(
                                    value?.hours ??
                                    ''
                                ),

                            notes:
                                value?.notes
                                    ?.trim() ||
                                null,
                        };
                    }
                )
                .filter(
                    (
                        entry
                    ) =>
                        entry.hours >
                        0
                );

    // ==========================================================
    // BUILD REPAIR PAYLOAD
    // ==========================================================

    const buildRepairPayload =
        (): RepairEntryPayload[] =>
            repairReasons
                .map(
                    (
                        reason
                    ) => {
                        const value =
                            repairValues[
                            reason.id
                            ];

                        return {
                            repairReasonId:
                                reason.id,

                            mechanicId:
                                value?.mechanicId ||
                                null,

                            hours:
                                numberOrZero(
                                    value?.hours ??
                                    ''
                                ),

                            notes:
                                value?.notes
                                    ?.trim() ||
                                null,
                        };
                    }
                )
                .filter(
                    (
                        entry
                    ) =>
                        entry.hours >
                        0
                );

    // ==========================================================
    // CREATE IDLE REASON
    // ==========================================================

    const createIdleReasonMutation =
        useMutation({
            mutationFn:
                (
                    name: string
                ) =>
                    equipmentShiftLogService.createIdleReasonType(
                        {
                            name,

                            vehicleTypes:
                                vehicleType
                                    ? [
                                        vehicleType,
                                    ]
                                    : [],
                        }
                    ),

            onSuccess:
                async (
                    created
                ) => {
                    toast.success(
                        'Сул зогсолтын шалтгаан нэмэгдлээ'
                    );

                    setNewIdleReason(
                        ''
                    );

                    await queryClient.invalidateQueries(
                        {
                            queryKey: [
                                'equipment-idle-reasons',
                            ],
                        }
                    );

                    setIdleValues(
                        (
                            previous
                        ) => ({
                            ...previous,

                            [created.id]:
                            {
                                hours:
                                    '',

                                notes:
                                    '',
                            },
                        })
                    );
                },

            onError:
                (
                    error: Error
                ) => {
                    toast.error(
                        error.message ||
                        'Шалтгаан нэмэхэд алдаа гарлаа'
                    );
                },
        });

    // ==========================================================
    // CREATE REPAIR REASON
    // ==========================================================

    const createRepairReasonMutation =
        useMutation({
            mutationFn:
                (
                    name: string
                ) =>
                    equipmentShiftLogService.createRepairReasonType(
                        {
                            name,

                            vehicleTypes:
                                vehicleType
                                    ? [
                                        vehicleType,
                                    ]
                                    : [],
                        }
                    ),

            onSuccess:
                async (
                    created
                ) => {
                    toast.success(
                        'Эвдрэл гэмтлийн шалтгаан нэмэгдлээ'
                    );

                    setNewRepairReason(
                        ''
                    );

                    await queryClient.invalidateQueries(
                        {
                            queryKey: [
                                'equipment-repair-reasons',
                            ],
                        }
                    );

                    setRepairValues(
                        (
                            previous
                        ) => ({
                            ...previous,

                            [created.id]:
                            {
                                hours:
                                    '',

                                notes:
                                    '',

                                mechanicId:
                                    '',
                            },
                        })
                    );
                },

            onError:
                (
                    error: Error
                ) => {
                    toast.error(
                        error.message ||
                        'Шалтгаан нэмэхэд алдаа гарлаа'
                    );
                },
        });

    // ==========================================================
    // CREATE IDLE REASON HANDLER
    // ==========================================================

    const handleCreateIdleReason =
        async () => {
            const name =
                newIdleReason.trim();

            if (!name) {
                toast.error(
                    'Шалтгааны нэр оруулна уу'
                );

                return;
            }

            await createIdleReasonMutation.mutateAsync(
                name
            );
        };

    // ==========================================================
    // CREATE REPAIR REASON HANDLER
    // ==========================================================

    const handleCreateRepairReason =
        async () => {
            const name =
                newRepairReason.trim();

            if (!name) {
                toast.error(
                    'Шалтгааны нэр оруулна уу'
                );

                return;
            }

            await createRepairReasonMutation.mutateAsync(
                name
            );
        };

    // ==========================================================
    // CREATE LOG
    // ==========================================================

    const createMutation =
        useMutation({
            mutationFn:
                equipmentShiftLogService
                    .createLog,

            onSuccess: () => {
                toast.success(
                    'Бүртгэл амжилттай үүслээ'
                );

                onSuccess();
            },

            onError:
                (
                    error: Error
                ) => {
                    toast.error(
                        error.message ||
                        'Бүртгэл үүсгэхэд алдаа гарлаа'
                    );
                },
        });

    // ==========================================================
    // UPDATE LOG
    // ==========================================================

    const updateMutation =
        useMutation({
            mutationFn: ({
                id,
                payload,
            }: {
                id: string;

                payload: Parameters<
                    typeof equipmentShiftLogService.updateLog
                >[1];
            }) =>
                equipmentShiftLogService.updateLog(
                    id,
                    payload
                ),

            onSuccess: () => {
                toast.success(
                    'Бүртгэл амжилттай шинэчлэгдлээ'
                );

                onSuccess();
            },

            onError:
                (
                    error: Error
                ) => {
                    toast.error(
                        error.message ||
                        'Шинэчлэхэд алдаа гарлаа'
                    );
                },
        });

    const isPending =
        createMutation.isPending ||
        updateMutation.isPending;

    // ==========================================================
    // SUBMIT
    // ==========================================================

    const handleSubmit =
        async () => {
            if (!vehicleId) {
                toast.error(
                    'Техник сонгоно уу'
                );

                return;
            }

            if (!operatorId) {
                toast.error(
                    'Оператор сонгоно уу'
                );

                return;
            }

            if (
                !operationalDate
            ) {
                toast.error(
                    'Огноо сонгоно уу'
                );

                return;
            }

            if (
                totalHours.trim() ===
                '' ||
                workedHours.trim() ===
                ''
            ) {
                toast.error(
                    'Нийт болон ажилласан цагийг оруулна уу'
                );

                return;
            }

            // Засварын цаг оруулсан бол
            // mechanic заавал сонгосон байна.
            const invalidRepair =
                Object.values(
                    repairValues
                ).find(
                    (
                        value
                    ) =>
                        numberOrZero(
                            value.hours
                        ) > 0 &&
                        !value.mechanicId
                );

            if (
                invalidRepair
            ) {
                toast.error(
                    'Засварын цаг оруулсан мөр бүр дээр засвар хийсэн хүн сонгоно уу'
                );

                return;
            }

            const payload = {
                vehicleId,

                shiftId:
                    shiftId ||
                    null,

                operatorId,

                operationalDate,

                shiftType,

                totalHours:
                    numberOrZero(
                        totalHours
                    ),

                workedHours:
                    numberOrZero(
                        workedHours
                    ),

                repairHours:
                    Number(
                        totalRepairHours.toFixed(
                            1
                        )
                    ),

                idleHours:
                    Number(
                        totalIdleHours.toFixed(
                            1
                        )
                    ),

                fuelReceived:
                    fuelReceived.trim()
                        ? numberOrZero(
                            fuelReceived
                        )
                        : null,

                notes:
                    notes.trim() ||
                    null,

                idleEntries:
                    buildIdlePayload(),

                repairEntries:
                    buildRepairPayload(),
            };

            if (
                isEditMode &&
                editingLog
            ) {
                await updateMutation.mutateAsync(
                    {
                        id:
                            editingLog.id,

                        payload,
                    }
                );
            } else {
                await createMutation.mutateAsync(
                    payload
                );
            }
        };

    // ==========================================================
    // SELECTED VEHICLE
    // ==========================================================

    const selectedVehicle =
        isEditMode
            ? editingLog
                ?.vehicle
            : vehicleOptions.find(
                (
                    vehicle
                ) =>
                    vehicle.id ===
                    vehicleId
            );

    // ==========================================================
    // STYLES
    // ==========================================================

    const selectClass =
        'mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200';

    const cardClass =
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900';

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <>
            <div className="space-y-5">

                {/* HEADER */}

                <div className="flex items-start justify-between gap-4">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isEditMode
                                ? 'Цаг ашиглалтын бүртгэл засах'
                                : 'Цаг ашиглалтын бүртгэл нэмэх'}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Сул зогсолт болон засварын цаг нь шалтгааны бүртгэлээс автоматаар бодогдоно.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={
                            onCancel
                        }
                        disabled={
                            isPending
                        }
                    >
                        Хаах
                    </Button>

                </div>

                {/* ====================================================
            BASIC INFORMATION
        ===================================================== */}

                <div className={cardClass}>

                    <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Үндсэн мэдээлэл
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {/* DATE */}

                        <div>
                            <Label>
                                Огноо
                            </Label>

                            {isEditMode ? (
                                <Input
                                    className="mt-1"
                                    value={
                                        operationalDate
                                    }
                                    disabled
                                />
                            ) : (
                                <select
                                    value={
                                        operationalDate
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setOperationalDate(
                                            event.target.value
                                        );

                                        setVehicleId(
                                            ''
                                        );

                                        setVehicleType(
                                            undefined
                                        );

                                        setIdleValues(
                                            {}
                                        );

                                        setRepairValues(
                                            {}
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
                            )}
                        </div>

                        {/* SHIFT */}

                        <div>
                            <Label>
                                Ээлж
                            </Label>

                            <select
                                value={
                                    shiftType
                                }
                                onChange={(
                                    event
                                ) =>
                                    setShiftType(
                                        event.target.value as
                                        | 'day'
                                        | 'night'
                                    )
                                }
                                className={
                                    selectClass
                                }
                                disabled={
                                    isEditMode
                                }
                            >
                                <option value="day">
                                    Өдрийн ээлж
                                </option>

                                <option value="night">
                                    Шөнийн ээлж
                                </option>
                            </select>
                        </div>

                        {/* VEHICLE */}

                        <div>
                            <Label>
                                Техник
                            </Label>

                            {isEditMode ? (
                                <Input
                                    className="mt-1"
                                    value={
                                        editingLog
                                            ?.vehicle
                                            ?.mineNumber ??
                                        editingLog
                                            ?.vehicle
                                            ?.name ??
                                        ''
                                    }
                                    disabled
                                />
                            ) : (
                                <select
                                    value={
                                        vehicleId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleVehicleChange(
                                            event.target.value
                                        )
                                    }
                                    className={
                                        selectClass
                                    }
                                    disabled={
                                        isLoadingVehicles
                                    }
                                >
                                    <option value="">
                                        Техник сонгох
                                    </option>

                                    {vehicleOptions.map(
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
                                                {vehicle.mineNumber
                                                    ? `${vehicle.mineNumber} — `
                                                    : ''}

                                                {
                                                    vehicle.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            )}
                        </div>

                        {/* OPERATOR */}

                        <div>
                            <Label>
                                Оператор
                            </Label>

                            <select
                                value={
                                    operatorId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setOperatorId(
                                        event.target.value
                                    )
                                }
                                className={
                                    selectClass
                                }
                            >
                                <option value="">
                                    Оператор сонгох
                                </option>

                                {operators.map(
                                    (
                                        operator
                                    ) => (
                                        <option
                                            key={
                                                operator.id
                                            }
                                            value={
                                                operator.id
                                            }
                                        >
                                            {getUserLabel(
                                                operator
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                    </div>

                    {selectedVehicle?.type && (
                        <div className="mt-3">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                                {
                                    selectedVehicle.type
                                }
                            </span>
                        </div>
                    )}

                </div>

                {/* ====================================================
            HOURS
        ===================================================== */}

                <div className={cardClass}>

                    <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Цагийн мэдээлэл
                    </h3>

                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <Label>
                                Нийт цаг
                            </Label>

                            <Input
                                className="mt-1"
                                type="number"
                                step={0.1}
                                min="0"
                                value={
                                    totalHours
                                }
                                onChange={(
                                    event
                                ) =>
                                    setTotalHours(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <Label>
                                Ажилласан цаг
                            </Label>

                            <Input
                                className="mt-1"
                                type="number"
                                step={0.1}
                                min="0"
                                value={
                                    workedHours
                                }
                                onChange={(
                                    event
                                ) =>
                                    setWorkedHours(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                    </div>

                </div>

                {/* ====================================================
            IDLE / REPAIR
        ===================================================== */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <ReasonSummaryCard
                        title="Сул зогсолт"
                        total={
                            totalIdleHours
                        }
                        count={
                            buildIdlePayload()
                                .length
                        }
                        tone="warning"
                        onClick={() =>
                            setIdleModalOpen(
                                true
                            )
                        }
                    />

                    <ReasonSummaryCard
                        title="Эвдрэл, гэмтэл"
                        total={
                            totalRepairHours
                        }
                        count={
                            buildRepairPayload()
                                .length
                        }
                        tone="danger"
                        onClick={() =>
                            setRepairModalOpen(
                                true
                            )
                        }
                    />

                </div>

                {/* ====================================================
            OTHER
        ===================================================== */}

                <div className={cardClass}>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <Label>
                                Авсан түлш (л)
                            </Label>

                            <Input
                                className="mt-1"
                                type="number"
                                step={0.1}
                                min="0"
                                value={
                                    fuelReceived
                                }
                                onChange={(
                                    event
                                ) =>
                                    setFuelReceived(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <Label>
                                Нэмэлт тэмдэглэл
                            </Label>

                            <TextArea
                                className="mt-1"
                                rows={3}
                                value={
                                    notes
                                }
                                onChange={
                                    setNotes
                                }
                            />
                        </div>

                    </div>

                </div>

                {(isLoadingDetail ||
                    isLoadingIdleReasons ||
                    isLoadingRepairReasons ||
                    isLoadingMechanics) && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-600 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                            Мэдээлэл ачааллаж байна...
                        </div>
                    )}

                {/* ACTION */}

                <div className="flex justify-end gap-3">

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={
                            onCancel
                        }
                    >
                        Болих
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={
                            handleSubmit
                        }
                        disabled={
                            isPending
                        }
                    >
                        {isPending
                            ? 'Хадгалж байна...'
                            : isEditMode
                                ? 'Өөрчлөлт хадгалах'
                                : 'Бүртгэл үүсгэх'}
                    </Button>

                </div>

            </div>

            {/* ======================================================
          IDLE MODAL
      ======================================================= */}

            <ReasonEditorModal
                open={idleModalOpen}
                onClose={() =>
                    setIdleModalOpen(false)
                }
                reasons={idleReasons}
                values={idleValues}
                onChange={(
                    reasonId,
                    field,
                    value
                ) =>
                    setIdleValue(
                        reasonId,
                        field,
                        value
                    )
                }
                totalHours={totalIdleHours}
                loading={isLoadingIdleReasons}
                newReasonName={newIdleReason}
                onNewReasonNameChange={
                    setNewIdleReason
                }
                onCreateReason={
                    handleCreateIdleReason
                }
                isCreatingReason={
                    createIdleReasonMutation.isPending
                }
            />

        </>
    );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function ReasonSummaryCard({
    title,
    total,
    count,
    tone,
    onClick,
}: {
    title: string;
    total: number;
    count: number;

    tone:
    | 'warning'
    | 'danger';

    onClick: () => void;
}) {
    const toneClass =
        tone === 'danger'
            ? 'text-red-500 dark:text-red-400'
            : 'text-amber-600 dark:text-amber-400';

    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800"
        >
            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        {count} шалтгаан бүртгэсэн
                    </p>
                </div>

                <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>

            </div>

            <p
                className={`mt-4 text-2xl font-semibold ${toneClass}`}
            >
                {total.toFixed(
                    1
                )}{' '}

                <span className="text-sm font-normal">
                    цаг
                </span>
            </p>

        </button>
    );
}