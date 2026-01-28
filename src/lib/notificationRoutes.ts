/**
 * Centralized route resolver for notifications.
 * Maps notification type + entityId to application routes.
 */

type NotificationType = 
  | "friend_request_received"
  | "friend_request_accepted"
  | "expense_created"
  | "expense_updated"
  | "expense_confirmed"
  | "debt_created"
  | "debt_settled"
  | string; // Allow unknown types

interface RouteConfig {
  path: string;
  fallback?: string;
}

const routeMap: Record<string, (entityId: string) => RouteConfig> = {
  // Friend-related notifications
  friend_request_received: () => ({
    path: "/friends",
    fallback: "/friends",
  }),
  friend_request_accepted: (entityId) => ({
    path: `/friends/${entityId}`,
    fallback: "/friends",
  }),

  // Expense-related notifications
  expense_created: (entityId) => ({
    path: `/expenses/${entityId}`,
    fallback: "/expenses",
  }),
  expense_updated: (entityId) => ({
    path: `/expenses/${entityId}`,
    fallback: "/expenses",
  }),
  expense_confirmed: (entityId) => ({
    path: `/expenses/${entityId}`,
    fallback: "/expenses",
  }),

  // Debt-related notifications
  debt_created: (entityId) => ({
    path: `/friends/${entityId}`,
    fallback: "/dashboard",
  }),
  debt_settled: (entityId) => ({
    path: `/friends/${entityId}`,
    fallback: "/dashboard",
  }),
};

/**
 * Resolves a notification to an application route.
 * Returns the appropriate route based on notification type and entity ID.
 * Falls back to dashboard for unknown notification types.
 */
export function resolveNotificationRoute(
  type: NotificationType,
  entityId: string,
  entityType?: string
): string {
  const resolver = routeMap[type];

  if (resolver) {
    const config = resolver(entityId);
    return config.path;
  }

  // Fallback based on entityType if type is unknown
  if (entityType) {
    switch (entityType) {
      case "group_expense":
        return `/expenses/${entityId}`;
      case "friendship":
        return `/friends/${entityId}`;
      case "friend_request":
        return "/friends";
      default:
        return "/dashboard";
    }
  }

  return "/dashboard";
}

/**
 * Gets a human-readable title for a notification type.
 */
export function getNotificationTitle(type: NotificationType): string {
  const titles: Record<string, string> = {
    friend_request_received: "New Friend Request",
    friend_request_accepted: "Friend Request Accepted",
    expense_created: "New Expense",
    expense_updated: "Expense Updated",
    expense_confirmed: "Expense Confirmed",
    debt_created: "New Transaction",
    debt_settled: "Debt Settled",
  };

  return titles[type] || "Notification";
}
