"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string; zipCode: string }) => void;
  initialQuery?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export function SearchBar({ onSearch, onLocationSelect, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to check if input looks like a ZIP code
  const isZipCodeFormat = (input: string): boolean => {
    const trimmed = input.trim();
    // US ZIP code patterns: 12345 or 12345-6789
    const zipCodeRegex = /^\d{5}(-\d{4})?$/;
    return zipCodeRegex.test(trimmed);
  };

  // Helper function to extract ZIP code from address components
  const extractZipCode = (addressComponents: google.maps.GeocoderAddressComponent[]): string | null => {
    for (const component of addressComponents) {
      if (component.types.includes('postal_code')) {
        return component.long_name;
      }
    }
    return null;
  };

  // Helper function to filter predictions to only ZIP code related ones
  const filterZipCodePredictions = (predictions: PlacePrediction[]): PlacePrediction[] => {
    return predictions.filter(prediction => {
      // Check if the prediction is for a postal code
      const hasPostalCodeType = prediction.types?.includes('postal_code');
      
      // Check if the main text looks like a ZIP code
      const mainTextIsZip = isZipCodeFormat(prediction.structured_formatting.main_text);
      
      // Check if the description contains a ZIP code pattern
      const descriptionHasZip = /\b\d{5}(-\d{4})?\b/.test(prediction.description);
      
      return hasPostalCodeType || mainTextIsZip || descriptionHasZip;
    });
  };

  // Set initial query from props
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Enhanced Google Maps API detection
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && 
          window.google?.maps?.places?.AutocompleteService && 
          window.google?.maps?.Geocoder) {
        try {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          geocoder.current = new window.google.maps.Geocoder();
          setIsGoogleLoaded(true);
          console.log('🔍 SearchBar: Google Maps API loaded successfully');
          return true;
        } catch (error) {
          console.error('🔍 SearchBar: Error initializing Google Maps services:', error);
          return false;
        }
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMaps()) return;

    // Set up polling with better timing
    let attempts = 0;
    let currentDelay = 100;
    const maxAttempts = 100;
    
    const checkWithDelay = () => {
      setTimeout(() => {
        attempts++;
        console.log(`🔍 SearchBar: Checking Google Maps API - attempt ${attempts}`);
        
        if (checkGoogleMaps()) {
          return;
        } else if (attempts >= maxAttempts) {
          console.error('🔍 SearchBar: Google Maps API failed to load after maximum attempts');
          return;
        } else {
          currentDelay = Math.min(currentDelay * 1.1, 2000);
          checkWithDelay();
        }
      }, currentDelay);
    };

    checkWithDelay();
  }, []);

  // Debounced search for predictions - MODIFIED for ZIP codes only
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 0 && autocompleteService.current && isGoogleLoaded) {
        
        // If it's already a valid ZIP code format, don't show predictions
        if (isZipCodeFormat(query)) {
          setPredictions([]);
          setShowPredictions(false);
          return;
        }
        
        // Only search if it could potentially be a ZIP code (starts with numbers)
        if (!/^\d/.test(query.trim())) {
          setPredictions([]);
          setShowPredictions(false);
          return;
        }
        
        setIsLoading(true);
        
        // MODIFIED: Search specifically for postal codes
        const request = {
          input: query,
          types: ['postal_code'], // Restrict to postal codes only
          componentRestrictions: { country: 'us' },
        };

        console.log('🔍 SearchBar: Making ZIP code autocomplete request for:', query);

        autocompleteService.current.getPlacePredictions(
          request,
          (predictions, status) => {
            setIsLoading(false);
            console.log('🔍 SearchBar: ZIP code autocomplete response:', { status, predictions });
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              // Double filter to ensure only ZIP code related predictions
              const zipCodePredictions = filterZipCodePredictions(predictions);
              setPredictions(zipCodePredictions);
              setShowPredictions(zipCodePredictions.length > 0);
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setPredictions([]);
              setShowPredictions(false);
            } else {
              console.error('🔍 SearchBar: AutocompleteService error:', status);
              setPredictions([]);
              setShowPredictions(false);
            }
          }
        );
      } else if (query.length === 0) {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isGoogleLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('🔍 SearchBar: Form submitted with query:', query);
      
      // Validate that it's a ZIP code format
      if (!isZipCodeFormat(query.trim())) {
        toast.error('Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)');
        return;
      }
      
      onSearch(query);
      setShowPredictions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setPredictions([]);
    setShowPredictions(false);
  };

  const handlePredictionClick = (prediction: PlacePrediction) => {
    console.log('🔍 SearchBar: ZIP code prediction clicked:', prediction);
    
    if (!geocoder.current) {
      console.error('🔍 SearchBar: Geocoder not available');
      toast.error('Location service not available');
      return;
    }

    setQuery(prediction.structured_formatting.main_text);
    setShowPredictions(false);
    setIsLoading(true);

    console.log('🔍 SearchBar: Starting geocoding for ZIP code place_id:', prediction.place_id);

    // Geocode the selected ZIP code
    geocoder.current.geocode(
      { 
        placeId: prediction.place_id
      },
      (results, status) => {
        setIsLoading(false);
        console.log('🔍 SearchBar: ZIP code geocoding response:', { status, results });
        
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          
          // Extract ZIP code from address components
          const zipCode = extractZipCode(result.address_components || []);
          
          if (!zipCode) {
            console.error('🔍 SearchBar: Could not extract ZIP code from result');
            toast.error('Could not determine ZIP code from selection');
            return;
          }
          
          // Check if result is in US by examining address components
          const isInUS = result.address_components?.some(component => 
            component.types.includes('country') && 
            (component.short_name === 'US' || component.long_name === 'United States')
          );
          
          console.log('🔍 SearchBar: ZIP code location is in US:', isInUS);
          console.log('🔍 SearchBar: Extracted ZIP code:', zipCode);
          
          if (isInUS && zipCode) {
            const location = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              address: result.formatted_address || prediction.description,
              zipCode: zipCode
            };
            
            console.log('🔍 SearchBar: About to call onLocationSelect with ZIP code location:', location);
            
            // Call the location select callback if provided
            if (onLocationSelect && typeof onLocationSelect === 'function') {
              try {
                onLocationSelect(location);
                console.log('🔍 SearchBar: Successfully called onLocationSelect for ZIP code');
                toast.success(`Moving to ZIP code ${zipCode}`);
              } catch (error) {
                console.error('🔍 SearchBar: Error calling onLocationSelect:', error);
                toast.error('Error updating location');
              }
            } else {
              console.warn('🔍 SearchBar: onLocationSelect callback not provided or not a function');
              toast.warning('Location callback not available');
            }
            
            onSearch(zipCode); // Use the ZIP code for search
          } else {
            console.warn('🔍 SearchBar: Invalid ZIP code location');
            toast.warning('Please select a valid US ZIP code');
          }
        } else {
          console.error('🔍 SearchBar: ZIP code geocoding error:', status);
          toast.error(`Could not find ZIP code location: ${status}`);
        }
      }
    );
  };

  // MODIFIED: Handle manual ZIP code entry
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow digits and hyphens for ZIP codes
    const sanitizedValue = value.replace(/[^\d-]/g, '');
    
    // Limit to ZIP code format (5 digits + optional -4 digits)
    let formattedValue = sanitizedValue;
    if (sanitizedValue.length > 5 && !sanitizedValue.includes('-')) {
      // Auto-format: 123456789 -> 12345-6789
      formattedValue = sanitizedValue.slice(0, 5) + '-' + sanitizedValue.slice(5, 9);
    } else if (sanitizedValue.length > 10) {
      // Limit to 10 characters max (12345-6789)
      formattedValue = sanitizedValue.slice(0, 10);
    }
    
    setQuery(formattedValue);
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex w-full items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter ZIP code (e.g., 12345)"
            className="w-full pl-9 pr-10"
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
            maxLength={10} // Limit to ZIP+4 format
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Show loading message when Google API is not loaded */}
      {!isGoogleLoaded && query.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
          Loading location services...
        </div>
      )}

      {/* Predictions dropdown - MODIFIED for ZIP codes */}
      {showPredictions && isGoogleLoaded && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-2 text-sm text-muted-foreground">Searching ZIP codes...</span>
            </div>
          ) : predictions.length > 0 ? (
            <div className="max-h-60 overflow-auto">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  onClick={() => handlePredictionClick(prediction)}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matching ZIP codes found
            </div>
          )}
        </div>
      )}
      
 
    </div>
  );
}