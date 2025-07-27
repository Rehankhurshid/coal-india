"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, Info } from "lucide-react";

export function IOSPushDebug() {
  const [debugInfo, setDebugInfo] = useState({
    isIOS: false,
    isStandalone: false,
    hasPushManager: false,
    hasNotificationAPI: false,
    hasServiceWorker: false,
    serviceWorkerReady: false,
    safariVersion: "",
    iosVersion: "",
    displayMode: "",
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const userAgent = window.navigator.userAgent;
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      
      // Check if running as PWA
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
      
      // Get display mode
      let displayMode = "browser";
      if (window.matchMedia('(display-mode: standalone)').matches) {
        displayMode = "standalone";
      } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
        displayMode = "fullscreen";
      } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        displayMode = "minimal-ui";
      }
      
      // Extract iOS version
      let iosVersion = "";
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)(_(\d+))?/);
      if (iosMatch) {
        iosVersion = `${iosMatch[1]}.${iosMatch[2]}${iosMatch[4] ? `.${iosMatch[4]}` : ""}`;
      }
      
      // Extract Safari version
      let safariVersion = "";
      const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
      if (safariMatch) {
        safariVersion = safariMatch[1];
      }
      
      // Check for service worker
      let serviceWorkerReady = false;
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          serviceWorkerReady = !!registration;
        } catch (err) {
          console.error('Service worker check failed:', err);
        }
      }
      
      setDebugInfo({
        isIOS,
        isStandalone: standalone,
        hasPushManager: 'PushManager' in window,
        hasNotificationAPI: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        serviceWorkerReady,
        safariVersion,
        iosVersion,
        displayMode,
      });
    };
    
    checkCapabilities();
  }, []);

  if (!debugInfo.isIOS) {
    return null;
  }

  const canUsePushNotifications = 
    debugInfo.isStandalone && 
    debugInfo.hasPushManager && 
    debugInfo.hasNotificationAPI && 
    debugInfo.hasServiceWorker;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">iOS Push Notification Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {debugInfo.isStandalone ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Running as PWA: {debugInfo.isStandalone ? "Yes" : "No"} ({debugInfo.displayMode})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.hasPushManager ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Push Manager API: {debugInfo.hasPushManager ? "Available" : "Not Available"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.hasNotificationAPI ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Notification API: {debugInfo.hasNotificationAPI ? "Available" : "Not Available"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.hasServiceWorker ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Service Worker: {debugInfo.hasServiceWorker ? "Supported" : "Not Supported"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.serviceWorkerReady ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Service Worker Ready: {debugInfo.serviceWorkerReady ? "Yes" : "No"}</span>
        </div>
        
        {debugInfo.iosVersion && (
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span>iOS Version: {debugInfo.iosVersion}</span>
          </div>
        )}
        
        {debugInfo.safariVersion && (
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span>Safari Version: {debugInfo.safariVersion}</span>
          </div>
        )}
      </div>
      
      {!debugInfo.isStandalone && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To enable push notifications on iOS:
            <ol className="mt-2 ml-4 list-decimal">
              <li>Open this page in Safari (not Chrome)</li>
              <li>Tap the Share button (square with arrow)</li>
              <li>Select "Add to Home Screen"</li>
              <li>Open the app from your home screen</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      {debugInfo.isStandalone && !canUsePushNotifications && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>
            Push notifications are not available. Your iOS version may be too old (requires iOS 16.4+).
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
