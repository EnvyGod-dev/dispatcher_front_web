import http from '../../index';

export interface SendNotificationInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendBulkNotificationInput {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResponse {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  reason?: string;
}

const notificationService = {
  sendToUser: async (body: SendNotificationInput) => {
    return await http.post<NotificationResponse>(
      '/api/internal/notifications/send',
      { body }
    );
  },

  sendBulk: async (body: SendBulkNotificationInput) => {
    return await http.post<NotificationResponse>(
      '/api/internal/notifications/send-bulk',
      { body }
    );
  },
};

export default notificationService;
