import { StockpileType } from '../stockpile/types';
import { Vehicle } from './types';

export const convertWorklogToM3 = ({
  stockpileType,
  vehicle,
  worklogCount,
}: {
  stockpileType: StockpileType;
  vehicle: Vehicle;
  worklogCount: string;
}) => {
  if (stockpileType === 'soil') {
    return Number(worklogCount) * Number(vehicle.soilCoefficient);
  } else {
    return Number(worklogCount) * Number(vehicle.coalCoefficient);
  }
};
