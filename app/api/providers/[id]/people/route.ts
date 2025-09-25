// app/api/providers/[id]/people/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Fetch all people for a specific provider
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const supabaseAdmin = createAdminSupabaseClient();
  
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    const { id: providerId } = params;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching people for provider ID:', providerId);

    // First, verify the provider exists
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('id, name, type, address, phone_number')
      .eq('id', providerId)
      .maybeSingle();

    if (providerError) {
      console.error('Error fetching provider:', providerError);
      return NextResponse.json(
        { error: 'Database error while fetching provider' },
        { status: 500 }
      );
    }

    if (!provider) {
      console.log('Provider not found for ID:', providerId);
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    console.log('Found provider:', provider.name, 'Type:', provider.type);

    // Fetch all people associated with this provider
    const { data: people, error: peopleError } = await supabaseAdmin
      .from('people')
      .select(`
        id,
        provider_id,
        avatar,
        name,
        email,
        address,
        biography,
        dentistry_types,
        degree,
        created_at,
        updated_at
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      return NextResponse.json(
        { error: 'Failed to fetch people' },
        { status: 500 }
      );
    }

    console.log(`Found ${people?.length || 0} people for provider ${provider.name}`);

    // Log the people data for debugging
    if (people && people.length > 0) {
      console.log('Sample person data:', {
        id: people[0].id,
        name: people[0].name,
        dentistry_types: people[0].dentistry_types,
        hasAvatar: !!people[0].avatar
      });
    }

    return NextResponse.json({
      success: true,
      people: people || [],
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        address: provider.address,
        phone_number: provider.phone_number
      },
      count: people?.length || 0
    });

  } catch (error) {
    console.error('Error in GET people for provider:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Add a new person to this provider
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  console.log('=== POST /api/providers/[id]/people - Starting ===');
  
  const supabaseAdmin = createAdminSupabaseClient();
  
  if (!supabaseAdmin) {
    console.error('Supabase admin client not configured');
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    const { id: providerId } = params;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    console.log('Adding person to provider ID:', providerId);

    // Verify the provider exists
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('id, name')
      .eq('id', providerId)
      .maybeSingle();

    if (providerError || !provider) {
      console.error('Provider not found:', providerError);
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

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
      .maybeSingle();

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
      provider_id: providerId, // Use the provider ID from the URL
      avatar: avatar?.trim() || null,
      name: name.trim(),
      email: email.trim(),
      address: address?.trim() || null,
      biography: biography?.trim() || null,
      dentistry_types: dentistryTypes && dentistryTypes.length > 0 ? dentistryTypes : null,
      degree: degree?.trim() || null
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
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}