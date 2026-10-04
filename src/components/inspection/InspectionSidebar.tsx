'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import inspectionService from '@/services/internal/inspection';
import {
  UpdateInspectionInput,
  Inspection,
} from '@/services/internal/inspection/types';
import { VehicleType, vehicleTypeMap } from '@/services/internal/vehicle/types';
import Select from '../form/Select';

interface InspectionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingInspection?: Inspection;
}

export default function InspectionSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingInspection,
}: InspectionSidebarProps) {
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [vehicleType, setVehicleType] = useState<VehicleType>('truck');
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  // Bulk upload states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: any }>;
  } | null>(null);

  const isEditMode = !!editingInspection;

  const { data: inspectionsData } = useQuery({
    queryKey: ['inspections-all-types'],
    queryFn: () => inspectionService.getInspections({ limit: 100, offset: 0 }),
    enabled: isOpen,
  });

  const existingTypes = Array.from(
    new Set(
      (inspectionsData?.data || [])
        .map((i) => i.type)
        .filter((t): t is string => !!t && t.trim() !== '')
    )
  ).map((t) => ({
    value: t,
    label: t,
  }));

  useEffect(() => {
    if (editingInspection) {
      setVehicleType(editingInspection.vehicleType);
      setName(editingInspection.name);
      setType(editingInspection.type || '');
      setUploadMode('single');
    }
  }, [editingInspection]);

  const createMutation = useMutation({
    mutationFn: inspectionService.createInspection,
    onSuccess: () => {
      toast.success('Үзлэг амжилттай бүртгэгдлээ.');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Үзлэг үүсгэхэд алдаа гарлаа');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspectionInput }) =>
      inspectionService.updateInspection({ ...data, id }),
    onSuccess: () => {
      toast.success('Үзлэг амжилттай шинэчлэгдлээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      console.log(error, 'error');
      toast.error(error.message || 'Үзлэг шинэчлэхэд алдаа гарлаа');
    },
  });

  const { isPending: isBulkUploading, mutateAsync: bulkUploadInspections } =
    useMutation({
      mutationFn: inspectionService.bulkCreateInspections,
      onSuccess: (result) => {
        setBulkUploadResult(result);

        if (result.success > 0) {
          toast.success(`${result.success} үзлэг амжилттай бүртгэгдлээ`);
          if (onSuccess) onSuccess();

          onClose();
        }

        if (result.failed > 0) {
          toast.warning(`${result.failed} үзлэг алдаатай байна`);
        }

        if (result.errors.length > 0) {
          toast.warning(`${result.errors[0].error}`);
        }
      },
      onError: (x) => {
        toast.error(x.message || 'Алдаа гарлаа.');
      },
    });

  const isPending =
    createMutation.isPending || updateMutation.isPending || isBulkUploading;

  const resetForm = () => {
    setVehicleType('truck');
    setName('');
    setType('');
    setBulkFile(null);
    setBulkUploadResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];
      if (!validTypes.includes(file.type)) {
        toast.error('Зөвхөн Excel эсвэл CSV файл оруулна уу');
        return;
      }
      setBulkFile(file);
      setBulkUploadResult(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Файл сонгоно уу');
      return;
    }

    const formData = new FormData();
    formData.append('file', bulkFile);

    await bulkUploadInspections(formData);
  };

  const handleSubmit = async () => {
    if (!vehicleType || !name.trim()) {
      toast.error('Техникийн төрөл болон нэр заавал бөглөнө үү');
      return;
    }

    const formData = {
      vehicleType,
      name: name.trim(),
      type: (Array.isArray(type) ? type[0] : type)?.trim() || undefined,
    };

    try {
      if (isEditMode && editingInspection) {
        await updateMutation.mutateAsync({
          id: editingInspection.id,
          data: { ...formData, id: editingInspection.id },
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      resetForm();
      setUploadMode('single');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-300 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <span className="sr-only">Close panel</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </TransitionChild>

              <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Үзлэг засах' : 'Үзлэг үүсгэх'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode
                      ? 'Үзлэгийн мэдээллийг шинэчлэх'
                      : 'Оператор ээлж эхлэхэд шалгах үзлэг'}
                  </p>

                  {/* Mode Toggle - Only show when not editing */}
                  {!isEditMode && (
                    <div className="flex items-center justify-between py-3 mt-4 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-medium transition-colors ${
                            uploadMode === 'single'
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          Форм
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadMode(
                              uploadMode === 'single' ? 'bulk' : 'single'
                            );
                            if (uploadMode === 'single') {
                              setBulkFile(null);
                              setBulkUploadResult(null);
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                            uploadMode === 'bulk'
                              ? 'bg-brand-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              uploadMode === 'bulk'
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium transition-colors ${
                            uploadMode === 'bulk'
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          Файл
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {uploadMode === 'bulk' && !isEditMode ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-6 h-6 text-green-600 dark:text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                              Загварчилсан файл
                            </h4>
                            <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                              Үзлэгийн мэдээллийг зөв форматаар оруулахын тулд
                              доорх загвар файлыг ашиглана уу.
                            </p>
                            <a
                              href="/template_files/inspection_format.xlsx"
                              download="uzlegiin_zagvar.xlsx"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 text-sm font-medium rounded-lg border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors shadow-sm"
                            >
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
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span>Загвар файл татах</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Файлын формат
                      </span>

                      <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="grid grid-cols-1 gap-3 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-blue-900 dark:text-blue-100">
                              vehicleType
                            </span>
                            <div className="flex-1">
                              <p className="text-blue-900 dark:text-blue-100 font-medium">
                                Техникийн төрөл
                              </p>
                              <p className="text-blue-700 dark:text-blue-300 text-xs">
                                truck | excavator | loader | dozer | dump |
                                grader | specialPurpose | light_vehicle |
                                special_purpose (Заавал)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-blue-900 dark:text-blue-100">
                              name
                            </span>
                            <div className="flex-1">
                              <p className="text-blue-900 dark:text-blue-100 font-medium">
                                Үзлэгийн нэр
                              </p>
                              <p className="text-blue-700 dark:text-blue-300 text-xs">
                                Жишээ: Дугуйн даралт шалгах (Заавал)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-blue-900 dark:text-blue-100">
                              type
                            </span>
                            <div className="flex-1">
                              <p className="text-blue-900 dark:text-blue-100 font-medium">
                                Төрөл / Ангилал
                              </p>
                              <p className="text-blue-700 dark:text-blue-300 text-xs">
                                Жишээ: Аюулгүй байдал (Заавал биш)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-900 dark:text-white mb-3 block">
                          Файл оруулах
                        </Label>
                        {!bulkFile && (
                          <div className="relative">
                            <input
                              type="file"
                              id="bulk-inspection-input"
                              accept=".xlsx,.xls,.csv"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <label
                              htmlFor="bulk-inspection-input"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg
                                  className="w-8 h-8 mb-3 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="font-semibold">
                                    Файл сонгох
                                  </span>{' '}
                                  эсвэл чирж оруулах
                                </p>
                                <p className="text-xs text-gray-500">
                                  Excel (.xlsx, .xls) эсвэл CSV
                                </p>
                              </div>
                            </label>
                          </div>
                        )}

                        {bulkFile && (
                          <div className="mt-3 flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                            <svg
                              className="w-5 h-5 text-brand-600 dark:text-brand-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-brand-900 dark:text-brand-100 truncate">
                                {bulkFile.name}
                              </p>
                              <p className="text-xs text-brand-600 dark:text-brand-400">
                                {(bulkFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setBulkFile(null)}
                              className="p-1 hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-brand-600 dark:text-brand-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Upload Results */}
                      {bulkUploadResult && (
                        <div className="space-y-3">
                          {bulkUploadResult.success > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <svg
                                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                  Амжилттай
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  {bulkUploadResult.success} үзлэг бүртгэгдсэн
                                </p>
                              </div>
                            </div>
                          )}

                          {bulkUploadResult.failed > 0 && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-start gap-3 mb-3">
                                <svg
                                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                    Алдаатай бүртгэл: {bulkUploadResult.failed}
                                  </p>
                                </div>
                              </div>

                              <div className="max-h-64 overflow-y-auto space-y-2">
                                {bulkUploadResult.errors.map((err, idx) => (
                                  <details
                                    key={idx}
                                    className="group bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800/50"
                                  >
                                    <summary className="cursor-pointer p-3 text-xs font-medium text-yellow-900 dark:text-yellow-100 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors list-none">
                                      <div className="flex items-center justify-between">
                                        <span>
                                          Мөр {err.row}:{' '}
                                          {err.error.split(',')[0]}...
                                        </span>
                                        <svg
                                          className="w-4 h-4 text-yellow-600 dark:text-yellow-400 group-open:rotate-180 transition-transform"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                          />
                                        </svg>
                                      </div>
                                    </summary>
                                    <div className="p-3 pt-0 text-xs space-y-2 border-t border-yellow-100 dark:border-yellow-800/30">
                                      <div>
                                        <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                          Алдаа:
                                        </p>
                                        <p className="text-yellow-700 dark:text-yellow-300">
                                          {err.error}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                          Өгөгдөл:
                                        </p>
                                        <pre className="text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded overflow-x-auto text-xs">
                                          {JSON.stringify(err.data, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </details>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBulkFile(null);
                              setBulkUploadResult(null);
                            }}
                            className="w-full"
                          >
                            Шинэ файл оруулах
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Single inspection form
                    <form className="space-y-6">
                      <div>
                        <Label>
                          Техникийн төрөл{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          className="w-full mt-1"
                          placeholder="Техникийн төрөл сонгох"
                          value={vehicleType}
                          onChange={(value) =>
                            setVehicleType(value as VehicleType)
                          }
                          disabled={isPending}
                          options={vehicleTypeMap}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Тухайн төрлийн бүх техникт энэ үзлэг хамрагдана
                        </p>
                      </div>

                      <div>
                        <Label>Төрөл / Ангилал</Label>
                        <Select
                          allowCreate={true}
                          createLabel={(input) => `Нэмэх "${input}"`}
                          className="w-full mt-1"
                          placeholder="Төрөл сонгох эсвэл шинээр бичих"
                          value={type || undefined}
                          onChange={setType}
                          disabled={isPending}
                          options={existingTypes}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Жишээ: Аюулгүй байдал, Техникийн байдал, Гэрэлтүүлэг
                        </p>
                        {existingTypes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {existingTypes.slice(0, 5).map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => setType(t.value)}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>
                          Үзлэгийн нэр <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="mt-1"
                          placeholder="Дугуйн даралт шалгах"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex gap-2">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium mb-1">
                              Операторын хэрэглээ:
                            </p>
                            <p className="text-xs">
                              Оператор ээлж эхлэх үед өөрийн техникийн төрөлд
                              тохирсон бүх үзлэгийг харж, тус бүрийг{' '}
                              <strong>Хэвийн</strong>, <strong>Аюултай</strong>,
                              эсвэл <strong>Шалгах шаардлагатай</strong> гэж
                              тэмдэглэнэ.
                            </p>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                      disabled={isPending}
                    >
                      Болих
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={
                        uploadMode === 'bulk' ? handleBulkUpload : handleSubmit
                      }
                      disabled={isPending}
                    >
                      {isPending
                        ? 'Түр хүлээнэ үү...'
                        : uploadMode === 'bulk'
                          ? 'Файл оруулах'
                          : isEditMode
                            ? 'Хадгалах'
                            : 'Үүсгэх'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
