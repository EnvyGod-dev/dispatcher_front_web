import { UserRoleTypeMap } from '@/services/internal/employee/type';

export const UserRoleColorMap: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  dispatcher:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  driver:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  markscheider:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  hr: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
  ita: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  mechanic:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
};

export const renderUserRole = (role: string, name?: string) => {
  const roleLabel = UserRoleTypeMap[role] || role;
  const colorClass =
    UserRoleColorMap[role] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';

  const roleSpan = (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {roleLabel}
    </span>
  );

  if (name) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900 dark:text-gray-100">{name}</span>
        {roleSpan}
      </div>
    );
  }

  return roleSpan;
};

export const renderDisplayNameWithPosition = ({
  position,
  name,
}: {
  position?: string;
  name?: string;
}) => {
  const positionSpan = (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}
    >
      {position}
    </span>
  );

  if (name) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900 dark:text-gray-100">{name}</span>
        {position ? positionSpan : ''}
      </div>
    );
  }

  return positionSpan;
};
