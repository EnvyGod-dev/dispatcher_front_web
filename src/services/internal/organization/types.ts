export interface Organization {
  id: string;
  name: string;
  subdomain: string | null;

  logoUrl?: string | null;

  code?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  deactivatedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  subdomain: string;

  logoUrl?: string | null;

  code?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateOrganizationInput {
  id: string;

  name?: string;
  subdomain?: string;

  /**
   * undefined -> өөрчлөхгүй
   * null      -> логог устгана
   * string    -> шинэ лого
   */
  logoUrl?: string | null;

  code?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface OrganizationsResponse {
  data: Organization[];
  totalCount: number;
}