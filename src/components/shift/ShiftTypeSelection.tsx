'use client';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';

interface ShiftTypeSelectionProps {
  onSelect: (type: 'day' | 'night') => void;
}

export default function ShiftTypeSelection({ onSelect }: ShiftTypeSelectionProps) {
  const shiftTypes = [
    {
      type: 'day' as const,
      label: 'Өдрийн ээлж',
      icon: (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      description: '08:00 - 20:00',
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      hoverBorderColor: 'hover:border-yellow-500 dark:hover:border-yellow-500',
      iconColor: 'text-yellow-500',
    },
    {
      type: 'night' as const,
      label: 'Шөнийн ээлж',
      icon: (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      description: '20:00 - 08:00',
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      hoverBorderColor: 'hover:border-indigo-500 dark:hover:border-indigo-500',
      iconColor: 'text-indigo-500',
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        <PageBreadcrumb
          pageTitle="Ээлж эхлүүлэх"
          description="Өдрийн эсвэл шөнийн ээлж сонгоно уу"
        />

        <ComponentCard title="Ээлжийн төрөл сонгох">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shiftTypes.map((shift) => (
              <button
                key={shift.type}
                onClick={() => onSelect(shift.type)}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${shift.bgColor} ${shift.borderColor} ${shift.hoverBorderColor} hover:shadow-lg group`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className={`${shift.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    {shift.icon}
                  </div>

                  {/* Label */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {shift.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {shift.description}
                    </p>
                  </div>

                  {/* Decorative gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${shift.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

                  {/* Arrow indicator */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                    <svg className={`w-6 h-6 ${shift.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </ComponentCard>
      </div>
    </div>
  );
}