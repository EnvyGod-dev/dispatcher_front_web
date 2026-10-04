'use client';

import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Switch from '@/components/form/switch/Switch';
import Button from '@/components/ui/button/Button';
import miningBlockService from '@/services/internal/mining-block';
import {
  MiningBlock,
  UpdateMiningBlockInput,
} from '@/services/internal/mining-block/types';
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

interface MiningBlockFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingBlock?: MiningBlock;
}

export default function MiningBlockFormSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingBlock,
}: MiningBlockFormSidebarProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [layerNumber, setLayerNumber] = useState('');

  const isEditMode = !!editingBlock;

  useEffect(() => {
    if (editingBlock) {
      setName(editingBlock.name);
      setLayerNumber(editingBlock.layerNumber);
      setDescription(editingBlock.description || '');
      setIsActive(editingBlock.isActive);
      setLatitude(editingBlock.latitude || '');
      setLongitude(editingBlock.longitude || '');
    }
  }, [editingBlock]);

  const createMutation = useMutation({
    mutationFn: miningBlockService.createMiningBlock,
    onSuccess: () => {
      toast.success('Блок амжилттай үүслээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (x) => {
      toast.error(x.message || 'Блок үүсгэхэд алдаа гарлаа');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMiningBlockInput }) =>
      miningBlockService.updateMiningBlock({ ...data, id }),
    onSuccess: () => {
      toast.success('Блок амжилттай шинэчлэгдлээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Блок шинэчлэхэд алдаа гарлаа');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setLatitude('');
    setLongitude('');
    setLayerNumber('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !layerNumber) {
      toast.error('Блокын нэр болон давхаргыг заавал бөглөнө үү');
      return;
    }

    const formData = {
      name: name.trim(),
      isActive,
      layerNumber,
      latitude: latitude.trim() || undefined,
      longitude: longitude.trim() || undefined,
    };

    const updateData = {
      id: editingBlock?.id || '',
      name: name.trim(),
      isActive,
      layerNumber,
      latitude: latitude.trim() || undefined,
      longitude: longitude.trim() || undefined,
    };

    try {
      if (isEditMode && editingBlock) {
        await updateMutation.mutateAsync({
          id: editingBlock.id,
          data: updateData,
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
                    {isEditMode ? 'Блок засах' : 'Блок үүсгэх'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode
                      ? 'Блокын мэдээллийг шинэчлэх'
                      : 'Шинэ уурхайн блок нэмэх'}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
                >
                  {/* Block Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Блокын мэдээлэл
                    </h3>

                    <div>
                      <Label>
                        Блокын нэр <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="mt-1"
                        placeholder="S2.1.2_1470"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* Material Info Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <Label>Талын зай</Label>
                      <Input
                        className="mt-1"
                        placeholder="13"
                        value={layerNumber}
                        onChange={(e) => setLayerNumber(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      GPS байршил
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Өргөрөг</Label>
                        <Input
                          className="mt-1"
                          placeholder="47.9184"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>Уртраг</Label>
                        <Input
                          className="mt-1"
                          placeholder="106.9177"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Тэмдэглэл</Label>
                    <TextArea
                      className="mt-1"
                      rows={3}
                      placeholder="Нэмэлт тэмдэглэл"
                      value={description}
                      onChange={(e) => setDescription(e)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      defaultChecked={isActive}
                      onChange={setIsActive}
                      disabled={isPending}
                      label={isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
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
