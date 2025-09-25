"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Globe,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowLeft,
  GraduationCap,
  Mail,
  MapPin as AddressIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Provider } from "@/lib/types";
import { OpenStatusBadge } from "./ui/open-status-badge";

interface PracticeProfilePageProps {
  practiceId: string;
}

// Define person interface
interface Person {
  id: string;
  avatar: string | null;
  name: string;
  email: string | null;
  address: string | null;
  biography: string | null;
  dentistry_types: string[] | null;
  degree: string | null;
  created_at: string;
  updated_at: string;
}

export function PracticeProfilePage({ practiceId }: PracticeProfilePageProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [practice, setPractice] = useState<Provider | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonProfile, setShowPersonProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log(practice, "practice..");

  // Fetch provider data
  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/providers/${practiceId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch provider: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setPractice(data.provider);
      } catch (error) {
        console.error("Error fetching provider:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load provider data"
        );
        toast.error("Could not load provider details");
      } finally {
        setLoading(false);
      }
    };

    if (practiceId) {
      fetchProviderData();
    }
  }, [practiceId]);

  // Fetch people associated with this provider
  const fetchPeople = async () => {
    try {
      setPeopleLoading(true);
      const response = await fetch(`/api/providers/${practiceId}/people`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch people: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPeople(data.people || []);
    } catch (error) {
      console.error('Error fetching people:', error);
      // Don't show error toast for people fetch, as it's not critical
      setPeople([]);
    } finally {
      setPeopleLoading(false);
    }
  };

  const nextPhoto = () => {
    if (practice?.photos?.length) {
      setCurrentPhotoIndex((prev) => (prev + 1) % practice.photos!.length);
    }
  };

  const prevPhoto = () => {
    if (practice?.photos?.length) {
      setCurrentPhotoIndex(
        (prev) => (prev - 1 + practice.photos!.length) % practice.photos!.length
      );
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(
      isFavorite
        ? `Removed ${practice?.name} from favorites`
        : `Added ${practice?.name} to favorites`
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: practice?.name || "Dental Practice",
        text: `Check out ${
          practice?.name || "this dental practice"
        } on Dentistar Guide`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  // Handle view person profile
  const handleViewProfile = (person: Person) => {
    setSelectedPerson(person);
    setShowPersonProfile(true);
  };

  // Handle back from person profile
  const handleBackFromProfile = () => {
    setShowPersonProfile(false);
    setSelectedPerson(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !practice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Practice Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "We couldn't find the practice you're looking for."}
          </p>
          <Link href="/map">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Return to Map
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show person profile view
  if (showPersonProfile && selectedPerson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={handleBackFromProfile}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Button>
            </div>

            {/* Person Profile Header */}
            <div className="relative mb-8">
              {/* Cover Image */}
              <div className="h-48 relative overflow-hidden rounded-t-lg">
    {/* Practice photo as background */}
    {practice.photos && practice.photos.length > 0 ? (
      <>
        <img
          src={practice.photos[0]}
          alt={practice.name}
          className="w-full h-full object-cover"
        />
        {/* Overlay for better readability */}
        {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-blue-800/70"></div> */}
      </>
    ) : (
      <>
        {/* Fallback gradient background */}
        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </>
    )}
    
    {/* Profile Image */}
    <div className="absolute bottom-0 left-8 transform translate-y-1/2">
      <img
        src={selectedPerson.avatar || 'https://via.placeholder.com/120'}
        alt={selectedPerson.name}
        className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
      />
    </div>
  </div>
              
              {/* Name and Specialties */}
              <div className="bg-white rounded-b-lg p-6 pt-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Dr. {selectedPerson.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      {selectedPerson.dentistry_types && selectedPerson.dentistry_types.length > 0 ? (
                        selectedPerson.dentistry_types.map((type, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-sm">
                          General Practice
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 gap-8">
              {/* Biography Section */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Biography</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedPerson.biography || 
                     `Dr. ${selectedPerson.name} is a dedicated dental professional committed to providing excellent patient care. With expertise in ${selectedPerson.dentistry_types?.join(', ') || 'general dentistry'}, Dr. ${selectedPerson.name} brings years of experience and a passion for helping patients achieve optimal oral health.`
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Education & Credentials Section */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Education & Credentials</h2>
                  <div className="space-y-6">
                    {selectedPerson.degree ? (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <GraduationCap className="h-5 w-5 text-gray-600 mt-1" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Degree</h3>
                          <p className="text-gray-600">{selectedPerson.degree}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <GraduationCap className="h-5 w-5 text-gray-600 mt-1" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">DDS</h3>
                          <p className="text-gray-600">Doctor of Dental Surgery degree from an accredited institution.</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-gray-600 mt-1" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Residency</h3>
                        <p className="text-gray-600">Completed residency training in dental practice.</p>
                      </div>
                    </div>

                    {selectedPerson.dentistry_types && selectedPerson.dentistry_types.length > 0 && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <GraduationCap className="h-5 w-5 text-gray-600 mt-1" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Specializations</h3>
                          <p className="text-gray-600">
                            Specialized training in {selectedPerson.dentistry_types.join(', ')}.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Section */}
              {/* <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    {selectedPerson.email && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Mail className="h-5 w-5 text-gray-600 mt-1" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Email</h3>
                          <p className="text-gray-600">{selectedPerson.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedPerson.address && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <AddressIcon className="h-5 w-5 text-gray-600 mt-1" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Address</h3>
                          <p className="text-gray-600">{selectedPerson.address}</p>
                        </div>
                      </div>
                    )}

                    {practice.phoneNumber && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Phone className="h-5 w-5 text-gray-600 mt-1" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Phone</h3>
                          <p className="text-gray-600">{practice.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for display
  const specialties = practice.tags || [];
  const hours = { today: "Open: 9:00 AM - 5:00 PM" }; // Default hours
  const services = (practice.tags || []).map((tag) => ({
    name: tag,
    description: `Professional ${tag.toLowerCase()} services provided by our experienced team.`,
  }));
  const overview = `${practice.name} is a highly-rated ${
    practice.type
  } practice located in the heart of ${
    practice.address?.split(",")[0] || "your area"
  }. With a rating of ${practice.rating} from ${
    practice.reviewCount
  } reviews, we are committed to providing exceptional care to our patients.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {practice?.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Photo Gallery */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {practice.photos && practice.photos.length > 0 ? (
                      <>
                        <Image
                          src={practice.photos[currentPhotoIndex]}
                          alt={`${practice.name} - Photo`}
                          width={800}
                          height={400}
                          className="w-full h-full object-cover"
                        />

                        {practice.photos.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                              onClick={prevPhoto}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                              onClick={nextPhoto}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {practice.photos.map((_, index) => (
                                <div
                                  key={index}
                                  onClick={() => setCurrentPhotoIndex(index)}
                                  className={cn(
                                    "w-2 h-2 rounded-full transition-colors cursor-pointer",
                                    index === currentPhotoIndex
                                      ? "bg-white"
                                      : "bg-white/50"
                                  )}
                                ></div>
                              ))}
                            </div>
                          </>
                        )}
                      
                        <div className="absolute top-4 left-4">
                          <OpenStatusBadge practice={practice} variant="compact" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                          <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No photos available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="people" onClick={fetchPeople}>People</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">
                        About {practice.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {overview}
                      </p>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-700 mb-2">
                            Type
                          </h4>
                          <p className="text-gray-700 capitalize">
                            {practice.type}
                          </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-700 mb-2">
                            Rating
                          </h4>
                          <div className="flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4 mr-1",
                                    i < Math.floor(practice.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-gray-700">
                              {practice?.rating.toFixed(1)} (
                              {practice.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Services</h3>
                      {services.length > 0 ? (
                        <div className="space-y-4">
                          {services.map((service, index) => (
                            <div
                              key={index}
                              className="border-b border-gray-200 pb-4 last:border-b-0"
                            >
                              <h4 className="font-medium text-gray-900 mb-2">
                                {service.name}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {service.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No specific services listed
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="people" className="mt-6">
  <Card>
    <CardContent className="p-6">
      <h3 className="text-xl font-semibold mb-6">Our Team</h3>
      {peopleLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading team members...</span>
        </div>
      ) : people.length > 0 ? (
        <div className="space-y-4">
          {people.map((person: Person) => (
            <div key={person.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="flex items-center space-x-4">
                {/* Avatar with improved styling */}
                <div className="relative">
                  <img
                    src={person.avatar || 'https://via.placeholder.com/60'}
                    alt={person.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                  />
                  {/* Optional online status indicator */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{person.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {person.dentistry_types && person.dentistry_types.length > 0 ? (
                      <p className="text-sm text-gray-600 font-medium">
                        {person.dentistry_types.join(' | ')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 font-medium">General Practice</p>
                    )}
                  </div>
                  {/* Add subtitle for additional context */}
                  <p className="text-xs text-gray-500 mt-1">
                    {person.degree || 'Doctor of Dental Surgery'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                {/* View Profile button */}
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleViewProfile(person)}
                  className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
                >
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h4>
          <p className="text-gray-500">No team members have been added to this practice yet.</p>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

                <TabsContent value="photos" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Photos</h3>
                      {practice.photos && practice.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {practice.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setCurrentPhotoIndex(index)}
                            >
                              <Image
                                src={photo}
                                alt={`${practice.name} - Photo ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">No photos available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <Card>
                <CardContent className="p-6">
                  <Link href={`/practice/${practiceId}/booking`}>
                    <Button className="w-full mb-4 bg-blue-600 hover:bg-blue-700">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book an appointment
                    </Button>
                  </Link>

                  {practice.website && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        window.open(
                          practice.website,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Website
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Contact Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Address
                      </h4>
                      <p className="text-gray-600 text-sm flex items-start gap-2 break-words">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {practice.address || "Address not available"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                      <p className="text-gray-600 text-sm">
                        {practice.phoneNumber || "Phone not available"}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Hours
                      </h4>
                      
                      {practice?.hours?.weekday_text && Array.isArray(practice.hours.weekday_text) ? (
                        <div className="space-y-2">
                          {practice.hours.weekday_text.map((hour:any, index:any) => {
                            // Safe parsing for dynamic data
                            const colonIndex = hour?.indexOf(':') || -1;
                            const day = colonIndex > -1 ? hour.substring(0, colonIndex).trim() : hour || 'Unknown';
                            const time = colonIndex > -1 ? hour.substring(colonIndex + 1).trim() : 'N/A';
                            const isOpen = time && time.toLowerCase() !== 'closed' && time !== 'N/A';
                            
                            return (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">{day}</span>
                                <span className={`text-sm ${isOpen ? 'text-gray-900' : 'text-red-600'}`}>
                                  {time}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Hours not available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Rating & Reviews
                  </h3>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(practice.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-lg">
                      {practice.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm">
                    Based on {practice.reviewCount || 0} reviews
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}