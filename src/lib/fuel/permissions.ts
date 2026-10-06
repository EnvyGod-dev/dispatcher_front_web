import { useAuth } from '@/components/AuthProvider';
import { UserRole } from '@/services/roles';
import { fuelApproveRoles, fuelControlRoles, fuelRecordRoles, fuelViewRoles } from './roles';

export { fuelApproveRoles, fuelControlRoles, fuelRecordRoles, fuelViewRoles };

export const useFuelPermissions = () => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  return {
    canView: !!role && fuelViewRoles.includes(role),
    canControl: !!role && fuelControlRoles.includes(role),
    canApprove: !!role && fuelApproveRoles.includes(role),
    /** Бүртгэлийн жагсаалт харах (удирдлага зөвхөн тайлан харна). */
    canViewRecords: !!role && fuelRecordRoles.includes(role),
  };
};
