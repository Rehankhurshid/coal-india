'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Bell, 
  Loader2,
  Send,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface DiagnosticItem {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function PushNotificationsDebugPage() {
  const { employee: user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [testSending, setTestSending] = useState(false);

  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const updateDiagnostic = (name: string, update: Partial<DiagnosticItem>) => {
    setDiagnostics(prev => prev.map(item => 
      item.name === name ? { ...item, ...update } : item
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    // Initialize diagnostic items
    const items: DiagnosticItem[] = [
      { name: 'VAPID Keys', status: 'checking', message: 'Checking VAPID configuration...' },
      { name: 'Service Worker', status: 'checking', message: 'Checking service worker registration...' },
      { name: 'Notification Permission', status: 'checking', message: 'Checking notification permission...' },
      { name: 'Push Subscription', status: 'checking', message: 'Checking push subscription...' },
      { name: 'Database Table', status: 'checking', message: 'Checking database table...' },
      { name: 'API Endpoints', status: 'checking', message: 'Checking API endpoints...' },
      { name: 'Environment Variables', status: 'checking', message: 'Checking environment variables...' }
    ];
    
    setDiagnostics(items);

    // 1. Check VAPID Keys
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (publicKey && publicKey.length > 0) {
        updateDiagnostic('VAPID Keys', {
          status: 'success',
          message: 'VAPID public key configured',
          details: { keyLength: publicKey.length }
        });
      } else {
        updateDiagnostic('VAPID Keys', {
          status: 'error',
          message: 'VAPID public key not found. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables.',
        });
      }
    } catch (error) {
      updateDiagnostic('VAPID Keys', {
        status: 'error',
        message: 'Error checking VAPID keys',
        details: error
      });
    }

    // 2. Check Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          updateDiagnostic('Service Worker', {
            status: 'success',
            message: 'Service worker is registered',
            details: {
              scope: registration.scope,
              state: registration.active?.state
            }
          });
        } else {
          updateDiagnostic('Service Worker', {
            status: 'error',
            message: 'No service worker registration found',
          });
        }
      } else {
        updateDiagnostic('Service Worker', {
          status: 'error',
          message: 'Service workers not supported in this browser',
        });
      }
    } catch (error) {
      updateDiagnostic('Service Worker', {
        status: 'error',
        message: 'Error checking service worker',
        details: error
      });
    }

    // 3. Check Notification Permission
    try {
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'granted') {
          updateDiagnostic('Notification Permission', {
            status: 'success',
            message: 'Notifications are enabled',
          });
        } else if (permission === 'denied') {
          updateDiagnostic('Notification Permission', {
            status: 'error',
            message: 'Notifications are blocked. Please enable them in browser settings.',
          });
        } else {
          updateDiagnostic('Notification Permission', {
            status: 'warning',
            message: 'Notification permission not yet granted',
          });
        }
      } else {
        updateDiagnostic('Notification Permission', {
          status: 'error',
          message: 'Notifications not supported in this browser',
        });
      }
    } catch (error) {
      updateDiagnostic('Notification Permission', {
        status: 'error',
        message: 'Error checking notification permission',
        details: error
      });
    }

    // 4. Check Push Subscription
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      
      if (sub) {
        updateDiagnostic('Push Subscription', {
          status: 'success',
          message: 'Push subscription active',
          details: {
            endpoint: sub.endpoint.substring(0, 50) + '...',
            hasKeys: !!(sub.toJSON().keys?.p256dh && sub.toJSON().keys?.auth)
          }
        });
      } else {
        updateDiagnostic('Push Subscription', {
          status: 'warning',
          message: 'No push subscription found. Click the bell icon in messaging to enable.',
        });
      }
    } catch (error) {
      updateDiagnostic('Push Subscription', {
        status: 'error',
        message: 'Error checking push subscription',
        details: error
      });
    }

    // 5. Check Database Table
    try {
      const response = await fetch('/api/push/check-database', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        updateDiagnostic('Database Table', {
          status: 'success',
          message: `Database table exists with ${data.count} subscription(s)`,
          details: data
        });
      } else {
        updateDiagnostic('Database Table', {
          status: 'error',
          message: 'Database table check failed',
        });
      }
    } catch (error) {
      updateDiagnostic('Database Table', {
        status: 'error',
        message: 'Error checking database table',
        details: error
      });
    }

    // 6. Check API Endpoints
    try {
      const endpoints = ['/api/push/subscribe', '/api/push/unsubscribe', '/api/push/send'];
      const results = await Promise.all(
        endpoints.map(async endpoint => {
          try {
            const response = await fetch(endpoint, { method: 'OPTIONS' });
            return { endpoint, ok: response.ok || response.status === 405 };
          } catch {
            return { endpoint, ok: false };
          }
        })
      );
      
      const allOk = results.every(r => r.ok);
      updateDiagnostic('API Endpoints', {
        status: allOk ? 'success' : 'error',
        message: allOk ? 'All API endpoints are accessible' : 'Some API endpoints are not accessible',
        details: results
      });
    } catch (error) {
      updateDiagnostic('API Endpoints', {
        status: 'error',
        message: 'Error checking API endpoints',
        details: error
      });
    }

    // 7. Check Environment Variables
    try {
      const envCheck = {
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      };
      
      const allSet = Object.values(envCheck).every(v => v);
      updateDiagnostic('Environment Variables', {
        status: allSet ? 'success' : 'error',
        message: allSet ? 'All required environment variables are set' : 'Some environment variables are missing',
        details: envCheck
      });
    } catch (error) {
      updateDiagnostic('Environment Variables', {
        status: 'error',
        message: 'Error checking environment variables',
        details: error
      });
    }

    setIsRunning(false);
  };

  const sendTestNotification = async () => {
    setTestSending(true);
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          recipientIds: [user?.employeeId],
          notification: {
            title: 'Test Push Notification',
            body: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            tag: 'test-notification',
            url: '/push-notifications-debug'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Push notification response:', result);
        
        if (result.sent > 0) {
          alert(`✅ Test notification sent successfully!\n\nSent: ${result.sent}\nFailed: ${result.failed}\n\nCheck your notifications (it may take a few seconds to arrive).`);
        } else if (result.total === 0) {
          alert('⚠️ No push subscription found. Please enable notifications first by clicking the bell icon in the messaging page.');
        } else {
          alert(`❌ Failed to send notification.\n\nSent: ${result.sent}\nFailed: ${result.failed}`);
        }
      } else {
        const error = await response.text();
        console.error('Push notification error:', error);
        alert(`Failed to send test notification: ${error}`);
      }
    } catch (error) {
      alert(`Error sending test notification: ${error}`);
    } finally {
      setTestSending(false);
    }
  };

  const getStatusIcon = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticItem['status']) => {
    const variants: Record<DiagnosticItem['status'], 'default' | 'destructive' | 'secondary' | 'outline'> = {
      checking: 'default',
      success: 'outline',
      error: 'destructive',
      warning: 'secondary'
    };
    
    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the push notifications debug page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const overallStatus = diagnostics.every(d => d.status === 'success') ? 'success' : 
                       diagnostics.some(d => d.status === 'error') ? 'error' : 
                       diagnostics.some(d => d.status === 'warning') ? 'warning' : 'checking';

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Push Notifications Debug
        </h1>
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          Re-run Diagnostics
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Overall Status
            {getStatusBadge(overallStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <span className="text-lg">
              {overallStatus === 'success' && 'All systems operational!'}
              {overallStatus === 'error' && 'Some issues need to be resolved.'}
              {overallStatus === 'warning' && 'System is partially configured.'}
              {overallStatus === 'checking' && 'Running diagnostics...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diagnostics.map((item) => (
              <div key={item.name} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div className="space-y-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.message}
                      </div>
                      {item.details && (
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Send Test Notification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Send a test push notification to your device. Make sure you have enabled notifications first.
            </p>
            <Button 
              onClick={sendTestNotification}
              disabled={testSending || !subscription}
            >
              <Send className="h-4 w-4 mr-2" />
              {testSending ? 'Sending...' : 'Send Test Notification'}
            </Button>
            {!subscription && (
              <p className="text-sm text-red-500 mt-2">
                Enable push notifications first by clicking the bell icon in the messaging app.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Current User</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify({ employeeId: user.employeeId, name: user.name }, null, 2)}
            </pre>
          </div>

          {subscription && (
            <div>
              <h3 className="font-semibold mb-2">Current Subscription</h3>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify({
                  endpoint: subscription.endpoint.substring(0, 50) + '...',
                  expirationTime: subscription.expirationTime,
                  hasKeys: !!(subscription.toJSON().keys?.p256dh && subscription.toJSON().keys?.auth)
                }, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
