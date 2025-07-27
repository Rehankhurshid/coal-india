import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const envCheck = {
      // Check if environment variables exist (without exposing their values)
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      NODE_ENV: process.env.NODE_ENV,
      
      // Show lengths to verify keys are not empty
      supabase_url_length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      anon_key_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      jwt_secret_length: process.env.JWT_SECRET?.length || 0,
      database_url_length: process.env.DATABASE_URL?.length || 0,
      
      // Check if keys start with correct prefixes
      service_key_starts_with_ey: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') || false,
      anon_key_starts_with_ey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') || false,
      
      // Check connection pooling
      database_url_has_pooling: process.env.DATABASE_URL?.includes('pooler.supabase.com') || false,
      database_url_has_pgbouncer: process.env.DATABASE_URL?.includes('pgbouncer=true') || false,
      
      // Check Vercel environment
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }

    // Test database connection
    let connectionTest = null
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('employees')
        .select('count(*)')
        .limit(1)

      connectionTest = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      }
    } catch (dbError) {
      connectionTest = {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        hasData: false
      }
    }

    return NextResponse.json({
      success: true,
      environment_check: envCheck,
      database_connection: connectionTest,
      message: 'Environment variables and database connection status check'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment_check: null,
      database_connection: null
    }, { status: 500 })
  }
}
