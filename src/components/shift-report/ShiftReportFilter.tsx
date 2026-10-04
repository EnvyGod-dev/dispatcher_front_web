import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MiningBlock } from '@/services/internal/mining-block/types';
import type { ShiftReportFilters } from '@/services/internal/shift-report/types';
import { Stockpile } from '@/services/internal/stockpile/types';
import { VehicleOrganization } from '@/services/internal/vehicle-organization/types';
import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from '../form/date-picker';
import StockpileLabel from '../stockpile/StockpileTag';
import ColumnSettings from '../vehicles/ColumnSettings';
import { ColumnOption } from '../vehicles/ColumnSettings';
import { formatDate } from '@/lib/time-formatter';

type ShiftReportFilterState = Pick<
  ShiftReportFilters,
  | 'driverName'
  | 'vehicleCode'
  | 'shiftType'
  | 'status'
  | 'operationalDate'
  | 'vehicleOrganizationId'
  | 'miningBlockId'
  | 'stockpileId'
  | 'startDate'
  | 'endDate'
>;

interface ShiftReportFilterProps {
  filters: ShiftReportFilterState;
  onFiltersChange: (filters: ShiftReportFilterState) => void;
  miningBlocks: MiningBlock[];
  stockpiles: Stockpile[];
  vehicleOrganizations: VehicleOrganization[];
  isLoading?: boolean;
  availableColumns: ColumnOption[];
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
}


type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
  render?: ReactNode;
};

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
  disabled = false,
}: {
  value?: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('mn-MN');
    if (!keyword) return options;

    return options.filter((option) =>
      `${option.label} ${option.searchText ?? ''}`
        .toLocaleLowerCase('mn-MN')
        .includes(keyword)
    );
  }, [options, search]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((prev) => !prev);
          setSearch('');
        }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>
          {selected?.render ?? selected?.label ?? placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          <div className="relative p-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
                setSearch('');
              }}
              className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Бүгд
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${
                    option.value === value ? 'bg-accent' : ''
                  }`}
                >
                  {option.render ?? option.label}
                </button>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Илэрц олдсонгүй
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const shiftTypeOptions = [
  { value: 'all', label: 'Бүх ээлж' },
  { value: 'day', label: 'Өдрийн ээлж' },
  { value: 'night', label: 'Шөнийн ээлж' },
];

const shiftStatusOptions = [
  { value: 'all', label: 'Бүх төлөв' },
  { value: 'started', label: 'Ажиллаж байгаа' },
  { value: 'completed', label: 'Дууссан' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
];

export default function ShiftReportFilter({
  filters,
  onFiltersChange,
  miningBlocks,
  stockpiles,
  vehicleOrganizations,
  isLoading = false,
  availableColumns,
  visibleColumns,
  onVisibleColumnsChange,
}: ShiftReportFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<ShiftReportFilterState>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== undefined && value !== ''
  );

  const activeFilterCount = Object.entries(localFilters).filter(
    ([key, value]) => value !== undefined && value !== ''
  ).length;

  const handleFilterChange = (key: keyof ShiftReportFilterState, value: any) => {
    const newFilters = {
      ...localFilters,
      [key]: value === 'all' || value === '' ? undefined : value,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: ShiftReportFilterState = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const removeFilter = (key: keyof ShiftReportFilterState) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getFilterLabel = (key: keyof ShiftReportFilterState): string => {
    const labels: Record<keyof ShiftReportFilterState, string> = {
      driverName: 'Оператор',
      vehicleCode: 'Техник',
      shiftType: 'Ээлж',
      status: 'Төлөв',
      operationalDate: 'Ээлжийн огноо',
      vehicleOrganizationId: 'Компани',
      miningBlockId: 'Олборлолтын блок',
      stockpileId: 'Овоолго',
      startDate: 'Эхлэх огноо',
      endDate: 'Дуусах огноо',
    };
    return labels[key];
  };

  const getFilterDisplayValue = (
    key: keyof ShiftReportFilterState,
    value: any
  ): string => {
    if (key === 'shiftType') {
      return (
        shiftTypeOptions.find((opt) => opt.value === value)?.label || value
      );
    }
    if (key === 'status') {
      return (
        shiftStatusOptions.find((opt) => opt.value === value)?.label || value
      );
    }
    if (key === 'miningBlockId') {
      return miningBlocks.find((block) => block.id === value)?.name || value;
    }
    if (key === 'vehicleOrganizationId') {
      return (
        vehicleOrganizations.find((organization) => organization.id === value)
          ?.name || value
      );
    }
    if (key === 'stockpileId') {
      return (
        stockpiles.find((stockpile) => stockpile.id === value)?.type || value
      );
    }
    if (
      key === 'operationalDate' ||
      key === 'startDate' ||
      key === 'endDate'
    ) {
      return value;
    }
    return value;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Шүүлтүүр
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-brand-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Цэвэрлэх
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Оператороор хайх"
              value={localFilters.driverName || ''}
              onChange={(e) => handleFilterChange('driverName', e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <ColumnSettings
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onSave={onVisibleColumnsChange}
          />
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="bg-background rounded-lg border border-border p-6 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {/* Row 1: Text Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Операторын нэр
                </label>
                <Input
                  type="text"
                  placeholder="Операторын нэрээр хайх..."
                  value={localFilters.driverName || ''}
                  onChange={(e) =>
                    handleFilterChange('driverName', e.target.value)
                  }
                  className="h-10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Техникийн нэр
                </label>
                <Input
                  type="text"
                  placeholder="Техникийн нэрээр хайх..."
                  value={localFilters.vehicleCode || ''}
                  onChange={(e) =>
                    handleFilterChange('vehicleCode', e.target.value)
                  }
                  className="h-10"
                />
              </div>
            </div>

            {/* Row 2: Searchable Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ээлжийн төрөл
                </label>
                <select
                  value={localFilters.shiftType || 'all'}
                  onChange={(e) => handleFilterChange('shiftType', e.target.value)}
                  disabled={isLoading}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {shiftTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Төлөв
                </label>
                <select
                  value={localFilters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  disabled={isLoading}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {shiftStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Компани
                </label>
                <SearchableSelect
                  value={localFilters.vehicleOrganizationId}
                  placeholder="Бүгд"
                  searchPlaceholder="Компани хайх..."
                  disabled={isLoading}
                  options={vehicleOrganizations.map((organization) => ({
                    value: organization.id,
                    label: organization.name,
                  }))}
                  onChange={(value) =>
                    handleFilterChange('vehicleOrganizationId', value)
                  }
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Олборлолтын блок
                </label>
                <SearchableSelect
                  value={localFilters.miningBlockId}
                  placeholder="Бүгд"
                  searchPlaceholder="Block хайх..."
                  disabled={isLoading}
                  options={miningBlocks.map((block) => ({
                    value: block.id,
                    label: block.name,
                    searchText: `${block.name} ${block.layerNumber ?? ''}`,
                  }))}
                  onChange={(value) => handleFilterChange('miningBlockId', value)}
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Овоолго
                </label>
                <SearchableSelect
                  value={localFilters.stockpileId}
                  placeholder="Бүгд"
                  searchPlaceholder="Овоолго хайх..."
                  disabled={isLoading}
                  options={stockpiles.map((stockpile) => ({
                    value: stockpile.id,
                    label: `${stockpile.type} ${stockpile.layerNumber ?? ''}`.trim(),
                    searchText: `${stockpile.type} ${stockpile.layerNumber ?? ''}`,
                    render: (
                      <StockpileLabel
                        type={stockpile.type}
                        layerNumber={stockpile.layerNumber}
                      />
                    ),
                  }))}
                  onChange={(value) => handleFilterChange('stockpileId', value)}
                />
              </div>
            </div>

            {/* Row 3: Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ээлжийн огноо
                </label>
                <DatePicker
                  id="operational-date-picker"
                  placeholder="Ээлжийн огноо"
                  mode="single"
                  defaultDate={
                    localFilters.operationalDate
                      ? new Date(`${localFilters.operationalDate}T00:00:00`)
                      : undefined
                  }
                  onChange={(currentDateString) =>
                    handleFilterChange(
                      'operationalDate',
                      currentDateString[0]
                        ? formatDate(currentDateString[0])
                        : undefined
                    )
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Эхлэх огноо
                </label>
                <DatePicker
                  id="start-date-picker"
                  placeholder="Эхлэх Огноо"
                  mode="single"
                  defaultDate={
                    localFilters.startDate
                      ? new Date(`${localFilters.startDate}T00:00:00`)
                      : undefined
                  }
                  onChange={(currentDateString) =>
                    handleFilterChange(
                      'startDate',
                      currentDateString[0]
                        ? formatDate(currentDateString[0])
                        : undefined
                    )
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Дуусах огноо
                </label>
                <DatePicker
                  id="end-date-picker"
                  placeholder="Эхлэх Огноо"
                  mode="single"
                  defaultDate={
                    localFilters.endDate
                      ? new Date(`${localFilters.endDate}T00:00:00`)
                      : undefined
                  }
                  onChange={(currentDateString) =>
                    handleFilterChange(
                      'endDate',
                      currentDateString[0]
                        ? formatDate(currentDateString[0])
                        : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([key, value]) => {
            if (!value) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-full text-sm"
              >
                {getFilterLabel(key as keyof ShiftReportFilterState)}:{' '}
                {getFilterDisplayValue(key as keyof ShiftReportFilterState, value)}
                <button
                  onClick={() => removeFilter(key as keyof ShiftReportFilterState)}
                  className="hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
