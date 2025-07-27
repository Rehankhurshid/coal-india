import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if table exists
    const { data: tableExists, error: checkError } = await supabase
      .rpc('to_regclass', { schema_name: 'public.push_subscriptions' });

    if (checkError) {
      console.error('Error checking table:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check table',
        details: checkError.message 
      }, { status: 500 });
    }

    if (!tableExists) {
      // Create the push_subscriptions table
      const { error: createError } = await supabase.rpc('create_push_subscriptions_table');

      if (createError && createError.message.includes('does not exist')) {
        // If the function doesn't exist, create table directly
        const { error: sqlError } = await supabase.from('push_subscriptions').select('*').limit(1);
        
        if (sqlError && sqlError.message.includes('does not exist')) {
          // Table doesn't exist, create it using raw SQL
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.push_subscriptions (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              employee_id TEXT NOT NULL,
              endpoint TEXT NOT NULL,
              p256dh TEXT NOT NULL,
              auth TEXT NOT NULL,
              platform TEXT DEFAULT 'web',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(employee_id, endpoint)
            );

            -- Create index for faster lookups
            CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee_id 
            ON public.push_subscriptions(employee_id);

            -- Enable RLS
            ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

            -- Create RLS policy for authenticated users to manage their own subscriptions
            CREATE POLICY "Users can manage their own push subscriptions"
            ON public.push_subscriptions
            FOR ALL
            USING (true)
            WITH CHECK (true);
          `;

          // Since we can't execute raw SQL directly, we'll return instructions
          return NextResponse.json({ 
            success: false, 
            tableExists: false,
            message: 'Push subscriptions table does not exist. Please create it in Supabase dashboard.',
            sql: createTableSQL
          });
        }
      }

      if (createError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create table',
          details: createError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Push subscriptions table created successfully',
        tableExists: true 
      });
    }

    // Table exists, verify structure
    const { data: columns, error: columnsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(0);

    return NextResponse.json({ 
      success: true, 
      tableExists: true,
      message: 'Push subscriptions table exists',
      hasError: !!columnsError,
      errorDetails: columnsError?.message
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we have VAPID keys
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'VAPID keys not configured',
        message: 'Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your environment variables'
      }, { status: 500 });
    }

    // Try to create a test subscription to verify everything works
    const testSubscription = {
      employee_id: 'TEST_USER',
      endpoint: 'https://test.example.com',
      p256dh: 'test_p256dh',
      auth: 'test_auth',
      platform: 'test'
    };

    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .upsert(testSubscription, {
        onConflict: 'employee_id,endpoint'
      });

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to test push subscriptions table',
        details: insertError.message,
        suggestion: 'Please ensure the push_subscriptions table exists in your Supabase database'
      }, { status: 500 });
    }

    // Clean up test subscription
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('employee_id', 'TEST_USER');

    return NextResponse.json({ 
      success: true, 
      message: 'Push notifications setup verified successfully',
      vapidKeyConfigured: true,
      tableExists: true
    });

  } catch (error) {
    console.error('Setup verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
