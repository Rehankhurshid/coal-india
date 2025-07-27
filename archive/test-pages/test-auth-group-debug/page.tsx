'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { ClientAuthService } from '@/lib/auth/client-auth'

export default function TestAuthGroupDebugPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDebugTest = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // First check if user is authenticated
      const isAuth = ClientAuthService.isAuthenticated()
      const currentUserId = ClientAuthService.getCurrentUserId()
      const authHeaders = ClientAuthService.getAuthHeaders()

      console.log('[DEBUG] Client auth check:', {
        isAuthenticated: isAuth,
        currentUserId,
        hasAuthHeader: 'Authorization' in authHeaders
      })

      if (!isAuth || !currentUserId) {
        setError('Not authenticated. Please log in first.')
        setLoading(false)
        return
      }

      // Run the debug test
      const response = await fetch('/api/debug/auth-group-test', {
        method: 'POST',
        headers: authHeaders
      })

      const data = await response.json()
      console.log('[DEBUG] Test results:', data)
      setResults(data)

    } catch (err: any) {
      console.error('[DEBUG] Test error:', err)
      setError(err.message || 'An error occurred during testing')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Group Creation Debug</CardTitle>
          <CardDescription>
            This page tests the complete authentication and group creation flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDebugTest} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Debug Test...
              </>
            ) : (
              'Run Debug Test'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              {/* Overall Status */}
              <Alert variant={results.success ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.success)}
                  <AlertDescription>
                    {results.success ? 'All tests passed!' : `Failed at step: ${results.step}`}
                  </AlertDescription>
                </div>
              </Alert>

              {/* Auth Headers Check */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Authentication Headers</CardTitle>
                    {getStatusIcon(results.authHeaders?.authHeaderFormat === 'valid-bearer')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p>Has Auth Header: {results.authHeaders?.hasAuthHeader ? 'Yes' : 'No'}</p>
                    <p>Format: {results.authHeaders?.authHeaderFormat}</p>
                    <p>Content-Type: {results.authHeaders?.contentType}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Authenticated User Check */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Authenticated User</CardTitle>
                    {getStatusIcon(!!results.authenticatedUser)}
                  </div>
                </CardHeader>
                <CardContent>
                  {results.authenticatedUser ? (
                    <div className="text-sm space-y-1">
                      <p>Employee ID: {results.authenticatedUser.employeeId}</p>
                      <p>Session ID: {results.authenticatedUser.sessionId}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">No authenticated user found</p>
                  )}
                </CardContent>
              </Card>

              {/* Supabase Connection Check */}
              {results.supabaseTest && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Supabase Connection</CardTitle>
                      {getStatusIcon(results.supabaseTest.canQueryEmployees)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>Can Query Employees: {results.supabaseTest.canQueryEmployees ? 'Yes' : 'No'}</p>
                      {results.supabaseTest.employee && (
                        <p>Employee: {results.supabaseTest.employee.name} ({results.supabaseTest.employee.emp_code})</p>
                      )}
                      {results.supabaseTest.employeeError && (
                        <p className="text-red-500">Error: {results.supabaseTest.employeeError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Group Creation Test */}
              {results.groupCreationTest && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Group Creation Test</CardTitle>
                      {getStatusIcon(results.groupCreationTest.canCreateGroup && results.groupCreationTest.canAddMember)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>Table Exists: {results.groupCreationTest.tableExists ? 'Yes' : 'No'}</p>
                      <p>Can Create Group: {results.groupCreationTest.canCreateGroup ? 'Yes' : 'No'}</p>
                      {results.groupCreationTest.canCreateGroup && (
                        <>
                          <p>Can Add Member: {results.groupCreationTest.canAddMember ? 'Yes' : 'No'}</p>
                          <p>Cleaned Up: {results.groupCreationTest.cleanedUp ? 'Yes' : 'No'}</p>
                        </>
                      )}
                      {results.groupCreationTest.createError && (
                        <div className="mt-2">
                          <p className="text-red-500 font-semibold">Create Error:</p>
                          <p className="text-red-500 text-xs">{results.groupCreationTest.createError}</p>
                          {results.groupCreationTest.createErrorCode && (
                            <p className="text-red-500 text-xs">Code: {results.groupCreationTest.createErrorCode}</p>
                          )}
                        </div>
                      )}
                      {results.groupCreationTest.memberError && (
                        <p className="text-red-500">Member Error: {results.groupCreationTest.memberError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RLS Policies Check */}
              {results.rlsPolicies && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">RLS Policies</CardTitle>
                      {getStatusIcon(results.rlsPolicies.hasGetCurrentUserId)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>Has get_current_user_id: {results.rlsPolicies.hasGetCurrentUserId ? 'Yes' : 'No'}</p>
                      <p>Current User ID: {results.rlsPolicies.currentUserId || 'N/A'}</p>
                      {results.rlsPolicies.rlsError && (
                        <p className="text-red-500">Error: {results.rlsPolicies.rlsError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Errors Summary */}
              {results.errors && results.errors.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-red-500 space-y-1">
                      {results.errors.map((err: string, i: number) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Raw Results */}
              <details className="cursor-pointer">
                <summary className="text-sm text-muted-foreground hover:text-foreground">
                  View Raw Results
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
