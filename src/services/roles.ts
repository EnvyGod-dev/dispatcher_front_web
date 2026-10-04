export const UserRole = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  DRIVER: 'driver',
  ASSISTANT_OPERATOR: 'assistant_operator',
  DISPATCHER: 'dispatcher',
  OPERATOR: 'operator',
  MARKSCHEIDER: 'markscheider',
  ITA: 'ita',
  MECHANIC: 'mechanic',
  HR: 'hr',
  FUEL_OPERATOR: 'fuel_operator',
  MANAGER: 'manager',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_ROLES = Object.values(UserRole);

export const inspectionActionRoles = [
  UserRole.MARKSCHEIDER,
  UserRole.DISPATCHER,
  UserRole.ITA,
] as const;

export const inspectionReadRoles = [
  UserRole.ADMIN,
  UserRole.MARKSCHEIDER,
  UserRole.DISPATCHER,
  UserRole.MECHANIC,
] as const;

export const dailyPlanActionRoles = [
  UserRole.DISPATCHER,
  UserRole.ADMIN,
] as const;

export const dailyPlanReadRoles = [
  UserRole.ADMIN,
  UserRole.DISPATCHER,
  UserRole.DRIVER,
] as const;

export const miningBlockActionRoles = [UserRole.DISPATCHER] as const;

export const miningBlockReadRoles = [
  UserRole.DISPATCHER,
  UserRole.ADMIN,
] as const;

export const miningRouteActionRoles = [UserRole.DISPATCHER] as const;

export const miningRouteReadRoles = [
  UserRole.DISPATCHER,
  UserRole.ADMIN,
] as const;

export const miningSectionActionRoles = [UserRole.DISPATCHER] as const;

export const miningSectionReadRoles = [
  UserRole.DISPATCHER,
  UserRole.ADMIN,
] as const;

export const markscheiderReportReadRoles = [
  UserRole.MARKSCHEIDER,
  UserRole.ADMIN,
  UserRole.DISPATCHER,
];

export const markscheiderReportActionRoles = [
  UserRole.MARKSCHEIDER,
  UserRole.ADMIN
];

export const stockpileReadRoles = [UserRole.DISPATCHER, UserRole.ADMIN];

export const stockpileActionRoles = [UserRole.ADMIN, UserRole.DISPATCHER];

export const employeeReadRoles = [
  UserRole.HR,
  UserRole.DISPATCHER,
  UserRole.ADMIN,
];

export const employeeActionRoles = [
  UserRole.HR,
  UserRole.ADMIN,
] as const;

export const fuelReadRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.FUEL_OPERATOR,
  UserRole.DISPATCHER,
  UserRole.ITA,
  UserRole.MANAGER,
] as const;

export const fuelOperateRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.FUEL_OPERATOR,
  UserRole.DISPATCHER,
] as const;

export const fuelSuperviseRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.DISPATCHER,
] as const;

export const fuelEngineerRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.ITA,
] as const;

export const fuelManageRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
] as const;

export const hasRole = (
  userRole: UserRole | undefined,
  allowedRoles: readonly UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

export const hasAnyRole = (
  userRole: UserRole | undefined,
  ...allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

export const hasPermission = (
  userRole: UserRole | undefined,
  requiredRoles: readonly UserRole[]
): boolean => {
  if (!userRole) return false;

  if (userRole === UserRole.SUPERADMIN) return true;

  return requiredRoles.includes(userRole);
};