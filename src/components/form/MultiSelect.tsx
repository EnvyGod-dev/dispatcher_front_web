import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  text: string | React.ReactNode;
  selected: boolean;
}

interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder = 'Select options...',
  options,
  value = [],
  onChange,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(value);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    if (disabled) return;
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const handleRemove = (e: React.MouseEvent, valueToRemove: string) => {
    e.stopPropagation();
    const newValues = selectedValues.filter((v) => v !== valueToRemove);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const selectedOptions = options.filter((opt) =>
    selectedValues.includes(opt.value)
  );

  const filteredOptions = options.filter((option) => {
    if (!searchQuery) return true;
    const text =
      typeof option.text === 'string'
        ? option.text
        : String(option.text);
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={cn('w-full', className)} ref={dropdownRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
      )}

      <div className="relative">
        {/* trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-all',
            'border-gray-300 hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
            disabled && 'cursor-not-allowed opacity-50',
            isOpen && 'border-brand-500 ring-2 ring-brand-500/20'
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1.5 overflow-hidden">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                >
                  <span className="max-w-[120px] truncate">{option.text}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, option.value)}
                    className="rounded-sm hover:bg-brand-100 dark:hover:bg-brand-800/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder}
              </span>
            )}
          </div>

          <ChevronDown
            className={cn(
              'ml-2 h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {/* search input */}
            <div className="border-b border-gray-200 p-2 dark:border-gray-700">
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Хайх..."
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Хайлтад тохирсон сонголт олдсонгүй' : 'Сонголт алга'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggle(option.value)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        isSelected &&
                        'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                          isSelected
                            ? 'border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500'
                            : 'border-gray-300 dark:border-gray-600'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="flex-1 truncate text-left">
                        {option.text}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;