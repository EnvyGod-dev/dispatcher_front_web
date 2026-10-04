'use client';

import vehicleOrganizationService from '@/services/internal/vehicle-organization';
import {
  CreateVehicleOrganizationInput,
  VehicleOrganization,
} from '@/services/internal/vehicle-organization/types';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { Divider, Input } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Label from '../form/Label';
import Loading from '../loading';
import Button from '../ui/button/Button';

interface AddVehicleOrganizationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleOrganizationAdded: () => void;
  editingOrg?: VehicleOrganization;
}

export default function AddVehicleOrganizationSidebar({
  isOpen,
  onClose,
  onVehicleOrganizationAdded: onVehicleOrganizationAdded,
  editingOrg,
}: AddVehicleOrganizationSidebarProps) {
  const [formData, setFormData] = useState<CreateVehicleOrganizationInput>({
    name: '',
  });

  const isEditMode = !!editingOrg;

  useEffect(() => {
    if (editingOrg) {
      setFormData({
        name: editingOrg.name,
      });
    }
  }, [editingOrg]);

  const { isPending, mutateAsync: createVehicleOrganization } = useMutation({
    mutationFn: vehicleOrganizationService.createVehicleOrganization,
    onSuccess: () => {
      toast.success('Байгууллага амжилттай нэмэгдлээ.');
      resetForm();
      onVehicleOrganizationAdded();
    },
    onError: (x) => {
      toast.error(x.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      vehicleOrganizationService.updateVehicleOrganization({ id, name }),
    onSuccess: () => {
      toast.success('Байгууллага амжилттай шинэчлэгдлээ.');
      resetForm();

      onVehicleOrganizationAdded();

      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Үзлэг шинэчлэхэд алдаа гарлаа');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Байгууллагын нэр оруулна уу.');
      return;
    }

    if (isEditMode && editingOrg) {
      await updateMutation.mutateAsync({
        id: editingOrg.id,
        name: formData.name,
      });
    } else {
      await createVehicleOrganization(formData);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-60">
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
                    Байгууллага нэмэх
                  </DialogTitle>
                </div>

                <Divider />

                {/* Form Content */}
                <div className="relative flex-1 px-4 sm:px-6">
                  {isPending ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label>
                          Байгууллагын нэр{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={formData.name}
                          defaultValue={formData.name || undefined}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value,
                            })
                          }
                          className="mt-2"
                        />
                      </div>
                    </form>
                  )}
                </div>

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
                    variant="primary"
                  >
                    {isPending ? 'Хадгалж байна...' : 'Хадгалах'}
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
