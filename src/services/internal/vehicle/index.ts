import { uploadFile } from '@/services/helper/upload-file';
import http from '../../index';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  Vehicle,
  VehiclePicture,
  VehicleResponse,
  VehicleStatus,
  VehicleType,
} from './types';

const vehicleService = {
  getVehicles: async ({
    offset,
    limit,
    type,
    name,
    code,
    vehicleNumber,
    status,
    vehicleOrganizationId,
    sortColumn,
    sortOrder,
  }: {
    offset?: number;
    limit?: number;
    type?: VehicleType;
    name?: string;
    code?: string;
    vehicleNumber?: string;
    status?: VehicleStatus;
    vehicleOrganizationId?: string;
    sortColumn?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await http.get<Vehicle[]>('/api/internal/vehicles', {
      params: {
        offset,
        limit,
        type,
        name,
        code,
        vehicleNumber,
        status,
        vehicleOrganizationId,
        sortColumn,
        sortOrder,
      },
    });

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as VehicleResponse;
  },

  getShiftVehicles: async ({
    limit,
    offset,
    type,
  }: {
    limit?: number;
    offset?: number;
    type?: VehicleType;
  }) => {
    const response = await http.get<Vehicle[]>('/api/internal/shift-vehicles', {
      params: {
        limit,
        offset,
        type,
      },
    });
    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as VehicleResponse;
  },

  getVehicle: async (id: string) => {
    return await http.get<Vehicle>('/api/internal/vehicle', {
      params: { id },
    });
  },

  getVehiclePictures: async (id: string) => {
    return await http.get<VehiclePicture[]>('api/internal/vehicle/pictures', {
      params: { id },
    });
  },

  createVehicle: async (body: CreateVehicleInput) => {
    return await http.post<Vehicle>('/api/admin/vehicle', { body });
  },
  uploadVehicleImage: async (file: File) => {
    const result = await uploadFile(file, '/api/admin/vehicle/upload-image');
    return {
      body: result,
      headers: new Headers(),
      status: 200,
    };
  },
  deleteVehicleImage: async ({
    vehicleId,
    position,
  }: {
    vehicleId: string;
    position: string;
  }) => {
    return await http.delete('/api/admin/vehicle/delete-picture', {
      body: {
        vehicleId,
        position,
      },
    });
  },
  updateVehicle: async (body: UpdateVehicleInput) => {
    console.log(body, 'body');

    return await http.put<UpdateVehicleInput>('/api/admin/vehicle', { body });
  },
  deleteVehicle: async (id: string) => {
    return await http.delete<{ success: boolean }>('/api/admin/vehicle', {
      body: { id },
    });
  },
};

export default vehicleService;
