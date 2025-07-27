'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function MessagingTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [employeeId, setEmployeeId] = useState('3000');

  const updateResult = (name: string, status: TestResult['status'], message?: string, data?: any) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.name === name);
      const result = { name, status, message, data };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setGroupId(null);

    try {
      // Test 1: Check Authentication Status
      updateResult('Authentication Check', 'pending');
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authRes.ok && authData.authenticated) {
          updateResult('Authentication Check', 'success', 
            `Authenticated as ${authData.employee.name} (${authData.employee.emp_code})`,
            authData
          );
        } else {
          updateResult('Authentication Check', 'error', 'Not authenticated');
        }
      } catch (e: any) {
        updateResult('Authentication Check', 'error', e.message);
      }

      // Test 2: Database Tables Check
      updateResult('Database Tables', 'pending');
      try {
        const tablesRes = await fetch('/api/messaging/test-tables');
        const tablesData = await tablesRes.json();
        if (tablesRes.ok) {
          const allAccessible = Object.values(tablesData.tables || {}).every((t: any) => t.accessible);
          updateResult('Database Tables', allAccessible ? 'success' : 'error',
            allAccessible ? 'All messaging tables accessible' : 'Some tables not accessible',
            tablesData
          );
        } else {
          updateResult('Database Tables', 'error', tablesData.error || 'Failed to check tables');
        }
      } catch (e: any) {
        updateResult('Database Tables', 'error', e.message);
      }

      // Test 3: Get User Groups
      updateResult('Get User Groups', 'pending');
      try {
        const groupsRes = await fetch('/api/messaging/groups');
        const groupsData = await groupsRes.json();
        if (groupsRes.ok) {
          updateResult('Get User Groups', 'success', 
            `Found ${groupsData.groups?.length || 0} groups`,
            groupsData
          );
          if (groupsData.groups?.length > 0) {
            setGroupId(groupsData.groups[0].id);
          }
        } else {
          updateResult('Get User Groups', 'error', groupsData.error || 'Failed to fetch groups');
        }
      } catch (e: any) {
        updateResult('Get User Groups', 'error', e.message);
      }

      // Test 4: Create Test Group
      updateResult('Create Test Group', 'pending');
      try {
        const createRes = await fetch('/api/messaging/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Test Group ${Date.now()}`,
            description: 'Automated test group',
            memberIds: [employeeId]
          })
        });
        const createData = await createRes.json();
        if (createRes.ok) {
          updateResult('Create Test Group', 'success', 
            `Created group: ${createData.group.name}`,
            createData
          );
          setGroupId(createData.group.id);
        } else {
          updateResult('Create Test Group', 'error', createData.error || 'Failed to create group');
        }
      } catch (e: any) {
        updateResult('Create Test Group', 'error', e.message);
      }

      // Test 5: Fetch Messages (if we have a group)
      if (groupId || results.find(r => r.name === 'Create Test Group')?.status === 'success') {
        const testGroupId = groupId || results.find(r => r.name === 'Create Test Group')?.data?.group?.id;
        if (testGroupId) {
          updateResult('Fetch Messages', 'pending');
          try {
            const messagesRes = await fetch(`/api/messaging/groups/${testGroupId}/messages`);
            const messagesData = await messagesRes.json();
            if (messagesRes.ok) {
              updateResult('Fetch Messages', 'success', 
                `Fetched ${messagesData.messages?.length || 0} messages`,
                messagesData
              );
            } else {
              updateResult('Fetch Messages', 'error', 
                messagesData.error || 'Failed to fetch messages',
                messagesData
              );
            }
          } catch (e: any) {
            updateResult('Fetch Messages', 'error', e.message);
          }

          // Test 6: Send Test Message
          updateResult('Send Test Message', 'pending');
          try {
            const sendRes = await fetch(`/api/messaging/groups/${testGroupId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `Test message sent at ${new Date().toLocaleTimeString()}`,
                messageType: 'text'
              })
            });
            const sendData = await sendRes.json();
            if (sendRes.ok) {
              updateResult('Send Test Message', 'success', 
                'Message sent successfully',
                sendData
              );
            } else {
              updateResult('Send Test Message', 'error', sendData.error || 'Failed to send message');
            }
          } catch (e: any) {
            updateResult('Send Test Message', 'error', e.message);
          }
        }
      }

    } finally {
      setIsRunning(false);
    }
  };

  const loginAndTest = async () => {
    // First login
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      
      if (!loginRes.ok) {
        alert('Login failed');
        return;
      }

      // Skip OTP for testing
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeId,
          otp: 'skip'
        })
      });

      if (verifyRes.ok) {
        // Reload to update auth state
        window.location.reload();
      } else {
        alert('OTP verification failed');
      }
    } catch (e: any) {
      alert('Login error: ' + e.message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Messaging System Test Suite</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Employee ID</label>
            <Input 
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter employee ID"
            />
          </div>
          <Button onClick={loginAndTest} variant="outline">
            Login & Set Auth
          </Button>
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {results.map((result, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.status === 'pending' && (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                )}
                {result.status === 'success' && <Check className="w-5 h-5 text-green-600" />}
                {result.status === 'error' && <X className="w-5 h-5 text-red-600" />}
                
                <div>
                  <h3 className="font-semibold">{result.name}</h3>
                  {result.message && (
                    <p className="text-sm text-gray-600">{result.message}</p>
                  )}
                </div>
              </div>
              
              {result.data && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    View Details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </Card>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click "Run All Tests" to start testing the messaging system.
            Make sure you're logged in first!
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Test Sequence:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Check authentication status</li>
          <li>Verify database tables are accessible</li>
          <li>Fetch existing user groups</li>
          <li>Create a new test group</li>
          <li>Fetch messages from the group</li>
          <li>Send a test message to the group</li>
        </ol>
      </div>
    </div>
  );
}
