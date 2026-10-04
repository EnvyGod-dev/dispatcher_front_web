'use client';

import miningSectionService from '@/services/internal/mining-section';
import {
  CreateMiningSectionInput,
  MiningSection,
} from '@/services/internal/mining-section/types';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { Input } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Label from '../form/Label';
import Loading from '../loading';
import { Button } from '../ui/button';

interface AddVehicleOrganizationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMiningSectionAdded: () => void;
  editingMiningsection?: MiningSection;
}

export default function AddMiningSectionSidebar({
  isOpen,
  onClose,
  onMiningSectionAdded: onMiningSectionAdded,
  editingMiningsection,
}: AddVehicleOrganizationSidebarProps) {
  const [formData, setFormData] = useState<CreateMiningSectionInput>({
    name: '',
  });

  const isEditMode = !!editingMiningsection;

  useEffect(() => {
    if (editingMiningsection) {
      setFormData(editingMiningsection);
    }
  }, [editingMiningsection]);

  const { isPending: isCreating, mutateAsync: createMiningSection } =
    useMutation({
      mutationFn: miningSectionService.createMiningSection,
      onSuccess: () => {
        resetForm();
        onMiningSectionAdded();
        toast.success('Уулын хэсэг нэмэгдлээ.');
      },
      onError: (x) => {
        onMiningSectionAdded();
        toast.error(x.message || 'Уулын хэсэг нэмэхэд алдаа гарлаа.');
      },
    });

  const { isPending: isUpdating, mutateAsync: updateMiningSection } =
    useMutation({
      mutationFn: miningSectionService.updateMiningSection,
      onSuccess: () => {
        resetForm();

        onMiningSectionAdded();

        toast.success('Уулын хэсэг шинэчлэгдлээ.');
      },
      onError: (x) => {
        onMiningSectionAdded();
        toast.error(x.message || 'Уулын хэсэг шинэчлэхэд алдаа гарлаа.');
      },
    });

  const isPending = isCreating || isUpdating;

  const resetForm = () => {
    setFormData({
      name: '',
    });
  };

  const handleInputChange = (
    field: keyof CreateMiningSectionInput,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        if (formData.name == editingMiningsection.name) {
          toast.error('Өөрчлөлт байхгүй.');
          return;
        }

        await updateMiningSection({ ...formData, id: editingMiningsection.id });
      }

      await createMiningSection(formData);
    } catch (error) {
      console.log(error);
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
        className="z-index-100 fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-[closed]:opacity-0 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="relative rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
                  >
                    <span className="absolute -inset-2.5" />
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

              <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 py-6 shadow-xl">
                {/* Header */}
                <div className="px-4 sm:px-6">
                  <DialogTitle className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                    Уулын хэсэг нэмэх
                  </DialogTitle>
                </div>

                {/* Form Content */}
                <div className="relative mt-6 flex-1 px-4 sm:px-6">
                  {isPending ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label>
                          Нэр <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange('name', e.target.value)
                          }
                          placeholder="Уулын хэсгийн нэрийг оруулна уу"
                          disabled={isPending}
                          className="mt-2"
                        />
                      </div>
                    </form>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-shrink-0 justify-end px-4 py-4 gap-3">
                  <Button
                    onClick={handleClose}
                    disabled={isPending}
                    variant="outline"
                  >
                    Буцах
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || !formData.name}
                    variant="default"
                  >
                    {isPending ? 'Нэмж байна...' : 'Нэмэх'}
                  </Button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
