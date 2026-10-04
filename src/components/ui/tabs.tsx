'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-11 w-fit items-center justify-center rounded-lg p-1',
        'bg-gray-100 dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-4 py-2',
        'text-sm font-medium whitespace-nowrap transition-all',
        'text-gray-600 dark:text-gray-400',
        'hover:text-gray-900 dark:hover:text-gray-200',
        'focus-visible:outline-none focus-visible:ring-2 ',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900',
        'data-[state=active]:text-gray-900 dark:data-[state=active]:text-white',
        'data-[state=active]:shadow-sm',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none mt-4', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
