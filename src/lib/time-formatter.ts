import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export function formatDateFromNow(
  value: string | number | Date | null | undefined
): string | undefined {
  if (!value) return;

  return dayjs(value).fromNow();
}

export function formatDate(
  value: string | number | Date | null | undefined
): string | undefined {
  if (!value) return;

  return dayjs(value).utc().local().format('YYYY-MM-DD');
}

export function formatDateFull(
  value: string | number | Date | null | undefined
): string | null {
  if (!value) return null;

  return dayjs(value).utc().local().format('YYYY-MM-DD HH:mm');
}
