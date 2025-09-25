"use client";
import React, { useState, useEffect, useRef } from 'react';
import GoogleMapReact from 'google-map-react';
import { cn } from '@/lib/utils';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Provider } from '@/lib/types';

// Marker component with lat/lng props
const Marker = ({ 
  lat,
  lng,
  provider, 
  selected, 
  onClick, 
  $hover 
}: { 
  lat: number;
  lng: number;
  provider: Provider; 
  selected: boolean; 
  onClick: () => void; 
  $hover?: boolean;
}) => {
  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 transform cursor-pointer transition-all",
        ($hover || selected) && "z-10 scale-110"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex flex-col items-center",
        provider.type === 'dentist' ? "text-blue-500" : "text-purple-500",
        selected && "text-primary font-bold"
      )}>
        <MapPin 
          className={cn(
            "h-6 w-6",
            selected && "h-8 w-8"
          )} 
          fill={selected ? "currentColor" : "transparent"}
        />
        {($hover || selected) && (
          <div className="absolute top-7 rounded bg-white px-2 py-1 text-xs font-semibold shadow-md dark:bg-gray-800">
            {provider.name}
          </div>
        )}
      </div>
    </div>
  );
};

// Current location marker with lat/lng props
const CurrentLocationMarker = ({ lat, lng }: { lat: number; lng: number }) => (
  <div
    className="absolute -translate-x-1/2 -translate-y-1/2 transform"
  >
    <div className="flex flex-col items-center text-red-500">
      <div className="relative">
        <Navigation className="h-6 w-6" />
        <div className="absolute -inset-1 animate-ping rounded-full bg-red-400 opacity-30"></div>
      </div>
      <div className="mt-1 rounded bg-white px-2 py-1 text-xs font-semibold shadow-md dark:bg-gray-800">
        You are here
      </div>
    </div>
  </div>
);

interface MapComponentProps {
  center: { lat: number; lng: number };
  zoom: number;
  providers: Provider[];
  selectedProvider: Provider | null;
  onProviderSelect: (provider: Provider) => void;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
}

export default function MapComponent({
  center,
  zoom,
  providers,
  selectedProvider,
  onProviderSelect,
  onLocationChange
}: MapComponentProps) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapsApi, setMapsApi] = useState<typeof google.maps | null>(null);
  const [currentCenter, setCurrentCenter] = useState(center);
  const mapRef = useRef<any>(null);

  // Debug logging
  useEffect(() => {
    console.log('🗺️ MapComponent: Received new center prop:', center);
    console.log('🗺️ MapComponent: Current internal center:', currentCenter);
  }, [center, currentCenter]);

  // Handle map API load
  const handleApiLoaded = (
    map: google.maps.Map, 
    maps: typeof google.maps
  ) => {
    console.log('🗺️ MapComponent: Google Maps API loaded, setting up map');
    setMapInstance(map);
    setMapsApi(maps);
    setCurrentCenter(center);
    
    // Set initial center
    map.setCenter(center);
    
    // This makes the Google Maps API globally available for SearchBar
    if (typeof window !== 'undefined') {
      (window as any).google = { maps };
    }
    
    console.log('🗺️ MapComponent: Map initialization complete');
  };

  // Handle center changes - this is the key fix
  useEffect(() => {
    if (mapInstance && (center.lat !== currentCenter.lat || center.lng !== currentCenter.lng)) {
      console.log('🗺️ MapComponent: Center changed, panning map from', currentCenter, 'to', center);
      
      // Update internal state
      setCurrentCenter(center);
      
      // Pan the map to new location
      mapInstance.panTo(center);
      
      // Optional: Adjust zoom if moving to a very different location
      const distance = calculateDistance(currentCenter.lat, currentCenter.lng, center.lat, center.lng);
      if (distance > 100) { // If more than 100km away, adjust zoom
        console.log('🗺️ MapComponent: Large distance change detected, adjusting zoom');
        mapInstance.setZoom(10);
        setTimeout(() => {
          mapInstance.setZoom(zoom);
        }, 1000);
      }
      
      console.log('🗺️ MapComponent: Map should now be centered on:', center);
    }
  }, [center, mapInstance, currentCenter, zoom]);

  // Find my location button handler
  const handleFindMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          console.log('📱 MapComponent: User location found:', newCenter);
          
          if (mapInstance) {
            mapInstance.panTo(newCenter);
            setCurrentCenter(newCenter);
          }
          
          // Notify parent component of location change
          if (onLocationChange) {
            onLocationChange(newCenter);
          }
          
          toast.success("Location updated");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not update location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  // Helper function to calculate distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="relative h-full w-full">
      <GoogleMapReact
        ref={mapRef}
        bootstrapURLKeys={{ 
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          libraries: ['places']
        }}
        center={center}
        zoom={zoom}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map, maps }: { map: google.maps.Map; maps: typeof google.maps }) => handleApiLoaded(map, maps)}
        options={{
          fullscreenControl: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'greedy'
        }}
        onChange={({ center: newCenter }) => {
          // This fires when user manually drags the map
          console.log('🗺️ MapComponent: Map dragged to:', newCenter);
          setCurrentCenter(newCenter);
        }}
      >
        {/* Current location marker */}
        <CurrentLocationMarker lat={center.lat} lng={center.lng} />
        
        {/* Provider markers */}
        {providers.map((provider) => (
          <Marker
            key={provider.id}
            lat={provider.lat}
            lng={provider.lng}
            provider={provider}
            selected={selectedProvider?.id === provider.id}
            onClick={() => onProviderSelect(provider)}
          />
        ))}
      </GoogleMapReact>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded">
          <div>Map Center: {currentCenter.lat.toFixed(4)}, {currentCenter.lng.toFixed(4)}</div>
          <div>Prop Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
          <div>Providers: {providers.length}</div>
        </div>
      )}

      {/* Find my location button */}
      <div className="absolute bottom-4 right-4">
        <Button 
          onClick={handleFindMyLocation} 
          className="flex items-center gap-2 rounded-full"
          size="sm"
        >
          <Navigation className="h-4 w-4" />
          <span>Find My Location</span>
        </Button>
      </div>
    </div>
  );
}