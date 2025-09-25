export interface Practice {
    name?:string;
    lat?: number;
    lng?: number;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
    hours?: {
      periods?: Array<{
        open: { day: number; time: string };
        close: { day: number; time: string };
      }>;
    };
  }
  
  export interface TimeInfo {
    day: number;
    time: number;
    hours: number;
    minutes: number;
  }
  
  /**
   * Get current time in practice's timezone based on coordinates
   */
  export function getCurrentTimeInTimezone(lat?: number, lng?: number): TimeInfo | null {
    if (!lat || !lng) return null;
    
    // Rough timezone estimation based on longitude
    const timezoneOffset = Math.round(lng / 15);
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utc + (timezoneOffset * 3600000));
    
    return {
      day: localTime.getDay(),
      time: localTime.getHours() * 100 + localTime.getMinutes(),
      hours: localTime.getHours(),
      minutes: localTime.getMinutes()
    };
  }
  
  /**
   * Extract coordinates from practice object
   */
  export function getPracticeCoordinates(practice: Practice): { lat?: number; lng?: number } {
    return {
      lat: practice?.geometry?.location?.lat || practice?.lat,
      lng: practice?.geometry?.location?.lng || practice?.lng
    };
  }
  
  /**
   * Check if practice is currently open
   */
  export function isCurrentlyOpen(practice: Practice): boolean {
    const { lat, lng } = getPracticeCoordinates(practice);
    const periods = practice?.hours?.periods;
    
    if (!periods || !Array.isArray(periods) || !lat || !lng) return false;
    
    const current = getCurrentTimeInTimezone(lat, lng);
    if (!current) return false;
    
    const todayHours = periods.find(period => period.open.day === current.day);
    if (!todayHours) return false;
    
    const openTime = parseInt(todayHours.open.time);
    const closeTime = parseInt(todayHours.close.time);
    
    if (closeTime < openTime) {
      // Business is open past midnight
      return current.time >= openTime || current.time <= closeTime;
    } else {
      // Normal business hours
      return current.time >= openTime && current.time <= closeTime;
    }
  }
  
  /**
   * Get closing time for today
   */
  export function getClosingTime(practice: Practice): string | null {
    const { lat, lng } = getPracticeCoordinates(practice);
    const periods = practice?.hours?.periods;
    
    if (!periods || !Array.isArray(periods) || !lat || !lng) return null;
    
    const current = getCurrentTimeInTimezone(lat, lng);
    if (!current) return null;
    
    const todayHours = periods.find(period => period.open.day === current.day);
    if (!todayHours) return null;
    
    const closeTime = parseInt(todayHours.close.time);
    const hours = Math.floor(closeTime / 100);
    const minutes = closeTime % 100;
    
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }
  
  /**
   * Get next opening time
   */
  export function getNextOpening(practice: Practice): string | null {
    const { lat, lng } = getPracticeCoordinates(practice);
    const periods = practice?.hours?.periods;
    
    if (!periods || !Array.isArray(periods) || !lat || !lng) return null;
    
    const current = getCurrentTimeInTimezone(lat, lng);
    if (!current) return null;
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Check if opening later today
    const todayHours = periods.find(period => period.open.day === current.day);
    if (todayHours) {
      const openTime = parseInt(todayHours.open.time);
      if (current.time < openTime) {
        const hours = Math.floor(openTime / 100);
        const minutes = openTime % 100;
        const timeStr = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
        return `Opens at ${timeStr} today`;
      }
    }
    
    // Find next day with hours
    for (let i = 1; i <= 7; i++) {
      const nextDay = (current.day + i) % 7;
      const nextDayHours = periods.find(period => period.open.day === nextDay);
      if (nextDayHours) {
        const openTime = parseInt(nextDayHours.open.time);
        const hours = Math.floor(openTime / 100);
        const minutes = openTime % 100;
        const timeStr = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
        return `Opens ${dayNames[nextDay]} at ${timeStr}`;
      }
    }
    
    return null;
  }
  
  /**
   * Get practice status info
   */
  export function getPracticeStatus(practice: Practice) {
    const isOpen = isCurrentlyOpen(practice);
    const closingTime = getClosingTime(practice);
    const nextOpening = getNextOpening(practice);
    
    return {
      isOpen,
      closingTime,
      nextOpening,
      statusText: isOpen ? 'OPEN NOW' : 'CLOSED',
      badgeColor: isOpen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
    };
  }