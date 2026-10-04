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
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import markshaderReportService, {
  MarkshaderReport,
} from '@/services/internal/markshader-report';

interface MarkshaderReportFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingReport?: MarkshaderReport;
}

function getDateOptions(days = 30): { label: string; value: string }[] {
  const options = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const value = d.toLocaleDateString('en-CA');
    options.push({ label: value, value });
  }
  return options;
}

export default function MarkshaderReportFormSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingReport,
}: MarkshaderReportFormSidebarProps) {
  const today = new Date().toLocaleDateString('en-CA');
  const dateOptions = getDateOptions(30);
  const isEditMode = !!editingReport;

  const [reportDate, setReportDate] = useState(today);
  const [vehicleId, setVehicleId] = useState('');
  const [markProduction, setMarkProduction] = useState('');
  const [notes, setNotes] = useState('');

  const [disSoil, setDisSoil] = useState('');
  const [disCoal, setDisCoal] = useState('');
  const [disTotalProduction, setDisTotalProduction] = useState('');
  const [disReisSoil, setDisReisSoil] = useState('');
  const [disReisCoal, setDisReisCoal] = useState('');
  const [disDataLocked, setDisDataLocked] = useState(false);

  const markDisDiscrepancy =
    markProduction && disTotalProduction
      ? (parseFloat(markProduction) - parseFloat(disTotalProduction)).toFixed(2)
      : '';

  const disCoefficient =
    markProduction && disTotalProduction && parseFloat(markProduction) > 0
      ? (parseFloat(disTotalProduction) / parseFloat(markProduction)).toFixed(4)
      : '';

  const { data: excavatorsRaw, isLoading: isLoadingExcavators } = useQuery({
    queryKey: ['excavators', reportDate],
    queryFn: () => markshaderReportService.getExcavatorsByDate(reportDate),
    enabled: isOpen && !isEditMode && !!reportDate,
  });

  const excavators = excavatorsRaw
    ? Array.from(new Map(excavatorsRaw.map((ex) => [ex.vehicleId, ex])).values())
    : [];

  const { data: productionData, isLoading: isLoadingProduction } = useQuery({
    queryKey: ['actual-production', reportDate, vehicleId],
    queryFn: () =>
      markshaderReportService.getActualProductionByVehicle({
        date: reportDate,
        vehicleId,
      }),
    enabled: isOpen && !isEditMode && !!vehicleId && !!reportDate,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (productionData && !isEditMode) {
      setDisSoil(productionData.disSoil ? String(productionData.disSoil) : '');
      setDisCoal(productionData.disCoal ? String(productionData.disCoal) : '');
      setDisTotalProduction(productionData.disTotalProduction ? String(productionData.disTotalProduction) : '');
      setDisReisSoil(productionData.disReisSoil ? String(productionData.disReisSoil) : '');
      setDisReisCoal(productionData.disReisCoal ? String(productionData.disReisCoal) : '');
      setDisDataLocked(true);
    }
  }, [productionData, isEditMode]);

  useEffect(() => {
    if (editingReport) {
      setReportDate(editingReport.reportDate);
      setVehicleId(editingReport.vehicleId);
      setMarkProduction(editingReport.markProduction ?? '');
      setNotes(editingReport.notes ?? '');
      setDisSoil(editingReport.disSoil ?? '');
      setDisCoal(editingReport.disCoal ?? '');
      setDisTotalProduction(editingReport.disTotalProduction ?? '');
      setDisReisSoil(String(editingReport.disReisSoil ?? ''));
      setDisReisCoal(String(editingReport.disReisCoal ?? ''));
      setDisDataLocked(false);
    }
  }, [editingReport]);

  const resetForm = () => {
    setReportDate(today);
    setVehicleId('');
    setMarkProduction('');
    setNotes('');
    setDisSoil('');
    setDisCoal('');
    setDisTotalProduction('');
    setDisReisSoil('');
    setDisReisCoal('');
    setDisDataLocked(false);
  };

  const createMutation = useMutation({
    mutationFn: markshaderReportService.createReport,
    onSuccess: () => {
      toast.success('Хэмжилт амжилттай үүслээ');
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Хэмжилт үүсгэхэд алдаа гарлаа');
    },
  });

  const updateMutation = useMutation({
    mutationFn: markshaderReportService.updateReport,
    onSuccess: () => {
      toast.success('Хэмжилт амжилттай шинэчлэгдлээ');
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Хэмжилт шинэчлэхэд алдаа гарлаа');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!vehicleId) {
      toast.error('Excavator сонгоно уу');
      return;
    }

    const payload = {
      reportDate,
      vehicleId,
      markProduction: markProduction.trim(),
      disSoil: disSoil || '0',
      disCoal: disCoal || '0',
      disReisSoil: parseInt(disReisSoil || '0') || 0,
      disReisCoal: parseInt(disReisCoal || '0') || 0,
      disTotalProduction: disTotalProduction || '0',
      disCoefficient: disCoefficient || undefined,
      markDisDiscrepancy: markDisDiscrepancy || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditMode && editingReport) {
        await updateMutation.mutateAsync({ id: editingReport.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      resetForm();
      onClose();
    }
  };

  const selectedExcavator = excavators.find((e) => e.vehicleId === vehicleId);

  const selectClass =
    'mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed';

  const isDisInputDisabled = isPending || isLoadingProduction || disDataLocked;

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
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none disabled:opacity-50"
                  >
                    <span className="sr-only">Close panel</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </TransitionChild>

              <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                {/* Header */}
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Хэмжилт засах' : 'Хэмжилт нэмэх'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Маркшейдерийн хэмжилтийн бүртгэл
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

                  {/* Огноо */}
                  <div>
                    <Label>Огноо <span className="text-red-500">*</span></Label>
                    {isEditMode ? (
                      <Input className="mt-1" value={reportDate} disabled />
                    ) : (
                      <select
                        value={reportDate}
                        onChange={(e) => {
                          setReportDate(e.target.value);
                          setVehicleId('');
                          setDisSoil('');
                          setDisCoal('');
                          setDisTotalProduction('');
                          setDisReisSoil('');
                          setDisReisCoal('');
                          setDisDataLocked(false);
                        }}
                        disabled={isPending}
                        className={selectClass}
                      >
                        {dateOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Excavator */}
                  <div>
                    <Label>Excavator <span className="text-red-500">*</span></Label>
                    {isEditMode ? (
                      <Input
                        className="mt-1"
                        value={
                          editingReport?.vehicle?.mineNumber ??
                          editingReport?.vehicle?.name ??
                          vehicleId
                        }
                        disabled
                      />
                    ) : (
                      <select
                        value={vehicleId}
                        onChange={(e) => {
                          setVehicleId(e.target.value);
                          setDisDataLocked(false);
                        }}
                        disabled={isPending || isLoadingExcavators}
                        className={selectClass}
                      >
                        <option value="">
                          {isLoadingExcavators ? 'Ачааллаж байна...' : 'Excavator сонгох'}
                        </option>
                        {excavators.map((ex) => (
                          <option key={ex.vehicleId} value={ex.vehicleId}>
                            {ex.mineNumber ?? ex.vehicleName}
                            {ex.operatorName ? ` — ${ex.operatorName}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedExcavator?.operatorName && (
                      <p className="mt-1 text-xs text-gray-500">
                        Оператор: {selectedExcavator.operatorName}
                      </p>
                    )}
                  </div>

                  {/* Марк бүтээл */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Маркшейдерийн хэмжилт
                    </h3>
                    <div>
                      <Label>Марк бүтээл (м3) <span className="text-red-500">*</span></Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step={0.01}
                        placeholder="0.00"
                        value={markProduction}
                        onChange={(e) => setMarkProduction(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* ДИС мэдээ */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      ДИС мэдээ
                      {isLoadingProduction && !isEditMode && (
                        <span className="text-xs text-gray-400 font-normal">Ачааллаж байна...</span>
                      )}
                      {disDataLocked && !isEditMode && (
                        <button
                          type="button"
                          onClick={() => setDisDataLocked(false)}
                          className="text-xs text-blue-500 hover:text-blue-600 font-normal underline"
                        >
                          Засах
                        </button>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Системээс автомат татана. Дутуу бол гараар оруулна уу.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Хөрс (м3)</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          step={0.01}
                          placeholder="0.00"
                          value={disSoil}
                          onChange={(e) => setDisSoil(e.target.value)}
                          disabled={isDisInputDisabled}
                        />
                      </div>
                      <div>
                        <Label>Нүүрс (м3)</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          step={0.01}
                          placeholder="0.00"
                          value={disCoal}
                          onChange={(e) => setDisCoal(e.target.value)}
                          disabled={isDisInputDisabled}
                        />
                      </div>
                      <div>
                        <Label>Рейс хөрс</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          placeholder="0"
                          value={disReisSoil}
                          onChange={(e) => setDisReisSoil(e.target.value)}
                          disabled={isDisInputDisabled}
                        />
                      </div>
                      <div>
                        <Label>Рейс нүүрс</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          placeholder="0"
                          value={disReisCoal}
                          onChange={(e) => setDisReisCoal(e.target.value)}
                          disabled={isDisInputDisabled}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label>Бодит бүтээл (м3)</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step={0.01}
                        placeholder="0.00"
                        value={disTotalProduction}
                        onChange={(e) => setDisTotalProduction(e.target.value)}
                        disabled={isDisInputDisabled}
                      />
                    </div>
                  </div>

                  {/* Зөрүү */}
                  {markDisDiscrepancy && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Марк-Дис зөрүү (автомат)</p>
                      <p className={`text-xl font-bold ${parseFloat(markDisDiscrepancy) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {parseFloat(markDisDiscrepancy) > 0 && '+'}
                        {markDisDiscrepancy} м3
                      </p>
                      {disCoefficient && (
                        <p className="text-xs text-gray-400 mt-1">
                          ДИС коэф: {disCoefficient}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Тэмдэглэл */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Label>Тэмдэглэл</Label>
                    <TextArea
                      className="mt-1"
                      rows={3}
                      placeholder="Нэмэлт тэмдэглэл"
                      value={notes}
                      onChange={(e) => setNotes(e)}
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                      Болих
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isPending}>
                      {isPending ? 'Түр хүлээнэ үү...' : isEditMode ? 'Хадгалах' : 'Үүсгэх'}
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