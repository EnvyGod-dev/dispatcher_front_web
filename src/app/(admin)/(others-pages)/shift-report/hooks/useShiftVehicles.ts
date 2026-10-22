import vehicleService from '@/services/internal/vehicle';
import {
  vehicleTypeMap,
  type Vehicle,
  type VehicleType,
} from '@/services/internal/vehicle/types';
import { useQueries } from '@tanstack/react-query';
import { shiftReportKeys } from '../queryKeys';

const vehicleTypes = vehicleTypeMap.map((item) => item.value as VehicleType);

/** Every vehicle a shift can be recorded for, across all vehicle types. */
export function useShiftVehicles(enabled = true) {
  return useQueries({
    queries: vehicleTypes.map((type) => ({
      queryKey: [...shiftReportKeys.all, 'vehicles', type],
      queryFn: () =>
        vehicleService.getShiftVehicles({ offset: 0, limit: 500, type }),
      enabled,
      staleTime: 60000,
    })),
    combine: (results) => {
      const seen = new Set<string>();
      const vehicles: Vehicle[] = [];

      results.forEach((result) => {
        (result.data?.data || []).forEach((vehicle) => {
          if (seen.has(vehicle.id)) return;
          seen.add(vehicle.id);
          vehicles.push(vehicle);
        });
      });

      return {
        vehicles,
        isLoading: results.some((result) => result.isLoading),
      };
    },
  });
}
