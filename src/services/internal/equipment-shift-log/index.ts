import http from '@/services/index';

const BASE_URL = '/api/internal/equipment-shift-log';

// ============================================================
// COMMON TYPES
// ============================================================

export type ShiftType = 'day' | 'night';

export type VehicleType =
    | 'truck'
    | 'excavator'
    | 'loader'
    | 'dozer'
    | 'dump'
    | 'light_vehicle'
    | 'special_purpose'
    | 'grader';

export type EquipmentUserRole =
    | 'superadmin'
    | 'admin'
    | 'markscheider'
    | 'driver'
    | 'assistant_operator'
    | 'dispatcher'
    | 'hr'
    | 'ita'
    | 'mechanic';

// ============================================================
// VEHICLE
// ============================================================

export type VehicleOption = {
    id: string;
    name: string;
    mineNumber: string | null;
    type: VehicleType | null;
};

// ============================================================
// REASONS
// ============================================================

export type ReasonType = {
    id: string;
    organizationId: string;
    name: string;
    vehicleTypes: VehicleType[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type IdleReasonType = ReasonType;

export type RepairReasonType = ReasonType;

// ============================================================
// USERS
// ============================================================

export type EquipmentUserOption = {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: EquipmentUserRole;
    position: string | null;
    department: string | null;
    status: string | null;
};

export type ShiftLogOperator = {
    id: string | null;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: EquipmentUserRole | null;
};

export type RepairMechanic = {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    position: string | null;
};

// ============================================================
// IDLE ENTRY
// ============================================================

export type IdleEntry = {
    id: string;
    shiftLogId: string;
    idleReasonId: string | null;
    reasonName: string | null;
    hours: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

// ============================================================
// REPAIR ENTRY
// ============================================================

export type RepairEntry = {
    id: string;
    shiftLogId: string;

    repairReasonId: string | null;
    reasonName: string | null;

    mechanicId: string | null;
    mechanic: RepairMechanic | null;

    hours: string;
    notes: string | null;

    createdAt: string;
    updatedAt: string;
};

// ============================================================
// SHIFT LOG
// ============================================================

export type ShiftLog = {
    id: string;
    organizationId: string;

    vehicleId: string;

    operatorId: string | null;

    shiftId: string | null;

    operationalDate: string;

    shiftType: ShiftType;

    totalHours: string;

    workedHours: string | null;

    repairHours: string | null;

    idleHours: string | null;

    fuelReceived: string | null;

    notes: string | null;

    recordedBy: string | null;

    createdAt: string;

    updatedAt: string;

    vehicle: {
        id: string;
        name: string;
        mineNumber: string | null;
        type: VehicleType | null;
    } | null;

    operator: ShiftLogOperator | null;

    totalCount?: number;
};

export type ShiftLogDetail =
    ShiftLog & {
        idleEntries: IdleEntry[];

        repairEntries: RepairEntry[];
    };

// ============================================================
// ENTRY PAYLOADS
// ============================================================

export type IdleEntryPayload = {
    idleReasonId?: string | null;

    hours: number;

    notes?: string | null;
};

export type RepairEntryPayload = {
    repairReasonId?: string | null;

    mechanicId?: string | null;

    hours: number;

    notes?: string | null;
};

// ============================================================
// SHIFT LOG PAYLOAD
// ============================================================

export type CreateShiftLogPayload = {
    vehicleId: string;

    shiftId?: string | null;

    operatorId?: string | null;

    operationalDate: string;

    shiftType: ShiftType;

    /*
     * Бүх цагийг application талаас
     * гараар тооцоолж backend рүү өгнө.
     */

    totalHours: number;

    workedHours: number;

    repairHours: number;

    idleHours: number;

    fuelReceived?: number | null;

    notes?: string | null;

    idleEntries?: IdleEntryPayload[];

    repairEntries?: RepairEntryPayload[];
};

export type UpdateShiftLogPayload =
    Partial<CreateShiftLogPayload>;

// ============================================================
// REPAIR PAYLOAD
// ============================================================

/*
 * Repair module-д зориулсан payload.
 *
 * Frontend existing shift байгаа эсэхийг
 * өөрөө шийдэхгүй.
 *
 * Backend:
 *
 * organizationId
 * + vehicleId
 * + operationalDate
 * + shiftType
 *
 * ашиглан existing shift log-ийг олно.
 */
export type CreateRepairPayload = {
    vehicleId: string;

    shiftId?: string | null;

    operatorId?: string | null;

    operationalDate: string;

    shiftType: ShiftType;

    repairEntries: RepairEntryPayload[];
};

export type CreateRepairResponse = {
    shiftLog: ShiftLog;

    repairEntries: Array<{
        repairReasonId: string | null;

        mechanicId: string | null;

        hours: string;

        notes: string | null;
    }>;

    /*
     * true:
     * шинэ equipment_shift_logs үүссэн.
     *
     * false:
     * existing equipment_shift_logs дээр
     * repair нэмэгдсэн.
     */
    created: boolean;
};

// ============================================================
// REASON PAYLOAD
// ============================================================

export type CreateReasonPayload = {
    name: string;

    vehicleTypes?: VehicleType[];
};

// ============================================================
// FORM OPTIONS
// ============================================================

export type ShiftLogFormOptions = {
    idleReasons: IdleReasonType[];

    repairReasons: RepairReasonType[];

    operators: EquipmentUserOption[];

    mechanics: EquipmentUserOption[];
};

// ============================================================
// IDLE REASONS
// ============================================================

const getIdleReasonTypes = async (
    vehicleType?: VehicleType
): Promise<IdleReasonType[]> => {
    const res =
        await http.get<
            IdleReasonType[]
        >(
            `${BASE_URL}/idle-reasons`,
            {
                params: vehicleType
                    ? {
                        vehicleType,
                    }
                    : undefined,
            }
        );

    return res.body;
};

const createIdleReasonType =
    async (
        payload: CreateReasonPayload
    ): Promise<IdleReasonType> => {
        const res =
            await http.post<
                IdleReasonType
            >(
                `${BASE_URL}/idle-reasons`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

const updateIdleReasonType =
    async (
        id: string,

        payload:
            Partial<CreateReasonPayload> & {
                isActive?: boolean;
            }
    ): Promise<IdleReasonType> => {
        const res =
            await http.put<
                IdleReasonType
            >(
                `${BASE_URL}/idle-reasons/${id}`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

const deleteIdleReasonType =
    async (
        id: string
    ): Promise<void> => {
        await http.delete<void>(
            `${BASE_URL}/idle-reasons/${id}`
        );
    };

// ============================================================
// REPAIR REASONS
// ============================================================

const getRepairReasonTypes =
    async (
        vehicleType?: VehicleType
    ): Promise<
        RepairReasonType[]
    > => {
        const res =
            await http.get<
                RepairReasonType[]
            >(
                `${BASE_URL}/repair-reasons`,
                {
                    params: vehicleType
                        ? {
                            vehicleType,
                        }
                        : undefined,
                }
            );

        return res.body;
    };

const createRepairReasonType =
    async (
        payload: CreateReasonPayload
    ): Promise<RepairReasonType> => {
        const res =
            await http.post<
                RepairReasonType
            >(
                `${BASE_URL}/repair-reasons`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

const updateRepairReasonType =
    async (
        id: string,

        payload:
            Partial<CreateReasonPayload> & {
                isActive?: boolean;
            }
    ): Promise<RepairReasonType> => {
        const res =
            await http.put<
                RepairReasonType
            >(
                `${BASE_URL}/repair-reasons/${id}`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

const deleteRepairReasonType =
    async (
        id: string
    ): Promise<void> => {
        await http.delete<void>(
            `${BASE_URL}/repair-reasons/${id}`
        );
    };

// ============================================================
// USERS
// ============================================================

const getOperators =
    async (): Promise<
        EquipmentUserOption[]
    > => {
        const res =
            await http.get<
                EquipmentUserOption[]
            >(
                `${BASE_URL}/operators`
            );

        return res.body;
    };

const getMechanics =
    async (): Promise<
        EquipmentUserOption[]
    > => {
        const res =
            await http.get<
                EquipmentUserOption[]
            >(
                `${BASE_URL}/mechanics`
            );

        return res.body;
    };

const getUsersByRole =
    async (
        role: EquipmentUserRole
    ): Promise<
        EquipmentUserOption[]
    > => {
        const res =
            await http.get<
                EquipmentUserOption[]
            >(
                `${BASE_URL}/users-by-role`,
                {
                    params: {
                        role,
                    },
                }
            );

        return res.body;
    };

// ============================================================
// FORM OPTIONS
// ============================================================

const getFormOptions =
    async (
        vehicleType: VehicleType
    ): Promise<
        ShiftLogFormOptions
    > => {
        const res =
            await http.get<
                ShiftLogFormOptions
            >(
                `${BASE_URL}/form-options`,
                {
                    params: {
                        vehicleType,
                    },
                }
            );

        return res.body;
    };

// ============================================================
// VEHICLES
// ============================================================

const getVehiclesByDate =
    async (
        date: string
    ): Promise<
        VehicleOption[]
    > => {
        const res =
            await http.get<
                VehicleOption[]
            >(
                `${BASE_URL}/vehicles-by-date`,
                {
                    params: {
                        date,
                    },
                }
            );

        return res.body;
    };

// ============================================================
// LOG LIST
// ============================================================

export type GetLogsParams = {
    limit?: number;

    offset?: number;

    startDate?: string;

    endDate?: string;

    vehicleId?: string;
};

export type GetLogsResponse = {
    data: ShiftLog[];

    totalCount: number;
};

const getLogs = async (
    params: GetLogsParams
): Promise<GetLogsResponse> => {
    const query: Record<
        string,
        string
    > = {};

    if (
        params.limit != null
    ) {
        query.limit =
            String(
                params.limit
            );
    }

    if (
        params.offset != null
    ) {
        query.offset =
            String(
                params.offset
            );
    }

    if (
        params.startDate
    ) {
        query.startDate =
            params.startDate;
    }

    if (
        params.endDate
    ) {
        query.endDate =
            params.endDate;
    }

    if (
        params.vehicleId
    ) {
        query.vehicleId =
            params.vehicleId;
    }

    const res =
        await http.get<
            ShiftLog[]
        >(
            `${BASE_URL}/logs`,
            {
                params: query,
            }
        );

    const headerCount =
        parseInt(
            res.headers?.get(
                'x-total-count'
            ) ?? '',
            10
        );

    const bodyCount =
        res.body[0]
            ?.totalCount;

    const totalCount =
        Number.isFinite(
            headerCount
        )
            ? headerCount
            : Number(
                bodyCount ??
                0
            );

    return {
        data: res.body,

        totalCount,
    };
};

// ============================================================
// LOG DETAIL
// ============================================================

const getLogById =
    async (
        id: string
    ): Promise<
        ShiftLogDetail
    > => {
        const res =
            await http.get<
                ShiftLogDetail
            >(
                `${BASE_URL}/logs/${id}`
            );

        return res.body;
    };

// ============================================================
// CREATE / APPEND REPAIR
// ============================================================

/*
 * Repair module энэ method-ийг ашиглана.
 *
 * Backend:
 *
 * 1. vehicle + operationalDate + shiftType
 *    match хийж existing shift хайна.
 *
 * 2. Existing байвал:
 *    - шинэ shift үүсгэхгүй
 *    - repair entry нэмнэ
 *    - parent repairHours sync хийнэ
 *
 * 3. Existing байхгүй бол:
 *    - шинэ shift үүсгэнэ
 *    - repair entry нэмнэ
 *
 * Ингэснээр duplicate shift POST хийхгүй.
 */
const createOrAppendRepair =
    async (
        payload: CreateRepairPayload
    ): Promise<CreateRepairResponse> => {
        const res =
            await http.post<
                CreateRepairResponse
            >(
                `${BASE_URL}/logs/repair`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

// ============================================================
// CREATE LOG
// ============================================================

/*
 * Үндсэн /time-management
 * цаг бүртгэлийн create.
 *
 * RepairForm дээр үүнийг ашиглахгүй.
 */
const createLog =
    async (
        payload: CreateShiftLogPayload
    ): Promise<ShiftLog> => {
        const res =
            await http.post<
                ShiftLog
            >(
                `${BASE_URL}/logs`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

// ============================================================
// UPDATE LOG
// ============================================================

const updateLog =
    async (
        id: string,

        payload: UpdateShiftLogPayload
    ): Promise<ShiftLog> => {
        const res =
            await http.put<
                ShiftLog
            >(
                `${BASE_URL}/logs/${id}`,
                {
                    body: payload,
                }
            );

        return res.body;
    };

// ============================================================
// DELETE LOG
// ============================================================

const deleteLog =
    async (
        id: string
    ): Promise<void> => {
        await http.delete<void>(
            `${BASE_URL}/logs/${id}`
        );
    };

// ============================================================
// SERVICE
// ============================================================

const equipmentShiftLogService = {
    // Idle reasons
    getIdleReasonTypes,
    createIdleReasonType,
    updateIdleReasonType,
    deleteIdleReasonType,

    // Repair reasons
    getRepairReasonTypes,
    createRepairReasonType,
    updateRepairReasonType,
    deleteRepairReasonType,

    // Users
    getOperators,
    getMechanics,
    getUsersByRole,

    // Form
    getFormOptions,

    // Vehicles
    getVehiclesByDate,

    // Repair
    createOrAppendRepair,

    // Logs
    getLogs,
    getLogById,
    createLog,
    updateLog,
    deleteLog,
};

export default equipmentShiftLogService;