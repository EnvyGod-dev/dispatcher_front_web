'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select } from 'antd';
import { toast } from 'sonner';
import { UserStatus } from '@/services/internal/employee/type';
import employeeService from '@/services/internal/employee';
import StatusBadge from './StatusBadge';

interface StatusDropdownProps {
  employeeId: string;
  currentStatus: UserStatus;
  disabled?: boolean;
}

export const statusOptions = [
  { value: 'available', label: 'Ажиллаж байгаа' },
  { value: 'resting', label: 'Амарсан' },
  { value: 'sick_leave', label: 'Өвчтэй' },
  { value: 'on_leave', label: 'Чөлөөтэй' },
  { value: 'inactive', label: 'Идэвхгүй/Ажлаас гарсан' },
];

export default function StatusDropdown({
  employeeId,
  currentStatus,
  disabled = false,
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutateAsync: updateStatus, isPending } = useMutation({
    mutationFn: employeeService.updateEmployeeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Employees'] });
      toast.success('Төлөв амжилттай шинэчлэгдлээ');
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Төлөв шинэчлэхэд алдаа гарлаа');
    },
  });

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    try {
      await updateStatus({
        userId: employeeId,
        status: newStatus,
      });
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  return (
    <div className="w-full max-w-[144px]">
      {!isOpen ? (
        <div
          onClick={() => !disabled && !isPending && setIsOpen(true)}
          className={`w-full ${!disabled && !isPending ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        >
          <StatusBadge status={currentStatus} />
        </div>
      ) : (
        <Select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={disabled || isPending}
          loading={isPending}
          options={statusOptions}
          className="w-full"
          size="small"
          placeholder="Төлөв сонгох"
          open={isOpen}
          onBlur={() => setIsOpen(false)}
          autoFocus
        />
      )}
    </div>
  );
}
