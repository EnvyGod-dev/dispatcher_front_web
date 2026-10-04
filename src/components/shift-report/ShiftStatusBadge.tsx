import { ShiftStatus } from '@/services/internal/shift/types';

export const shiftStatusBadgeConfig = {
  started: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-400',
    dot: 'bg-blue-600',
    label: 'Явагдаж байна',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-400',
    dot: 'bg-green-600',
    label: 'Дууссан',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-400',
    dot: 'bg-red-600',
    label: 'Цуцлагдсан',
  },
};

interface ShiftStatusBadgeProps {
  status: ShiftStatus;
}

export default function ShiftStatusBadge({ status }: ShiftStatusBadgeProps) {
  const config = shiftStatusBadgeConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
