import { apiClient } from "./client";

export interface Notification {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  readAt: string;
  createdAt: string;
}

export const notificationApi = {
  getAll: (unread: boolean) =>
    apiClient.get<Notification[]>(`/notifications?unread=${unread}`),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}`),

  markAllAsRead: () => apiClient.patch("/notifications"),
};
