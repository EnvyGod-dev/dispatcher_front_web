import http from '../../index';
import {
  CreateVehicleOrganizationInput,
  VehicleOrganization,
  VehicleOrganizationResponse,
} from './types';

const vehicleOrganizationService = {
  getVehicleOrganizations: async ({
    limit,
    offset,
  }: {
    limit?: number;
    offset?: number;
  }) => {
    const response = await http.get<VehicleOrganization[]>(
      '/api/admin/vehicle-organizations',
      {
        params: { limit, offset },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 25),
    } as VehicleOrganizationResponse;
  },
  createVehicleOrganization: async (body: CreateVehicleOrganizationInput) => {
    return await http.post<CreateVehicleOrganizationInput>(
      '/api/admin/vehicle-organization',
      { body }
    );
  },
  updateVehicleOrganization: async ({
    id,
    name,
  }: {
    id: string;
    name: string;
  }) => {
    return await http.put<VehicleOrganization>(
      '/api/admin/vehicle-organization',
      { body: { id, name } }
    );
  },
  deleteVehicleOrganization: async (id: string) => {
    return await http.delete<boolean>('/api/admin/vehicle-organization', {
      body: { id },
    });
  },
};

export default vehicleOrganizationService;
