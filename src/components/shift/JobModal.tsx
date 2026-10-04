'use client';

import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

interface JobModalProps {
  isOpen: boolean;
  planId: string;
  routeInfo: {
    pickUpBlockName?: string;
    dropOffBlockName?: string;
    routeCode?: string;
  };
  currentJob: {
    transportedAmount: string;
    notes: string;
  };
  onJobChange: (updates: Partial<JobModalProps['currentJob']>) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function JobModal({
  isOpen,
  planId,
  routeInfo,
  currentJob,
  onJobChange,
  onSave,
  onClose,
}: JobModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        Рейс эхлүүлэх
      </h3>

      {/* Route Info Display */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Маршрут
        </div>
        {routeInfo.routeCode && (
          <div className="text-xs   text-gray-600 dark:text-gray-400 mb-2">
            {routeInfo.routeCode}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-orange-700 dark:text-orange-400">
            {routeInfo.pickUpBlockName}
          </span>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          <span className="font-medium text-blue-700 dark:text-blue-400">
            {routeInfo.dropOffBlockName}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Тээвэрлэсэн хэмжээ (тонн) *</Label>
          <Input
            type="number"
            step={0.1}
            onChange={(e) => onJobChange({ transportedAmount: e.target.value })}
            placeholder="Хэмжээ оруулах..."
            className="mt-2"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Техникээр тээвэрлэсэн хэмжээг оруулна уу
          </p>
        </div>

        <div>
          <Label>Тэмдэглэл</Label>
          <textarea
            value={currentJob.notes}
            onChange={(e) => onJobChange({ notes: e.target.value })}
            placeholder="Тэмдэглэл оруулах..."
            className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Буцах
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            className="flex-1"
            disabled={!currentJob.transportedAmount}
          >
            Рейс эхлүүлэх
          </Button>
        </div>
      </div>
    </Modal>
  );
}
