"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Calendar,
  Building2,
  LogOut,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Star,
  Globe,
  User
} from "lucide-react";
import LogoIcon from "@/assets/Icons/LogoIcon";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
}

interface Provider {
  id: string;
  name: string;
  type: string;
  address: string;
  phone_number: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  business_status: string;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string;
  created_at: string;
  provider: {
    name: string;
    type: string;
  } | null;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("providers");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createSupabaseClient();

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/admin/login");
          return;
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_verified, full_name, email')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin' || !profile.is_verified) {
          await supabase.auth.signOut();
          toast.error("Access denied. Admin privileges required.");
          router.push("/admin/login");
          return;
        }

        setUser({
          id: user.id,
          email: user.email || profile.email || '',
          role: profile.role,
          full_name: profile.full_name
        });

      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, [router, supabase]);

  // Fetch data based on active tab
  useEffect(() => {
    if (user && activeTab) {
      fetchData(activeTab);
    }
  }, [user, activeTab]);

  const fetchData = async (tab: string) => {
    setDataLoading(true);
    try {
      switch (tab) {
        case "providers":
          await fetchProviders();
          break;
        case "bookings":
          await fetchBookings();
          break;
        case "profiles":
          await fetchProfiles();
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      toast.error(`Failed to load ${tab}`);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchProviders = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    setProviders(data || []);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        provider:providers(name, type)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    setBookings(data || []);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    setProfiles(data || []);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const toggleUserVerification = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchProfiles();
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification status");
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', providerId);

      if (error) throw error;

      toast.success("Provider deleted successfully");
      fetchProviders();
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Failed to delete provider");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: "providers", label: "Providers", icon: Building2, count: providers.length },
    { id: "bookings", label: "Bookings", icon: Calendar, count: bookings.length },
    { id: "profiles", label: "Profiles", icon: Users, count: profiles.length },
  ];

  const renderProvidersTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Provider</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Rating</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <div>
                  <div className="font-medium text-gray-900">{provider.name}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {provider.address.split(',').slice(0, 2).join(', ')}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant={provider.type === 'dentist' ? 'default' : 'secondary'}>
                  {provider.type}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  {provider.phone_number && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {provider.phone_number}
                    </div>
                  )}
                  {provider.website && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="font-medium">{provider.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500 ml-1">({provider.review_count})</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant={provider.business_status === 'OPERATIONAL' ? 'default' : 'secondary'}>
                  {provider.business_status}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/practice/${provider.id}`, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProvider(provider.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBookingsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Patient</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Provider</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Appointment</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <div>
                  <div className="font-medium text-gray-900">{booking.name}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {booking.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {booking.phone}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div>
                  <div className="font-medium text-gray-900">
                    {booking.provider?.name || 'Unknown Provider'}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {booking.provider?.type || 'Unknown'}
                  </Badge>
                </div>
              </td>
              <td className="py-4 px-4">
                {booking.appointment_date && booking.appointment_time ? (
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(booking.appointment_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">{booking.appointment_time}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">Not scheduled</span>
                )}
              </td>
              <td className="py-4 px-4">
                <select
                  value={booking.status}
                  onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600">
                  {new Date(booking.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const mailtoLink = `mailto:${booking.email}?subject=Regarding your appointment&body=Dear ${booking.name},%0D%0A%0D%0A`;
                      window.open(mailtoLink);
                    }}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProfilesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Verification</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {profile.full_name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">ID: {profile.user_id.slice(0, 8)}...</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  {profile.email && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {profile.email}
                    </div>
                  )}
                  {profile.phone && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {profile.phone}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge 
                  variant={profile.role === 'admin' ? 'default' : profile.role === 'provider' ? 'secondary' : 'outline'}
                >
                  {profile.role}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  {profile.is_verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${profile.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600">
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserVerification(profile.id, profile.is_verified)}
                    className={profile.is_verified ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                  >
                    {profile.is_verified ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <LogoIcon />
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-900">Admin Panel</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.full_name || 'Admin User'}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage providers, bookings, and user profiles</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Card key={tab.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(tab.id)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{tab.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
                      </div>
                      <div className={`p-3 rounded-full ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    <Badge variant="secondary" className="ml-2">
                      {tab.count}
                    </Badge>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {tabs.find(tab => tab.id === activeTab)?.icon && (
                  <tabs.find(tab => tab.id === activeTab)!.icon className="h-5 w-5" />
                )}
                {tabs.find(tab => tab.id === activeTab)?.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(activeTab)}
                disabled={dataLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  <span className="ml-3 text-gray-600">Loading {activeTab}...</span>
                </div>
              ) : (
                <>
                  {activeTab === "providers" && (
                    <>
                      {providers.length === 0 ? (
                        <div className="text-center py-12">
                          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                          <p className="text-gray-500">No dental providers have been added to the system yet.</p>
                        </div>
                      ) : (
                        renderProvidersTable()
                      )}
                    </>
                  )}

                  {activeTab === "bookings" && (
                    <>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                          <p className="text-gray-500">No appointment bookings have been made yet.</p>
                        </div>
                      ) : (
                        renderBookingsTable()
                      )}
                    </>
                  )}

                  {activeTab === "profiles" && (
                    <>
                      {profiles.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
                          <p className="text-gray-500">No user profiles have been created yet.</p>
                        </div>
                      ) : (
                        renderProfilesTable()
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}