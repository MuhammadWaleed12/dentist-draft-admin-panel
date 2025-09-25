// app/api/admin/auth/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Enforce single admin email if configured
    const allowedAdminEmail = process.env.ADMIN_EMAIL;

    // No profiles checks. Enforce by ADMIN_EMAIL only if set

    if (allowedAdminEmail && user.email?.toLowerCase() !== allowedAdminEmail.toLowerCase()) {
      return NextResponse.json(
        { isAdmin: false, error: 'Access denied. Invalid admin account' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}