// app/driver/shift/components/ShiftStartForm.tsx
'use client';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Select } from 'antd';
import { ShiftData } from './types';
import { ShiftType } from '@/services/internal/shift/types';
import { Vehicle } from '@/services/internal/vehicle/types';

interface ShiftStartFormProps {
  shiftData: ShiftData;
  vehicles: Vehicle[];
  vehicleLoading: boolean;
  isStarting: boolean; 
  onShiftDataChange: (data: Partial<ShiftData>) => void;
  onStartShift: () => void;
}

export default function ShiftStartForm({
  shiftData,
  vehicles,
  vehicleLoading,
  isStarting,
  onShiftDataChange,
  onStartShift,
}: ShiftStartFormProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <PageBreadcrumb
          pageTitle="Ээлж эхлүүлэх"
          description=""
        />

        <ComponentCard title="Ээлжийн мэдээлэл">
          <div className="space-y-6">
            {/* Shift Type Selection */}
            <div>
              <Label>Ээлж *</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <ShiftTypeButton
                  type="day"
                  icon="☀️"
                  label="Өдрийн ээлж"
                  isSelected={shiftData.shiftType === 'day'}
                  onClick={() => onShiftDataChange({ shiftType: 'day' })}
                  disabled={isStarting}
                />
                <ShiftTypeButton
                  type="night"
                  icon="🌙"
                  label="Шөнийн ээлж"
                  isSelected={shiftData.shiftType === 'night'}
                  onClick={() => onShiftDataChange({ shiftType: 'night' })}
                  disabled={isStarting}
                />
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <Label>Техник сонгох *</Label>
              <div className="mt-2">
                <Select
                  style={{ width: '100%' }}
                  placeholder="Ээлжийн техник сонгох..."
                  value={shiftData.vehicleId || undefined}
                  onChange={(value) => onShiftDataChange({ vehicleId: value })}
                  options={vehicles.map(v => ({
                    value: v.id,
                    label: `${v.name} - ${v.vehicleNumber}`,
                  }))}
                  size="large"
                  loading={vehicleLoading}
                  disabled={vehicleLoading || isStarting}
                  showSearch
                  optionFilterProp="label"
                />
              </div>
            </div>

            {/* Starting Mileage */}
            <div>
              <Label>Эхлэх км-ын заалт*</Label>
              <Input
                type="number"
                onChange={(e) => onShiftDataChange({ mileageStart: e.target.value })}
                placeholder="Эхлэх км-ын заалт оруулах"
                className="mt-2"
                disabled={isStarting}
              />
            </div>

            <div>
              <Label>Эхлэх мото заалт*</Label>
              <Input
                type="number"
                onChange={(e) => onShiftDataChange({ motoStart: e.target.value })}
                placeholder="Эхлэх мото заалт оруулах"
                className="mt-2"
                disabled={isStarting}
              />
            </div>

            <Button
              variant="primary"
              onClick={onStartShift}
              className="w-full"
              disabled={isStarting || !shiftData.vehicleId || !shiftData.mileageStart}
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Эхэлж байна...
                </span>
              ) : (
                'Ээлж эхлүүлэх'
              )}
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}

interface ShiftTypeButtonProps {
  type: ShiftType;
  icon: string;
  label: string;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ShiftTypeButton({ icon, label, isSelected, disabled, onClick }: ShiftTypeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-6 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-semibold text-gray-800 dark:text-white">{label}</div>
    </button>
  );
}