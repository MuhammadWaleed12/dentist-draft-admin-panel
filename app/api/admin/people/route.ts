// app/api/admin/people/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/get-supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication via server-side cookie session
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    const { data: people, error } = await supabaseAdmin
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching people:', error);
      return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
    }

    return NextResponse.json({ success: true, people: people || [] });
  } catch (error) {
    console.error('Error in admin people API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


