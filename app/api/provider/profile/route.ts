// app/api/provider/profile/route.ts - Updated for phone-based authentication with centralized Supabase admin

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/get-supabase-admin';
import type { Database } from '@/lib/supabase';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

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

// Search Google Places for provider data by phone number
async function searchGooglePlacesByPhone(phoneNumber: string) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    // Clean phone number for search
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Search for dental practice with phone number
    const searchQuery = `dentist ${phoneNumber}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&type=dentist&key=${GOOGLE_PLACES_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.status !== 'OK' || !searchData.results?.length) {
      console.log('No Google Places results found for phone:', phoneNumber);
      return null;
    }

    // Try to find exact phone match
    let matchedPlace = null;
    
    for (const place of searchData.results) {
      // Get detailed information for each result
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,business_status,opening_hours,photos,types,geometry&key=${GOOGLE_PLACES_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === 'OK' && detailsData.result) {
        const placePhone = detailsData.result.formatted_phone_number || detailsData.result.international_phone_number;
        
        if (placePhone) {
          const cleanPlacePhone = placePhone.replace(/\D/g, '');
          
          // Check if phone numbers match (last 10 digits)
          if (cleanPhone.slice(-10) === cleanPlacePhone.slice(-10)) {
            matchedPlace = detailsData.result;
            break;
          }
        }
      }
    }

    return matchedPlace || searchData.results[0]; // Return matched place or first result
  } catch (error) {
    console.error('Error searching Google Places by phone:', error);
    return null;
  }
}

// Convert Google Place data to provider format
function convertGooglePlaceToProvider(googlePlace: any, phoneNumber: string, userId: string) {
  // Determine if it's a cosmetic dentist
  const isCosmetic = googlePlace.types?.some((type: string) => 
    type.includes('cosmetic') || type.includes('aesthetic')
  ) || googlePlace.name.toLowerCase().includes('cosmetic');

  // Extract specialties from Google types
  const tags: string[] = [];
  if (googlePlace.types?.includes('dentist')) tags.push('General Dentistry');
  if (isCosmetic) tags.push('Cosmetic Dentistry');
  if (googlePlace.types?.includes('orthodontist')) tags.push('Orthodontics');
  
  // Default tag if none found
  if (tags.length === 0) tags.push('General Dentistry');

  // Convert Google Photos to URLs
  const photos: string[] = [];
  if (googlePlace.photos?.length && GOOGLE_PLACES_API_KEY) {
    googlePlace.photos.slice(0, 5).forEach((photo: any) => {
      if (photo.photo_reference) {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
        photos.push(photoUrl);
      }
    });
  }

  return {
    id: crypto.randomUUID(),
    name: googlePlace.name,
    type: isCosmetic ? 'cosmetic' as const : 'dentist' as const,
    address: googlePlace.formatted_address || '',
    lat: googlePlace.geometry?.location?.lat || 0,
    lng: googlePlace.geometry?.location?.lng || 0,
    phone_number: phoneNumber, // Use the authenticated user's phone
    website: googlePlace.website || null,
    tags,
    photos,
    rating: googlePlace.rating || 0,
    review_count: googlePlace.user_ratings_total || 0,
    business_status: googlePlace.business_status || 'OPERATIONAL',
    opening_hours: googlePlace.opening_hours || null,
    place_id: googlePlace.place_id,
    email: null, // No email for phone auth
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_verified: new Date().toISOString()
  };
}

// GET - Fetch provider profile (with Google fallback based on phone)
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

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_verified, phone')
      .eq('phone', user.phone)
      .single();

    // If no profile exists, create one (all phone users are initially unverified)
    if (profileError || !profile) {
      const { data: newProfile, error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: user.id,
          phone: user.phone,
          role: 'provider',
          is_verified: false
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: null,
        message: 'Profile created. Verification pending.'
      });
    }

    // For unverified users, don't fetch provider data
    if (!profile.is_verified) {
      return NextResponse.json({
        success: true,
        provider: null,
        verified: false,
        message: 'Account verification pending'
      });
    }

    // First, try to fetch provider data from Supabase using phone number
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('*')
      .eq('phone_number', user.phone)
      .single();

    // If provider exists in Supabase, return it
    if (!providerError && provider) {
      return NextResponse.json({
        success: true,
        provider: {
          id: provider.id,
          name: provider.name,
          type: provider.type,
          address: provider.address,
          phone_number: provider.phone_number,
          website: provider.website,
          tags: provider.tags,
          photos: provider.photos,
          rating: provider.rating,
          review_count: provider.review_count,
          business_status: provider.business_status,
          opening_hours: provider.opening_hours,
          place_id: provider.place_id,
        },
        source: 'supabase'
      });
    }

    // If not found in Supabase, try to fetch from Google Places using phone
    console.log('Provider not found in Supabase, searching Google Places by phone...');
    
    const googlePlace = await searchGooglePlacesByPhone(user.phone);
    
    if (!googlePlace) {
      return NextResponse.json({
        success: true,
        provider: null,
        message: 'No provider data found. Please update your profile manually.'
      });
    }

    // Convert Google data to our format
    const providerData = convertGooglePlaceToProvider(googlePlace, user.phone, user.id);

    // Create provider record in Supabase
    try {
      const { data: createdProvider, error: createError } = await supabaseAdmin
        .from('providers')
        .insert(providerData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating provider from Google data:', createError);
        
        // Return Google data without saving to Supabase
        return NextResponse.json({
          success: true,
          provider: {
            id: providerData.id,
            name: providerData.name,
            type: providerData.type,
            address: providerData.address,
            phone_number: providerData.phone_number,
            website: providerData.website,
            tags: providerData.tags,
            photos: providerData.photos,
            rating: providerData.rating,
            review_count: providerData.review_count,
            business_status: providerData.business_status,
            opening_hours: providerData.opening_hours,
            place_id: providerData.place_id,
          },
          source: 'google',
          message: 'Data fetched from Google Places but not saved to database'
        });
      }

      return NextResponse.json({
        success: true,
        provider: {
          id: createdProvider.id,
          name: createdProvider.name,
          type: createdProvider.type,
          address: createdProvider.address,
          phone_number: createdProvider.phone_number,
          website: createdProvider.website,
          tags: createdProvider.tags,
          photos: createdProvider.photos,
          rating: createdProvider.rating,
          review_count: createdProvider.review_count,
          business_status: createdProvider.business_status,
          opening_hours: createdProvider.opening_hours,
          place_id: createdProvider.place_id,
        },
        source: 'google',
        message: 'Provider data imported from Google Places'
      });

    } catch (error) {
      console.error('Error saving Google data to Supabase:', error);
      
      // Return Google data even if save failed
      return NextResponse.json({
        success: true,
        provider: {
          id: providerData.id,
          name: providerData.name,
          type: providerData.type,
          address: providerData.address,
          phone_number: providerData.phone_number,
          website: providerData.website,
          tags: providerData.tags,
          photos: providerData.photos,
          rating: providerData.rating,
          review_count: providerData.review_count,
          business_status: providerData.business_status,
          opening_hours: providerData.opening_hours,
          place_id: providerData.place_id,
        },
        source: 'google',
        message: 'Data fetched from Google Places but could not be saved'
      });
    }

  } catch (error) {
    console.error('Error in GET provider profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update provider profile (updated for phone-based auth)
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

    // Check if user is verified
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_verified')
      .eq('phone', user.phone)
      .single();

    if (profileError || !profile || !profile.is_verified) {
      return NextResponse.json(
        { error: 'User account not verified. Please contact support.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, phone_number, website, tags, photos } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Practice name is required' },
        { status: 400 }
      );
    }

    // Update provider data in Supabase using phone number
    const { data: updatedProvider, error: updateError } = await supabaseAdmin
      .from('providers')
      .update({
        name: name.trim(),
        address: address?.trim() || '',
        phone_number: phone_number?.trim() || user.phone, // Keep original phone if not provided
        website: website?.trim() || null,
        tags: tags || [],
        photos: photos || [],
        updated_at: new Date().toISOString()
      })
      .eq('phone_number', user.phone)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating provider:', updateError);
      
      // If provider doesn't exist, create it
      if (updateError.code === 'PGRST116') {
        const newProviderData = {
          id: crypto.randomUUID(),
          name: name.trim(),
          type: 'dentist' as const,
          address: address?.trim() || '',
          lat: 0,
          lng: 0,
          phone_number: phone_number?.trim() || user.phone,
          website: website?.trim() || null,
          tags: tags || [],
          photos: photos || [],
          rating: 0,
          review_count: 0,
          business_status: 'OPERATIONAL',
          opening_hours: null,
          place_id: null,
          email: null,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_verified: new Date().toISOString()
        };

        const { data: createdProvider, error: createError } = await supabaseAdmin
          .from('providers')
          .insert(newProviderData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating provider:', createError);
          return NextResponse.json(
            { error: 'Failed to create provider profile' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          provider: {
            id: createdProvider.id,
            name: createdProvider.name,
            type: createdProvider.type,
            address: createdProvider.address,
            phone_number: createdProvider.phone_number,
            website: createdProvider.website,
            tags: createdProvider.tags,
            photos: createdProvider.photos,
            rating: createdProvider.rating,
            review_count: createdProvider.review_count,
            business_status: createdProvider.business_status,
            opening_hours: createdProvider.opening_hours,
            place_id: createdProvider.place_id,
          },
          message: 'Profile created successfully'
        });
      }

      return NextResponse.json(
        { error: 'Failed to update provider profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        type: updatedProvider.type,
        address: updatedProvider.address,
        phone_number: updatedProvider.phone_number,
        website: updatedProvider.website,
        tags: updatedProvider.tags,
        photos: updatedProvider.photos,
        rating: updatedProvider.rating,
        review_count: updatedProvider.review_count,
        business_status: updatedProvider.business_status,
        opening_hours: updatedProvider.opening_hours,
        place_id: updatedProvider.place_id,
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT provider profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}