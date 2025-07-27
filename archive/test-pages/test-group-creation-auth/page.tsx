'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, XCircle, Shield, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function TestGroupCreationAuth() {
  const { employee, loading: authLoading, currentUserId, isAuthenticated } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [memberIds, setMemberIds] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Authentication status check
  const authStatus = {
    isAuthenticated: isAuthenticated,
    userId: currentUserId,
    userName: employee?.name,
    isLoading: authLoading
  };

  // Load user's groups
  const loadGroups = async () => {
    if (!isAuthenticated || !currentUserId) return;
    
    setIsLoadingGroups(true);
    try {
      const response = await fetch('/api/messaging/groups', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok && data.groups) {
        setGroups(data.groups);
        addTestResult('Load Groups', true, `Loaded ${data.groups.length} groups`);
      } else {
        addTestResult('Load Groups', false, data.error || 'Failed to load groups');
      }
    } catch (error) {
      addTestResult('Load Groups', false, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated]);

  const addTestResult = (test: string, success: boolean, details: string) => {
    setTestResults(prev => [...prev, { test, success, details, timestamp: new Date() }]);
  };

  const testGroupCreation = async () => {
    if (!isAuthenticated || !employee) {
      toast.error('You must be logged in to create groups');
      return;
    }

    setIsCreating(true);
    setTestResults([]);

    try {
      // Test 1: Check authentication status
      addTestResult('Authentication Check', true, `Authenticated as ${employee.name} (${currentUserId})`);

      // Test 2: Validate input
      if (!groupName.trim()) {
        addTestResult('Input Validation', false, 'Group name is required');
        return;
      }
      addTestResult('Input Validation', true, 'Valid input provided');

      // Test 3: Prepare member IDs
      const memberIdArray = memberIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id && id !== currentUserId); // Filter out empty and current user

      addTestResult('Member Preparation', true, `Prepared ${memberIdArray.length} additional members`);

      // Test 4: Create group via API
      const createResponse = await fetch('/api/messaging/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          memberIds: memberIdArray
        })
      });

      const createData = await createResponse.json();

      if (createResponse.ok && createData.success) {
        addTestResult('Group Creation', true, `Created group: ${createData.group.name} (ID: ${createData.group.id})`);
        toast.success(`Group "${createData.group.name}" created successfully!`);

        // Test 5: Verify group membership
        const verifyResponse = await fetch('/api/messaging/groups', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok && verifyData.groups) {
          const newGroup = verifyData.groups.find((g: any) => g.id === createData.group.id);
          if (newGroup) {
            addTestResult('Group Verification', true, `Group found in user's groups with ${newGroup.memberCount} members`);
            
            // Test 6: Send test message
            const messageResponse = await fetch(`/api/messaging/groups/${createData.group.id}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                content: 'Welcome to the group! This is a test message.',
                messageType: 'text'
              })
            });

            if (messageResponse.ok) {
              addTestResult('Message Send', true, 'Successfully sent test message to the group');
            } else {
              const messageError = await messageResponse.json();
              addTestResult('Message Send', false, messageError.error || 'Failed to send message');
            }
          } else {
            addTestResult('Group Verification', false, 'Group not found in user\'s groups');
          }
        } else {
          addTestResult('Group Verification', false, verifyData.error || 'Failed to verify group');
        }

        // Reload groups
        await loadGroups();
        
        // Clear form
        setGroupName('');
        setGroupDescription('');
        setMemberIds('');
      } else {
        addTestResult('Group Creation', false, createData.error || 'Failed to create group');
        toast.error(createData.error || 'Failed to create group');
      }
    } catch (error) {
      addTestResult('Unexpected Error', false, error instanceof Error ? error.message : 'Unknown error');
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to test group creation</p>
            <Button className="mt-4" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Authenticated as: <strong>{authStatus.userName}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Employee ID: <strong>{authStatus.userId}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Group Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group Name *</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Project Team Alpha"
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Optional group description"
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Member IDs (comma-separated)</label>
            <Input
              value={memberIds}
              onChange={(e) => setMemberIds(e.target.value)}
              placeholder="e.g., 12345678, 87654321"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to create a group with just yourself
            </p>
          </div>

          <Button 
            onClick={testGroupCreation} 
            disabled={isCreating || !groupName.trim()}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Group...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <div className="text-sm text-muted-foreground">{result.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Groups ({groups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingGroups ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No groups found</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="p-3 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{group.memberCount} members</span>
                        <span>Role: {group.userRole}</span>
                        <span>{group.unreadCount} unread</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium">{group.avatar}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
