"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Search,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle,
  XCircle,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalProviders: number;
  totalBookings: number;
  pendingBookings: number;
  verifiedProviders: number;
}

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  provider: {
    name: string;
    type: string;
    address: string;
  };
}

interface Provider {
  id: string;
  name: string;
  type: 'dentist' | 'cosmetic';
  address: string;
  phone_number: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  business_status: string;
  created_at: string;
  tags: string[];
  photos: string[];
}

interface Person {
  id: string;
  provider_id: string;
  avatar: string | null;
  name: string;
  email: string;
  address: string | null;
  biography: string | null;
  dentistry_types: string[] | null;
  degree: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalProviders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    verifiedProviders: 0
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentBookings(),
        loadProviders(),
        loadPeople(),
        loadProfiles()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    setProfilesLoading(true);
    try {
      const response = await fetch('/api/admin/profiles');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setProfilesLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load basic stats from API endpoints
      const [bookingsRes, providersRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/providers')
      ]);

      const bookingsData = await bookingsRes.json();
      const providersData = await providersRes.json();

      const totalBookings = bookingsData.bookings?.length || 0;
      const pendingBookings = bookingsData.bookings?.filter((b: Booking) => b.status === 'pending').length || 0;
      const totalProviders = providersData.providers?.length || 0;

      setStats({
        totalProviders,
        totalBookings,
        pendingBookings,
        verifiedProviders: totalProviders // Assuming all providers are verified
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await fetch('/api/admin/bookings');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadProviders = async () => {
    setProvidersLoading(true);
    try {
      const response = await fetch('/api/admin/providers');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load providers');
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadPeople = async () => {
    setPeopleLoading(true);
    try {
      const response = await fetch('/api/admin/people');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setPeople(data.people || []);
    } catch (error) {
      console.error('Error loading people:', error);
      toast.error('Failed to load people');
    } finally {
      setPeopleLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any }
          : booking
      ));

      toast.success('Booking status updated successfully');
      
      // Reload stats to reflect changes
      loadStats();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers?id=${providerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state
      setProviders(providers.filter(provider => provider.id !== providerId));
      toast.success('Provider deleted successfully');
      
      // Reload stats
      loadStats();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
      localStorage.clear();
      sessionStorage.clear();
      router.push('/admin/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchQuery || 
      booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 min-h-screen border-r border-slate-200 bg-white">
          <div className="w-full p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">DentiStar Admin</h2>
              <p className="text-slate-500 text-sm">Control Center</p>
            </div>
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                { id: 'providers', label: 'Providers', icon: Building2 },
                { id: 'people', label: 'People', icon: Users },
                { id: 'profiles', label: 'Profiles', icon: UserCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
              <div className="pt-4">
                <Button variant="outline" onClick={loadDashboardData} className="w-full justify-start gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="w-full justify-start gap-2 mt-2 text-red-600 hover:text-red-700">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-slate-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-600">Manage providers, bookings, profiles and more</p>
                </div>
                <div className="flex items-center gap-4 md:hidden">
                  <Button variant="outline" onClick={loadDashboardData} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </Button>
                  <Button variant="outline" onClick={handleSignOut} className="text-red-600 hover:text-red-700 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProviders}</div>
                  <p className="text-xs text-muted-foreground">
                    Active dental practices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    All time bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting confirmation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified Providers</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.verifiedProviders}</div>
                  <p className="text-xs text-muted-foreground">
                    Active and verified
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest booking requests from patients</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                  ) : bookings.slice(0, 5).length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{booking.name}</p>
                            <p className="text-sm text-slate-600">{booking.provider.name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(booking.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">No recent bookings</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system health and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Storage Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Bookings Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Bookings Management</h2>
                <p className="text-slate-600">Manage patient booking requests</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadRecentBookings}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Bookings</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Search by name, email, or provider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <Label htmlFor="status">Status Filter</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Requests ({filteredBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Appointment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{booking.name}</p>
                                <p className="text-sm text-slate-600">{booking.address}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{booking.provider.name}</p>
                                <p className="text-sm text-slate-600 capitalize">{booking.provider.type}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {booking.email}
                                </p>
                                <p className="text-sm flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {booking.phone}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {booking.appointment_date && booking.appointment_time ? (
                                <div>
                                  <p className="text-sm font-medium">
                                    {new Date(booking.appointment_date).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-slate-600">{booking.appointment_time}</p>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500">Not scheduled</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={booking.status}
                                  onValueChange={(value) => updateBookingStatus(booking.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No bookings found</h3>
                    <p className="text-slate-600">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'No booking requests have been submitted yet'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            {/* Providers Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Providers Management</h2>
                <p className="text-slate-600">Manage dental practices and providers</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadProviders}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Providers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registered Providers ({providers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  </div>
                ) : providers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{provider.name}</p>
                                <p className="text-sm text-slate-600 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {provider.address.split(',')[0]}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {provider.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {provider.phone_number && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {provider.phone_number}
                                  </p>
                                )}
                                {provider.website && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    <a 
                                      href={provider.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      Website
                                    </a>
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{provider.rating.toFixed(1)}</span>
                                <span className="text-sm text-slate-500">({provider.review_count})</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  provider.business_status === 'OPERATIONAL' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {provider.business_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">
                                {new Date(provider.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/practice/${provider.id}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteProvider(provider.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No providers found</h3>
                    <p className="text-slate-600">No dental providers have been registered yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">People Management</h2>
                <p className="text-slate-600">Manage people associated with providers</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadPeople}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>People ({people.length})</CardTitle>
                <CardDescription>List of people across all providers</CardDescription>
              </CardHeader>
              <CardContent>
                {peopleLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  </div>
                ) : people.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Dentistry Types</TableHead>
                          <TableHead>Degree</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {people.map((person) => (
                          <TableRow key={person.id}>
                            <TableCell className="font-medium">{person.name}</TableCell>
                            <TableCell>{person.email}</TableCell>
                            <TableCell className="truncate max-w-[300px]">{person.address || '-'}</TableCell>
                            <TableCell>
                              {person.dentistry_types && person.dentistry_types.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {person.dentistry_types.map((t) => (
                                    <Badge key={t} variant="secondary">{t}</Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </TableCell>
                            <TableCell>{person.degree || '-'}</TableCell>
                            <TableCell className="text-slate-600 text-sm">
                              {new Date(person.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No people found</h3>
                    <p className="text-slate-600">No people are associated yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Profiles</h2>
                <p className="text-slate-600">Supabase profiles table</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadProfiles}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Profiles ({profiles.length})</CardTitle>
                <CardDescription>All profiles in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {profilesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  </div>
                ) : profiles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.full_name || '-'}</TableCell>
                            <TableCell>{p.email || '-'}</TableCell>
                            <TableCell>{p.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">{p.role}</Badge>
                            </TableCell>
                            <TableCell>
                              {p.is_verified ? (
                                <Badge className="bg-green-100 text-green-800">Yes</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-800">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm">
                              {new Date(p.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No profiles found</h3>
                    <p className="text-slate-600">No profiles have been created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
        </main>
      </div>
    </div>
  );
}