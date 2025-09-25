"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data returned");
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_verified')
        .eq('user_id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found");
      }

      if (profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      if (!profile.is_verified) {
        await supabase.auth.signOut();
        throw new Error("Admin account not verified. Contact system administrator.");
      }

      toast.success("Welcome to the admin panel!");
      router.push("/admin");

    } catch (error) {
      console.error("Admin login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-white text-2xl font-bold">DentiStar Admin</div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl">
              <Shield className="h-8 w-8" />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Sign in to access the administrative dashboard
              </CardDescription>
            </div>

            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-red-100 text-red-800 border border-red-200">
              <Shield className="w-4 h-4 mr-2" />
              Authorized Personnel Only
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@dentistarguide.com"
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-3" />
                    Sign In to Admin Panel
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                🔒 Secure admin authentication for DentiStar Guide
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-white/50">
          <p>
            For technical support, contact{" "}
            <a href="mailto:tech@dentistarguide.com" className="text-white/70 hover:text-white">
              tech@dentistarguide.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}