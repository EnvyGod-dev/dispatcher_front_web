'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InspectionResult, InspectionStatus } from './types';
import { Inspection } from '@/services/internal/inspection/types';
import inspectionService from '@/services/internal/inspection';

interface InspectionItemProps {
  inspection: Inspection;
  result?: InspectionResult;
  onChange: (
    inspectionId: string,
    field: keyof InspectionResult,
    value: any
  ) => void;
}

const statusLabels: Record<InspectionStatus, string> = {
  normal: 'Хэвийн',
  issue: 'Авултай',
  needs_inspection: 'Анхаарах',
};

export default function InspectionItem({
  inspection,
  result,
  onChange,
}: InspectionItemProps) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => inspectionService.uploadImage(file),
    onSuccess: (response) => {
      onChange(inspection.id, 'photoUrl', response.body.url);
      toast.success('Зураг амжилттай хадгалагдлаа');
    },
    onError: (x) => {
      toast.error(x?.message || 'Зураг хадгалахад алдаа гарлаа');
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Зөвхөн зурагны файл сонгоно уу');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Зургийн хэмжээ 5MB-аас хэтрэх ёсгүй');
      return;
    }

    setIsUploading(true);
    uploadImageMutation.mutate(file);
  };

  const statusOptions: Array<{
    status: InspectionStatus;
    label: string;
    icon: string;
  }> = [
    { status: 'normal', label: statusLabels.normal, icon: '✓' },
    { status: 'issue', label: statusLabels.issue, icon: '⚠' },
    {
      status: 'needs_inspection',
      label: statusLabels.needs_inspection,
      icon: '!',
    },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-gray-800 dark:text-white">
            {inspection.name}
            <span className="text-red-500 ml-1">*</span>
          </div>
          {inspection.type && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {inspection.type}
            </div>
          )}
        </div>
        {result?.status && <StatusIcon status={result.status} />}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {statusOptions.map(({ status, label, icon }) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(inspection.id, 'status', status)}
            className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${
              result?.status === status
                ? getStatusButtonClass(status, true)
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {result?.status && result.status !== 'normal' && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          <textarea
            value={result.notes || ''}
            onChange={(e) => onChange(inspection.id, 'notes', e.target.value)}
            placeholder="Тайлбар оруулна уу (заавал)"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            rows={3}
          />
          <div className="space-y-2">
            <label className="text-brand-500 text-sm font-medium hover:text-brand-600 flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  Зураг хадгалж байна...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Зураг нэмэх
                </>
              )}
            </label>

            {result?.photoUrl && (
              <div className="mt-2">
                <img
                  src={result.photoUrl}
                  alt="Inspection photo"
                  className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: InspectionStatus }) {
  const icons = {
    normal: (
      <svg
        className="w-6 h-6 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    issue: (
      <svg
        className="w-6 h-6 text-yellow-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    needs_inspection: (
      <svg
        className="w-6 h-6 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return <div className="ml-2">{icons[status]}</div>;
}

function getStatusButtonClass(status: InspectionStatus, isSelected: boolean) {
  if (!isSelected) return '';

  const classes = {
    normal:
      'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    issue:
      'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    needs_inspection:
      'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
  };

  return classes[status];
}
