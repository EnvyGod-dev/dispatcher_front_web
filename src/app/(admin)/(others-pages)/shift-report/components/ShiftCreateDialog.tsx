'use client';

import Label from '@/components/form/Label';
import SearchableSelect from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import employeeService from '@/services/internal/employee';
import type { Employee } from '@/services/internal/employee/type';
import { shiftTypeItems, type CreateShiftInput } from '@/services/internal/shift/types';
import vehicleService from '@/services/internal/vehicle';
import type { Vehicle } from '@/services/internal/vehicle/types';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ShiftCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateShiftInput) => Promise<void>;
  isPending?: boolean;
}

const initialForm: CreateShiftInput = {
  driverId: '',
  vehicleId: '',
  shiftType: 'day',
  mileageStart: '',
  motoStart: '',
};

export default function ShiftCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ShiftCreateDialogProps) {
  const [form, setForm] = useState<CreateShiftInput>(initialForm);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
    }
  }, [open]);

  const { data: employeesData, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['shift-create', 'drivers'],
    queryFn: () => employeeService.getEmployees({ offset: 0, limit: 500 }),
    enabled: open,
    staleTime: 60000,
  });

  const { data: vehiclesData, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['shift-create', 'vehicles'],
    queryFn: () => vehicleService.getShiftVehicles({ offset: 0, limit: 500, type: 'truck' }),
    enabled: open,
    staleTime: 60000,
  });

  const drivers = useMemo(
    () =>
      (employeesData?.data || []).filter(
        (employee: Employee) => employee.role === 'driver' && employee.isActive
      ),
    [employeesData]
  );

  const vehicles = useMemo(
    () => (vehiclesData?.data || []).filter((vehicle: Vehicle) => vehicle.type === 'truck'),
    [vehiclesData]
  );

  const driverOptions = useMemo(
    () =>
      drivers.map((driver) => ({
        value: driver.id,
        label: `${driver.lastName} ${driver.firstName}`,
        searchText: [
          driver.lastName,
          driver.firstName,
          driver.phoneNumber,
          driver.name,
          driver.position,
        ]
          .filter((value): value is string => Boolean(value))
          .join(' '),
        keywords: [
          driver.lastName,
          driver.firstName,
          driver.phoneNumber,
          driver.name,
          driver.position,
        ].filter((value): value is string => Boolean(value)),
      })),
    [drivers]
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: vehicle.code ? `${vehicle.code} ${vehicle.vehicleNumber || ''}`.trim() : vehicle.name,
        searchText: [
          vehicle.code,
          vehicle.name,
          vehicle.vehicleNumber,
          vehicle.mineNumber,
        ]
          .filter((value): value is string => Boolean(value))
          .join(' '),
        keywords: [
          vehicle.code,
          vehicle.code?.replace(/[^a-zA-Z0-9]/g, ''),
          vehicle.code?.replace(/\D/g, ''),
          vehicle.name,
          vehicle.vehicleNumber,
          vehicle.vehicleNumber?.replace(/[^a-zA-Z0-9]/g, ''),
          vehicle.vehicleNumber?.replace(/\D/g, ''),
          vehicle.mineNumber,
        ].filter((value): value is string => Boolean(value)),
      })),
    [vehicles]
  );

  const isLoading = isEmployeesLoading || isVehiclesLoading;

  const handleSubmit = async () => {
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ээлж шинээр бүртгэх</DialogTitle>
          <DialogDescription>
            Диспетчер сонгосон операторт шинэ ээлж нээж, тайлангийн хүснэгтээс шууд удирдана.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Мэдээлэл ачааллаж байна...
          </div>
        ) : (
          <div className="grid gap-5 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Оператор</Label>
              <SearchableSelect
                value={form.driverId}
                onChange={(value) => setForm((prev) => ({ ...prev, driverId: value }))}
                options={driverOptions}
                placeholder="Оператор сонгох"
                searchPlaceholder="Оператор хайх"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Техник</Label>
              <SearchableSelect
                value={form.vehicleId}
                onChange={(value) => setForm((prev) => ({ ...prev, vehicleId: value }))}
                options={vehicleOptions}
                placeholder="Техник сонгох"
                searchPlaceholder="Техник хайх"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Ээлжийн төрөл</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {shiftTypeItems.map((item) => {
                  const selected = form.shiftType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, shiftType: item.value }))}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-border bg-background hover:border-brand-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{item.label} ээлж</div>
                      <div className="text-xs text-muted-foreground">
                        {item.value === 'day' ? 'Өдрийн ажил эхлүүлэх' : 'Шөнийн ажил эхлүүлэх'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Эхлэх км</Label>
              <Input
                type="number"
                value={form.mileageStart}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mileageStart: e.target.value }))
                }
                placeholder="Км заалт"
              />
            </div>

            <div className="space-y-2">
              <Label>Эхлэх мото цаг</Label>
              <Input
                type="number"
                value={form.motoStart}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, motoStart: e.target.value }))
                }
                placeholder="Мото цаг"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Болих
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              isLoading ||
              !form.driverId ||
              !form.vehicleId ||
              !form.mileageStart ||
              !form.motoStart
            }
          >
            {isPending ? 'Үүсгэж байна...' : 'Ээлж бүртгэх'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
