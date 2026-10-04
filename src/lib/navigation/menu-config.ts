import { UserRole } from '@/services/roles';
import { LucideIcon } from 'lucide-react';

export type MenuItemType = 'register' | 'report' | 'other';

export type MenuItem = {
  name: string;
  icon: LucideIcon;
  path?: string;
  type: MenuItemType;
  subItems?: SubMenuItem[];
  roles?: readonly UserRole[];
};

export type SubMenuItem = {
  name: string;
  path: string;
  roles: readonly UserRole[];
  pro?: boolean;
  new?: boolean;
  badge?: 'new' | 'pro';
};

export type MenuSection = {
  title: string;
  key: 'register' | 'report' | 'other';
  items: MenuItem[];
  badge?: 'new' | 'pro';
};
