// app/api/people/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Helper function to get authenticated provider
async function getAuthenticatedProvider(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    const supabase = createServerClient<Database>(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting authenticated provider:', error);
    return null;
  }
}

// Helper function to get provider ID from authenticated user
async function getProviderIdFromUser(userId: string, phone: string) {
  const supabaseAdmin = createAdminSupabaseClient();
  
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Get provider by phone number (since that's how they authenticate)
  const { data: provider, error } = await supabaseAdmin
    .from('providers')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle();

  if (error || !provider) {
    throw new Error('Provider not found');
  }

  return provider.id;
}

// DELETE - Delete a person
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createAdminSupabaseClient();
  
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    const user = await getAuthenticatedProvider(request);
    
    if (!user || !user.phone) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in with phone number' },
        { status: 401 }
      );
    }

    // Get provider ID
    const providerId = await getProviderIdFromUser(user.id, user.phone);

    const personId = params.id;

    if (!personId) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    // Check if the person exists and belongs to this provider
    const { data: existingPerson, error: fetchError } = await supabaseAdmin
      .from('people')
      .select('id, provider_id, name')
      .eq('id', personId)
      .maybeSingle();

    if (fetchError || !existingPerson) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    if (existingPerson.provider_id !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this person' },
        { status: 403 }
      );
    }

    // Delete the person
    const { error: deleteError } = await supabaseAdmin
      .from('people')
      .delete()
      .eq('id', personId);

    if (deleteError) {
      console.error('Error deleting person:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete person' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${existingPerson.name} has been deleted successfully`
    });

  } catch (error) {
    console.error('Error in DELETE person:', error);
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return NextResponse.json(
        { error: 'Provider profile not found. Please complete your provider setup first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}