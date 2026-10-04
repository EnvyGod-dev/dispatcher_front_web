'use client';
import { use } from 'react';

import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import vehicleService from '@/services/internal/vehicle';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Loading from '@/components/loading';
import VehicleSidebar from '@/components/ui/vehicle/Sidebar';
import { vehicleTypeLabels } from '@/services/internal/vehicle/types';
import { formatDate } from '@/lib/time-formatter';

interface VehicleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}
export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { id } = use(params);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vehicle'],
    queryFn: () => vehicleService.getVehicle(id),
  });

  const vehicle = data?.body || undefined;

  if (isLoading) {
    return <Loading />;
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Vehicle not found
        </h2>
        <button
          onClick={() => router.push('/vehicles')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Vehicles
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle={vehicle.name}
        breadcrumbs={[
          { label: 'Техник', href: '/vehicles' },
          { label: vehicle.name },
        ]}
        actions={[
          {
            label: 'Засах',
            onClick: () => setIsEditOpen(true),
            variant: 'primary',
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            ),
          },
        ]}
      />

      <div className="space-y-6">
        <ComponentCard title="Үндсэн мэдээлэл">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Техникийн марк" value={vehicle.name} />
            <InfoItem label="Улсын дугаар" value={vehicle.vehicleNumber} />
            <InfoItem label="Нэр" value={vehicle.code} />
            <InfoItem
              label="Төрөл"
              value={
                <span className="inline-flex px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {vehicleTypeLabels[vehicle.type]}
                </span>
              }
            />
            <InfoItem label="URL дугаар" value={vehicle.serialNumber} />
            <InfoItem label="СТАНЦ ID" value={vehicle.engineNumber} />
            <InfoItem label="Парк дугаар" value={`#${vehicle.mineNumber}`} />
            <InfoItem
              label="Төлөв"
              value={
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {vehicle.status === 'active'
                    ? 'Идэвхтэй'
                    : vehicle.status === 'maintenance'
                      ? 'Засвартай'
                      : 'Идэвхгүй'}
                </span>
              }
            />
          </div>
        </ComponentCard>

        {/* Technical Specifications */}
        <ComponentCard title="Техникийн мэдээлэл">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              label="Тэвшний багтаамж /Нүүрс/"
              value={vehicle.coalCoefficient?.toString()}
            />
            <InfoItem
              label="Тэвшний багтаамж /Хөрс/"
              value={vehicle.soilCoefficient?.toString()}
            />
            <InfoItem
              label="Түлшний норм/Цагт"
              value={vehicle.fuelConsumptionPerHour?.toString()}
            />
            <InfoItem
              label="Ашиглалтанд авсан огноо"
              value={formatDate(vehicle.commissioningDate)}
            />
            <InfoItem
              label="Техникийн даатгалын хугацаа"
              value={formatDate(vehicle.insuranceExpiryDate)}
            />
            <InfoItem
              label="Зогссон огноо"
              value={vehicle.decommissioningDate}
            />
            <InfoItem
              label="Зогссон мото цаг"
              value={vehicle.stoppedMotoHours?.toString()}
            />
          </div>
        </ComponentCard>

        {/* GPS & Sensors */}
        <ComponentCard title="GPS & Мэдрэгч">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem
              label="GPS суурилуулсан эсэх"
              value={vehicle.hasGps ? 'Тийм' : 'Үгүй'}
            />
            <InfoItem label="GPS ID" value={vehicle.gpsId} />
            <InfoItem label="GPS Group ID" value={vehicle.gpsGroupId} />
            <InfoItem label="GPS Нэр" value={vehicle.gpsName} />
            <InfoItem
              label="Дохиололтой эсэх"
              value={vehicle.hasBuzzer ? 'Тийм' : 'Үгүй'}
            />
            <InfoItem
              label="Түлшний мэдрэгчтэй эсэх"
              value={vehicle.hasFuelSensor ? 'Тийм' : 'Үгүй'}
            />
          </div>
        </ComponentCard>

        {/* Organization & Section */}
        {(vehicle.vehicleOrganizationId || vehicle.miningSectionId) && (
          <ComponentCard title="Байгууллага">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                label="Байгууллага"
                value={vehicle.vehicleOrganization?.name}
              />
              <InfoItem
                label="Уулын хэсэг"
                value={vehicle.miningSection?.name}
              />
            </div>
          </ComponentCard>
        )}

        {/* Notes */}
        {vehicle.notes && (
          <ComponentCard title="Тэмдэглэл">
            <p className="text-gray-600 dark:text-gray-400">{vehicle.notes}</p>
          </ComponentCard>
        )}

        {vehicle.vehiclePictures && vehicle.vehiclePictures.length > 0 && (
          <ComponentCard title="Техниктэй холбоотой зургууд">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ">
              {vehicle.vehiclePictures.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    src={image.url}
                    alt="Cover"
                    className="w-full border border-gray-200 rounded-xl dark:border-gray-800"
                    width={1054}
                    height={600}
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {image.position}
                  </span>
                </div>
              ))}
            </div>
          </ComponentCard>
        )}
      </div>

      {vehicle && (
        <VehicleSidebar
          editingVehicle={vehicle}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// Helper component for displaying information
interface InfoItemProps {
  label: string;
  value?: string | number | React.ReactNode;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
        {value || '-'}
      </dd>
    </div>
  );
}
