import http from '../../index';
import {
  CreateOrganizationInput,
  Organization,
  OrganizationsResponse,
  UpdateOrganizationInput,
} from './types';

const organizationService = {
  getOrganizations: async ({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }) => {
    const response = await http.get<Organization[]>(
      '/api/superadmin/organizations',
      {
        params: {
          limit: String(limit),
          offset: String(offset),
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(
        response.headers?.get('x-total-count') || '0',
        10
      ),
    } as OrganizationsResponse;
  },

  createOrganization: async (body: CreateOrganizationInput) => {
    return await http.post<Organization>('/api/superadmin/organization', {
      body: { ...body },
    });
  },

  updateOrganization: async (body: UpdateOrganizationInput) => {
    return await http.put<Organization>('/api/superadmin/organization', {
      body: { ...body },
    });
  },

  /**
   * Зөвхөн лого солих / устгах.
   *
   * logoUrl = null -> лого устгана
   */
  updateOrganizationLogo: async (id: string, logoUrl: string | null) => {
    return await http.put<Organization>('/api/superadmin/organization', {
      body: { id, logoUrl },
    });
  },

  deleteOrganization: async (id: string) => {
    return await http.delete<boolean>('/api/superadmin/organization', {
      body: { id },
    });
  },
};

export default organizationService;