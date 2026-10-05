import { UserRole } from '@/services/roles';

/** Вебэд түлшийг хянах, засах эрхтэй: admin, dispatcher, manager. fuel_operator зөвхөн харна. */
export const fuelControlRoles: readonly UserRole[] = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.DISPATCHER,
  UserRole.MANAGER,
];

export const fuelViewRoles: readonly UserRole[] = [...fuelControlRoles, UserRole.FUEL_OPERATOR, UserRole.ITA];

/** Орлогын засвар/цуцлах хүсэлтийг зөвхөн админ батална. */
export const fuelApproveRoles: readonly UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN];
