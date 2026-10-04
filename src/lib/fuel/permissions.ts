import { useAuth } from '@/components/AuthProvider';
import { UserRole } from '@/services/roles';
import { fuelControlRoles, fuelViewRoles } from './roles';

export { fuelControlRoles, fuelViewRoles };

export const useFuelPermissions = () => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

  return {
    canView: !!role && fuelViewRoles.includes(role),
    canControl: !!role && fuelControlRoles.includes(role),
  };
};
