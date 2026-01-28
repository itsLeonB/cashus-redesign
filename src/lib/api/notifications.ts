import { apiClient } from "./client";

export interface Notification {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export const notificationApi = {
  getUnread: () => apiClient.get<Notification[]>("/notifications"),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}`),

  markAllAsRead: () => apiClient.patch("/notifications"),
};
