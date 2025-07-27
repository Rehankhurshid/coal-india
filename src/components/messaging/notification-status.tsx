"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

interface NotificationStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function NotificationStatus({ className, showLabel = true }: NotificationStatusProps) {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, requestPermission } = usePushNotifications();

  const handleToggle = async () => {
    if (!isSubscribed && permission !== 'granted') {
      await requestPermission();
    }
    if (permission === 'granted') {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    }
  };

  if (permission === 'denied') {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <BellOff className="h-4 w-4" />
        {showLabel && <span className="text-sm">Notifications blocked</span>}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4 text-green-600" />
          {showLabel && <span>Notifications on</span>}
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4 text-muted-foreground" />
          {showLabel && <span>Notifications off</span>}
        </>
      )}
    </Button>
  );
}
