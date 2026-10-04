'use client';

import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import stockpileService from '@/services/internal/stockpile';
import {
  Stockpile,
  StockpileType,
  stockpileTypeMap,
  UpdateStockpileInput,
} from '@/services/internal/stockpile/types';
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

interface MaterialFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingMaterial?: Stockpile;
}

export default function StockpileFormSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingMaterial,
}: MaterialFormSidebarProps) {
  const [type, setType] = useState<StockpileType>('coal');
  const [layerNumber, setLayerNumber] = useState('');

  const isEditMode = !!editingMaterial;

  useEffect(() => {
    if (editingMaterial) {
      setLayerNumber(editingMaterial.layerNumber);

      setType(editingMaterial.type);
    }
  }, [editingMaterial]);

  const createMutation = useMutation({
    mutationFn: stockpileService.createStockpile,
    onSuccess: () => {
      toast.success('Овоолго амжилттай үүслээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Овоолго үүсгэхэд алдаа гарлаа');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockpileInput }) =>
      stockpileService.updateStockpile({ ...data, id }),
    onSuccess: () => {
      toast.success('Овоолго амжилттай шинэчлэгдлээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Овоолго шинэчлэхэд алдаа гарлаа');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setLayerNumber('');

    setType('coal');
  };

  const handleSubmit = async () => {
    if (!type.trim() || !layerNumber) {
      toast.error('Овоолгын дугаар болон төрлийг заавал бөглөнө үү.');
      return;
    }

    const formData = {
      layerNumber: layerNumber.trim(),
      type,
    };

    const updateData = {
      id: editingMaterial?.id || '',
      type,
      layerNumber: layerNumber.trim() || undefined,
    };

    try {
      if (isEditMode && editingMaterial) {
        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: { ...updateData, id: editingMaterial.id },
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
                    {isEditMode ? 'Овоолго засах' : 'Овоолго үүсгэх'}
                  </DialogTitle>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Овоолгын мэдээлэл
                    </h3>

                    <div>
                      <Label>
                        Төрөл <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        className="w-full mt-1"
                        placeholder="Төрөл сонгох"
                        value={type}
                        onChange={(value) => setType(value as StockpileType)}
                        disabled={isPending}
                        options={stockpileTypeMap}
                      />
                    </div>

                    <div>
                      <Label>
                        Овоолгын дугаар <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="mt-1"
                        placeholder="10"
                        value={layerNumber}
                        onChange={(e) => setLayerNumber(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
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
