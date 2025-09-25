// app/api/bookings/route.ts
// Handles booking creation and lookup with validation and Supabase admin access

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/get-supabase-admin';
import type { Database } from '@/lib/supabase';

// --- Request Body Type ---
interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  provider_id: string;
  appointment_date?: string;
  appointment_time?: string;
}

// --- Validation Helpers ---
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone);
}

function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(date.getTime()) && date >= today;
}

function validateTime(timeString: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
}

// --- POST: Create Booking ---
export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    const body: BookingRequest = await request.json();
    const { name, email, phone, address, provider_id, appointment_date, appointment_time } = body;

    console.log('Booking request received:', body);

    // Validate input
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !provider_id?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    if (appointment_date && !validateDate(appointment_date)) {
      return NextResponse.json({ error: 'Invalid appointment date' }, { status: 400 });
    }

    if (appointment_time && !validateTime(appointment_time)) {
      return NextResponse.json({ error: 'Invalid appointment time format' }, { status: 400 });
    }

    // Try provider by ID
    let actualProviderId = provider_id;
    let providerName = '';

    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .select('id, name, type, address')
      .eq('id', provider_id)
      .single();

    if (providerError) {
      console.warn('Provider not found by ID, trying place_id:', providerError.message);

      const { data: providerByPlaceId, error: placeIdError } = await supabaseAdmin
        .from('providers')
        .select('id, name, type, address')
        .eq('place_id', provider_id)
        .single();

      if (placeIdError || !providerByPlaceId) {
        return NextResponse.json(
          { error: 'Provider not found', details: `No match for ID/place_id: ${provider_id}` },
          { status: 404 }
        );
      }

      actualProviderId = providerByPlaceId.id;
      providerName = providerByPlaceId.name;
    } else {
      providerName = provider.name;
    }

    // Prevent duplicate booking
    const { data: existingBooking, error: existingBookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('email', email)
      .eq('provider_id', actualProviderId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingBookingError) {
      console.error('Error checking for duplicate:', existingBookingError);
    }

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Duplicate booking', details: 'You already have a pending booking.' },
        { status: 409 }
      );
    }

    // Insert booking
    const bookingData: Database['public']['Tables']['bookings']['Insert'] = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      provider_id: actualProviderId,
      appointment_date: appointment_date || null,
      appointment_time: appointment_time || null,
      status: 'pending'
    };

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select(`
        id,
        name,
        email,
        phone,
        address,
        appointment_date,
        appointment_time,
        status,
        created_at,
        provider:providers(name, type, address, phone_number)
      `)
      .single();

    if (bookingError) {
      console.error('Error inserting booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError.message },
        { status: 500 }
      );
    }

    console.log('Booking created successfully:', booking.id);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        provider_name: providerName,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time,
        status: booking.status,
        created_at: booking.created_at
      },
      message: 'Booking created successfully!'
    });

  } catch (error) {
    console.error('Unhandled booking error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const provider_id = searchParams.get('provider_id');

    // Require at least one query parameter
    if (!email && !provider_id) {
      return NextResponse.json(
        { error: 'Email or provider_id parameter is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        name,
        email,
        phone,
        appointment_date,
        appointment_time,
        status,
        created_at,
        provider:providers(name, type, address)
      `);

    if (email) {
      query = query.eq('email', email);
    }

    if (provider_id) {
      query = query.eq('provider_id', provider_id);
    }

    const { data: bookings, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bookings });

  } catch (error) {
    console.error('Unhandled error in GET /api/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
