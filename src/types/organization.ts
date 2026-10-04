import { UserPrivate } from '@/services/internal/employee/type'

export interface Organization {
  id: string;
  name: string;
  subdomain: string | null;

  code?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  deactivatedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}