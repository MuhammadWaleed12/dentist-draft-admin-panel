// lib/utils/bookingHelpers.ts

import { getCurrentTimeInTimezone, getPracticeCoordinates, type Practice } from '@/lib/practice-hours';

export interface AvailableDate {
  date: string;
  day: string;
  fullDate: Date;
  isToday: boolean;
  isAvailable: boolean;
}

export interface TimeSlot {
  time: string;
  value: string;
  isAvailable: boolean;
  isPast: boolean;
}

/**
 * Get timezone from coordinates (comprehensive US coverage)
 */
function getTimezoneFromCoordinates(lat: number, lng: number): string {
  // Complete US timezone mappings with all territories
  const timezones = [
    // === UNITED STATES COMPREHENSIVE COVERAGE ===
    
    // US Territories in Pacific
    { bounds: { latMin: 13, latMax: 15, lngMin: 144, lngMax: 146 }, tz: 'Pacific/Guam' }, // Guam
    { bounds: { latMin: -15, latMax: -13, lngMin: -172, lngMax: -169 }, tz: 'Pacific/Pago_Pago' }, // American Samoa
    
    // Hawaii
    { bounds: { latMin: 18, latMax: 23, lngMin: -162, lngMax: -154 }, tz: 'Pacific/Honolulu' },
    
    // Alaska (extended coverage)
    { bounds: { latMin: 54, latMax: 72, lngMin: -180, lngMax: -129 }, tz: 'America/Anchorage' },
    { bounds: { latMin: 51, latMax: 72, lngMin: -168, lngMax: -140 }, tz: 'America/Anchorage' }, // Aleutian Islands
    
    // Pacific Time Zone (CA, WA, OR, NV)
    { bounds: { latMin: 32, latMax: 49, lngMin: -125, lngMax: -114 }, tz: 'America/Los_Angeles' },
    { bounds: { latMin: 31, latMax: 37, lngMin: -118, lngMax: -114 }, tz: 'America/Los_Angeles' }, // Southern CA/NV
    
    // Mountain Time Zone (MT, WY, UT, CO, NM, parts of ID, ND, SD, TX, KS, NE)
    { bounds: { latMin: 25, latMax: 49, lngMin: -114, lngMax: -104 }, tz: 'America/Denver' },
    { bounds: { latMin: 31, latMax: 37, lngMin: -109, lngMax: -103 }, tz: 'America/Denver' }, // West TX, NM
    
    // Arizona (No DST - uses MST year-round, except Navajo Nation)
    { bounds: { latMin: 31, latMax: 37, lngMin: -115, lngMax: -109 }, tz: 'America/Phoenix' },
    
    // Central Time Zone (TX, OK, KS, NE, SD, ND, MN, IA, MO, AR, LA, MS, AL, TN, KY, IN, IL, WI, MI)
    { bounds: { latMin: 25, latMax: 49, lngMin: -104, lngMax: -82 }, tz: 'America/Chicago' },
    { bounds: { latMin: 25, latMax: 30, lngMin: -97, lngMax: -82 }, tz: 'America/Chicago' }, // Gulf states
    
    // Eastern Time Zone (ME, NH, VT, MA, RI, CT, NY, NJ, PA, DE, MD, DC, VA, WV, OH, NC, SC, GA, FL)
    { bounds: { latMin: 24, latMax: 49, lngMin: -85, lngMax: -66 }, tz: 'America/New_York' },
    { bounds: { latMin: 24, latMax: 26, lngMin: -82, lngMax: -80 }, tz: 'America/New_York' }, // South FL
    
    // US Territories in Atlantic/Caribbean
    { bounds: { latMin: 17, latMax: 19, lngMin: -68, lngMax: -65 }, tz: 'America/Puerto_Rico' }, // Puerto Rico
    { bounds: { latMin: 17, latMax: 19, lngMin: -65, lngMax: -64 }, tz: 'America/St_Thomas' }, // US Virgin Islands
    
    // === CANADA ===
    { bounds: { latMin: 41, latMax: 84, lngMin: -141, lngMax: -52 }, tz: 'America/Toronto' }, // Eastern Canada
    { bounds: { latMin: 45, latMax: 84, lngMin: -130, lngMax: -95 }, tz: 'America/Winnipeg' }, // Central Canada
    { bounds: { latMin: 48, latMax: 70, lngMin: -139, lngMax: -114 }, tz: 'America/Edmonton' }, // Mountain Canada
    { bounds: { latMin: 48, latMax: 60, lngMin: -140, lngMax: -114 }, tz: 'America/Vancouver' }, // Pacific Canada
    
    // === MEXICO ===
    { bounds: { latMin: 14, latMax: 33, lngMin: -118, lngMax: -86 }, tz: 'America/Mexico_City' },
    { bounds: { latMin: 20, latMax: 33, lngMin: -117, lngMax: -109 }, tz: 'America/Hermosillo' }, // Sonora (no DST)
    { bounds: { latMin: 25, latMax: 33, lngMin: -109, lngMax: -102 }, tz: 'America/Chihuahua' }, // Northern Mexico
    
    // === EUROPE ===
    { bounds: { latMin: 49, latMax: 61, lngMin: -8, lngMax: 2 }, tz: 'Europe/London' }, // UK & Ireland
    { bounds: { latMin: 35, latMax: 72, lngMin: -10, lngMax: 40 }, tz: 'Europe/Berlin' }, // Western/Central Europe
    { bounds: { latMin: 35, latMax: 71, lngMin: 20, lngMax: 50 }, tz: 'Europe/Helsinki' }, // Eastern Europe
    
    // === ASIA ===
    { bounds: { latMin: 18, latMax: 54, lngMin: 73, lngMax: 135 }, tz: 'Asia/Shanghai' }, // China/Central Asia
    { bounds: { latMin: 24, latMax: 46, lngMin: 129, lngMax: 146 }, tz: 'Asia/Tokyo' }, // Japan
    { bounds: { latMin: 33, latMax: 43, lngMin: 124, lngMax: 132 }, tz: 'Asia/Seoul' }, // Korea
    { bounds: { latMin: -10, latMax: 28, lngMin: 92, lngMax: 141 }, tz: 'Asia/Singapore' }, // Southeast Asia
    { bounds: { latMin: 6, latMax: 37, lngMin: 68, lngMax: 97 }, tz: 'Asia/Kolkata' }, // India
    { bounds: { latMin: 12, latMax: 42, lngMin: 44, lngMax: 75 }, tz: 'Asia/Dubai' }, // Middle East
    
    // === AUSTRALIA & OCEANIA ===
    { bounds: { latMin: -44, latMax: -10, lngMin: 113, lngMax: 154 }, tz: 'Australia/Sydney' },
    { bounds: { latMin: -48, latMax: -12, lngMin: 165, lngMax: 180 }, tz: 'Pacific/Auckland' }, // New Zealand
    
    // === AFRICA ===
    { bounds: { latMin: -35, latMax: 37, lngMin: -18, lngMax: 52 }, tz: 'Africa/Cairo' },
    
    // === SOUTH AMERICA ===
    { bounds: { latMin: -56, latMax: 13, lngMin: -82, lngMax: -34 }, tz: 'America/Sao_Paulo' },
    { bounds: { latMin: -56, latMax: 13, lngMin: -82, lngMax: -66 }, tz: 'America/Argentina/Buenos_Aires' },
    
    // === DEFAULT FALLBACK ===
    { bounds: { latMin: -90, latMax: 90, lngMin: -180, lngMax: 180 }, tz: 'UTC' }
  ];
  
  for (const zone of timezones) {
    const { bounds, tz } = zone;
    if (lat >= bounds.latMin && lat <= bounds.latMax && 
        lng >= bounds.lngMin && lng <= bounds.lngMax) {
      return tz;
    }
  }
  
  return 'UTC'; // Final fallback
}

/**
 * Get current time in practice's local timezone
 */
function getCurrentTimeInPracticeTimezone(lat: number, lng: number) {
  try {
    const timezone = getTimezoneFromCoordinates(lat, lng);
    const now = new Date();
    
    // Create date in practice's timezone
    const practiceTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    return {
      date: practiceTime,
      timeInMinutes: practiceTime.getHours() * 100 + practiceTime.getMinutes(),
      hours: practiceTime.getHours(),
      minutes: practiceTime.getMinutes(),
      day: practiceTime.getDay(),
      timezone
    };
  } catch (error) {
    console.warn('Timezone detection failed, using fallback', error);
    // Fallback to simple offset calculation
    const timezoneOffset = Math.round(lng / 15);
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utc + (timezoneOffset * 3600000));
    
    return {
      date: localTime,
      timeInMinutes: localTime.getHours() * 100 + localTime.getMinutes(),
      hours: localTime.getHours(),
      minutes: localTime.getMinutes(),
      day: localTime.getDay(),
      timezone: `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`
    };
  }
}

/**
 * Generate available dates for the next 30 days based on practice hours
 */
export function getAvailableDates(practice: Practice, daysToShow: number = 30, startDate?: Date): AvailableDate[] {
  const { lat, lng } = getPracticeCoordinates(practice);
  const periods = practice?.hours?.periods;
  
  if (!periods || !Array.isArray(periods) || !lat || !lng) {
    return [];
  }

  const practiceTime = getCurrentTimeInPracticeTimezone(lat, lng);
  
  // Use provided start date or current date in practice timezone
  const baseDate = startDate || practiceTime.date;
  
  const dates: AvailableDate[] = [];
  
  // Generate dates for the next `daysToShow` days from base date
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if practice is open on this day
    const dayHours = periods.find(period => period.open.day === dayOfWeek);
    const isAvailable = !!dayHours;
    
    // Format date display
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Check if it's today in practice timezone
    const isToday = date.toDateString() === practiceTime.date.toDateString();
    
    dates.push({
      date: `${date.getDate()} ${monthNames[date.getMonth()]}`,
      day: dayNames[dayOfWeek],
      fullDate: date,
      isToday,
      isAvailable
    });
  }
  
  return dates.filter(date => date.isAvailable); // Only return days when practice is open
}

/**
 * Generate available time slots for a specific date
 */
export function getAvailableTimeSlots(practice: Practice, selectedDate: Date): TimeSlot[] {
  const { lat, lng } = getPracticeCoordinates(practice);
  const periods = practice?.hours?.periods;
  
  if (!periods || !Array.isArray(periods) || !lat || !lng) {
    return [];
  }

  const practiceTime = getCurrentTimeInPracticeTimezone(lat, lng);
  
  const dayOfWeek = selectedDate.getDay();
  const dayHours = periods.find(period => period.open.day === dayOfWeek);
  
  if (!dayHours) return [];

  const openTime = parseInt(dayHours.open.time);
  const closeTime = parseInt(dayHours.close.time);

  const slots: TimeSlot[] = [];
  
  // Check if selected date is today in practice timezone
  const isToday = selectedDate.toDateString() === practiceTime.date.toDateString();
  
  console.log(`Practice timezone: ${practiceTime.timezone}`);
  console.log(`Selected date: ${selectedDate.toDateString()}`);
  console.log(`Today in practice timezone: ${practiceTime.date.toDateString()}`);
  console.log(`Is today: ${isToday}`);
  console.log(`Current time: ${practiceTime.timeInMinutes} (${practiceTime.hours}:${practiceTime.minutes.toString().padStart(2, '0')})`);
  
  // Generate 30-minute slots
  let currentTime = openTime;
  
  while (currentTime <= closeTime) {
    const currentHour = Math.floor(currentTime / 100);
    let currentMinute = currentTime % 100;
    
    // Only mark as past if it's today AND time has passed in practice timezone
    const isPast = isToday && currentTime <= practiceTime.timeInMinutes;
    
    // Format time for display
    const displayHour = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
    const ampm = currentHour >= 12 ? 'PM' : 'AM';
    const formattedTime = `${displayHour}:${currentMinute.toString().padStart(2, '0')} ${ampm}`;
    
    slots.push({
      time: formattedTime,
      value: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
      isAvailable: !isPast,
      isPast
    });
    
    // Add 30 minutes
    currentMinute += 30;
    let nextHour = currentHour;
    if (currentMinute >= 60) {
      currentMinute = 0;
      nextHour += 1;
    }
    
    currentTime = nextHour * 100 + currentMinute;
    
    if (currentTime > 2400) break;
  }
  
  const availableSlots = slots.filter(s => s.isAvailable);
  console.log(`Generated ${slots.length} total slots, ${availableSlots.length} available`);
  console.log(`Business hours: ${openTime} - ${closeTime}`);
  
  return slots;
}

/**
 * Get current month display for the calendar
 */
export function getCurrentMonthDisplay(practice: Practice, currentDate?: Date): string {
  const { lat, lng } = getPracticeCoordinates(practice);
  
  if (!lat || !lng) {
    const displayDate = currentDate || new Date();
    return displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const practiceTime = getCurrentTimeInPracticeTimezone(lat, lng);
  const displayDate = currentDate || practiceTime.date;
  
  return displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Check if a specific date/time combination is bookable
 */
export function isTimeSlotBookable(practice: Practice, date: Date, timeValue: string): boolean {
  const { lat, lng } = getPracticeCoordinates(practice);
  
  if (!lat || !lng) return false;
  
  const practiceTime = getCurrentTimeInPracticeTimezone(lat, lng);
  const isToday = date.toDateString() === practiceTime.date.toDateString();
  
  if (!isToday) return true; // Future dates are always bookable
  
  // For today, check if time hasn't passed
  const [hours, minutes] = timeValue.split(':').map(Number);
  const slotTime = hours * 100 + minutes;
  
  return slotTime > practiceTime.timeInMinutes;
}

/**
 * Get next available appointment slot
 */
export function getNextAvailableSlot(practice: Practice): { date: Date; time: string } | null {
  const availableDates = getAvailableDates(practice, 7); // Check next 7 days
  
  for (const dateInfo of availableDates) {
    const timeSlots = getAvailableTimeSlots(practice, dateInfo.fullDate);
    const availableSlot = timeSlots.find(slot => slot.isAvailable);
    
    if (availableSlot) {
      return {
        date: dateInfo.fullDate,
        time: availableSlot.time
      };
    }
  }
  
  return null;
}

/**
 * Format date for display in booking form
 */
export function formatDateForBooking(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
}

/**
 * Get booking summary text
 */
export function getBookingSummary(
  practice: Practice, 
  selectedService: string, 
  selectedDate: Date, 
  selectedTime: string
): string {
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `${selectedService} appointment at ${practice.name} on ${dateStr} at ${selectedTime}`;
}