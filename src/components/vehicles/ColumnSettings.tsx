import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface ColumnOption {
  key: string;
  label: string;
  defaultVisible: boolean;
  sortable?: boolean
  sortKey?: string
}

interface ColumnSettingsProps {
  columns: ColumnOption[];
  visibleColumns: string[];
  onSave: (visibleColumns: string[]) => void;
}

export default function ColumnSettings({
  columns,
  visibleColumns,
  onSave,
}: ColumnSettingsProps) {
  const [selectedColumns, setSelectedColumns] =
    useState<string[]>(visibleColumns);

  // Sync local state with prop changes
  useEffect(() => {
    setSelectedColumns(visibleColumns);
  }, [visibleColumns]);

  const handleToggle = (key: string) => {
    const newSelection = selectedColumns.includes(key)
      ? selectedColumns.filter((col) => col !== key)
      : [...selectedColumns, key];

    setSelectedColumns(newSelection);
    onSave(newSelection);
  };

  const handleReset = () => {
    const defaults = columns
      .filter((col) => col.defaultVisible)
      .map((col) => col.key);
    setSelectedColumns(defaults);
    onSave(defaults);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Баганы тохиргоо
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Харагдах багана сонгох</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={selectedColumns.includes(column.key)}
              onCheckedChange={() => handleToggle(column.key)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            Анхны байдалд шилжүүлэх
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
