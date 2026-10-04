import { UserStatus } from '@/services/internal/employee/type';

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

const statusConfig = {
  available: {
    label: 'Ажиллаж байгаа',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-200',
    dotColor: 'bg-green-500',
  },
  resting: {
    label: 'Амарсан',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-800 dark:text-gray-200',
    dotColor: 'bg-gray-500',
  },
  sick_leave: {
    label: 'Өвчтэй',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-200',
    dotColor: 'bg-orange-500',
  },
  on_leave: {
    label: 'Чөлөөтэй',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-200',
    dotColor: 'bg-purple-500',
  },
  inactive: {
    label: 'Идэвхгүй',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-200',
    dotColor: 'bg-red-500',
  },
};

export default function StatusBadge({
  status,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
