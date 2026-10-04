'use client';

import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import monthlyPlanService from '@/services/internal/monthly-plan';
import {
  MonthlyPlan,
  UpdateMonthlyPlanInput,
} from '@/services/internal/monthly-plan/types';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MonthlyPlanFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingPlan?: MonthlyPlan;
}

const MONTHS = [
  { value: 1, label: '1 - Нэгдүгээр сар' },
  { value: 2, label: '2 - Хоёрдугаар сар' },
  { value: 3, label: '3 - Гуравдугаар сар' },
  { value: 4, label: '4 - Дөрөвдүгээр сар' },
  { value: 5, label: '5 - Тавдугаар сар' },
  { value: 6, label: '6 - Зургаадугаар сар' },
  { value: 7, label: '7 - Долоодугаар сар' },
  { value: 8, label: '8 - Наймдугаар сар' },
  { value: 9, label: '9 - Есдүгээр сар' },
  { value: 10, label: '10 - Аравдугаар сар' },
  { value: 11, label: '11 - Арван нэгдүгээр сар' },
  { value: 12, label: '12 - Арван хоёрдугаар сар' },
] as const;

export default function MonthlyPlanFormSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingPlan,
}: MonthlyPlanFormSidebarProps) {
  const [coalAmount, setCoalAmount] = useState('');
  const [soilAmount, setSoilAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const isEditMode = !!editingPlan;

  useEffect(() => {
    if (editingPlan) {
      setCoalAmount(editingPlan.coalAmount);
      setSoilAmount(editingPlan.soilAmount);
    }
  }, [editingPlan]);

  const createMutation = useMutation({
    mutationFn: monthlyPlanService.createMonthlyPlan,
    onSuccess: () => {
      toast.success('Сарын төлөвлөгөө амжилттай үүслээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Сарын төлөвлөгөө үүсгэхэд алдаа гарлаа');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMonthlyPlanInput }) =>
      monthlyPlanService.updateMonthlyPlan({ ...data, id }),
    onSuccess: () => {
      toast.success('Сарын төлөвлөгөө амжилттай шинэчлэгдлээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Сарын төлөвлөгөө шинэчлэхэд алдаа гарлаа');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setCoalAmount('');
    setSoilAmount('');
  };

  const handleSubmit = async () => {
    if (!coalAmount || !soilAmount) {
      toast.error('Бүх талбарыг бөглөнө үү');
      return;
    }

    const formData = {
      coalAmount,
      soilAmount,
      month,
    };

    const updateData = {
      id: editingPlan?.id || '',
      coalAmount,
      soilAmount,
      month,
    };

    try {
      if (isEditMode && editingPlan) {
        await updateMutation.mutateAsync({
          id: editingPlan.id,
          data: updateData,
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          year: new Date().getFullYear(),
        });
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
                    {isEditMode ? 'Төлөвлөгөө засах' : 'Төлөвлөгөө үүсгэх'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode
                      ? 'Сарын төлөвлөгөө шинэчлэх'
                      : 'Сарын төлөвлөгөө үүсгэх'}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
                >
                  <div>
                    <Label>Сар </Label>
                    <Select
                      value={month?.toString()}
                      onValueChange={(value) => setMonth(Number(value))}
                      disabled={isPending}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Сонгох..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(({ value, label }) => (
                          <SelectItem key={value} value={value.toString()}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Төлөвлөгөөт хөрс (м3)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step={0.1}
                      placeholder="100.5"
                      defaultValue={soilAmount}
                      onChange={(e) => setSoilAmount(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>Төлөвлөгөөт нүүрс (м3)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step={0.1}
                      placeholder="100.5"
                      defaultValue={coalAmount}
                      onChange={(e) => setCoalAmount(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                </form>

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
                      onClick={handleSubmit}
                      disabled={isPending}
                    >
                      {isPending
                        ? 'Түр хүлээнэ үү...'
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
