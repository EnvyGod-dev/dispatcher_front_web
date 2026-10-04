'use client';

import MiningSections from '@/components/mining-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VehicleOrganizationTable from '@/components/vehicle-organization/VehicleOrganizations';
import Vehicles from '@/components/vehicles';
import { useState } from 'react';

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState('vehicles');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="vehicles">Техник</TabsTrigger>
        <TabsTrigger value="mining-sections">Уулын хэсэг</TabsTrigger>
        <TabsTrigger value="vehicle-organizations">
          Туслан гүйцэтгэгч компани
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vehicles">
        <Vehicles />
      </TabsContent>

      <TabsContent value="mining-sections">
        <MiningSections />
      </TabsContent>

      <TabsContent value="vehicle-organizations">
        <VehicleOrganizationTable />
      </TabsContent>
    </Tabs>
  );
}
