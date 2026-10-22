import http from '../../index';
import { uploadFile } from '@/services/helper/upload-file';
import {
  CreateEmployeeInput,
  DriverShiftGroup,
  Employee,
  EmployeeFilters,
  EmployeesResponse,
  UpdateEmployeeStatusInput,
  UserStatus,
} from './type';

export type BulkCreateEmployeesResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: unknown }>;
};

const employeeService = {
  getEmployees: async (filters: EmployeeFilters) => {
    const response = await http.get<Employee[]>('/api/admin/employees', {
      params: filters,
    });

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as EmployeesResponse;
  },

  createEmployee: async (body: CreateEmployeeInput) => {
    return await http.post<Employee>('/api/admin/register-user', { body });
  },

  uploadUserImage: async (file: File) => {
    const result = await uploadFile(file, '/api/admin/user/upload-image');
    return { body: result, headers: new Headers(), status: 200 };
  },

  updateEmployeeStatus: async (body: UpdateEmployeeStatusInput) => {
    return await http.post('/api/admin/employee-status', { body });
  },

  updateEmployee: async (body: UpdateEmployeeStatusInput) => {
    return await http.put('/api/admin/user', { body });
  },

  bulkUpdateEmployeeStatus: async (userIds: string[], status: UserStatus) => {
    return await Promise.all(
      userIds.map((userId) =>
        http.post('/api/admin/employee-status', {
          body: { userId, status },
        })
      )
    );
  },

  updateEmployeeDriverShiftGroup: async (body: {
    userId: string;
    driverShiftGroup: DriverShiftGroup;
  }) => {
    return await http.put('/api/admin/user/driver-shift-group', { body });
  },

  /**
   * Excel-ээс олноор бүртгэх. Файлыг `prepareEmployeeImport`-оор бэлдсэн байна.
   * http клиентээр илгээдэг тул байгууллагын subdomain header, алдааны мессеж зөв дамжина.
   */
  bulkCreateEmployees: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post<BulkCreateEmployeesResult>(
      '/api/admin/register-user/bulk',
      { body: formData as unknown as Record<string, unknown> }
    );

    return response.body;
  },

  deleteEmployee: async (userId: string) => {
    return await http.delete<boolean>('/api/admin/employee', {
      body: { userId },
    });
  },

  changeEmployeePassword: async (data: {
    userId: string;
    newPassword: string;
  }) => {
    return await http.put<{ success: boolean }>('/api/admin/change-password', {
      body: data,
    });
  },
};

export default employeeService;