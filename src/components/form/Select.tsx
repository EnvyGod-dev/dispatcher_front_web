import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string | React.ReactNode;
  keywords?: string[];
  searchText?: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  value?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  onCreateOption?: (inputValue: string) => void;
  createLabel?: (inputValue: string) => string;
}

const normalizeSearchText = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSearchTokens = (option: Option) => {
  const baseValues = [
    option.searchText,
    typeof option.label === 'string' ? option.label : undefined,
    ...(option.keywords || []),
    option.value,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map((value) => String(value));

  return baseValues.flatMap((value) => {
    const normalized = normalizeSearchText(value);
    const compact = normalized.replace(/\s+/g, '');
    const digitsOnly = value.replace(/\D/g, '');

    return [normalized, compact, digitsOnly].filter(Boolean);
  });
};

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = 'Select an option',
  onChange,
  className = '',
  value = '',
  disabled = false,
  searchPlaceholder = 'Search...',
  allowCreate = false,
  onCreateOption,
  createLabel = (input) => `Create "${input}"`,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value);
  const [searchValue, setSearchValue] = useState('');

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === selectedValue ? '' : currentValue;
    setSelectedValue(newValue);
    onChange(newValue);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreate = () => {
    setSelectedValue(searchValue);
    onChange(searchValue);
    setOpen(false);
    setSearchValue('');
  };

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const getOptionSearchValue = (option: Option) => {
    if (option.searchText) return option.searchText;

    if (typeof option.label === 'string') return option.label;

    return option.value;
  };
  const getCommandKeywords = (option: Option) =>
    (option.keywords || [])
      .filter((value) => value !== undefined && value !== null && value !== '')
      .map((value) => String(value));
  const normalizedSearchValue = normalizeSearchText(searchValue);
  const compactSearchValue = normalizedSearchValue.replace(/\s+/g, '');
  const filteredOptions =
    normalizedSearchValue.length === 0
      ? options
      : options.filter((option) => {
          const tokens = getSearchTokens(option);

          return tokens.some(
            (token) =>
              token.includes(normalizedSearchValue) ||
              token.includes(compactSearchValue)
          );
        });

  // Check if search value matches any existing option
  const hasExactMatch = options.some(
    (opt) =>
      getSearchTokens(opt).some(
        (token) =>
          token === normalizedSearchValue || token === compactSearchValue
      )
  );

  const showCreateOption =
    allowCreate && searchValue.trim() !== '' && !hasExactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between rounded-lg border border-input bg-background px-4 text-sm text-foreground shadow-theme-xs',
            'placeholder:text-muted-foreground focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-background dark:focus:border-brand-800',
            selectedValue
              ? 'text-foreground'
              : 'text-muted-foreground',
            className
          )}
        >
          {selectedOption ? selectedOption.label : selectedValue || placeholder}

          {/* {selectedOption ? selectedOption.label : placeholder} */}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full border-border bg-popover p-0 text-popover-foreground">
        <Command className="bg-popover" shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="text-foreground"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty className="text-muted-foreground">
            Сонголт олдсонгүй.
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={getOptionSearchValue(option)}
                keywords={getCommandKeywords(option)}
                onSelect={() => handleSelect(option.value)}
                className={cn(
                  'cursor-pointer text-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground'
                )}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedValue === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {typeof option.label === 'string' ? option.label : option.label}
              </CommandItem>
            ))}

            {showCreateOption && (
              <CommandItem
                onSelect={handleCreate}
                className={cn(
                  'cursor-pointer text-foreground',
                  'hover:bg-brand-50 dark:hover:bg-brand-900/20',
                  'border-t border-border'
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                {createLabel(searchValue)}
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Select;
