import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import type { ShiftType } from "@/services/internal/shift/types";

dayjs.extend(utc);

const dayShiftStartMinutes = 6 * 60 + 30;

const getMinutesInDay = (value: dayjs.Dayjs) => {
  return value.hour() * 60 + value.minute();
};

export const resolveOperationalDateForShift = ({
  value,
  shiftType,
}: {
  value?: string | Date | null;
  shiftType: ShiftType;
}) => {
  if (!value) {
    return undefined;
  }

  const date = dayjs.utc(value).local();

  if (!date.isValid()) {
    return undefined;
  }

  if (shiftType === "day") {
    return date.format("YYYY-MM-DD");
  }

  if (getMinutesInDay(date) < dayShiftStartMinutes) {
    return date.subtract(1, "day").format("YYYY-MM-DD");
  }

  return date.format("YYYY-MM-DD");
};
