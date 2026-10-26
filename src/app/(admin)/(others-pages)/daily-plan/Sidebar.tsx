'use client';

import Label from '@/components/form/Label';
import MultiSelect from '@/components/form/MultiSelect';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import dailyPlanService from '@/services/internal/daily-plan';
import {
  DailyPlan,
  UpdateDailyPlanInput,
} from '@/services/internal/daily-plan/types';
import miningBlockService from '@/services/internal/mining-block';
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
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { stockpileTypeMap } from '@/services/internal/stockpile/types';
import { vehicleTypeLabels, type VehicleType } from '@/services/internal/vehicle/types';

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

/** Өдрийн төлөвлөгөөнд сонгогдох техникийн төрөл. */
const PLAN_VEHICLE_TYPES: VehicleType[] = ['excavator', 'loader'];

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
  const [pickUpBlockId, setPickUpBlockId] = useState('');
  const [stockpileIds, setStockpileIds] = useState<string[]>([]);
  const [transportAmount, setTransportAmount] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [shiftType, setShiftType] = useState<ShiftType>('day');
  const [date, setDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));

  const isEditMode = !!editingPlan;

  const { data: blastBlocksData, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['mining-blocks', 'pick_up', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        miningBlockService.getMiningBlocks({ limit, offset }),
      ),
  });

  const { data: stockpilesData, isLoading: isLoadingStockpiles } = useQuery({
    queryKey: ['stockpiles', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        stockpileService.getStockpiles({ limit, offset }),
      ),
  });

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', 'daily-plan', 'all'],
    enabled: isOpen,
    queryFn: () =>
      fetchAllPages((offset, limit) =>
        vehicleService.getVehicles({
          limit,
          offset,
        }),
      ),
  });

  const isLoadingOptions =
    isOpen &&
    (isLoadingBlocks ||
      isLoadingStockpiles ||
      isLoadingVehicles);

  const blastBlocks = blastBlocksData?.data;
  // Идэвхгүй болгосон овоолго сонгогдохгүй (засаж буй төлөвлөгөөнийх харагдсаар).
  const stockpiles = stockpilesData?.data?.filter(
    (stockpile) => !stockpile.deactivatedAt || stockpileIds.includes(stockpile.id)
  );

  // Сонгосон овоолгын (дарааллаар эхний) маршрут — backend ч ингэж тооцно.
  const derivedRouteCode =
    stockpileIds
      .map((id) => stockpiles?.find((stockpile) => stockpile.id === id)?.routeCode)
      .find(Boolean) ?? null;
  // Ирсэн техникээс зөвхөн одоо ажиллаж буй (Идэвхтэй) экскаватор, дугуйт ачигчийг харуулна;
  // засварт байгаа, ашиглалтаас гарсан нь харагдахгүй.
  const vehicles = vehiclesData?.data
    ?.filter(
      (vehicle) =>
        vehicle.id === vehicleId ||
        (PLAN_VEHICLE_TYPES.includes(vehicle.type) && vehicle.status === 'active')
    )
    .sort(
      (a, b) =>
        (vehicleTypeLabels[a.type] ?? a.type).localeCompare(vehicleTypeLabels[b.type] ?? b.type) ||
        (a.code ?? '').localeCompare(b.code ?? '', 'mn', { numeric: true })
    );

  useEffect(() => {
    if (editingPlan) {
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
    setPickUpBlockId('');
    setStockpileIds([]);
    setTransportAmount('');
    setVehicleId('');
    setShiftType('day');
    setDate(dayjs().format('YYYY-MM-DD'));
  };

  const handleSubmit = async () => {
    if (!date || !pickUpBlockId || stockpileIds.length === 0) {
      toast.error('Бүх талбарыг бөглөнө үү');
      return;
    }

    // Маршрутыг backend сонгосон овоолгын маршрутаас авна.
    const formData = {
      pickUpBlockId,
      stockpileIds,
      transportAmount: transportAmount.trim() || undefined,
      vehicleId,
      shiftType,
      date,
    };

    const updateData = {
      id: editingPlan?.id || '',
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
                  className="relative flex-1 overflow-y-auto px-6 py-6 space-y-6"
                >
                  {isLoadingOptions && (
                    <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Сонголтуудыг ачаалж байна...
                    </div>
                  )}
                  <div>
                    <Label>
                      Өдөр <span className="text-red-500">*</span>
                    </Label>
                    {/* Native огноо: бичиж оруулж болно, гар утсанд системийн сонгогч нээгдэнэ. */}
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onClick={(e) => {
                        // Талбар дээр дарахад календарь нээгдэнэ; тоогоор бичиж ч болно.
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {
                          /* хуучин хөтөч */
                        }
                      }}
                      disabled={isPending}
                      className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[
                        { label: 'Өнөөдөр', value: dayjs().format('YYYY-MM-DD') },
                        { label: 'Маргааш', value: dayjs().add(1, 'day').format('YYYY-MM-DD') },
                        { label: 'Нөгөөдөр', value: dayjs().add(2, 'day').format('YYYY-MM-DD') },
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setDate(option.value)}
                          disabled={isPending}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            date === option.value
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>
                      Техник <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      className="w-full mt-1"
                      placeholder={
                        isLoadingVehicles ? 'Ачаалж байна...' : 'Техник'
                      }
                      value={vehicleId}
                      onChange={setVehicleId}
                      disabled={!vehicles || editingPlan !== undefined}
                      options={
                        [
                          // Засаж буй төлөвлөгөөний техник өөр төрлийнх бол кодоор нь харуулна.
                          ...(editingPlan &&
                          editingPlan.vehicleId &&
                          !vehicles?.some((vehicle) => vehicle.id === editingPlan.vehicleId)
                            ? [
                                {
                                  value: editingPlan.vehicleId,
                                  label: editingPlan.vehicleCode || editingPlan.vehicleName || 'Техник',
                                  searchText: editingPlan.vehicleCode ?? '',
                                },
                              ]
                            : []),
                          ...(vehicles?.map((vehicle) => ({
                          value: vehicle.id,
                          label: [vehicle.code || vehicle.name, vehicleTypeLabels[vehicle.type]]
                            .filter(Boolean)
                            .join(' · '),
                          searchText: [
                            vehicle.code,
                            vehicle.name,
                            vehicle.mineNumber,
                            vehicle.vehicleNumber,
                            vehicleTypeLabels[vehicle.type],
                          ]
                            .filter(Boolean)
                            .join(' '),
                        })) ?? []),
                        ]
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
                        placeholder={
                          isLoadingBlocks
                            ? 'Ачаалж байна...'
                            : 'Тэсэлгээний блок сонгох'
                        }
                        value={pickUpBlockId || undefined}
                        onChange={setPickUpBlockId}
                        disabled={isPending || isLoadingBlocks}
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
                        placeholder={
                          isLoadingStockpiles
                            ? 'Ачаалж байна...'
                            : 'Овоолго сонгох...'
                        }
                        value={stockpileIds}
                        onChange={setStockpileIds}
                        disabled={isPending || isLoadingStockpiles}
                        options={
                          stockpiles?.map((stockpile) => {
                            const typeLabel =
                              stockpileTypeMap.find((t) => t.value === stockpile.type)?.label ||
                              stockpile.type;
                            return {
                              value: stockpile.id,
                              text: stockpile.routeCode
                                ? `${typeLabel} - ${stockpile.layerNumber} · ${stockpile.routeCode}`
                                : `${typeLabel} - ${stockpile.layerNumber}`,
                              selected: false,
                            };
                          }) ?? []
                        }
                      />
                      {stockpileIds.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Маршрут (овоолгоос автоматаар):{' '}
                          <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                            {derivedRouteCode ?? 'овоолгод маршрут холбоогүй'}
                          </span>
                        </p>
                      )}
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
                      disabled={isPending || isLoadingOptions}
                      startIcon={
                        isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : undefined
                      }
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