
interface BadgeProps {
  children: React.ReactNode;
  color?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

export const TableBadge: React.FC<BadgeProps> = ({ children, color = 'default' }) => {
  const colorClasses = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
};

