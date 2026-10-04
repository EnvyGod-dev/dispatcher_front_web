import dayjs from 'dayjs';

export type ShiftType = 'day' | 'night';

/**
 * determines the current shift type based on local time
 * day shift: 08:00 - 20:00
 * night shift: 20:00 - 08:00
 */
export function getCurrentShiftType(): ShiftType {
  const currentHour = dayjs().hour();
  
  // day shift is from 8:00 to 20:00
  if (currentHour >= 8 && currentHour < 20) {
    return 'day';
  }
  
  return 'night';
} 

/**
 * gets the shift type for a specific date/time
 */
export function getShiftTypeForDate(date: string | Date): ShiftType {
  const hour = dayjs(date).hour();
  
  if (hour >= 8 && hour < 20) {
    return 'day';
  }
  
  return 'night';
}