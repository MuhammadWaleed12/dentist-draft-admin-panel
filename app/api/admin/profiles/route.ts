// app/api/admin/profiles/route.ts
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

    // Enforce single admin if configured
    const allowedAdminEmail = process.env.ADMIN_EMAIL;
    if (allowedAdminEmail && user.email?.toLowerCase() !== allowedAdminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Access denied. Invalid admin account' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profiles: profiles || [] });
  } catch (error) {
    console.error('Error in admin profiles API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


