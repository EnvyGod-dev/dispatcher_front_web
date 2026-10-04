'use client';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Vehicle } from '@/services/internal/vehicle/types';
import { ShiftType } from '@/services/internal/shift/types';
import { Select } from 'antd';

interface VehicleSelectionFormProps {
  shiftType: ShiftType;
  routeInfo: {
    routeCode?: string;
    routeName?: string;
    pickUpBlockName?: string;
    dropOffBlockName?: string;
  };
  vehicles: Vehicle[];
  vehicleId: string;
  mileageStart: string;
  vehicleLoading: boolean;
  isStarting: boolean;
  onVehicleChange: (vehicleId: string) => void;
  onMileageChange: (mileage: string) => void;
  onMotoStartChange: (moto: string) => void;
  onStartShift: () => void;
  onBack: () => void;
}

export default function VehicleSelectionForm({
  shiftType,
  routeInfo,
  vehicles,
  vehicleId,
  mileageStart,
  vehicleLoading,
  isStarting,
  onVehicleChange,
  onMileageChange,
  onMotoStartChange,
  onStartShift,
  onBack,
}: VehicleSelectionFormProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        <PageBreadcrumb
          pageTitle="Техник сонгох"
          description={`${shiftType === 'day' ? 'Өдрийн' : 'Шөнийн'} ээлж`}
        />

        {/* Route Info */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Сонгосон маршрут
          </div>
          {routeInfo.routeCode && (
            <div className="text-xs   text-gray-600 dark:text-gray-400 mb-1">
              {routeInfo.routeCode}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-orange-700 dark:text-orange-400">
              {routeInfo.pickUpBlockName}
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span className="font-medium text-blue-700 dark:text-blue-400">
              {routeInfo.dropOffBlockName}
            </span>
          </div>
        </div>

        <ComponentCard title="Техник сонгох">
          <div className="space-y-6">
            <div>
              <Label>
                Техник <span className="text-red-500">*</span>
              </Label>
              <Select
                className="w-full mt-2"
                size="large"
                placeholder="Техник сонгох"
                value={vehicleId || undefined}
                onChange={onVehicleChange}
                loading={vehicleLoading}
                disabled={vehicleLoading || isStarting}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={vehicles.map((vehicle) => ({
                  value: vehicle.id,
                  label: `${vehicle.name} - ${vehicle.vehicleNumber}`,
                }))}
              />
              {vehicles.length === 0 && !vehicleLoading && (
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Энэ маршрутад тохирох техник олдсонгүй
                </p>
              )}
            </div>

            <div>
              <Label>
                Эхлэх км-ын заалт <span className="text-red-500">*</span>
              </Label>
              <Input
                className="mt-2"
                type="number"
                placeholder="0"
                onChange={(e) => onMileageChange(e.target.value)}
                disabled={isStarting}
              />
            </div>

            <div>
              <Label>
                Эхлэх мото заалт <span className="text-red-500">*</span>
              </Label>
              <Input
                className="mt-2"
                type="number"
                placeholder="0"
                onChange={(e) => onMotoStartChange(e.target.value)}
                disabled={isStarting}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isStarting}
                className="flex-1"
              >
                Буцах
              </Button>
              <Button
                variant="primary"
                onClick={onStartShift}
                disabled={!vehicleId || !mileageStart || isStarting}
                className="flex-1"
              >
                {isStarting ? 'Эхэлж байна...' : 'Ээлж эхлүүлэх'}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
