import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkAllNotificationsAsRead } from "@/hooks/useApi";
import { notificationApi, Notification } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/queryKeys";
import {
  resolveNotificationRoute,
  getNotificationTitle,
} from "@/lib/notificationRoutes";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onNavigate: () => void;
}

function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isUnread = !notification.readAt;

  const markAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAsRead(notification.id),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unread });

      // Snapshot previous values
      const previousAll = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );
      const previousUnread = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.unread
      );

      // Optimistically update the cache
      const updateNotification = (notifications: Notification[] | undefined) =>
        notifications?.map((n) =>
          n.id === notification.id
            ? { ...n, readAt: new Date().toISOString() }
            : n
        );

      queryClient.setQueryData(
        queryKeys.notifications.all,
        updateNotification(previousAll)
      );
      queryClient.setQueryData(
        queryKeys.notifications.unread,
        previousUnread?.filter((n) => n.id !== notification.id)
      );

      return { previousAll, previousUnread };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previousAll);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(
          queryKeys.notifications.unread,
          context.previousUnread
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });

  const handleClick = () => {
    // Mark as read optimistically
    if (isUnread) {
      markAsReadMutation.mutate();
    }

    // Navigate to the relevant page
    const route = resolveNotificationRoute(
      notification.type,
      notification.entityId,
      notification.entityType
    );
    navigate(route);
    onNavigate();
  };

  const metadata = notification.metadata as Record<string, unknown> | null;
  const description =
    (metadata?.message as string) ||
    (metadata?.description as string) ||
    getNotificationTitle(notification.type);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isUnread ? "bg-accent/30" : "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 h-2 w-2 rounded-full flex-shrink-0",
            isUnread ? "bg-primary" : "bg-transparent"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm", isUnread && "font-medium")}>
            {description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {markAsReadMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

function NotificationSkeleton() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-start gap-3">
        <Skeleton className="h-2 w-2 rounded-full mt-1" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading, isError } = useNotifications(false);
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => !n.readAt).length;
  }, [notifications]);

  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 max-h-[70vh] flex flex-col"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs h-8"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {isLoading ? (
            <div className="space-y-1">
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">Failed to load notifications</p>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="p-1 space-y-1">
              {sortedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with read status */}
        {sortedNotifications.length > 0 && unreadCount === 0 && (
          <div className="p-3 border-t border-border text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Check className="h-3 w-3" />
              All caught up!
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
