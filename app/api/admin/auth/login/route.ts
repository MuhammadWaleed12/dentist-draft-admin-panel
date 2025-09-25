// app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Enforce single admin email if configured
    const allowedAdminEmail = process.env.ADMIN_EMAIL;
    if (allowedAdminEmail && email.toLowerCase() !== allowedAdminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Access denied. Invalid admin account.' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Sign in with email and password (sets cookies via server client)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'No user data returned' },
        { status: 401 }
      );
    }

    // No profiles table checks; authentication is purely by Supabase user and ADMIN_EMAIL

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}