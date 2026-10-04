'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shiftReportKeys } from '../queryKeys';

type InvalidateDetailOptions = {
  shiftId?: string;
};

export function useShiftReportInvalidation() {
  const queryClient = useQueryClient();

  return async ({ shiftId }: InvalidateDetailOptions = {}) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: shiftReportKeys.all }),
      shiftId
        ? queryClient.invalidateQueries({
          queryKey: shiftReportKeys.detail(shiftId),
        })
        : Promise.resolve(),
    ]);
  };
}

export function useMutationToastMessages() {
  return {
    onShiftSaved: () => toast.success('Ээлж амжилттай хадгалагдлаа'),
    onShiftCreated: () => toast.success('Ээлж амжилттай үүслээ'),
    onShiftDeleted: () => toast.success('Ээлж амжилттай устгагдлаа'),
    onWorkLogSaved: () => toast.success('Рейс амжилттай хадгалагдлаа'),
    onWorkLogDeleted: () => toast.success('Рейс амжилттай устгагдлаа'),
  };
}
