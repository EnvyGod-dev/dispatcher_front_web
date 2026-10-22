'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import Label from '@/components/form/Label';
import MultiSelect from '@/components/form/MultiSelect';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import equipmentShiftLogService, {
  type CreateReasonPayload,
  type VehicleType,
} from '@/services/internal/equipment-shift-log';
import { vehicleTypeMap } from '@/services/internal/vehicle/types';
import {
  isIdleCategory,
  reasonCategoryOptions,
  type ReasonCategory,
  type ReasonRow,
} from './types';

interface ReasonSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingReason?: ReasonRow;
}

const createReason = (category: ReasonCategory, payload: CreateReasonPayload) =>
  isIdleCategory(category)
    ? equipmentShiftLogService.createIdleReasonType({
        name: payload.name,
        vehicleTypes: payload.vehicleTypes,
      })
    : equipmentShiftLogService.createRepairReasonType({
        ...payload,
        category,
      });

const deleteReason = (category: ReasonCategory, id: string) =>
  isIdleCategory(category)
    ? equipmentShiftLogService.deleteIdleReasonType(id)
    : equipmentShiftLogService.deleteRepairReasonType(id);

export default function ReasonSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingReason,
}: ReasonSidebarProps) {
  const [name, setName] = useState('');
  const [category, setCategory] =
    useState<ReasonCategory>('technological_idle');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  const isEditMode = !!editingReason;

  useEffect(() => {
    if (!isOpen) return;

    setName(editingReason?.name ?? '');
    setCategory(editingReason?.rowCategory ?? 'technological_idle');
    setVehicleTypes(editingReason?.vehicleTypes ?? []);
  }, [isOpen, editingReason]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateReasonPayload = {
        name: name.trim(),
        vehicleTypes,
      };

      if (!editingReason) {
        return createReason(category, payload);
      }

      const previous = editingReason.rowCategory;

      // Технологийн ↔ засварын хооронд шилжүүлбэл өөр хүснэгт тул шинээр үүсгээд хуучныг устгана.
      if (isIdleCategory(previous) !== isIdleCategory(category)) {
        const created = await createReason(category, payload);
        await deleteReason(previous, editingReason.id);
        return created;
      }

      return isIdleCategory(category)
        ? equipmentShiftLogService.updateIdleReasonType(
            editingReason.id,
            payload,
          )
        : equipmentShiftLogService.updateRepairReasonType(editingReason.id, {
            ...payload,
            category,
          });
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? 'Амжилттай шинэчлэгдлээ' : 'Амжилттай нэмэгдлээ',
      );
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Хадгалахад алдаа гарлаа');
    },
  });

  const isPending = saveMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Нэр оруулна уу');
      return;
    }

    saveMutation.mutate();
  };

  const handleClose = () => {
    if (!isPending) onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-300 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <DialogPanel
            transition
            className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
          >
            <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-900">
              <div className="border-b border-gray-200 px-6 py-6 dark:border-gray-700">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditMode ? 'Төрөл засах' : 'Төрөл нэмэх'}
                </DialogTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Сул зогсолт, засварын системийн нэршил
                </p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div>
                  <Label>
                    Ангилал <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 space-y-2">
                    {reasonCategoryOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                          category === option.value
                            ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason-category"
                          className="mt-1"
                          checked={category === option.value}
                          onChange={() => setCategory(option.value)}
                          disabled={isPending}
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {option.hint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>
                    Нэр <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Жишээ: Тэсэлгээ хүлээсэн"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div>
                  <Label>Техникийн төрөл</Label>
                  <MultiSelect
                    placeholder="Бүх техник"
                    value={vehicleTypes}
                    onChange={(values) =>
                      setVehicleTypes(values as VehicleType[])
                    }
                    disabled={isPending}
                    options={vehicleTypeMap.map((item) => ({
                      value: item.value,
                      text: item.label,
                      selected: false,
                    }))}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Сонгоогүй бол бүх техникт харагдана. Сонгосон бол зөвхөн
                    тэр төрлийн техникийг бүртгэхэд гарч ирнэ.
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
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
                    startIcon={
                      isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : undefined
                    }
                  >
                    {isEditMode ? 'Хадгалах' : 'Нэмэх'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
