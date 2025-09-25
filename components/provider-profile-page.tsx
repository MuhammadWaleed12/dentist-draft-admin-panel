"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Save, 
  MapPin, 
  Phone, 
  Globe, 
  X, 
  ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Shield,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import LogoIcon from '@/assets/Icons/LogoIcon';


// Provider interface based on database schema
interface Provider {
  id: string;
  name: string;
  type: 'dentist' | 'cosmetic';
  address: string;
  phone_number: string | null;
  website: string | null;
  tags: string[];
  photos: string[];
  rating: number;
  zipCode?: string;  
  review_count: number;
  business_status: string;
  opening_hours: any;
}

// Upload progress interface
interface UploadProgress {
  [key: string]: number;
}

// Image upload utility functions
const imageUtils = {
  validateFile: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 10MB' };
    }
    
    return { valid: true };
  },

  generateFileName: (userId: string, originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${userId}/${timestamp}-${randomString}.${extension}`;
  },

  compressImage: async (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Fixed: Use HTMLImageElement instead of conflicting with Next.js Image
      const img = document.createElement('img');
      
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Fixed: Added null check for ctx
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        // Fallback: return original file if compression fails
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
};

export function ProviderProfilePage() {
  const { 
    user, 
    loading: authLoading, 
    isVerified, 
    verificationStatus, 
    refreshVerificationStatus,
    signOut 
  } = useAuth();
  console.log(verificationStatus)
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createSupabaseClient();

  // Form state - matches database schema
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    website: '',
    tags: [] as string[],
    photos: [] as string[]
  });

  // Load provider data
  const fetchProviderData = useCallback(async () => {
    if (!user || !isVerified) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/provider/profile');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.provider) {
        setProvider(data.provider);
        setFormData({
          name: data.provider.name || '',
          address: data.provider.address || '',
          phone_number: data.provider.phone_number || '',
          website: data.provider.website || '',
          tags: data.provider.tags || [],
          photos: data.provider.photos || []
        });
      }
      
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast.error('Failed to load provider data');
    } finally {
      setLoading(false);
    }
  }, [user, isVerified]);

  // Check authentication and load provider data
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error('Please login to access this page');
      window.location.href = '/login';
      return;
    }

    // Only fetch provider data if user is verified
    if (isVerified) {
      fetchProviderData();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, isVerified, fetchProviderData]);

  // Handle verification status refresh
  const handleRefreshVerification = async () => {
    setRefreshing(true);
    try {
      await refreshVerificationStatus();
      toast.info('Verification status updated');
    } catch (error) {
      toast.error('Failed to refresh verification status');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Upload single image to Supabase Storage
  const uploadImageToSupabase = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const validation = imageUtils.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const compressedFile = await imageUtils.compressImage(file);
    const fileName = imageUtils.generateFileName(user.id, file.name);
    
    const { data, error } = await supabase.storage
      .from('provider-photos')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('provider-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Handle multiple image uploads
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const fileNames = fileArray.map(f => f.name);
    
    setUploadingFiles(fileNames);
    
    try {
      const uploadPromises = fileArray.map(async (file) => {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: Math.min((prev[file.name] || 0) + 20, 90)
            }));
          }, 200);

          const url = await uploadImageToSupabase(file);
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          
          return url;
        } catch (error) {
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUploads = uploadedUrls.filter(url => url !== null);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...successfulUploads]
      }));
      
      toast.success(`${successfulUploads.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setTimeout(() => {
        setUploadingFiles([]);
        setUploadProgress({});
      }, 2000);
    }

    event.target.value = '';
  };

  // Delete image from Supabase Storage
  const deleteImageFromSupabase = async (imageUrl: string): Promise<void> => {
    if (!user) return;

    try {
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      const fileName = pathSegments[pathSegments.length - 1];
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('provider-photos')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image from storage:', error);
      }
    } catch (error) {
      console.error('Error parsing image URL for deletion:', error);
    }
  };

  // Remove image from form and storage
  const removeImage = async (index: number) => {
    const imageUrl = formData.photos[index];
    
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));

    try {
      await deleteImageFromSupabase(imageUrl);
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
    }
  };

  // Save provider profile
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Practice name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      
      if (data.provider) {
        setProvider(data.provider);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Add specialty tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      handleInputChange('tags', [...formData.tags, trimmedTag]);
    }
  };

  // Remove specialty tag
  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };
  

  // Show loading while checking auth or verification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please login to access this page</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show verification pending message for unverified providers
  if (verificationStatus === 'unverified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <LogoIcon />
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Verification Pending
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Your provider account is awaiting verification
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Account Under Review</p>
                    <p>
                      We're currently verifying your dental practice credentials. 
                      This process typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">What happens next:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    Our team reviews your practice information
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    We verify your dental license and credentials
                  </div>
               
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    Full access to your provider dashboard
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Need Help?</p>
                    <p>
                      Contact our support team at{' '}
                      <a href="mailto:support@dentistarguide.com" className="underline">
                        support@dentistarguide.com
                      </a>{' '}
                      if you have any questions about the verification process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRefreshVerification}
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Checking...' : 'Check Status'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show provider not found message
  if (verificationStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <LogoIcon />
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Account Not Found
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  No provider account found for this email
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Subscription Required</p>
                  <p>
                    This portal is for subscribed dental providers only. 
                    Please contact us to subscribe to DentiStar Guide services.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open('mailto:sales@dentistarguide.com', '_blank')}
                >
                  Contact Sales
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading if we're verified but still loading provider data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider data...</p>
        </div>
      </div>
    );
  }

  // Main provider profile form (only shows for verified users)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
         

          {/* Main Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Practice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Practice Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter practice name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="(555) 123-4567"
                    type="tel"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Practice Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website" className="text-sm font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourpractice.com"
                    type="url"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Specialties/Tags */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Specialties & Services</Label>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                  {formData.tags.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No specialties added yet</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add specialty (e.g., General Dentistry, Orthodontics)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addTag(input.value);
                        input.value = '';
                      }
                    }}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Press Enter to add. Click on tags to remove them.
                </p>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Practice Photos</Label>
                  <Badge variant="outline" className="text-xs">
                    {formData.photos.length}/20 photos
                  </Badge>
                </div>

                {/* Upload Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploadingFiles.length > 0 || formData.photos.length >= 20}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-3 bg-blue-50 rounded-full">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadingFiles.length > 0 ? 'Uploading...' : 'Upload Photos'}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WebP up to 10MB each
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Upload Progress */}
                {uploadingFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading {uploadingFiles.length} file(s)...</p>
                    {uploadingFiles.map((fileName) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate">{fileName}</span>
                          <span>
                            {uploadProgress[fileName] === -1 ? (
                              <span className="text-red-500">Failed</span>
                            ) : uploadProgress[fileName] === 100 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              `${uploadProgress[fileName] || 0}%`
                            )}
                          </span>
                        </div>
                        <Progress 
                          value={uploadProgress[fileName] === -1 ? 100 : (uploadProgress[fileName] || 0)}
                          className={`h-2 ${uploadProgress[fileName] === -1 ? 'bg-red-100' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo Grid */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative overflow-hidden rounded-lg border bg-gray-100">
                          <Image
                            src={photo}
                            alt={`Practice photo ${index + 1}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.photos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No photos uploaded yet</p>
                    <p className="text-sm">Add photos to showcase your practice</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-between items-center pt-6 border-t">
                <p className="text-sm text-gray-500">
                  * Required fields
                </p>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.name.trim() || uploadingFiles.length > 0}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}