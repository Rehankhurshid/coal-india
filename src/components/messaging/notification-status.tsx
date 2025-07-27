"use client";

import { Bell, BellOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NotificationStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function NotificationStatus({ className, showLabel = true }: NotificationStatusProps) {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, requestPermission } = usePushNotifications();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

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

  // iOS-specific message when not in PWA mode
  if (isIOS && !isStandalone && !('Notification' in window)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2 text-muted-foreground cursor-help", className)}>
              <Info className="h-4 w-4" />
              {showLabel && <span className="text-sm">iOS: Install app first</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              To enable notifications on iOS:
            </p>
            <ol className="text-sm mt-2 space-y-1">
              <li>1. Tap the Share button in Safari</li>
              <li>2. Select "Add to Home Screen"</li>
              <li>3. Open the app from your home screen</li>
            </ol>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

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
