/**
 * Centralized route resolver for notifications.
 * Maps notification type + entityId to application routes.
 */

import { Notification } from "./api/notifications";

const routeMap: Record<string, (notification: Notification) => string> = {
  // Debt-related notifications
  "debt-created": (notification: Notification) => {
    const metadata = notification.metadata as Record<string, string>;
    if (metadata["friendshipId"]) {
      return `/friends/${metadata["friendshipId"]}`;
    }
    return "/friends";
  },
};

const titleMap: Record<string, (notification: Notification) => string> = {
  // Debt-related notifications
  "debt-created": (notification: Notification) => {
    const metadata = notification.metadata as Record<string, string>;
    if (metadata["friendName"]) {
      return `New Transaction with ${metadata["friendName"]}`;
    }

    return "New Transaction";
  },
};

/**
 * Resolves a notification to an application route.
 * Returns the appropriate route based on notification type and entity ID.
 * Falls back to dashboard for unknown notification types.
 */
export function resolveNotificationRoute(notification: Notification): string {
  const resolver = routeMap[notification.type];

  if (resolver) {
    return resolver(notification);
  }

  return "/dashboard";
}

/**
 * Gets a human-readable title for a notification type.
 */
export function getNotificationTitle(notification: Notification): string {
  const titleResolver = titleMap[notification.type];
  if (titleResolver) return titleResolver(notification);
  return "Notification";
}
