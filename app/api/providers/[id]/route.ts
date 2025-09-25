// app/api/providers/[id]/route.ts
// API route for fetching a single provider by ID, place_id, or phone number
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { Provider } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchValue = params.id;

  console.log('🔍 === PROVIDER LOOKUP (Phone-First Approach) ===');
  console.log('🔍 Search value:', searchValue);
  console.log('🔍 Request URL:', request.url);

  if (!searchValue) {
    console.log('❌ ERROR: No search value provided');
    return NextResponse.json({ error: 'Provider identifier is required' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseClient();

    // Determine if the search value looks like a phone number
    const isPhoneNumber = /^\d+$/.test(searchValue) && searchValue.length >= 10;
    const isPlaceId = searchValue.startsWith('ChIJ');
    
    console.log('🔍 Search type analysis:');
    console.log('  - Is phone number:', isPhoneNumber);
    console.log('  - Is place_id:', isPlaceId);
    console.log('  - Search value length:', searchValue.length);

    let provider = null;
    let searchMethod = '';

    // STRATEGY 1: If it looks like a phone number, search by phone first
    if (isPhoneNumber) {
      console.log('📞 STRATEGY 1: Searching by phone number...');
      
      const { data: phoneProvider, error: phoneError } = await supabase
        .from('providers')
        .select('*')
        .eq('phone_number', searchValue)
        .single();

      console.log('📞 Phone search result:', phoneProvider?.name || 'Not found');
      console.log('📞 Phone search error:', phoneError?.code || 'None');

      if (!phoneError && phoneProvider) {
        provider = phoneProvider;
        searchMethod = 'phone_number';
      }
    }

    // STRATEGY 2: If not found by phone, try by place_id
    if (!provider && isPlaceId) {
      console.log('🗺️ STRATEGY 2: Searching by place_id...');
      
      const { data: placeProvider, error: placeError } = await supabase
        .from('providers')
        .select('*')
        .eq('place_id', searchValue)
        .single();

      console.log('🗺️ Place ID search result:', placeProvider?.name || 'Not found');
      console.log('🗺️ Place ID search error:', placeError?.code || 'None');

      if (!placeError && placeProvider) {
        provider = placeProvider;
        searchMethod = 'place_id';
      }
    }

    // STRATEGY 3: If still not found, try by ID field
    if (!provider) {
      console.log('🆔 STRATEGY 3: Searching by id field...');
      
      const { data: idProvider, error: idError } = await supabase
        .from('providers')
        .select('*')
        .eq('id', searchValue)
        .single();

      console.log('🆔 ID search result:', idProvider?.name || 'Not found');
      console.log('🆔 ID search error:', idError?.code || 'None');

      if (!idError && idProvider) {
        provider = idProvider;
        searchMethod = 'id';
      }
    }

    // STRATEGY 4: If still not found, try partial phone number match
    if (!provider && searchValue.length >= 10) {
      console.log('📱 STRATEGY 4: Trying partial phone number match...');
      
      // Try to match last 10 digits for phone numbers
      const { data: partialPhoneProviders, error: partialError } = await supabase
        .from('providers')
        .select('*')
        .ilike('phone_number', `%${searchValue.slice(-10)}`);

      console.log('📱 Partial phone search results:', partialPhoneProviders?.length || 0);

      if (!partialError && partialPhoneProviders && partialPhoneProviders.length > 0) {
        provider = partialPhoneProviders[0]; // Take the first match
        searchMethod = 'partial_phone';
      }
    }

    // STRATEGY 5: Last resort - search all fields with OR condition
    if (!provider) {
      console.log('🔄 STRATEGY 5: Comprehensive search across all fields...');
      
      const { data: comprehensiveResults, error: comprehensiveError } = await supabase
        .from('providers')
        .select('*')
        .or(`id.eq.${searchValue},place_id.eq.${searchValue},phone_number.eq.${searchValue},phone_number.ilike.%${searchValue}%`);

      console.log('🔄 Comprehensive search results:', comprehensiveResults?.length || 0);

      if (!comprehensiveError && comprehensiveResults && comprehensiveResults.length > 0) {
        provider = comprehensiveResults[0];
        searchMethod = 'comprehensive';
        console.log('🔄 Found providers:', comprehensiveResults.map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone_number,
          place_id: p.place_id
        })));
      }
    }

    if (!provider) {
      console.log('❌ Provider not found with any strategy');
      return NextResponse.json({ 
        error: 'Provider not found',
        message: 'The requested provider could not be found in our database',
        debug: {
          searched_value: searchValue,
          search_strategies_tried: [
            isPhoneNumber ? 'phone_number' : null,
            isPlaceId ? 'place_id' : null,
            'id',
            'partial_phone',
            'comprehensive'
          ].filter(Boolean),
          is_phone_number: isPhoneNumber,
          is_place_id: isPlaceId
        }
      }, { status: 404 });
    }

    console.log('✅ SUCCESS: Provider found!');
    console.log('✅ Found by:', searchMethod);
    console.log('✅ Provider name:', provider.name);
    console.log('✅ Provider phone:', provider.phone_number);
    console.log('✅ Provider photos count:', provider.photos?.length || 0);
    console.log('✅ Provider updated_at:', provider.updated_at);

    // Transform the provider data to match our Provider interface
    const transformedProvider: Provider = {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      address: provider.address,
      lat: provider.lat,
      lng: provider.lng,
      rating: provider.rating || 0,
      reviewCount: provider.review_count || 0,
      tags: provider.tags || [],
      phoneNumber: provider.phone_number || '',
      website: provider.website || '',
      photos: provider.photos || [], // ✅ This should include your uploaded photo
      hours: provider.opening_hours,
      distance: provider?.distance
    };

    console.log('✅ Final transformed data:');
    console.log('  - Phone:', transformedProvider.phoneNumber);
    console.log('  - Photos:', transformedProvider.photos.length);
    console.log('  - Name:', transformedProvider.name);

    const response = { 
      provider: transformedProvider,
      source: 'supabase',
      timestamp: new Date().toISOString(),
      debug: {
        search_value: searchValue,
        search_method: searchMethod,
        database_id: provider.id,
        database_place_id: provider.place_id,
        database_phone: provider.phone_number,
        database_updated_at: provider.updated_at,
        photos_count: provider.photos?.length || 0,
        was_phone_search: isPhoneNumber
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected error fetching provider:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch provider',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      debug: {
        searched_value: searchValue,
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}