"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Star, ArrowRight, Users, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Provider } from '@/lib/types';
import { toast } from 'sonner';
import doctors from '@/assets/images/doctors.jpeg'
import familyDoctor from '@/assets/images/familyDoctor.png'
import cosmetic from '@/assets/images/cosmetic.jpg'
import town from '@/assets/images/city.jpg'
import { OpenStatusBadge } from './ui/open-status-badge';
import { SearchBar } from '@/components/search-bar'; // Import your SearchBar component

const specialtyTags = [
  'General Dentistry',
  'Pediatric',
  'Orthodontics',
  'Cosmetics',
  'Open now',
  'Emergency Services',
  'Oral Surgery'
];

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('In NYC');
  const [currentLocationDisplay, setCurrentLocationDisplay] = useState(''); // For SearchBar display
  const [featuredPractices, setFeaturedPractices] = useState<Provider[]>([]);
  const [practiceCollections, setPracticeCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInfo, setLocationInfo] = useState<{ city: string; state: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Get user's current location and fetch providers
  useEffect(() => {
    const getUserLocationAndProviders = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setUserLocation(coords);
              
              // Get city name from coordinates
              try {
                const response = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
                );
                const data = await response.json();
                
                if (data.status === 'OK' && data.results.length > 0) {
                  const addressComponents = data.results[0].address_components;
                  let city = '';
                  let state = '';
                  
                  for (const component of addressComponents) {
                    if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                      city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                      state = component.short_name;
                    }
                  }
                  
                  if (city && state) {
                    setLocation(`In ${city}, ${state}`);
                    setCurrentLocationDisplay(`${city}, ${state}`); // Set display value for SearchBar
                    setLocationInfo({ city, state });
                    
                    // Generate dynamic collections based on location
                    const dynamicCollections = [
                      {
                        title: `Practices in ${city}`,
                        description: `Find top-rated dentists in ${city}, ${state}.`,
                        image: town,
                        searchQuery: `dentist in ${city} ${state}`,
                        type: 'location'
                      },
                      {
                        title: 'Family-Friendly Practices',
                        description: 'Dental care for the whole family.',
                        image: familyDoctor,
                        searchQuery: 'family dentist',
                        type: 'specialty'
                      },
                      {
                        title: 'Cosmetic Dentistry Experts',
                        description: 'Achieve your dream smile with specialists.',
                        image: cosmetic,
                        searchQuery: 'cosmetic dentist',
                        type: 'specialty'
                      }
                    ];
                    setPracticeCollections(dynamicCollections);
                  }
                }
              } catch (error) {
                console.error('Error getting city name:', error);
                // Fallback collections if geocoding fails
                setPracticeCollections([
                  {
                    title: 'Dental Practices Near You',
                    description: 'Find top-rated dentists in your area.',
                    image: town,
                    searchQuery: 'dentist near me',
                    type: 'location'
                  },
                  {
                    title: 'Family-Friendly Practices',
                    description: 'Dental care for the whole family.',
                    image: familyDoctor,
                    searchQuery: 'family dentist',
                    type: 'specialty'
                  },
                  {
                    title: 'Cosmetic Dentistry Experts',
                    description: 'Achieve your dream smile with specialists.',
                    image: cosmetic,
                    searchQuery: 'cosmetic dentist',
                    type: 'specialty'
                  }
                ]);
              }
              
              // Fetch providers for current location
              await fetchProvidersForLocation(coords.lat, coords.lng);
            },
            (error) => {
              console.error("Error getting location:", error);
              toast.info("Using default location. You can search for your area.");
              // Use default NYC location
              setCurrentLocationDisplay('New York, NY'); // Set display for SearchBar
              setLocationInfo({ city: 'New York', state: 'NY' });
              setPracticeCollections([
                {
                  title: 'Practices in New York',
                  description: 'Find top-rated dentists in New York, NY.',
                  image: town,
                  searchQuery: 'dentist in New York NY',
                  type: 'location'
                },
                {
                  title: 'Family-Friendly Practices',
                  description: 'Dental care for the whole family.',
                  image: familyDoctor,
                  searchQuery: 'family dentist',
                  type: 'specialty'
                },
                {
                  title: 'Cosmetic Dentistry Experts',
                  description: 'Achieve your dream smile with specialists.',
                  image: cosmetic,
                  searchQuery: 'cosmetic dentist',
                  type: 'specialty'
                }
              ]);
              fetchProvidersForLocation(40.7128, -74.006);
            }
          );
        } else {
          // Use default NYC location
          setCurrentLocationDisplay('New York, NY'); // Set display for SearchBar
          setLocationInfo({ city: 'New York', state: 'NY' });
          setPracticeCollections([
            {
              title: 'Practices in New York',
              description: 'Find top-rated dentists in New York, NY.',
              image: town,
              searchQuery: 'dentist in New York NY',
              type: 'location'
            },
            {
              title: 'Family-Friendly Practices',
              description: 'Dental care for the whole family.',
              image: familyDoctor,
              searchQuery: 'family dentist',
              type: 'specialty'
            },
            {
              title: 'Cosmetic Dentistry Experts',
              description: 'Achieve your dream smile with specialists.',
              image: cosmetic,
              searchQuery: 'cosmetic dentist',
              type: 'specialty'
            }
          ]);
          fetchProvidersForLocation(40.7128, -74.006);
        }
      } catch (error) {
        console.error('Error in getUserLocationAndProviders:', error);
        setIsLoading(false);
      }
    };

    getUserLocationAndProviders();
  }, []);

  const fetchProvidersForLocation = async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      
      // First check Supabase for cached data
      const response = await fetch(`/api/providers?lat=${lat}&lng=${lng}&page=1&limit=20&radius=15`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      // Take only first 3 providers for featured section
      setFeaturedPractices(data.providers?.slice(0, 3) || []);
      
      if (data.fromCache) {
        console.log('Loaded providers from Supabase cache');
        toast.success('Loaded dental practices from your area');
      } else {
        console.log('Loaded fresh providers from Google Places API');
        toast.success('Found dental practices near you');
      }
      
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error(`Failed to load providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFeaturedPractices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // Build search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location && location !== 'In NYC') {
      // Remove "In " prefix if present
      const cleanLocation = location.replace(/^In\s+/i, '');
      params.set('location', cleanLocation);
    }
    
    // Redirect to map page with search parameters
    router.push(`/map?${params.toString()}`);
  };

  // INSTANT NAVIGATION - Handle location selection from SearchBar
  const handleLocationSelect = (selectedLocation: { lat: number; lng: number; address: string }) => {
    console.log('🏠 HomePage: Location selected - instant navigation to map:', selectedLocation);
    
    // Build search parameters for instant navigation
    const params = new URLSearchParams();
    params.set('lat', selectedLocation.lat.toString());
    params.set('lng', selectedLocation.lng.toString());
    params.set('location', selectedLocation.address);
    
    // Add current search query if exists
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      // Default search query for dental practices
      params.set('q', 'dental practices');
    }
    
    // INSTANT NAVIGATION - immediately redirect to map page like Zillow
    router.push(`/map?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    // Redirect to map page with tag filter
    const params = new URLSearchParams();
    params.set('tags', tag);
    // Also set a readable search query for display
    params.set('q', tag);
    params.set('tags', tag);
    
    // Add current location if available
    if (userLocation) {
      params.set('lat', userLocation.lat.toString());
      params.set('lng', userLocation.lng.toString());
    }
    
    router.push(`/map?${params.toString()}`);
  };

  const handleCollectionClick = (collection: any) => {
    // Redirect to map page with collection-specific search
    const params = new URLSearchParams();
    params.set('q', collection.searchQuery);
    if (collection.type === 'location' && locationInfo) {
      params.set('location', `${locationInfo.city}, ${locationInfo.state}`);
    }
    router.push(`/map?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-custom-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {user ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0]}!` : 'Find the'} <span className="text-blue-600">{user ? 'Your Dental Care' : 'Best Dentists'}</span> {user ? 'Awaits' : 'Near You'}
            </h1>
            
            <p className="text-xl text-gray-600 mb-12">
              Discover exceptional dental care with our curated selection.
            </p>

            {/* Search Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
              
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <SearchBar
                    onSearch={() => {}} // Empty since we handle search with button
                    onLocationSelect={handleLocationSelect}
                    initialQuery={currentLocationDisplay} // Dynamic based on detected location
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Search Dental Practices
                </Button>
              </div>
            </div>

            {/* Specialty Tags */}
            <div className="flex flex-wrap justify-center gap-3">
              {specialtyTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-white/80 text-gray-700 hover:bg-white cursor-pointer transition-colors px-4 py-2 text-sm"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Practices */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Dental Practices</h2>
            <p className="text-xl text-gray-600">
              {locationInfo ? `Top-rated dental practices in ${locationInfo.city}, ${locationInfo.state}` : 'Top-rated dental practices near you'}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {featuredPractices.map((practice) => (
                <Card key={practice.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      {practice.photos && practice.photos.length > 0 ? (
                        <Image
                          src={practice.photos[0]}
                          alt={practice.name}
                          width={400}
                          height={240}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <MapPin className="h-6 w-6 text-blue-500" />
                            </div>
                            <p className="text-xs text-gray-600 font-medium">No photo available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 left-3 text-white">
                      <OpenStatusBadge practice={practice} variant="compact" />
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{practice.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{practice.address}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(practice.rating) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium text-gray-900 ml-1">
                          {practice.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({practice.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {practice.distance ? `${practice.distance.toFixed(1)} mi away` : 'Nearby'}
                      </span>
                      <Link href={`/practice/${practice.id}`}>
                        <Button variant="outline" size="sm">
                          View More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/map">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                View All Practices
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Practice Collections */}
      <section className="py-20 bg-[#ecf3ff]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Practice Collections</h2>
            <p className="text-xl text-gray-600">
              {locationInfo ? `Explore dental practices in ${locationInfo.city} and by specialty` : 'Explore practices by location or specialty'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {practiceCollections.map((collection, index) => (
              <div
                key={index} 
                className="group hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm"
                onClick={() => handleCollectionClick(collection)}
              >
                <div className="p-4">
                  <div className="overflow-hidden rounded-lg">
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      width={414}
                      height={200}
                      className="w-full h-[200px] object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight">
                    {collection.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-normal">
                    {collection.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#2563eb]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-white">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Do you own a dental practice?<br />
                Grow it with us!
              </h2>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                Join our network of trusted dental professionals and reach more patients in your area. Showcase your practice and highlight your unique services.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-blue-200" />
                  <span className="text-blue-100">Increased visibility to potential patients</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-blue-200" />
                  <span className="text-blue-100">Enhanced online presence and credibility</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-blue-200" />
                  <span className="text-blue-100">Opportunity for premium placements and features</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/providers">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-base font-semibold">
                    Learn more and register
                  </Button>
                </Link>
                <Link href="/providers">
                  <Button className="bg-[#facc15] text-[#1f2937] hover:bg-[#facc15] px-8 py-3 text-base font-semibold">
                    Explore premium benefits
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src={doctors}
                  alt="Dental professionals"
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}