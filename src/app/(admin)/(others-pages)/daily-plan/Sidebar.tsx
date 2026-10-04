'use client';

import Label from '@/components/form/Label';
import MultiSelect from '@/components/form/MultiSelect';
import Select from '@/components/form/Select';
import DatePicker from '@/components/form/date-picker';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import dailyPlanService from '@/services/internal/daily-plan';
import {
  DailyPlan,
  UpdateDailyPlanInput,
} from '@/services/internal/daily-plan/types';
import miningBlockService from '@/services/internal/mining-block';
import routeService from '@/services/internal/routes';
import { ShiftType, shiftTypeItems } from '@/services/internal/shift/types';
import stockpileService from '@/services/internal/stockpile';
import vehicleService from '@/services/internal/vehicle';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import dayjs from 'dayjs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { stockpileTypeMap } from '@/services/internal/stockpile/types';

type PaginatedResponse<T> = {
  data: T[];
  totalCount?: number;
};

async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<PaginatedResponse<T>>,
) {
  const limit = 100;
  let offset = 0;
  const allItems: T[] = [];

  while (true) {
    const response = await fetchPage(offset, limit);
    const pageItems = response.data ?? [];

    allItems.push(...pageItems);

    if (pageItems.length === 0) {
      break;
    }

    offset += pageItems.length;

    if (
      typeof response.totalCount === 'number' &&
      allItems.length >= response.totalCount
    ) {
      break;
    }

    if (
      typeof response.totalCount !== 'number' &&
      pageItems.length < limit
    ) {
      break;
    }
  }

  return {
    data: allItems,
    totalCount: allItems.length,
  };
}

interface DailyPlanFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingPlan?: DailyPlan;
}

export default function DailyPlanFormSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingPlan,
}: DailyPlanFormSidebarProps) {
  const [routeId, setRouteId] = useState('');
  const [pickUpBlockId, setPickUpBlockId] = useState('');
  const [stockpileIds, setStockpileIds] = useState<string[]>([]);
  const [transportAmount, setTransportAmount] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [shiftType, setShiftType] = useState<ShiftType>('day');
  const [date, setDate] = useState<string>('');

  const isEditMode = !!editingPlan;

  const { data: routesData } = useQuery({
    queryKey: ['routes', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        routeService.getRoutes({ limit, offset }),
      ),
  });

  const { data: blastBlocksData } = useQuery({
    queryKey: ['mining-blocks', 'pick_up', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        miningBlockService.getMiningBlocks({ limit, offset }),
      ),
  });

  const { data: stockpilesData } = useQuery({
    queryKey: ['stockpiles', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        stockpileService.getStockpiles({ limit, offset }),
      ),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'excavator', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        vehicleService.getVehicles({
          limit,
          offset,
          type: 'excavator',
        }),
      ),
  });

  const routes = routesData?.data || [];

  const blastBlocks = blastBlocksData?.data;
  const stockpiles = stockpilesData?.data;
  const vehicles = vehiclesData?.data;

  useEffect(() => {
    if (editingPlan) {
      setRouteId(editingPlan.routeId);
      setPickUpBlockId(editingPlan.pickUpBlockId);
      setStockpileIds(editingPlan.stockpileIds);
      setTransportAmount(editingPlan.transportAmount || '');
      setVehicleId(editingPlan.vehicleId || '');
      setShiftType(editingPlan.shiftType);
      setDate(editingPlan.date);
    }
  }, [editingPlan]);

  const createMutation = useMutation({
    mutationFn: dailyPlanService.createDailyPlan,
    onSuccess: () => {
      toast.success('Өдрийн төлөвлөгөө амжилттай үүслээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Өдрийн төлөвлөгөө үүсгэхэд алдаа гарлаа');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDailyPlanInput }) =>
      dailyPlanService.updateDailyPlan({ ...data, id }),
    onSuccess: () => {
      toast.success('Өдрийн төлөвлөгөө амжилттай шинэчлэгдлээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Өдрийн төлөвлөгөө шинэчлэхэд алдаа гарлаа');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setRouteId('');
    setPickUpBlockId('');
    setStockpileIds([]);
    setTransportAmount('');
    setVehicleId('');
    setShiftType('day');
    setDate('');
  };

  const handleSubmit = async () => {
    if (!routeId || !pickUpBlockId || stockpileIds.length === 0) {
      toast.error('Бүх талбарыг бөглөнө үү');
      return;
    }

    const formData = {
      routeId,
      pickUpBlockId,
      stockpileIds,
      transportAmount: transportAmount.trim() || undefined,
      vehicleId,
      shiftType,
      date,
    };

    const updateData = {
      id: editingPlan?.id || '',
      routeId,
      pickUpBlockId,
      stockpileIds,
      transportAmount: transportAmount.trim() || undefined,
      vehicleId,
      shiftType,
      date,
    };

    if (shiftType === undefined) {
      toast.error('Ээлж сонгоно уу.');
    }

    try {
      if (isEditMode && editingPlan) {
        await updateMutation.mutateAsync({
          id: editingPlan.id,
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
                    {isEditMode ? 'Төлөвлөгөө засах' : 'Төлөвлөгөө үүсгэх'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode
                      ? 'Өдрийн төлөвлөгөөний мэдээллийг шинэчлэх'
                      : 'Шинэ өдрийн төлөвлөгөө нэмэх'}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
                >
                  <div>
                    <Label>
                      Өдөр <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="plan-date-picker"
                      placeholder="Огноо"
                      mode="single"
                      onChange={(dates) => {
                        setDate(
                          dates?.[0] ? dayjs(dates[0]).format('YYYY-MM-DD') : ''
                        );
                      }}
                    />
                  </div>
                  <div>
                    <Label>
                      Маршрут <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      className="w-full mt-1"
                      placeholder="Маршрут сонгох"
                      value={routeId || undefined}
                      onChange={setRouteId}
                      disabled={isPending}
                      options={routes.map((route) => ({
                        value: route.id,
                        label: `${route.routeCode}`,
                      }))}
                    />
                  </div>

                  <div>
                    <Label>
                      Техник <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      className="w-full mt-1"
                      placeholder="Техник"
                      value={vehicleId}
                      onChange={setVehicleId}
                      disabled={!vehicles || editingPlan !== undefined}
                      options={
                        vehicles?.map((vehicle) => ({
                          value: vehicle.id,
                          label: `${vehicle.code}`,
                        })) ?? []
                      }
                    />
                  </div>

                  <div>
                    <Label>
                      Ээлж <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      className="w-full mt-1"
                      placeholder="Ээлж сонгох"
                      value={shiftType || undefined}
                      onChange={(value) => setShiftType(value as ShiftType)}
                      disabled={isPending}
                      options={shiftTypeItems}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Блокууд сонгох
                    </div>

                    <div>
                      <Label>
                        Тэсэлгээний блок (Ачих){' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        className="w-full mt-1"
                        placeholder="Тэсэлгээний блок сонгох"
                        value={pickUpBlockId || undefined}
                        onChange={setPickUpBlockId}
                        disabled={isPending}
                        options={
                          blastBlocks?.map((block) => ({
                            value: block.id,
                            label: `${block.name} - ${block.layerNumber}`,
                          })) ?? []
                        }
                      />
                    </div>

                    <div className="flex justify-center py-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>

                    <div>
                      <Label>
                        Овоолгын блок (Буулгах){' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <MultiSelect
                        placeholder="Овоолго сонгох..."
                        value={stockpileIds}
                        onChange={setStockpileIds}
                        disabled={isPending}
                        options={
                          stockpiles?.map((stockpile) => {
                            const typeLabel =
                              stockpileTypeMap.find((t) => t.value === stockpile.type)?.label ||
                              stockpile.type;
                            return {
                              value: stockpile.id,
                              text: `${typeLabel} - ${stockpile.layerNumber}`,
                              selected: false,
                            };
                          }) ?? []
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Тээвэрлэх хэмжээ (м3)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step={0.1}
                      placeholder="100.5"
                      defaultValue={transportAmount}
                      onChange={(e) => setTransportAmount(e.target.value)}
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