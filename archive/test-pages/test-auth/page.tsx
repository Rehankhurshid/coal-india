"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ClientAuthService, getAuthHeaders } from '@/lib/auth/client-auth';
import { MessagingApiService } from '@/lib/services/messaging-api';
import { Loader2 } from 'lucide-react';

export default function TestAuthPage() {
  const { isAuthenticated, currentUserId, employee, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [groupCreationResult, setGroupCreationResult] = useState<any>(null);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    checkAuthDebug();
  }, [isAuthenticated]);

  const checkAuthDebug = async () => {
    if (!isAuthenticated) return;

    setIsTestingAuth(true);
    try {
      const response = await fetch('/api/auth/debug', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Debug check failed:', error);
      setDebugInfo({ error: 'Failed to fetch debug info' });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testGroupCreation = async () => {
    setIsCreatingGroup(true);
    setGroupCreationResult(null);
    
    try {
      const groupData = {
        name: `Test Group ${new Date().toLocaleTimeString()}`,
        description: 'Testing group creation with authentication',
        memberIds: []
      };

      console.log('Creating group with data:', groupData);
      console.log('Auth headers:', getAuthHeaders());

      const result = await MessagingApiService.createGroup(groupData);
      
      setGroupCreationResult({
        success: true,
        group: result,
        message: 'Group created successfully!'
      });
    } catch (error) {
      console.error('Group creation failed:', error);
      setGroupCreationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const checkLocalStorage = () => {
    const session = localStorage.getItem('auth_session');
    return session ? JSON.parse(session) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication & Group Creation Test</h1>

      {/* Authentication Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Employee ID:</strong> {currentUserId || 'N/A'}</p>
            <p><strong>Employee Name:</strong> {employee?.name || 'N/A'}</p>
            <p><strong>Local Storage Session:</strong> {checkLocalStorage() ? '✅ Present' : '❌ Missing'}</p>
          </div>
          
          {!isAuthenticated && (
            <div className="mt-4">
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      {isAuthenticated && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isTestingAuth ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking authentication debug info...</span>
                </div>
              ) : debugInfo ? (
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              ) : (
                <p>No debug info available</p>
              )}
              
              <Button 
                onClick={checkAuthDebug} 
                className="mt-4"
                disabled={isTestingAuth}
              >
                Refresh Debug Info
              </Button>
            </CardContent>
          </Card>

          {/* Group Creation Test */}
          <Card>
            <CardHeader>
              <CardTitle>Group Creation Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testGroupCreation}
                disabled={isCreatingGroup}
                className="mb-4"
              >
                {isCreatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Group...
                  </>
                ) : (
                  'Create Test Group'
                )}
              </Button>

              {groupCreationResult && (
                <div className={`p-4 rounded ${groupCreationResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className="font-semibold mb-2">
                    {groupCreationResult.success ? '✅ Success' : '❌ Failed'}
                  </p>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(groupCreationResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
