'use client';

import DatePicker from '@/components/form/date-picker';
import DropzoneComponent from '@/components/form/form-elements/DropZone';
import Select from '@/components/form/Select';
import Switch from '@/components/form/switch/Switch';
import { formatDate } from '@/lib/time-formatter';
import miningSectionService from '@/services/internal/mining-section';
import vehicleService from '@/services/internal/vehicle';
import vehicleOrganizationService from '@/services/internal/vehicle-organization';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  Vehicle,
  VehicleImagePosition,
  vehiclePositionMap,
  vehicleStatusOptions,
  vehicleTypeMap,
} from '@/services/internal/vehicle/types';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Label from '../../form/Label';
import Loading from '../../loading';
import { Button } from '../button';

interface AddVehicleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingVehicle?: Vehicle;
}

export default function VehicleSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingVehicle,
}: AddVehicleSidebarProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateVehicleInput>({
    name: '',
    code: '',
    vehicleNumber: '',
    serialNumber: '',
    engineNumber: '',
    vehicleOrganizationId: '',
    miningSectionId: '',
    mineNumber: '',
    type: 'truck',
    commissioningDate: '',
    insuranceExpiryDate: '',
    decommissioningDate: '',
    soilCoefficient: '',
    coalCoefficient: '',
    stoppedMotoHours: undefined,
    hasGps: false,
    gpsId: '',
    gpsGroupId: '',
    gpsName: '',
    hasBuzzer: false,
    hasFuelSensor: false,
    fuelConsumptionPerHour: undefined,
    notes: '',
    vehiclePictures: [],
    vehicleType: 'excavator',
    status: 'active',
  });

  const isEditMode = !!editingVehicle;

  useEffect(() => {
    if (editingVehicle) {
      setFormData(editingVehicle);
    }
  }, [editingVehicle]);

  const { data: vehicleOrganizations } = useQuery({
    queryKey: ['vehicleOrganizations'],
    queryFn: () =>
      vehicleOrganizationService.getVehicleOrganizations({
        offset: 0,
        limit: 50,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: miningSections } = useQuery({
    queryKey: ['miningSections'],
    queryFn: () =>
      miningSectionService.getMiningSections({ offset: 0, limit: 50 }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: vehiclePictures } = useQuery({
    queryKey: ['vehicle-pictures', editingVehicle?.id],
    queryFn: () => vehicleService.getVehiclePictures(editingVehicle!.id),
    enabled: !!editingVehicle,
    placeholderData: undefined,
  });

  const { isPending: pendingCreate, mutateAsync: createVehicle } = useMutation({
    mutationFn: vehicleService.createVehicle,

    onSuccess: () => {
      toast.success('Техник амжилттай үүслээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Техник үүсгэхэд алдаа гарлаа');
    },
  });

  const { isPending: pendingDelete, mutateAsync: deletePicture } = useMutation({
    mutationFn: vehicleService.deleteVehicleImage,
    onSuccess: () => {
      toast.success('Зураг амжилттай устгалаа');
      queryClient.invalidateQueries({
        queryKey: ['vehicle-pictures', editingVehicle?.id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Зураг устгахад алдаа гарлаа');
    },
  });

  const handleImageDelete = async (position: VehicleImagePosition) => {
    const existingPicture = vehiclePictures?.body.find(
      (pic) => pic.position === position
    );

    if (existingPicture && editingVehicle) {
      // delete from server
      try {
        await deletePicture({
          vehicleId: editingVehicle.id,
          position,
        });
      } catch (error) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      vehiclePictures: prev.vehiclePictures?.filter(
        (pic) => pic.position !== position
      ),
    }));
  };
  const { isPending: pendingUpdate, mutateAsync: updateVehicle } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleInput }) =>
      vehicleService.updateVehicle({
        ...data,
        id,
      }),
    onSuccess: () => {
      toast.success('Техник амжилттай шинэчлэгдлээ');
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Техник шинэчлэхэд алдаа гарлаа');
    },
  });

  const isPending = pendingCreate || pendingUpdate;

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      vehicleNumber: '',
      serialNumber: '',
      engineNumber: '',
      vehicleOrganizationId: '',
      miningSectionId: '',
      mineNumber: '',
      type: 'truck',
      soilCoefficient: '',
      coalCoefficient: '',
      stoppedMotoHours: undefined,
      hasGps: false,
      commissioningDate: '',
      insuranceExpiryDate: '',
      decommissioningDate: '',
      gpsId: '',
      gpsGroupId: '',
      gpsName: '',
      hasBuzzer: false,
      hasFuelSensor: false,
      fuelConsumptionPerHour: undefined,
      notes: '',
      vehiclePictures: [],
      vehicleType: 'excavator',
    });
  };

  const handleInputChange = (
    field: keyof CreateVehicleInput,
    value: string | number | boolean
  ) => {
    const updatedFormData = { ...formData, [field]: value };

    if (field === 'vehicleNumber' || field === 'mineNumber') {
      updatedFormData.code = generateCode(
        updatedFormData.vehicleNumber as string,
        updatedFormData.mineNumber as string
      );
    }

    setFormData(updatedFormData);
  };

  const generateCode = (vehicleNumber: string, mineNumber: string | number) => {
    return `#${mineNumber} ${vehicleNumber}`.trim();
  };

  const handleImageUpload = (url: string, position: VehicleImagePosition) => {
    setFormData((prev) => ({
      ...prev,
      vehiclePictures: [...(prev.vehiclePictures || []), { position, url }],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type || !formData.vehicleNumber) {
      toast.error('Нэр, төрөл, улсын дугаарыг оруулна уу.');
      return;
    }

    const code = generateCode(
      formData.vehicleNumber as string,
      formData.mineNumber as string
    );

    try {
      if (isEditMode && editingVehicle) {
        await updateVehicle({
          id: editingVehicle.id,
          data: { ...formData, id: editingVehicle.id },
        });
      } else {
        await createVehicle({ ...formData, code });
      }
    } catch (error: any) {
      toast.error(error.message || 'Алдаа гарлаа.');
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
              className="pointer-events-auto relative w-screen max-w-3xl transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
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

              <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 py-6 shadow-xl">
                <div className="relative mt-6 flex-1 px-4 sm:px-6">
                  {isPending ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-2 gap-6"
                    >
                      <div>
                        <Label>Байгууллагын нэр</Label>
                        <Select
                          value={formData.vehicleOrganizationId || undefined}
                          onChange={(value) =>
                            handleInputChange('vehicleOrganizationId', value)
                          }
                          className="mt-2 w-full"
                          placeholder="Байгууллага сонгох"
                          disabled={isPending}
                          options={
                            vehicleOrganizations?.data.map((org) => ({
                              value: org.id,
                              label: org.name,
                            })) || []
                          }
                        />
                      </div>

                      <div>
                        <Label>Уулын хэсэг</Label>
                        <Select
                          value={formData.miningSectionId || undefined}
                          onChange={(value) =>
                            handleInputChange('miningSectionId', value)
                          }
                          className="mt-2 w-full"
                          placeholder="Уулын хэсэг сонгох"
                          disabled={isPending}
                          options={
                            miningSections?.data.map((miningSection) => ({
                              value: miningSection.id,
                              label: miningSection.name,
                            })) || []
                          }
                        />
                      </div>

                      <div>
                        <Label>Төрөл</Label>
                        <Select
                          onChange={(value) => handleInputChange('type', value)}
                          className="mt-2 w-full h-12"
                          value={formData.type}
                          placeholder="Төрөл сонгох"
                          options={vehicleTypeMap}
                        />
                      </div>

                      <div>
                        <Label>Нэр</Label>
                        <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md font-semibold text-sm dark:bg-blue-900/30 dark:text-blue-300">
                          {formData.code !== '#' ? formData.code : ''}
                        </div>
                      </div>

                      {(
                        [
                          ['name', 'Техникийн марк'],
                          ['vehicleNumber', 'Улсын дугаар'],
                          ['serialNumber', 'URL дугаар'],
                          ['engineNumber', 'СТАНЦ ID'],
                          ['mineNumber', 'Парк дугаар'],
                          ['commissioningDate', 'Ашиглалтад орсон огноо'],
                          [
                            'insuranceExpiryDate',
                            'Техникийн даатгалын хугацаа',
                          ],
                          ['soilCoefficient', 'Хөрсний тэвшний багтаамж'],
                          ['coalCoefficient', 'Нүүрсний тэвшний багтаамж'],
                          ['decommissioningDate', 'Хасагдсан огноо'],
                          ['stoppedMotoHours', 'Зогссон мото цаг'],
                          ['gpsId', 'GPS ID'],
                          ['gpsGroupId', 'GPS Group ID'],
                          ['gpsName', 'GPS нэр'],
                          ['fuelConsumptionPerHour', 'Цагийн түлш зарцуулалт'],
                          ['notes', 'Тэмдэглэл'],
                        ] as [keyof CreateVehicleInput, string][]
                      ).map(([field, label]) => (
                        <div key={field}>
                          <Label>{label}</Label>
                          {[
                            'commissioningDate',
                            'insuranceExpiryDate',
                            'decommissioningDate',
                          ].includes(field) ? (
                            <DatePicker
                              id={
                                field === 'commissioningDate'
                                  ? 'commissioningDate'
                                  : field === 'insuranceExpiryDate'
                                    ? 'insuranceExpiryDate'
                                    : 'decommissioningDate'
                              }
                              placeholder={
                                editingVehicle
                                  ? field === 'commissioningDate'
                                    ? formatDate(
                                        editingVehicle.commissioningDate
                                      )
                                    : field === 'insuranceExpiryDate'
                                      ? formatDate(
                                          editingVehicle.insuranceExpiryDate
                                        )
                                      : formatDate(
                                          editingVehicle.decommissioningDate
                                        )
                                  : undefined
                              }
                              mode="single"
                              onChange={(date) =>
                                handleInputChange(
                                  field,
                                  date?.[0]?.toISOString() || ''
                                )
                              }
                            />
                          ) : (
                            <Input
                              type="text"
                              value={
                                (formData[field] as
                                  | string
                                  | number
                                  | undefined) ?? ''
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  field,
                                  field === 'stoppedMotoHours' ||
                                    field === 'fuelConsumptionPerHour'
                                    ? Number(e.target.value)
                                    : e.target.value
                                )
                              }
                              disabled={isPending}
                              className="mt-2"
                            />
                          )}
                        </div>
                      ))}

                      {isEditMode ? (
                        <div>
                          <Label>Төлөв</Label>
                          <Select
                            value={formData.status || undefined}
                            onChange={(value) =>
                              handleInputChange('status', value)
                            }
                            className="mt-2 w-full"
                            placeholder="Төлөв"
                            disabled={isPending}
                            options={vehicleStatusOptions}
                          />
                        </div>
                      ) : (
                        <></>
                      )}

                      {/* Boolean Switches */}
                      <div className="col-span-2 flex gap-4 mt-4">
                        <div className="flex gap-4">
                          <Switch
                            label="Түлшний мэдрэгчтэй"
                            checked={formData.hasFuelSensor as boolean}
                            onChange={(e) =>
                              handleInputChange('hasFuelSensor', e.valueOf())
                            }
                          />
                          <Switch
                            label="Дохиололтой"
                            checked={formData.hasBuzzer as boolean}
                            onChange={(e) =>
                              handleInputChange('hasBuzzer', e.valueOf())
                            }
                          />
                          <Switch
                            label="GPS суурилуулсан"
                            checked={formData.hasGps as boolean}
                            onChange={(e) =>
                              handleInputChange('hasGps', e.valueOf())
                            }
                          />
                        </div>
                      </div>

                      {/* Dropzones */}
                      <div className="col-span-2 grid grid-cols-2 gap-6 mt-6">
                        {vehiclePositionMap.map(
                          ({
                            position,
                            label,
                          }: {
                            position: VehicleImagePosition;
                            label: string;
                          }) => {
                            // first check formData (newly uploaded), then fall back to existing pictures
                            const existingPicture =
                              formData.vehiclePictures?.find(
                                (pic) => pic.position === position
                              ) ||
                              vehiclePictures?.body.find(
                                (pic) => pic.position === position
                              );

                            return (
                              <div key={position} className="space-y-2">
                                <DropzoneComponent
                                  position={position}
                                  title={label}
                                  onUpload={(url) =>
                                    handleImageUpload(url, position)
                                  }
                                  initialUrl={existingPicture?.url}
                                />
                                {existingPicture?.url && (
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                      {label}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleImageDelete(position)
                                      }
                                      className="text-sm text-red-600 hover:text-red-800"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
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
                    disabled={
                      isPending ||
                      !formData.name ||
                      !formData.code ||
                      !formData.type ||
                      !formData.vehicleNumber
                    }
                    variant="default"
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
