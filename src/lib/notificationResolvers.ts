/**
 * Centralized route resolver for notifications.
 * Maps notification type + entityId to application routes.
 */

import { Notification } from "./api/notifications";

type NotificationConfig = {
  route: (notification: Notification) => string;
  title: (notification: Notification) => string;
};

const notificationConfigs: Record<string, NotificationConfig> = {
  "debt-created": {
    route: (notification) => {
      const metadata = notification.metadata;
      if (metadata["friendshipId"]) {
        return `/friends/${metadata["friendshipId"]}`;
      }
      return "/friends";
    },
    title: (notification) => {
      const metadata = notification.metadata;
      if (metadata["friendName"]) {
        return `New Transaction with ${metadata["friendName"]}`;
      }
      return "New Transaction";
    },
  },
};

/**
 * Resolves a notification to an application route.
 * Returns the appropriate route based on notification type and entity ID.
 * Falls back to dashboard for unknown notification types.
 */
export function resolveNotificationRoute(notification: Notification): string {
  return (
    notificationConfigs[notification.type]?.route(notification) || "/dashboard"
  );
}

/**
 * Gets a human-readable title for a notification type.
 */
export function getNotificationTitle(notification: Notification): string {
  return (
    notificationConfigs[notification.type]?.title(notification) ||
    "Notification"
  );
}
