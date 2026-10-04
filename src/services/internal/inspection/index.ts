import { uploadFile } from '@/services/helper/upload-file';
import http from '../../index';
import {
  CreateInspectionInput,
  Inspection,
  InspectionResponse,
  UpdateInspectionInput,
  CreateShiftInspectionInput,
  CreateShiftInspectionsBulkInput,
  ShiftInspection,
  ShiftInspectionStats,
  ShiftInspectionWithDetails,
  VehicleInspectionSummary,
} from './types';
import { VehicleType } from '../vehicle/types';
import { uploadBulkFile } from '@/lib/file-upload';
import { ShiftType } from '../shift/types';
import { ShiftWithInspections } from '@/app/(admin)/(others-pages)/inspection-report/[id]/page';

const inspectionService = {
  getInspections: async ({
    offset,
    limit,
    vehicleType,
  }: {
    offset?: number;
    limit?: number;
    vehicleType?: VehicleType;
  }) => {
    const response = await http.get<Inspection[]>('/api/internal/inspections', {
      params: {
        offset,
        limit,
        ...(vehicleType && { vehicleType }),
      },
    });

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as InspectionResponse;
  },

  getVehicleInspectionSummary: async ({
    offset = 0,
    limit = 20,
    startDate,
    endDate,
    vehicleType,
    vehicleOrganizationId,
    vehicleId,
    shiftType,
    driverId,
  }: {
    offset?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    vehicleType?: VehicleType;
    vehicleOrganizationId?: string;
    vehicleId?: string;
    shiftType?: ShiftType;
    driverId?: string;
  }) => {
    const response = await http.get<VehicleInspectionSummary[]>(
      '/api/internal/shift-inspections/summary',
      {
        params: {
          offset,
          limit,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(vehicleType && { vehicleType }),
          ...(vehicleOrganizationId && { vehicleOrganizationId }),
          ...(vehicleId && { vehicleId }),
          ...(shiftType && { shiftType }),
          ...(driverId && { driverId }),
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    };
  },

  getInspection: async (id: string) => {
    return await http.get<Inspection>('/api/internal/inspection', {
      params: { id },
    });
  },

  createInspection: async (body: CreateInspectionInput) => {
    return await http.post<Inspection>('/api/internal/inspection', { body });
  },

  bulkCreateInspections: async (formData: FormData) => {
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    return await uploadBulkFile<{
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string; data: any }>;
    }>(file, '/api/internal/inspections/bulk');
  },

  updateInspection: async (body: UpdateInspectionInput) => {
    return await http.put<Inspection>('/api/internal/inspection', { body });
  },

  deleteInspection: async (id: string) => {
    return await http.delete<boolean>('/api/internal/inspection', {
      body: { id },
    });
  },

  // Shift Inspections (driver)
  createShiftInspection: async (body: CreateShiftInspectionInput) => {
    return await http.post<ShiftInspection>('/api/internal/shift-inspection', {
      body,
    });
  },

  createShiftInspectionsBulk: async (body: CreateShiftInspectionsBulkInput) => {
    return await http.post<ShiftInspection[]>(
      '/api/internal/shift-inspections/bulk',
      { body }
    );
  },

  getShiftInspections: async ({
    offset,
    limit,
    vehicleType,
    vehicleId,
    status,
  }: {
    offset: number;
    limit: number;
    vehicleType?: string;
    vehicleId?: string;
    status?: string;
  }) => {
    const response = await http.get<ShiftWithInspections[]>(
      '/api/internal/shift-inspections',
      {
        params: {
          offset,
          limit,
          ...(vehicleType && { vehicleType }),
          ...(vehicleId && { vehicleId }),
          ...(status && { status }),
        },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    };
  },

  getShiftInspectionStats: async (shiftId: string) => {
    return await http.get<ShiftInspectionStats>(
      '/api/internal/shift-inspections/stats',
      {
        params: { shiftId },
      }
    );
  },

  uploadImage: async (file: File) => {
    const result = await uploadFile(
      file,
      '/api/internal/inspection/upload-image'
    );

    return {
      body: result,
      headers: new Headers(),
      status: 200,
    };
  },

  updateShiftInspectionPhoto: async (id: string, photoUrl: string) => {
    return await http.put<ShiftInspection>(
      `/api/internal/shift-inspection/${id}/photo`,
      {
        body: { photoUrl },
      }
    );
  },
};

export default inspectionService;
