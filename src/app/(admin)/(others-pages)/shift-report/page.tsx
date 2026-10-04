'use client';

import MonthlyAggregation from '@/components/shift-report/MonthlyAggregation';
import ShiftReportTable from '@/components/shift-report/ShiftReportTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export default function ShiftsReportPage() {
  const [activeTab, setActiveTab] = useState('shifts');

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shifts">Ээлжийн тайлан</TabsTrigger>
          <TabsTrigger value="monthly">Сарын нэгтгэл</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts">
          <ShiftReportTable />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyAggregation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
