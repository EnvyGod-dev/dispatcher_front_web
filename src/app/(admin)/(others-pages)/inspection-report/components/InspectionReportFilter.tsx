'use client';

import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Vehicle, vehicleTypeMap } from '@/services/internal/vehicle/types';
import { X } from 'lucide-react';
import { useCallback } from 'react';

interface InspectionFilters {
  vehicleType?: string;
  vehicleId?: string;
  status?: string;
}

interface InspectionReportFilterProps {
  filters: InspectionFilters;
  onFiltersChange: (filters: InspectionFilters) => void;
  vehicles: Vehicle[];
  isLoading: boolean;
}

const statusOptions = [
  { value: 'normal', label: 'Хэвийн' },
  { value: 'issue', label: 'Аюултай' },
  { value: 'needs_inspection', label: 'Үзлэг шаардлагатай' },
];

export default function InspectionReportFilter({
  filters,
  onFiltersChange,
  vehicles,
  isLoading,
}: InspectionReportFilterProps) {
  const handleFilterChange = (
    field: keyof InspectionFilters,
    value: string | undefined
  ) => {
    const newFilters = { ...filters, [field]: value || undefined };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.code}`,
  }));

  const hasActiveFilters =
    filters.vehicleType || filters.vehicleId || filters.status;

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      {hasActiveFilters && (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearFilters}
            className="gap-2 text-gray-600 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
            Цэвэрлэх
          </Button>
        </div>
      )}

      {/* Filters - Always Visible */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Техникийн төрөл
            </label>
            <Select
              value={filters.vehicleType || ''}
              onChange={(value) => handleFilterChange('vehicleType', value)}
              placeholder="Бүгд"
              options={vehicleTypeMap}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Техник
            </label>
            <Select
              value={filters.vehicleId || ''}
              onChange={(value) => handleFilterChange('vehicleId', value)}
              placeholder="Бүгд"
              options={vehicleOptions}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Төлөв
            </label>
            <Select
              value={filters.status || ''}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Бүгд"
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.vehicleType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
              Төрөл:{' '}
              {
                vehicleTypeMap.find((opt) => opt.value === filters.vehicleType)
                  ?.label
              }
              <button
                onClick={() => handleFilterChange('vehicleType', undefined)}
                className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.vehicleId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
              Техник:{' '}
              {
                vehicleOptions.find((opt) => opt.value === filters.vehicleId)
                  ?.label
              }
              <button
                onClick={() => handleFilterChange('vehicleId', undefined)}
                className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm">
              Төлөв:{' '}
              {statusOptions.find((opt) => opt.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', undefined)}
                className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
