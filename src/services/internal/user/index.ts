import http from '../../index';
import { UserPrivate } from '../employee/type';

const userService = {
  me: async () => {
    return await http.get<UserPrivate>('/api/iam');
  },
  resetPassword: async (currentPassword: string, newPassword: string) => {
    return await http.post<{ success: boolean }>('/api/iam/change-password', {
      body: { currentPassword, newPassword },
    });
  },
  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
  }) => {
    return await http.put<UserPrivate>('/api/iam/profile', {
      body: data,
    });
  },
};

export default userService;
