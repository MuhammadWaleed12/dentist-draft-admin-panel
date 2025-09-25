"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search-bar';
import { ProviderFilter } from '@/components/provider-filter';
import { MapPin, Filter, Star, Heart, Phone, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';
import { Provider } from '@/lib/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRouter as useNavigationRouter } from 'next/navigation';
import Image from 'next/image';

// ✅ Fixed dynamic import to prevent chunking issues
const MapComponent = dynamic(
  () => import('@/components/map-component').then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export function MapPage() {
  const [isClient, setIsClient] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.006,
  });
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<{ dentist: boolean; cosmetic: boolean }>({
    dentist: true,
    cosmetic: true,
  });
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapKey, setMapKey] = useState<number>(0);
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [providersPerPage] = useState<number>(12);
  const [totalProviderCount, setTotalProviderCount] = useState<number>(0);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false); // Mobile map toggle
  const router = useRouter();
  const navigationRouter = useNavigationRouter();
  
  const isMobile = useMediaQuery("(max-width: 768px)");
  const searchParams = useSearchParams();

  // ✅ Add ZIP code extraction function
  const extractZipFromString = (input: string | null | undefined): string | undefined => {
    if (!input) return undefined;
    // Match 5-digit ZIP codes with optional +4 extension
    const zipMatch = input.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipMatch ? zipMatch[1] : undefined;
  };

  useEffect(() => {
    setIsClient(true);
    if (isMobile) {
      setShowMap(false); // Hide map by default on mobile
    }
  }, [isMobile]);

  // Handle URL search parameters
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlLocation = searchParams.get('location');
    const urlTags = searchParams.get('tags');
    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');
    
    console.log('🗺️ MapPage: URL params:', { urlQuery, urlLocation, urlTags, urlLat, urlLng });
    
    if (urlTags) {
      setSelectedTags(urlTags.split(',').map(tag => tag.trim()).filter(Boolean));
      if (urlTags.split(',').length > 0) {
        setShowFilters(true);
      }
    }
    
    // ✅ PRIORITY: Use location parameter first, then fallback to query
    let currentSearchQuery = '';
    if (urlLocation) {
      currentSearchQuery = urlLocation;
      setSearchQuery(urlLocation);
    } else if (urlQuery && urlQuery !== 'dental practices') {
      currentSearchQuery = urlQuery;
      setSearchQuery(urlQuery);
    }
    
    // IMPORTANT: Handle coordinates from homepage navigation
    if (urlLat && urlLng) {
      const lat = parseFloat(urlLat);
      const lng = parseFloat(urlLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('🗺️ MapPage: Setting location from URL params:', { lat, lng });
        setLocation({ lat, lng });
        // ✅ Pass search query and location string to fetchProviders
        fetchProviders(lat, lng, 1, false, currentSearchQuery, urlLocation || undefined);
        return; // Don't run the geolocation logic below
      }
    }
    
    // Only run geolocation if we don't have URL coordinates
    if (!urlLat || !urlLng) {
      // Get user's current location and fetch initial providers
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(newLocation);
            toast.success("Location detected successfully");
            // ✅ Pass current search query
            fetchProviders(newLocation.lat, newLocation.lng, 1, false, currentSearchQuery);
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.info("Using default location. You can search for your area.");
            // ✅ Pass current search query for default location
            fetchProviders(location.lat, location.lng, 1, false, currentSearchQuery);
          }
        );
      } else {
        // ✅ Pass current search query for default fallback
        fetchProviders(location.lat, location.lng, 1, false, currentSearchQuery);
      }
    }
  }, [searchParams]);

  // ✅ Enhanced fetchProviders with ZIP code support
  const fetchProviders = async (
    lat: number, 
    lng: number, 
    page: number = 1, 
    forceRefresh: boolean = false,
    searchQuery?: string, // ✅ NEW: Add search query parameter
    locationString?: string // ✅ NEW: Add location string parameter
  ) => {
    console.log('🗺️ MapPage: Fetching providers for location:', { lat, lng, page, searchQuery, locationString });
    setIsLoadingProviders(true);
    
    try {
      // ✅ Extract ZIP code from available sources
      let zipCode: string | undefined = undefined;

      // Try to extract ZIP from search query first
      if (searchQuery) {
        zipCode = extractZipFromString(searchQuery);
        console.log('🔍 MapPage: ZIP from search query:', zipCode);
      }

      // Try location string if no ZIP found in search query
      if (!zipCode && locationString) {
        zipCode = extractZipFromString(locationString);
        console.log('🔍 MapPage: ZIP from location string:', zipCode);
      }

      // Try URL parameters if still no ZIP found
      if (!zipCode) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLocation = urlParams.get('location');
        const urlQuery = urlParams.get('q');

        if (urlLocation) {
          zipCode = extractZipFromString(decodeURIComponent(urlLocation));
          console.log('🔍 MapPage: ZIP from URL location:', zipCode);
        }

        if (!zipCode && urlQuery) {
          zipCode = extractZipFromString(decodeURIComponent(urlQuery));
          console.log('🔍 MapPage: ZIP from URL query:', zipCode);
        }
      }

      const typeParam = selectedTypes.dentist && selectedTypes.cosmetic 
        ? '' 
        : selectedTypes.dentist 
        ? '&type=dentist' 
        : selectedTypes.cosmetic 
        ? '&type=cosmetic' 
        : '';

      const tagsParam = selectedTags.length > 0 
        ? `&tags=${encodeURIComponent(selectedTags.join(','))}` 
        : '';

      // ✅ CRITICAL: Add ZIP parameter to URL if found
      const zipParam = zipCode ? `&zip=${zipCode}` : '';

      const url = `/api/providers?lat=${lat}&lng=${lng}&page=${page}&limit=${providersPerPage}&radius=10${typeParam}${tagsParam}${zipParam}${forceRefresh ? '&force_refresh=true' : ''}`;
      
      console.log('🗺️ MapPage: API request URL:', url);
      console.log('🔍 MapPage: ZIP parameter included:', !!zipCode, zipCode);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      console.log('🗺️ MapPage: Received providers:', data.providers?.length || 0);
      console.log('🗺️ MapPage: Data source:', data.source);
      console.log('🗺️ MapPage: From cache:', data.fromCache);

      // ✅ Defensive: Ensure providers is always an array
      const providers = Array.isArray(data.providers) ? data.providers : [];
      
      // ✅ Batch state updates to prevent rendering issues
      setAllProviders(providers);
      setTotalProviderCount(data.totalCount || 0);
      setHasMorePages(data.hasMore || false);
      setCurrentPage(page);
      setDataSource(data.source || (data.fromCache ? 'supabase' : 'google_maps'));
      
      const sourceText = data.fromCache || data.source === 'supabase' ? 'cached' : 'fresh';
      toast.success(`Found ${data.count || providers.length || 0} providers (${sourceText} data)${zipCode ? ` for ZIP ${zipCode}` : ''}`);
      
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error(`Failed to load providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAllProviders([]);
      setTotalProviderCount(0);
      setHasMorePages(false);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const handleSearch = (query: string) => {
    console.log('🗺️ MapPage: Search triggered with query:', query);
    setSearchQuery(query);
    
    // ✅ CRITICAL: Pass the search query to fetchProviders
    if (location) {
      fetchProviders(location.lat, location.lng, 1, false, query);
    }
  };

  // ✅ UPDATED: Handle location selection with ZIP code support
  const handleLocationSelect = useCallback((selectedLocation: { 
    lat: number; 
    lng: number; 
    address: string;
    zipCode?: string; 
  }) => {
    console.log('🗺️ MapPage: Location selected - instant update:', selectedLocation);
    
    const newLocation = { lat: selectedLocation.lat, lng: selectedLocation.lng };
    
    // Clear current data
    setAllProviders([]);
    setSelectedProvider(null);
    setCurrentPage(1);
    setTotalProviderCount(0);
    setHasMorePages(false);
    
    // Update search query to show the selected location
    setSearchQuery(selectedLocation.address);
    
    // Update map and location
    setMapKey(prev => prev + 1);
    setLocation(newLocation);
    
    // ✅ CRITICAL: Pass ZIP code and address to fetchProviders
    fetchProviders(
      newLocation.lat, 
      newLocation.lng, 
      1, 
      false, 
      selectedLocation.zipCode || selectedLocation.address, // ✅ Pass ZIP or address as search query
      selectedLocation.address // ✅ Pass full address as location string
    );
    
    toast.success(`Searching for providers in ${selectedLocation.address}`);
    
    // Update URL to reflect the new location
    const params = new URLSearchParams(window.location.search);
    params.set('lat', selectedLocation.lat.toString());
    params.set('lng', selectedLocation.lng.toString());
    params.set('location', selectedLocation.address);
    params.set('q', selectedLocation.address);
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  }, [selectedTypes, selectedTags, providersPerPage, router]);

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    
    const params = new URLSearchParams(window.location.search);
    if (tags.length > 0) {
      params.set('tags', tags.join(','));
    } else {
      params.delete('tags');
    }
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    
    if (location && !isLoadingProviders) {
      setCurrentPage(1);
      setAllProviders([]);
      setTimeout(() => {
        // ✅ Pass current search context
        fetchProviders(location.lat, location.lng, 1, false, searchQuery);
      }, 0);
    }
  };

  const handleTypeChange = (types: { dentist: boolean; cosmetic: boolean }) => {
    setSelectedTypes(types);
    
    const params = new URLSearchParams(window.location.search);
    if (!types.dentist && types.cosmetic) {
      params.set('type', 'cosmetic');
    } else if (types.dentist && !types.cosmetic) {
      params.set('type', 'dentist');
    } else {
      params.delete('type');
    }
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    
    if (location && !isLoadingProviders) {
      setCurrentPage(1);
      setAllProviders([]);
      setTimeout(() => {
        // ✅ Pass current search context
        fetchProviders(location.lat, location.lng, 1, false, searchQuery);
      }, 0);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setLocation({ lat: provider.lat, lng: provider.lng });
    setMapKey(prev => prev + 1);
    if (isMobile) setShowMap(true); // Show map when provider is selected on mobile
  };

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setLocation({ lat: provider.lat, lng: provider.lng });
    setMapKey(prev => prev + 1);
    navigationRouter.push(`/practice/${provider.id}`);
  };

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
  };

  const toggleFavorite = (provider: Provider, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isFavorite = favorites.includes(provider.id);
    if (isFavorite) {
      setFavorites(favorites.filter(id => id !== provider.id));
      toast.info(`Removed ${provider.name} from favorites`);
    } else {
      setFavorites([...favorites, provider.id]);
      toast.success(`Added ${provider.name} to favorites`);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > Math.ceil(totalProviderCount / providersPerPage)) return;
    
    setCurrentPage(page);
    // ✅ Pass current search context for pagination
    fetchProviders(location.lat, location.lng, page, false, searchQuery);
    document.querySelector('.provider-list')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMorePages || currentPage < Math.ceil(totalProviderCount / providersPerPage)) {
      handlePageChange(currentPage + 1);
    }
  };

  const renderPagination = () => {
    if (totalProviderCount <= providersPerPage) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={handlePreviousPage}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
          disabled={isLoadingProviders}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={isLoadingProviders}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
            i === currentPage
              ? "bg-black text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis" className="flex items-center justify-center w-8 h-8 text-gray-400">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          disabled={isLoadingProviders}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          {totalPages}
        </button>
      );
    }

    if (currentPage < totalPages || hasMorePages) {
      pages.push(
        <button
          key="next"
          onClick={handleNextPage}
          disabled={isLoadingProviders || (!hasMorePages && currentPage >= totalPages)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-sm text-gray-600">
          Showing {startResult}-{endResult} of {totalProviderCount} results
          {dataSource && (
            <span className="ml-2 text-xs text-gray-500">
              ({dataSource === 'supabase' ? 'cached' : 'fresh'} data)
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {pages}
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(totalProviderCount / providersPerPage);
  const startResult = (currentPage - 1) * providersPerPage + 1;
  const endResult = Math.min(currentPage * providersPerPage, totalProviderCount);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 w-full md:max-w-md">
              <SearchBar 
                onSearch={handleSearch} 
                onLocationSelect={handleLocationSelect}
                initialQuery={searchQuery}
              />
            </div>
            
            {/* Filters and Results */}
            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-2",
                  (selectedTags.length > 0 || showFilters) && "border-blue-500 bg-blue-50 text-blue-700"
                )}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span> {(selectedTags.length > 0) && `(${selectedTags.length})`}
              </Button>
              
              <Badge variant="secondary" className="text-sm">
                {totalProviderCount} results
                {selectedTags.length > 0 && (
                  <span className="ml-1 text-blue-600 hidden sm:inline">
                    for "{selectedTags.join(', ')}"
                  </span>
                )}
              </Badge>

              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="ml-auto"
                >
                  {showMap ? 'Show List' : 'Show Map'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "grid h-[calc(100vh-140px)]",
        isMobile ? "grid-cols-1" : "grid-cols-12"
      )}>
        {/* Providers Section - hidden on mobile when map is shown */}
        <section className={cn(
          "bg-gray-50 border-r flex flex-col",
          isMobile ? (showMap ? "hidden" : "col-span-1") : "col-span-8"
        )}>
          {/* Heading */}
          <div className="p-4 md:p-6 bg-gray-50">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Dental Practices Near You
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Top-rated dental practices in your area
            </p>
          </div>
          
          {/* Provider Type Filter */}
          {showFilters && (
            <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-b">
              <ProviderFilter
                selectedTypes={selectedTypes}
                selectedTags={selectedTags}
                onChange={handleTypeChange}
                onTagsChange={handleTagsChange}
              />
            </div>
          )}
          
          {/* Providers Grid */}
          <div className="flex-1 overflow-auto provider-list bg-gray-50">
            <div className={cn(
              "grid gap-3 p-4 md:p-6",
              isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
              {isLoadingProviders ? (
                Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 aspect-video rounded-lg mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : allProviders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 rounded-full bg-muted p-3">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">No providers found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try expanding your search radius or adjusting your filters
                  </p>
                </div>
              ) : (
                allProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-lg overflow-hidden bg-white",
                      selectedProvider?.id === provider.id && "ring-2 ring-blue-500 border-blue-200"
                    )}
                    onClick={() => handleProviderClick(provider)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProviderClick(provider)}
                  >
                    {/* Image Section */}
                    <div className="relative">
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        {provider.photos && provider.photos.length > 0 ? (
                          <Image
                            src={provider.photos[0]}
                            alt={provider.name}
                            width={200}
                            height={120}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <MapPin className="h-4 w-4 text-blue-500" />
                              </div>
                              <p className="text-xs text-gray-600 font-medium">No photo</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Favorite button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-white/90 hover:bg-white text-muted-foreground hover:text-rose-500 shadow-sm"
                        onClick={(e) => toggleFavorite(provider, e)}
                      >
                        <Heart 
                          className={cn(
                            "h-3 w-3 transition-colors",
                            favorites.includes(provider.id) && "fill-rose-500 text-rose-500"
                          )} 
                        />
                      </Button>

                      {/* Distance badge */}
                      {provider.distance !== undefined && (
                        <Badge className="absolute bottom-1 left-1 bg-white/90 text-gray-900 text-xs px-1 py-0">
                          <Navigation className="mr-1 h-2 w-2" />
                          {provider.distance.toFixed(1)} mi
                        </Badge>
                      )}
                    </div>

                    <div className="p-3">
                      {/* Header */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{provider.name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-1">Approachable dental care in the heart of {provider.address.split(',')[1] || 'the city'}.</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 text-xs">
                        <span className="text-gray-300">|</span>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-blue-600 hover:text-blue-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle directions
                          }}
                        >
                          Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Pagination */}
          {!isLoadingProviders && totalProviderCount > 0 && (
            <div className="bg-gray-50 border-t px-4 md:px-6">
              {renderPagination()}
            </div>
          )}
        </section>

        {/* Map Section - full width on mobile when shown */}
        <section className={cn(
          "bg-white",
          isMobile ? (showMap ? "col-span-1" : "hidden") : "col-span-4"
        )}>
          <MapComponent
            key={mapKey}
            center={location}
            zoom={13}
            providers={allProviders}
            selectedProvider={selectedProvider}
            onProviderSelect={handleProviderSelect}
            onLocationChange={handleLocationChange}
          />
        </section>
      </div>
    </div>
  );
}