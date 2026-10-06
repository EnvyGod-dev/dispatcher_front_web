import { UserRole } from '@/services/roles';

/**
 * Вебэд түлшийг бүртгэх, засах (орлого, зарлага, нийлүүлэгч, тохиргоо): зөвхөн admin, dispatcher.
 * fuel_operator, ИТА зөвхөн харна; удирдлага (manager) зөвхөн тайлан харна.
 */
export const fuelControlRoles: readonly UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DISPATCHER];

/** Бүртгэлийн жагсаалт (олголт, орлого, зарлага, аудит) харах. */
export const fuelRecordRoles: readonly UserRole[] = [...fuelControlRoles, UserRole.FUEL_OPERATOR, UserRole.ITA];

/** Тойм, зарцуулалт, тайлан харах (удирдлага орно). */
export const fuelViewRoles: readonly UserRole[] = [...fuelRecordRoles, UserRole.MANAGER];

/** Орлогын засвар/цуцлах хүсэлт батлах: admin, dispatcher. */
export const fuelApproveRoles: readonly UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DISPATCHER];
