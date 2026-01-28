import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import {
  Bell,
  MessageCircle,
  ChevronUp,
  UserPlus,
  Trophy,
  CheckCheck,
  Sparkles,
  Mail,
  User as UserIcon,
  Trash2,
  MoreVertical,
  UserMinus,
  Flag,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Notification, User } from "@shared/schema";

type NotificationWithFromUser = Notification & {
  fromUser?: (User & { profileImageUrl?: string | null }) | null;
};

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const { data: notifications, isLoading } = useQuery<NotificationWithFromUser[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/notifications");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({ title: "All notifications cleared" });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="gap-2"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications && notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(true)}
              className="gap-2"
              data-testid="button-clear-all"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} currentUserId={user.id} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearAllMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NotificationItem({ notification, currentUserId }: { notification: NotificationWithFromUser; currentUserId: string }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const markReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/notifications/${notification.id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/notifications/${notification.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({ title: "Notification deleted" });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/users/${notification.fromUserId}/follow`);
    },
    onSuccess: () => {
      toast({ title: "Now following this user" });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/users/${notification.fromUserId}/block`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "User blocked" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/users/${notification.fromUserId}/report`, { reason: "Reported from notification" });
    },
    onSuccess: () => {
      toast({ title: "User reported", description: "Thank you for helping keep our community safe" });
    },
  });

  const getIcon = () => {
    switch (notification.type) {
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "upvote":
        return <ChevronUp className="h-4 w-4 text-green-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-sky-500" />;
      case "grant_winner":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "message":
        return <Mail className="h-4 w-4 text-cyan-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const getLink = () => {
    if (notification.referenceType === "project" && notification.referenceId) {
      return `/projects/${notification.referenceId}`;
    }
    if (notification.referenceType === "user" && notification.referenceId) {
      return `/profile/${notification.referenceId}`;
    }
    return null;
  };

  const link = getLink();

  const handleClick = () => {
    if (!notification.isRead) {
      markReadMutation.mutate();
    }
  };

  const content = (
    <Card
      className={`p-4 transition-all hover-elevate ${!notification.isRead ? "bg-primary/5" : ""}`}
      onClick={handleClick}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex gap-3">
        {notification.fromUser ? (
          <div 
            className="relative flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocation(`/profile/${notification.fromUser!.id}`);
            }}
            data-testid={`link-avatar-${notification.fromUser.id}`}
          >
            <Avatar className="h-10 w-10 hover:opacity-80">
              <AvatarImage src={notification.fromUser.profileImageUrl || undefined} />
              <AvatarFallback><UserIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border">
              {getIcon()}
            </div>
          </div>
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
            {getIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" data-testid={`notification-menu-${notification.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                deleteNotificationMutation.mutate();
              }}
              data-testid="menu-delete-notification"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete notification
            </DropdownMenuItem>
            {notification.fromUserId && notification.fromUserId !== currentUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    followMutation.mutate();
                  }}
                  data-testid="menu-follow-user"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow user
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBlockDialog(true);
                  }}
                  data-testid="menu-block-user"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Block user
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    reportMutation.mutate();
                  }}
                  data-testid="menu-report-user"
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Report user
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this user?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to see your profile or interact with you. You can unblock them later from settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blockMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Bell className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No notifications</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        When someone interacts with your projects or profile, you'll see it here.
      </p>
    </div>
  );
}
