'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { useState } from 'react';

export type ExportType = 'shifts' | 'worklogs';
export type ExportFormat = 'xlsx' | 'csv';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (type: ExportType, format: ExportFormat) => void;
  visibleColumns: string[];
  isExporting?: boolean;
}

export default function ExportDialog({
  open,
  onOpenChange,
  onExport,
  visibleColumns,
  isExporting = false,
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('shifts');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  const handleExport = () => {
    onExport(exportType, exportFormat);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Файлаар татах</DialogTitle>
          <DialogDescription>
            Ээлжийн тайлангийн файлын төрөл болон форматыг сонгоно уу.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Экспорт хийх төрөл
            </label>
            <Select
              value={exportType}
              onValueChange={(value) => setExportType(value as ExportType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Төрөл сонгох..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shifts">Ээлжээр татах</SelectItem>
                <SelectItem value="worklogs">Рейсээр татах</SelectItem>
              </SelectContent>
            </Select>

            {exportType === 'shifts' && (
              <p className="text-sm text-muted-foreground">
                Зөвхөн ээлжийн ерөнхий мэдээлэл экспорт хийгдэнэ.
              </p>
            )}
            {exportType === 'worklogs' && (
              <p className="text-sm text-muted-foreground">
                Ээлжийн мэдээлэл болон Рейсийн дэлгэрэнгүй мэдээлэл экспорт
                хийгдэнэ.
              </p>
            )}
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Файлын формат
            </label>
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Формат сонгох..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visible Columns Info */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Файлын баганууд
            </label>
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Одоогоор {visibleColumns.length} багана сонгогдсон байна. Файлын
              багануудыг өөрчлөхийн тулд баганы тохиргооноос сонгоно уу.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Цуцлах
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Татаж байна...' : 'Татах'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
