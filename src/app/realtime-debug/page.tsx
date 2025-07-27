'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeDebugPage() {
  const [status, setStatus] = useState<string>('Initializing...')
  const [logs, setLogs] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected')
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const supabase = createClient()
    
    addLog('Creating Supabase client...')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    addLog(`Supabase URL: ${supabaseUrl ? 'Present' : 'Missing'}`)
    addLog(`Supabase Anon Key: ${supabaseAnonKey ? 'Present' : 'Missing'}`)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus('❌ Environment variables missing')
      addLog('ERROR: Missing Supabase environment variables')
      return
    }
    
    setStatus('✅ Environment variables loaded')
    addLog('Environment variables loaded successfully')
    
    // Test basic Supabase connection
    const testConnection = async () => {
      try {
        addLog('Testing basic Supabase connection...')
        const { data, error } = await supabase.from('employees').select('emp_code').limit(1)
        
        if (error) {
          addLog(`Database connection error: ${error.message}`)
          setStatus('❌ Database connection failed')
        } else {
          addLog('✅ Database connection successful')
          setStatus('✅ Database connected')
        }
      } catch (err) {
        addLog(`Connection test failed: ${err}`)
        setStatus('❌ Connection test failed')
      }
    }
    
    // Test real-time channel subscription
    const testRealtime = () => {
      addLog('Creating real-time channel...')
      const channel = supabase.channel('debug-test-channel')
      
      channel
        .on('broadcast', { event: 'test' }, (payload) => {
          addLog(`✅ Received broadcast: ${JSON.stringify(payload)}`)
        })
        .subscribe((status) => {
          addLog(`Channel subscription status: ${status}`)
          setConnectionStatus(status)
          
          if (status === 'SUBSCRIBED') {
            addLog('✅ Real-time channel subscribed successfully')
            
            // Send a test message
            setTimeout(() => {
              addLog('Sending test broadcast...')
              channel.send({
                type: 'broadcast',
                event: 'test',
                payload: { message: 'Hello from debug!', timestamp: new Date().toISOString() }
              })
            }, 1000)
          } else if (status === 'CHANNEL_ERROR') {
            addLog('❌ Real-time channel error')
          } else if (status === 'TIMED_OUT') {
            addLog('❌ Real-time channel timed out')
          }
        })
      
      // Cleanup
      return () => {
        addLog('Cleaning up channel...')
        supabase.removeChannel(channel)
      }
    }
    
    testConnection()
    const cleanup = testRealtime()
    
    return cleanup
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Real-time Debug Tool</h1>
          
          {/* Status Overview */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Status</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-lg">{status}</p>
              <p className="text-sm text-gray-600">Connection: {connectionStatus}</p>
            </div>
          </div>
          
          {/* Environment Check */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Environment Variables</h2>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>
          
          {/* Debug Logs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Debug Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Debug Instructions</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• This page tests the real-time connection in production</li>
              <li>• Check if environment variables are properly set</li>
              <li>• Verify Supabase database connection</li>
              <li>• Test real-time channel subscription</li>
              <li>• Look for any error messages in the logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
