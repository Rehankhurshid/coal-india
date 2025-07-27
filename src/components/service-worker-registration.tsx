"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Check if we're in a secure context (HTTPS or localhost)
          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.log('[Service Worker] Skipping registration - not in secure context');
            return;
          }

          // Wait for the window to load
          await new Promise((resolve) => {
            if (document.readyState === 'complete') {
              resolve(true);
            } else {
              window.addEventListener('load', () => resolve(true));
            }
          });

          // Check if service worker is already registered
          const existingRegistration = await navigator.serviceWorker.getRegistration('/');
          
          if (existingRegistration) {
            console.log('[Service Worker] Already registered:', existingRegistration.scope);
            
            // Update the service worker
            await existingRegistration.update();
            
            // If the worker is the custom push notification worker, we're good
            if (existingRegistration.active?.scriptURL.includes('/worker/index.js')) {
              console.log('[Service Worker] Custom push worker already active');
              return;
            }
          }

          // Register the main PWA service worker first
          let registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          console.log('[Service Worker] PWA worker registered:', registration.scope);

          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('[Service Worker] Ready to receive push notifications');

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('[Service Worker] New content available, refresh to update');
                
                // Optionally show update notification to user
                if (window.confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[Service Worker] Message received:', event.data);
          });

        } catch (error) {
          console.error('[Service Worker] Registration failed:', error);
          
          // Try to unregister and re-register if there's an issue
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
            console.log('[Service Worker] Unregistered all workers, please refresh');
          } catch (unregisterError) {
            console.error('[Service Worker] Failed to unregister:', unregisterError);
          }
        }
      };

      // Register on load with a small delay to ensure PWA plugin has initialized
      setTimeout(registerServiceWorker, 100);

      // Re-register on visibility change to ensure it stays active
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          const registration = await navigator.serviceWorker.getRegistration('/');
          if (registration) {
            registration.update();
          }
        }
      });

    } else {
      console.log('[Service Worker] Not supported in this browser');
    }
  }, []);

  return null;
}
