'use client';

import { useFuelPermissions } from '@/lib/fuel/permissions';
import { cn } from '@/lib/utils';
import { Eye, Fuel } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const tabs = [
  { href: '/fuel', label: 'Тойм' },
  { href: '/fuel/refuelings', label: 'Олголт' },
  { href: '/fuel/receipts', label: 'Орлого' },
  { href: '/fuel/consumption', label: 'Зарцуулалт' },
  { href: '/fuel/reports', label: 'Тайлан' },
  { href: '/fuel/audit', label: 'Аудит', control: true },
  { href: '/fuel/settings', label: 'Тохиргоо', control: true },
];

export default function FuelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canView, canControl } = useFuelPermissions();

  if (!canView) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <Fuel className="size-8 text-gray-300" />
        <p className="font-medium text-gray-700 dark:text-gray-300">Түлшний хэсэгт хандах эрхгүй байна</p>
      </div>
    );
  }

  const isActive = (href: string) => (href === '/fuel' ? pathname === '/fuel' : pathname.startsWith(href));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Fuel className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Түлш</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Олголт, орлого, үлдэгдэл, зарцуулалтын хяналт</p>
          </div>
        </div>
        {!canControl && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <Eye className="size-3.5" /> Зөвхөн харах эрх
          </span>
        )}
      </div>

      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-gray-200 px-1 dark:border-gray-800">
        {tabs
          .filter((t) => !t.control || canControl)
          .map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition',
                isActive(t.href)
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
              )}
            >
              {t.label}
            </Link>
          ))}
      </nav>

      {children}
    </div>
  );
}
