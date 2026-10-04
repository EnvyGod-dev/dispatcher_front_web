'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select } from 'antd';
import { toast } from 'sonner';
import employeeService from '@/services/internal/employee';
import {
  driverShiftGroupOptions,
  type DriverShiftGroup,
} from '@/services/internal/employee/type';

interface DriverShiftGroupDropdownProps {
  employeeId: string;
  currentDriverShiftGroup?: DriverShiftGroup | null;
  disabled?: boolean;
}

export default function DriverShiftGroupDropdown({
  employeeId,
  currentDriverShiftGroup,
  disabled = false,
}: DriverShiftGroupDropdownProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<DriverShiftGroup | undefined>(
    currentDriverShiftGroup ?? undefined
  );

  useEffect(() => {
    setValue(currentDriverShiftGroup ?? undefined);
  }, [currentDriverShiftGroup]);

  const { mutateAsync: updateDriverShiftGroup, isPending } = useMutation({
    mutationFn: employeeService.updateEmployeeDriverShiftGroup,
    onSuccess: (_, variables) => {
      setValue(variables.driverShiftGroup);
      queryClient.invalidateQueries({ queryKey: ['Employees'] });
      toast.success('ABCD ээлж амжилттай шинэчлэгдлээ');
    },
    onError: (error: Error) => {
      setValue(currentDriverShiftGroup ?? undefined);
      toast.error(error.message || 'ABCD ээлж шинэчлэхэд алдаа гарлаа');
    },
  });

  const handleChange = async (nextValue: DriverShiftGroup) => {
    if (nextValue === currentDriverShiftGroup) {
      return;
    }

    setValue(nextValue);

    try {
      await updateDriverShiftGroup({
        userId: employeeId,
        driverShiftGroup: nextValue,
      });
    } catch (error) {
      console.error('Driver shift group update error:', error);
    }
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      disabled={disabled || isPending}
      loading={isPending}
      options={driverShiftGroupOptions}
      className="w-32"
      size="small"
      placeholder="ABCD"
    />
  );
}
