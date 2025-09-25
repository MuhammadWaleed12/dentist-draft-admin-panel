// app/api/providers/route.ts
// COMPLETE HEALTHCARE PROVIDERS API WITH STRICT ZIP CODE FILTERING
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';

interface Provider {
  id: string;
  name: string;
  type: 'dentist' | 'cosmetic';
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  phoneNumber: string;
  website: string;
  photos?: string[];
  distance?: number;
  zipCode?: string;  // ✅ ZIP code support
  opening_hours?: {
    open_now?: boolean;
    periods?: any[];
    weekday_text?: string[];
  } | null;
}

// ============================================
// AUTHENTICATION & ADMIN CHECK
// ============================================

async function isUserAdmin(request: NextRequest): Promise<boolean> {
  try {
    console.log('🔍 Checking user authentication from cookies...');
    
    const cookieHeader = request.headers.get('cookie');
    console.log('🍪 Cookie header present:', !!cookieHeader);
    
    if (!cookieHeader) {
      console.log('❌ No cookies found');
      return false;
    }

    const authCookieMatch = cookieHeader.match(/sb-[^=]+-auth-token=base64-([^;]+)/);
    
    if (!authCookieMatch) {
      console.log('❌ No Supabase auth cookie found');
      return false;
    }

    try {
      const encodedSession = authCookieMatch[1];
      const decodedSession = atob(encodedSession);
      const sessionData = JSON.parse(decodedSession);
      
      console.log('📋 Session data parsed successfully');
      
      if (!sessionData.access_token) {
        console.log('❌ No access token in session');
        return false;
      }

      const supabase = createServerSupabaseClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser(sessionData.access_token);
      
      if (userError || !user) {
        console.log('❌ Invalid access token:', userError?.message);
        return false;
      }

      console.log('✅ User authenticated:', user.phone);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('phone', user.phone)
        .single();

      if (profileError) {
        console.log('❌ Profile query error:', profileError.message);
        return false;
      }

      if (!profile) {
        console.log('❌ No profile found for user:', user.phone);
        return false;
      }

      const isAdmin = profile.role === 'admin';
      console.log(`🔐 User role: ${profile.role}, Is admin: ${isAdmin}`);
      
      return isAdmin;

    } catch (parseError) {
      console.error('❌ Error parsing session cookie:', parseError);
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error in isUserAdmin:', error);
    return false;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function createBoundingBox(lat: number, lng: number, radiusKm: number) {
  const searchRadius = Math.max(radiusKm * 2, 25); // ✅ Increased for better coverage
  const latDelta = searchRadius / 111.32;
  const lngDelta = searchRadius / (111.32 * Math.cos(lat * Math.PI / 180));
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

function extractZipFromAddress(address: string): string | null {
  if (!address) return null;
  // Handle both 5-digit and ZIP+4, extract only the 5-digit part
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return zipMatch ? zipMatch[1] : null;
}

// ============================================
// ✅ STRICT ZIP CODE FILTERING FUNCTION
// ============================================

function filterProvidersByExactZip(providers: Provider[], requestedZip: string): Provider[] {
  if (!requestedZip || requestedZip === 'Unknown') {
    console.log('🔍 No ZIP filtering - no ZIP code provided');
    return providers; // No filtering if no ZIP provided
  }
  
  console.log(`🔍 === STRICT ZIP FILTERING: EXACT MATCHES ONLY ===`);
  console.log(`📮 Requested ZIP: ${requestedZip}`);
  console.log(`📊 Input: ${providers.length} providers to filter`);
  
  // Log ZIP distribution before filtering
  const originalZipCounts = providers.reduce((acc: any, provider: any) => {
    const zip = extractZipFromAddress(provider.address) || 'no-zip';
    acc[zip] = (acc[zip] || 0) + 1;
    return acc;
  }, {});
  console.log(`📊 Original ZIP distribution:`, originalZipCounts);
  
  // Filter for EXACT ZIP matches only
  const exactMatches = providers.filter(provider => {
    const providerZip = extractZipFromAddress(provider.address);
    const isExactMatch = providerZip === requestedZip;
    
    if (isExactMatch) {
      console.log(`✅ MATCH: ${provider.name} - ${providerZip} (${provider.address.split(',')[0]})`);
    } else {
      console.log(`❌ SKIP: ${provider.name} - ${providerZip || 'no-zip'} (${provider.address.split(',')[0]})`);
    }
    
    return isExactMatch;
  });
  
  // Log results
  console.log(`🎯 STRICT FILTERING RESULTS:`);
  console.log(`   Input providers: ${providers.length}`);
  console.log(`   Exact ZIP matches: ${exactMatches.length}`);
  console.log(`   Filtered out: ${providers.length - exactMatches.length}`);
  
  if (exactMatches.length === 0) {
    console.log(`⚠️ WARNING: No providers found in ZIP ${requestedZip}`);
    console.log(`💡 Available ZIPs in results: ${Object.keys(originalZipCounts).filter(zip => zip !== 'no-zip').join(', ')}`);
  } else {
    // Log final ZIP distribution
    const finalZipCounts = exactMatches.reduce((acc: any, provider: any) => {
      const zip = extractZipFromAddress(provider.address) || 'no-zip';
      acc[zip] = (acc[zip] || 0) + 1;
      return acc;
    }, {});
    console.log(`📊 Final ZIP distribution:`, finalZipCounts);
  }
  
  return exactMatches;
}

// ============================================
// ENHANCED SUPABASE SEARCH WITH ZIP SUPPORT
// ============================================
async function getProvidersFromSupabase(
  lat: number,
  lng: number,
  page: number,
  limit: number,
  radius: number = 20,
  tags: string[] = [],
  providerType?: string,
  searchZip?: string // ✅ NEW: ZIP parameter
): Promise<{ providers: Provider[], totalCount: number, fromCache: boolean } | null> {
  
  try {
    console.log(`🗄️ === ENHANCED SUPABASE CHECK WITH ZIP SUPPORT ===`);
    console.log(`📍 Coordinates: ${lat}, ${lng}`);
    console.log(`📮 Search ZIP: ${searchZip || 'not provided'}`);
    console.log(`🎯 Radius: ${radius}km, Type: ${providerType || 'all'}, Page: ${page}, Limit: ${limit}`);
    
    if (tags && tags.length > 0) {
      console.log(`🏷️ Filtering by tags: ${tags.join(', ')}`);
    }
    
    const supabase = createServerSupabaseClient();
    let allProviders: any[] = [];
    
    // ✅ STRATEGY 1: Direct ZIP code search (highest priority)
    if (searchZip) {
      console.log(`🔍 Strategy 1: Direct ZIP search for ${searchZip}`);
      
      let zipQuery = supabase
        .from('providers')
        .select('*')
        .eq('zip_code', searchZip)


        console.log(zipQuery,'ZipQuery....')
      
      if (providerType && (providerType === 'dentist' || providerType === 'cosmetic')) {
        zipQuery = zipQuery.eq('type', providerType);
        console.log(`🏷️ Filtering by type: ${providerType}`);
      }
      
      if (tags && tags.length > 0) {
        zipQuery = zipQuery.overlaps('tags', tags);
      }
      
      const { data: zipProviders, error: zipError } = await zipQuery.limit(100);
      
      if (!zipError && zipProviders && zipProviders.length > 0) {
        console.log(`✅ ZIP Search SUCCESS: Found ${zipProviders.length} providers for ZIP ${searchZip}`);
        allProviders = zipProviders;
      } else {
        console.log(`📭 ZIP Search: No providers found for ZIP ${searchZip}`);
        if (zipError) {
          console.error('ZIP Search Error:', zipError);
        }
      }
    }
    
    // ✅ STRATEGY 2: Address search if ZIP search fails or no ZIP provided
    if (allProviders.length === 0 && searchZip) {
      console.log(`🔍 Strategy 2: Address search for ZIP ${searchZip}`);
      
      let addressQuery = supabase
        .from('providers')
        .select('*')
        .ilike('address', `%${searchZip}%`)
      
      if (providerType && (providerType === 'dentist' || providerType === 'cosmetic')) {
        addressQuery = addressQuery.eq('type', providerType);
      }
      
      if (tags && tags.length > 0) {
        addressQuery = addressQuery.overlaps('tags', tags);
      }
      
      const { data: addressProviders, error: addressError } = await addressQuery;
      
      if (!addressError && addressProviders && addressProviders.length > 0) {
        console.log(`✅ Address Search SUCCESS: Found ${addressProviders.length} providers`);
        allProviders = addressProviders;
      }
    }
    
    // ✅ STRATEGY 3: Geographic bounding box search (fallback)
    if (allProviders.length === 0) {
      console.log(`🔍 Strategy 3: Geographic bounding box search`);
      
      const boundingBox = createBoundingBox(lat, lng, radius);
      console.log(`📐 Bounding box: lat(${boundingBox.minLat.toFixed(4)} to ${boundingBox.maxLat.toFixed(4)}), lng(${boundingBox.minLng.toFixed(4)} to ${boundingBox.maxLng.toFixed(4)})`);
      
      let geoQuery = supabase
        .from('providers')
        .select('*')
        .gte('lat', boundingBox.minLat)
        .lte('lat', boundingBox.maxLat)
        .gte('lng', boundingBox.minLng)
        .lte('lng', boundingBox.maxLng)
      
      if (providerType && (providerType === 'dentist' || providerType === 'cosmetic')) {
        geoQuery = geoQuery.eq('type', providerType);
      }
      
      if (tags && tags.length > 0) {
        geoQuery = geoQuery.overlaps('tags', tags);
      }
      
      const { data: geoProviders, error: geoError } = await geoQuery;
      
      if (!geoError && geoProviders && geoProviders.length > 0) {
        console.log(`✅ Geographic Search SUCCESS: Found ${geoProviders.length} providers`);
        allProviders = geoProviders;
      }
    }
    
    if (allProviders.length === 0) {
      console.log('📭 All search strategies failed - no providers found');
      return null;
    }
    
    // ✅ Process providers and calculate distances
    const providersWithDistance = allProviders
      .map(provider => {
        const distance = calculateDistance(lat, lng, Number(provider.lat), Number(provider.lng));
        
        let providerTags: string[] = [];
        let providerPhotos: string[] = [];
        
        try {
          providerTags = Array.isArray(provider.tags) ? provider.tags : 
                        provider.tags ? JSON.parse(provider.tags) : [];
        } catch (e) {
          providerTags = [];
        }
        
        try {
          providerPhotos = Array.isArray(provider.photos) ? provider.photos :
                          provider.photos ? JSON.parse(provider.photos) : [];
        } catch (e) {
          providerPhotos = [];
        }
        
        return {
          id: provider.id,
          name: provider.name,
          type: provider.type as 'dentist' | 'cosmetic',
          address: provider.address,
          lat: Number(provider.lat),
          lng: Number(provider.lng),
          rating: Number(provider.rating) || 0,
          reviewCount: provider.review_count || 0,
          tags: providerTags,
          phoneNumber: provider.phone_number || '',
          website: provider.website || '',
          photos: providerPhotos,
          distance: distance,
          zipCode: provider.zip_code, // ✅ Include ZIP code
          opening_hours: provider.opening_hours
        };
      })
      .sort((a, b) => a.distance - b.distance);
    
    // ✅ Apply tag filtering if specified
    let filteredProviders = providersWithDistance;
    if (tags && tags.length > 0) {
      filteredProviders = providersWithDistance.filter(provider => {
        return provider.tags.some(tag => 
          tags.some(requestedTag => 
            tag.toLowerCase().includes(requestedTag.toLowerCase()) ||
            requestedTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
      });
      console.log(`🏷️ Tag filtering: ${filteredProviders.length} providers match tags`);
    }
    
    // ✅ Apply distance filtering (more lenient for ZIP searches)
    const maxDistance = searchZip ? radius * 3 : radius; // Triple radius for ZIP searches
    const finalProviders = filteredProviders.filter(provider => provider.distance <= maxDistance);
    
    console.log(`🎯 Distance filtering: ${finalProviders.length} providers within ${maxDistance}km`);
    
    if (finalProviders.length === 0) {
      console.log('📭 No providers within distance limit');
      return null;
    }
    
    // ✅ Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageProviders = finalProviders.slice(startIndex, endIndex);
    
    console.log(`✅ SUPABASE SUCCESS! Returning ${pageProviders.length} providers (page ${page})`);
    
    return {
      providers: pageProviders,
      totalCount: finalProviders.length,
      fromCache: true
    };
    
  } catch (error) {
    console.error('💥 Enhanced Supabase search error:', error);
    return null;
  }
}

// ============================================
// ZIP CODE UTILITIES
// ============================================

async function getZipCodeFromCoordinates(lat: number, lng: number, apiKey: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const addressComponents = data.results[0].address_components;
      
      let zipCode = '';
      let city = '';
      let state = '';
      let country = '';
      
      for (const component of addressComponents) {
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
        if (component.types.includes('country')) {
          country = component.short_name;
        }
      }
      
      return { 
        zipCode: zipCode || 'Unknown', 
        city: city || 'Unknown', 
        state: state || '', 
        country: country || 'US' 
      };
    }
    
    return { zipCode: 'Unknown', city: 'Unknown', state: '', country: 'US' };
  } catch (error) {
    console.error('Error getting ZIP code from coordinates:', error);
    return { zipCode: 'Unknown', city: 'Unknown', state: '', country: 'US' };
  }
}

// ============================================
// ENHANCED GOOGLE MAPS API
// ============================================

async function fetchProvidersFromGoogleMaps(
  lat: number, 
  lng: number, 
  page: number = 1, 
  limit: number = 12,
  apiKey: string,
  tags: string[] = [],
  providerType?: string
): Promise<{ providers: any[], totalCount: number, hasMore: boolean }> {
  
  console.log(`🌐 === ENHANCED GOOGLE MAPS API (ZIP CODE BASED) ===`);
  
  const locationInfo = await getZipCodeFromCoordinates(lat, lng, apiKey);
  console.log(`📮 Fetching providers in ZIP: ${locationInfo.zipCode} (${locationInfo.city}, ${locationInfo.state})`);
  
  const allResults: any[] = [];
  const resultsNeeded = page * limit + 50;
  
  const tagToQueryMap: Record<string, string[]> = {
    'Orthodontics': ['orthodontist', 'braces', 'invisalign', 'teeth straightening', 'orthodontist DDS', 'orthodontist DMD'],
    'Pediatric': ['pediatric dentist', 'children dentist', 'kids dental', 'pediatric dentist DDS', 'pediatric dentist DMD'],
    'Cosmetics': ['cosmetic dentist', 'smile makeover', 'teeth whitening', 'cosmetic dentist DDS', 'cosmetic dentist DMD'],
    'Cosmetic Dentistry': ['cosmetic dentist', 'veneers', 'smile design', 'aesthetic dentist DDS', 'aesthetic dentist DMD'],
    'General Dentistry': ['general dentist', 'family dentist', 'dental office', 'dentist DDS', 'dentist DMD', 'DDS', 'DMD'],
    'Emergency Services': ['emergency dentist', 'urgent dental care', '24 hour dentist', 'emergency dentist DDS', 'emergency dentist DMD'],
    'Oral Surgery': ['oral surgeon', 'tooth extraction', 'wisdom teeth', 'oral surgeon DDS', 'oral surgeon DMD'],
    'Dental Implants': ['dental implants', 'implant dentist', 'tooth replacement', 'implant specialist DDS', 'implant specialist DMD'],
    'Endodontics': ['endodontist', 'root canal specialist', 'root canal treatment', 'endodontist DDS', 'endodontist DMD'],
    'Periodontics': ['periodontist', 'gum specialist', 'gum disease treatment', 'periodontist DDS', 'periodontist DMD'],
    'TMJ Treatment': ['tmj specialist', 'jaw treatment', 'tmj therapy', 'tmj dentist DDS', 'tmj dentist DMD'],
    'Prosthodontics': ['prosthodontist', 'dental prosthetics', 'dentures', 'prosthodontist DDS', 'prosthodontist DMD'],
    'Sedation Dentistry': ['sedation dentist', 'sleep dentistry', 'anxiety dentist', 'sedation dentist DDS', 'sedation dentist DMD'],
    'Preventive Care': ['preventive dentist', 'dental hygiene', 'dental cleaning', 'preventive dentist DDS', 'preventive dentist DMD'],
    'Routine Checkups': ['dental checkup', 'dental examination', 'routine dental', 'checkup dentist DDS', 'checkup dentist DMD'],
    'Family Dentistry': ['family dentist', 'family dental practice', 'all ages dental', 'family dentist DDS', 'family dentist DMD']
  };

  let searchStrategies: Array<{type: string, query: string, priority: number}> = [];
  
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      const queries = tagToQueryMap[tag] || [tag.toLowerCase()];
      queries.forEach((queryTerm, index) => {
        if (!providerType || providerType === 'dentist') {
          searchStrategies.push({
            type: 'dentist',
            query: `${queryTerm} ${locationInfo.zipCode}`,
            priority: index + 1
          });
        }
        if (!providerType || providerType === 'cosmetic') {
          searchStrategies.push({
            type: 'cosmetic',
            query: `${queryTerm} cosmetic ${locationInfo.zipCode}`,
            priority: index + 1
          });
        }
      });
    });
  } else {
    if (!providerType || providerType === 'dentist') {
      searchStrategies.push(
        { type: 'dentist', query: `dentist ${locationInfo.zipCode}`, priority: 1 },
        { type: 'dentist', query: `DDS ${locationInfo.zipCode}`, priority: 1 },
        { type: 'dentist', query: `DMD ${locationInfo.zipCode}`, priority: 1 },
        { type: 'dentist', query: `dental clinic ${locationInfo.zipCode}`, priority: 1 },
        { type: 'dentist', query: `orthodontist ${locationInfo.zipCode}`, priority: 1 },
        { type: 'dentist', query: `family dentist ${locationInfo.zipCode}`, priority: 1 }
      );
    }
    
    if (!providerType || providerType === 'cosmetic') {
      searchStrategies.push(
        { type: 'cosmetic', query: `cosmetic surgeon ${locationInfo.zipCode}`, priority: 1 },
        { type: 'cosmetic', query: `plastic surgeon ${locationInfo.zipCode}`, priority: 1 },
        { type: 'cosmetic', query: `dermatologist ${locationInfo.zipCode}`, priority: 1 }
      );
    }
  }

  searchStrategies.sort((a, b) => a.priority - b.priority);

  for (const strategy of searchStrategies) {
    if (allResults.length >= resultsNeeded) break;
    
    console.log(`🔍 Priority ${strategy.priority}: ${strategy.query.replace(` ${locationInfo.zipCode}`, '')} in ${locationInfo.zipCode} (${allResults.length}/${resultsNeeded})`);
    
    const type = strategy.type === 'dentist' ? 'dentist' : 'doctor';
    let nextPageToken: string | null = null;
    let apiPageCount = 0;
    const maxApiPages = 3;
    
    do {
      try {
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
          `query=${encodeURIComponent(strategy.query)}&` +
          `type=${type}&` +
          `location=${lat},${lng}&` +
          `radius=25000&` +
          `key=${apiKey}`;

        if (nextPageToken) {
          url += `&pagetoken=${nextPageToken}`;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
          const results = (data.results || []).map((place: any) => ({
            ...place,
            searchType: strategy.type
          }));
          
          allResults.push(...results);
          nextPageToken = data.next_page_token || null;
          apiPageCount++;
          
          console.log(`✅ Page ${apiPageCount}: +${results.length} results (total: ${allResults.length})`);
          
        } else if (data.status === 'ZERO_RESULTS') {
          console.log(`❌ No results for: ${strategy.query.replace(` ${locationInfo.zipCode}`, '')} in ${locationInfo.zipCode}`);
          break;
        } else if (data.status === 'INVALID_REQUEST') {
          console.log(`⏳ Token not ready, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        } else {
          console.log(`❌ API error: ${data.status}`);
          break;
        }
      } catch (error) {
        console.error(`💥 Search error:`, error);
        break;
      }
    } while (nextPageToken && apiPageCount < maxApiPages && allResults.length < resultsNeeded);
  }

  const uniqueResults = allResults.filter((place, index, self) => 
    index === self.findIndex(p => p.place_id === place.place_id)
  );

  const filteredResults = uniqueResults.filter(place => {
    if (place.geometry?.location) {
      const distance = calculateDistance(
        lat, lng, 
        place.geometry.location.lat, 
        place.geometry.location.lng
      );
      return distance <= 25;
    }
    return true;
  });

  console.log(`📊 Google Maps: ${uniqueResults.length} unique places, ${filteredResults.length} within range`);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageResults = filteredResults.slice(startIndex, endIndex);
  const hasMore = filteredResults.length > endIndex;
  
  console.log(`🎯 Returning page ${page}: ${pageResults.length} results`);

  return {
    providers: pageResults,
    totalCount: filteredResults.length,
    hasMore: hasMore
  };
}

// ============================================
// ENHANCED PROVIDER STORAGE WITH ZIP SUPPORT
// ============================================

async function storeProvidersInSupabase(providers: Provider[], locationInfo: { zipCode: string, city: string, state: string, lat: number, lng: number }) {
  try {
    console.log(`💾 === STORING ${providers.length} PROVIDERS WITH ZIP CODES ===`);
    
    if (providers.length === 0) {
      console.log(`⚠️ No providers to store`);
      return false;
    }
    
    const supabase = createAdminSupabaseClient();
    
    const providersToInsert = providers.map(provider => {
      // ✅ Extract ZIP from address or use location ZIP
      let zipCode = extractZipFromAddress(provider.address);
      if (!zipCode && locationInfo.zipCode && locationInfo.zipCode !== 'Unknown') {
        zipCode = locationInfo.zipCode;
      }
      
      return {
        name: provider.name,
        type: provider.type,
        address: provider.address,
        lat: provider.lat,
        lng: provider.lng,
        rating: provider.rating || 0,
        review_count: provider.reviewCount || 0,
        tags: provider.tags || [],
        phone_number: provider.phoneNumber || '',
        website: provider.website || '',
        photos: provider.photos || [],
        opening_hours: provider?.opening_hours || null,
        place_id:provider.id,
        business_status: 'OPERATIONAL',
        zip_code: zipCode, // ✅ Store ZIP code
        last_verified: new Date().toISOString()
      };
    });
    
    console.log('📋 Sample provider with ZIP:', {
      name: providersToInsert[0]?.name,
      address: providersToInsert[0]?.address,
      zip_code: providersToInsert[0]?.zip_code
    });
    
    const { data, error: providersError } = await supabase
      .from('providers')
      .upsert(providersToInsert, {
        onConflict: 'place_id', // ✅ Use id instead of place_id
        ignoreDuplicates: false
      })
      .select('id, name, zip_code');
    
    if (providersError) {
      console.error('❌ Error storing providers with ZIP:', providersError);
      console.error('Error details:', {
        code: providersError.code,
        message: providersError.message,
        details: providersError.details,
        hint: providersError.hint
      });
      return false;
    }
    
    console.log(`✅ Successfully stored ${data?.length || providers.length} providers`);
    
    // Log ZIP code distribution
    const zipCounts = data?.reduce((acc: any, provider: any) => {
      const zip = provider.zip_code || 'no-zip';
      acc[zip] = (acc[zip] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📮 ZIP code distribution:', zipCounts);
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error storing providers:', error);
    return false;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function determineProviderType(types: string[], name: string, searchType?: string): 'dentist' | 'cosmetic' {
  const typeStr = types.join(' ').toLowerCase();
  const nameStr = name.toLowerCase();
  
  if (searchType) {
    return searchType as 'dentist' | 'cosmetic';
  }
  
  const cosmeticKeywords = [
    'cosmetic', 'plastic', 'dermatolog', 'aesthetic', 'botox', 'laser',
    'med spa', 'medical spa', 'beauty', 'surgeon', 'facial', 'skin',
    'fillers', 'injectables', 'lip enhancement', 'anti-aging'
  ];
  
  const dentalKeywords = [
    'dental', 'dentist', 'orthodont', 'oral', 'tooth', 'teeth',
    'braces', 'invisalign', 'endodont', 'periodont', 'pediatric',
    'gum', 'implant', 'cavity', 'root canal', 'tmj', 'prosthodont',
    'dds', 'dmd', 'doctor of dental surgery', 'doctor of dental medicine'
  ];
  
  const hasCosmeticKeyword = cosmeticKeywords.some(keyword => 
    nameStr.includes(keyword) || typeStr.includes(keyword)
  );
  
  const hasDentalKeyword = dentalKeywords.some(keyword => 
    nameStr.includes(keyword) || typeStr.includes(keyword)
  );
  
  if (hasCosmeticKeyword && !hasDentalKeyword) {
    return 'cosmetic';
  } else if (hasDentalKeyword) {
    return 'dentist';
  } else {
    return 'dentist';
  }
}

function getProviderTags(types: string[], name: string, providerType: string): string[] {
  const tags: string[] = [];
  const nameStr = name ? name.toLowerCase() : '';
  const typeStr = types.join(' ').toLowerCase();

  if (providerType === 'dentist') {
    if (typeStr.includes('dentist') || nameStr.includes('dental') || nameStr.includes('dds') || nameStr.includes('dmd')) tags.push('General Dentistry');
    if (nameStr.includes('orthodont') || nameStr.includes('braces') || nameStr.includes('invisalign')) tags.push('Orthodontics');
    if (nameStr.includes('oral') && nameStr.includes('surgeon')) tags.push('Oral Surgery');
    if (nameStr.includes('implant')) tags.push('Dental Implants');
    if (nameStr.includes('cosmetic') && nameStr.includes('dent')) tags.push('Cosmetic Dentistry');
    if (nameStr.includes('endodont') || nameStr.includes('root canal')) tags.push('Endodontics');
    if (nameStr.includes('periodont') || nameStr.includes('gum')) tags.push('Periodontics');
    if (nameStr.includes('pediatric') || nameStr.includes('children')) tags.push('Pediatric Dentistry');
    if (nameStr.includes('emergency') || nameStr.includes('urgent')) tags.push('Emergency Dentistry');
    if (nameStr.includes('family')) tags.push('Family Dentistry');
    if (nameStr.includes('prosthodont')) tags.push('Prosthodontics');
    if (nameStr.includes('tmj') || nameStr.includes('jaw')) tags.push('TMJ Treatment');
    if (nameStr.includes('sedation')) tags.push('Sedation Dentistry');
    if (nameStr.includes('preventive')) tags.push('Preventive Care');
    if (nameStr.includes('checkup') || nameStr.includes('cleaning')) tags.push('Routine Checkups');
    if (nameStr.includes('dds') || nameStr.includes('dmd')) {
      if (tags.length === 0) tags.push('General Dentistry');
    }
    if (tags.length === 0) tags.push('General Dentistry');
  } else {
    if (nameStr.includes('plastic') || nameStr.includes('surgeon')) tags.push('Plastic Surgery');
    if (nameStr.includes('dermatolog') || nameStr.includes('skin')) tags.push('Skin Care');
    if (nameStr.includes('botox') || nameStr.includes('filler')) tags.push('Injectables');
    if (nameStr.includes('laser')) tags.push('Laser Treatments');
    if (nameStr.includes('aesthetic') || nameStr.includes('cosmetic')) tags.push('Aesthetic Medicine');
    if (nameStr.includes('facial')) tags.push('Facial Procedures');
    if (nameStr.includes('med spa') || nameStr.includes('spa')) tags.push('Medical Spa');
    if (tags.length === 0) tags.push('Cosmetic Services');
  }

  return tags;
}

function processPlacePhotos(photos: any[], apiKey: string): string[] {
  if (!photos || photos.length === 0) return [];
  
  const photoUrls: string[] = [];
  const maxPhotos = Math.min(photos.length, 5);
  
  for (let i = 0; i < maxPhotos; i++) {
    const photo = photos[i];
    if (photo.photo_reference) {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?` +
        `maxwidth=400&` +
        `maxheight=300&` +
        `photo_reference=${photo.photo_reference}&` +
        `key=${apiKey}`;
      
      photoUrls.push(photoUrl);
    }
  }
  
  return photoUrls;
}

async function processPlaceDetails(place: any, centerLat: number, centerLng: number, apiKey: string): Promise<Provider | null> {
  try {
    if (!place?.place_id) {
      return null;
    }

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${place.place_id}&` +
      `fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,business_status,photos,opening_hours&` +
      `key=${apiKey}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      return null;
    }

    const details = data?.result;

    if (details?.business_status === 'CLOSED_PERMANENTLY' || 
        details?.business_status === 'CLOSED_TEMPORARILY') {
      return null;
    }

    const providerType = determineProviderType(details?.types || [], details.name || '', place.searchType);
    const photos = processPlacePhotos(details?.photos || [], apiKey);
    const tags = getProviderTags(details?.types || [], details.name || '', providerType);
    
    const opening_hours = details.opening_hours ? {
      open_now: details?.opening_hours.open_now || false,
      periods: details?.opening_hours.periods || [],
      weekday_text: details?.opening_hours.weekday_text || []
    } : undefined;

    return {
      id: place.place_id,
      name: details.name || 'Unknown Provider',
      type: providerType,
      address: details?.formatted_address || place.vicinity || 'Address not available',
      lat: details?.geometry?.location?.lat || centerLat,
      lng: details?.geometry?.location?.lng || centerLng,
      rating: details?.rating || 0,
      reviewCount: details?.user_ratings_total || 0,
      tags: tags,
      phoneNumber: details?.formatted_phone_number || '',
      website: details?.website || '',
      photos: photos,
      opening_hours: opening_hours,
      distance: calculateDistance(
        centerLat, 
        centerLng, 
        details?.geometry?.location?.lat || centerLat, 
        details?.geometry?.location?.lng || centerLng
      )
    };
  } catch (error) {
    console.error(`Error processing place ${place?.place_id}:`, error);
    return null;
  }
}

// ============================================
// ✅ MAIN API ROUTE HANDLER WITH STRICT ZIP FILTERING
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zipCode = searchParams.get('zip'); // ✅ NEW: ZIP parameter support
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const radius = parseInt(searchParams.get('radius') || '20');
    const type = searchParams.get('type');
    const tagsParam = searchParams.get('tags');
    const forceRefresh = searchParams.get('force_refresh') === 'true';

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    const tags = tagsParam 
      ? tagsParam.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    console.log(`\n🏥 === ENHANCED PROVIDERS API WITH STRICT ZIP FILTERING ===`);
    console.log(`📍 Location: ${latNum}, ${lngNum}`);
    console.log(`📮 ZIP Code: ${zipCode || 'not provided'}`);
    console.log(`📄 Page: ${page}, Limit: ${limit}, Radius: ${radius}km`);
    console.log(`🏷️ Type: ${type || 'all'}, Tags: ${tags.join(', ') || 'none'}`);
    
    const userIsAdmin = await isUserAdmin(request);
    console.log(`🔐 User is admin: ${userIsAdmin}`);
    
    // ✅ ALWAYS check Supabase first for ALL users (with ZIP support)
    let result: { providers: Provider[], totalCount: number, fromCache: boolean } | null = null;
    
    if (!forceRefresh) {
      result = await getProvidersFromSupabase(
        latNum, lngNum, page, limit, radius, tags, type || undefined, zipCode || undefined
      );
    }
    
    // ✅ If Supabase has data, return it for BOTH admin and non-admin users
    if (result && result.fromCache && result.providers.length > 0) {
      console.log(`✅ RETURNING ${result.providers.length} PROVIDERS FROM CACHE (${userIsAdmin ? 'ADMIN' : 'USER'})`);
      
      return NextResponse.json({
        providers: result.providers,
        count: result.providers.length,
        totalCount: result.totalCount,
        hasMore: page * limit < result.totalCount,
        page: page,
        limit: limit,
        location: { lat: latNum, lng: lngNum },
        zipCode: zipCode,
        fromCache: true,
        source: 'supabase',
        userRole: userIsAdmin ? 'admin' : 'user',
        cacheTimestamp: new Date().toISOString()
      });
    }
    
    // ✅ Only admins can fetch new data from Google Maps
    if (userIsAdmin) {
      console.log(`🌐 ADMIN: FETCHING NEW DATA FROM GOOGLE MAPS API`);
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const googleResult = await fetchProvidersFromGoogleMaps(latNum, lngNum, page, limit, apiKey, tags, type || undefined);
      
      const processedProviders: Provider[] = [];
      let locationInfo;
      
      try {
        locationInfo = await getZipCodeFromCoordinates(latNum, lngNum, apiKey);
      } catch (error) {
        console.error('Error getting ZIP code info:', error);
        locationInfo = { zipCode: 'Unknown', city: 'Unknown', state: '' };
      }
      
      console.log(`🔄 Processing ${googleResult.providers.length} places...`);
      
      // Process places in parallel for better performance
      const processingPromises = googleResult.providers.map(place => 
        processPlaceDetails(place, latNum, lngNum, apiKey)
      );
      
      const processedResults = await Promise.allSettled(processingPromises);
      
      for (const result of processedResults) {
        if (result.status === 'fulfilled' && result.value) {
          const processed = result.value;
          
          // Apply tag filtering if specified
          if (tags && tags.length > 0) {
            const hasMatchingTag = processed.tags.some(tag => 
              tags.some(requestedTag => 
                tag.toLowerCase().includes(requestedTag.toLowerCase()) ||
                requestedTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            
            if (hasMatchingTag) {
              processedProviders.push(processed);
              console.log(`✅ ${processed.name}: ${processed.tags.join(', ')}`);
            } else {
              console.log(`⏭️ Skipped ${processed.name}: ${processed.tags.join(', ')}`);
            }
          } else {
            processedProviders.push(processed);
          }
        }
      }
      console.log(processedProviders,'📮 processProviders===')
      // ✅ STRICT ZIP FILTERING - Apply exact ZIP filtering if ZIP code provided
      if (zipCode && processedProviders.length > 0) {
        console.log(`\n🔍 === APPLYING STRICT ZIP FILTERING ===`);
        console.log(`📮 Requested ZIP: ${zipCode}`);
        console.log(`📊 Pre-filter: ${processedProviders.length} providers`);
        
        // Apply strict ZIP filtering - EXACT matches only
        const originalCount = processedProviders.length;
        const filteredProviders = filterProvidersByExactZip(processedProviders, zipCode);
        
        // Replace the original array with filtered results
        processedProviders.splice(0, processedProviders.length, ...filteredProviders);
        
        console.log(`✅ STRICT ZIP FILTERING COMPLETE:`);
        console.log(`   Original: ${originalCount} providers`);
        console.log(`   Filtered: ${processedProviders.length} providers`);
        console.log(`   Removed: ${originalCount - processedProviders.length} providers`);
        
        // If no exact matches found, provide helpful message
        if (processedProviders.length === 0) {
          console.log(`❌ NO PROVIDERS FOUND IN ZIP ${zipCode}`);
          console.log(`💡 This ZIP may not have dental providers, or they may not be indexed yet`);
          
          return NextResponse.json({
            providers: [],
            count: 0,
            totalCount: 0,
            hasMore: false,
            page: page,
            limit: limit,
            location: { lat: latNum, lng: lngNum },
            zipCode: zipCode,
            fromCache: false,
            source: 'google_maps_api',
            userRole: 'admin',
            message: `No dental providers found in ZIP code ${zipCode}. Try searching a nearby ZIP code.`,
            searchRadius: radius,
            appliedTags: tags,
            lastUpdated: new Date().toISOString(),
            filteringApplied: 'strict_zip_only',
            originalResultCount: originalCount,
            filteredResultCount: 0
          });
        }
      } else if (zipCode) {
        console.log(`⚠️ ZIP filtering requested but no providers to filter`);
      } else {
        console.log(`ℹ️ No ZIP filtering - geographic search mode`);
      }

      // ✅ Store filtered data in Supabase for future requests
      if (processedProviders.length > 0) {
        const stored = await storeProvidersInSupabase(processedProviders, {
          zipCode: locationInfo?.zipCode || zipCode || 'Unknown',
          city: locationInfo?.city || 'Unknown', 
          state: locationInfo?.state || '',
          lat: latNum,
          lng: lngNum
        });
        
        if (stored) {
          console.log(`✅ Stored ${processedProviders.length} EXACT ZIP MATCH providers for future requests`);
        } else {
          console.log(`❌ Failed to store providers - check logs above`);
        }
      }

      // Sort by distance for better user experience
      processedProviders.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      const successMessage = zipCode 
        ? `🎉 ADMIN SUCCESS: Returning ${processedProviders.length} providers from EXACT ZIP ${zipCode}`
        : `🎉 ADMIN SUCCESS: Returning ${processedProviders.length} providers from geographic search`;
      
      console.log(successMessage);
      console.log(`📊 Search covered ${googleResult.totalCount} total places, filtered to ${processedProviders.length} ${zipCode ? 'exact ZIP matches' : 'geographic matches'}`);
      
      return NextResponse.json({ 
        providers: processedProviders,
        count: processedProviders.length,
        totalCount: processedProviders.length, // ✅ Updated to reflect filtered count
        hasMore: false, // ✅ No pagination needed for exact ZIP matches typically
        page: page,
        limit: limit,
        location: { lat: latNum, lng: lngNum },
        zipCode: zipCode,
        fromCache: false,
        source: 'google_maps_api',
        userRole: 'admin',
        lastUpdated: new Date().toISOString(),
        searchRadius: radius,
        appliedTags: tags,
        filteringApplied: zipCode ? 'strict_zip_only' : 'geographic',
        originalResultCount: googleResult.totalCount,
        filteredResultCount: processedProviders.length
      });
      
    } else {
      // ✅ Non-admin users: No cached data available
      console.log(`📭 NON-ADMIN: No cached data available for this location`);
      
      return NextResponse.json({
        providers: [],
        count: 0,
        totalCount: 0,
        hasMore: false,
        page: page,
        limit: limit,
        location: { lat: latNum, lng: lngNum },
        zipCode: zipCode,
        fromCache: false,
        source: 'supabase',
        userRole: 'user',
        message: zipCode 
          ? `No providers found for ZIP ${zipCode}. An admin needs to search this area first.`
          : 'No providers found for this location. An admin needs to search this area first.',
        cacheTimestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('💥 API ERROR:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch providers', 
      providers: [],
      count: 0,
      totalCount: 0,
      hasMore: false,
      source: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}