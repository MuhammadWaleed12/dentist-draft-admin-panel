// app/api/people/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/get-supabase-admin';
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
  console.log('Getting provider ID for user:', { userId, phone });
  
  const supabaseAdmin = getSupabaseAdmin();
  
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured in getProviderIdFromUser');
    throw new Error('Supabase admin client not configured');
  }

  // Get provider by phone number (since that's how they authenticate)
  console.log('Querying providers table with phone:', phone);
  const { data: provider, error } = await supabaseAdmin
    .from('providers')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle(); // Use maybeSingle to avoid error when no match

  console.log('Provider query result:', { provider, error });

  if (error) {
    console.error('Error querying providers table:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!provider) {
    console.log('No provider found for phone:', phone);
    throw new Error('Provider not found');
  }

  console.log('Provider ID found:', provider.id);
  return provider.id;
}

// GET - Fetch all people for the authenticated provider
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  
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

    // Fetch all people for this provider
    const { data: people, error: peopleError } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      return NextResponse.json(
        { error: 'Failed to fetch people' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      people: people || []
    });

  } catch (error) {
    console.error('Error in GET people:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a new person
export async function POST(request: NextRequest) {
  console.log('=== POST /api/people - Starting ===');
  
  const supabaseAdmin = getSupabaseAdmin();
  
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured');
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    console.log('Getting authenticated provider...');
    const user = await getAuthenticatedProvider(request);
    
    if (!user || !user.phone) {
      console.log('User not authenticated or no phone:', { user: user ? 'exists' : 'null', phone: user?.phone });
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in with phone number' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', { userId: user.id, phone: user.phone });

    // Get provider ID
    console.log('Getting provider ID...');
    const providerId = await getProviderIdFromUser(user.id, user.phone);
    console.log('Provider ID found:', providerId);

    console.log('Parsing request body...');
    const body = await request.json();
    console.log('Request body received:', body);
    
    const { 
      avatar, 
      name, 
      email, 
      address, 
      biography, 
      dentistryTypes, 
      degree 
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      console.log('Validation failed: Name is required');
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      console.log('Validation failed: Email is required');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('Validation failed: Invalid email format');
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    console.log('Checking for existing person with email...');
    // Check if email already exists for this provider
    const { data: existingPerson, error: checkError } = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('provider_id', providerId)
      .eq('email', email.trim())
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no match

    if (checkError) {
      console.error('Error checking existing person:', checkError);
      return NextResponse.json(
        { error: 'Database error while checking for existing person' },
        { status: 500 }
      );
    }

    if (existingPerson) {
      console.log('Person with email already exists');
      return NextResponse.json(
        { error: 'A person with this email already exists' },
        { status: 400 }
      );
    }

    // Create new person
    console.log('Creating new person...');
    const newPersonData = {
      provider_id: providerId,
      avatar: avatar?.trim() || null,
      name: name.trim(),
      email: email.trim(),
      address: address?.trim() || null,
      biography: biography?.trim() || null,
      dentistry_types: dentistryTypes && dentistryTypes.length > 0 ? dentistryTypes : null,
      degree: degree?.trim() || null
      // Let database handle id, created_at and updated_at automatically
    };

    console.log('Person data to insert:', newPersonData);

    const { data: createdPerson, error: createError } = await supabaseAdmin
      .from('people')
      .insert(newPersonData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating person:', createError);
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
      return NextResponse.json(
        { 
          error: 'Failed to create person',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    console.log('Person created successfully:', createdPerson);

    return NextResponse.json({
      success: true,
      person: createdPerson,
      message: 'Person added successfully'
    });

  } catch (error) {
    console.error('Error in POST people:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return NextResponse.json(
        { error: 'Provider profile not found. Please complete your provider setup first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing person
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  
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

    const body = await request.json();
    const { 
      id,
      avatar, 
      name, 
      email, 
      address, 
      biography, 
      dentistryTypes, 
      degree 
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if the person exists and belongs to this provider
    const { data: existingPerson, error: fetchError } = await supabaseAdmin
      .from('people')
      .select('id, provider_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPerson) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    if (existingPerson.provider_id !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this person' },
        { status: 403 }
      );
    }

    // Check if email already exists for another person from this provider
    const { data: emailCheck } = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('provider_id', providerId)
      .eq('email', email.trim())
      .neq('id', id)
      .single();

    if (emailCheck) {
      return NextResponse.json(
        { error: 'Another person with this email already exists' },
        { status: 400 }
      );
    }

    // Update person data
    const updateData = {
      avatar: avatar?.trim() || null,
      name: name.trim(),
      email: email.trim(),
      address: address?.trim() || null,
      biography: biography?.trim() || null,
      dentistry_types: dentistryTypes && dentistryTypes.length > 0 ? dentistryTypes : null,
      degree: degree?.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedPerson, error: updateError } = await supabaseAdmin
      .from('people')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating person:', updateError);
      return NextResponse.json(
        { error: 'Failed to update person' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      person: updatedPerson,
      message: 'Person updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT people:', error);
    
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