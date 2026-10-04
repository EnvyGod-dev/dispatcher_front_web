'use client';

import { resolveOperationalDateForShift } from '@/lib/operational-date';
import {
  ShiftDetails,
  ShiftReport,
} from '@/services/internal/shift-report/types';
import type { DriverShiftGroup } from '@/services/internal/employee/type';
import { WorkLog } from '@/services/internal/work-log/types';
import { useEffect, useState } from 'react';

export type EditableWorkLog = Partial<ShiftDetails['workLogs'][number]> & {
  localId: string;
};

interface UseShiftEditFormProps {
  shift: ShiftReport;
  shiftDetails?: ShiftDetails;
}

export function useShiftEditForm({
  shift,
  shiftDetails,
}: UseShiftEditFormProps) {
  const [shiftData, setShiftData] = useState({
    driverShiftGroup: (shift.driverShiftGroup || '') as DriverShiftGroup | '',
    shiftType: shift.shiftType || '',
    operationalDate:
      shift.operationalDate ||
      resolveOperationalDateForShift({
        value: shift.shiftStart || shift.createdAt,
        shiftType: shift.shiftType,
      }) ||
      '',
    vehicleId: shift.vehicleId || '',
    mileageStart: shift.mileageStart || '',
    mileageEnd: shift.mileageEnd || '',
    motoStart: shift.motoStart || '',
    motoEnd: shift.motoEnd || '',
    notes: shift.notes || '',
    status: shift.status || '',
  });

  const [workLogs, setWorkLogs] = useState<EditableWorkLog[]>([]);

  // Update workLogs when shiftDetails changes
  useEffect(() => {
    if (shiftDetails?.workLogs) {
      setWorkLogs(
        shiftDetails.workLogs.map((workLog, index) => ({
          ...workLog,
          localId: workLog.id || `${shift.id}-${index}`,
        }))
      );
    }
  }, [shiftDetails]);

  const updateShiftField = (field: string, value: string) => {
    setShiftData((prev) => ({ ...prev, [field]: value }));
  };

  const updateWorkLog = (index: number, field: keyof WorkLog, value: any) => {
    const updated = [...workLogs];
    updated[index] = { ...updated[index], [field]: value };
    setWorkLogs(updated);
  };

  const addWorkLog = (input: Partial<EditableWorkLog> = {}) => {
    setWorkLogs((prev) => [
      {
        localId: `new-${Date.now()}-${prev.length}`,
        shiftId: shift.id,
        status: 'completed',
        startTime: shift.createdAt || new Date().toISOString(),
        endTime: shift.createdAt || new Date().toISOString(),
        notes: '',
        ...input,
      },
      ...prev,
    ]);
  };

  const deleteWorkLog = (index: number) => {
    const updated = [...workLogs];
    updated.splice(index, 1);
    setWorkLogs(updated);
  };

  return {
    shiftData,
    workLogs,
    updateShiftField,
    updateWorkLog,
    addWorkLog,
    deleteWorkLog,
  };
}
