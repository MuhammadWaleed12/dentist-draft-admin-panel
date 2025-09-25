// At the top of your booking helpers file, add:
export interface Provider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  hours: {
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    open_now?: boolean;
    weekday_text?: string[];
  };
  // Add any other fields from your Provider type
  type: string;
  address: string;
  rating: number;
  reviewCount?: number;
  tags?: string[];
  phoneNumber?: string;
  website: string;
  photos: string[];
  zipCode?: string;  
distance:number;

}