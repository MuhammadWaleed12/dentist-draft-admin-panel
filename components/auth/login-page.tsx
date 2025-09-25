"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
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
import { Phone, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import LogoIcon from "@/assets/Icons/LogoIcon";
import { toast } from "sonner";
import PhoneField from "@/components/ui/phone-field"; 

// Validation functions
const validatePhone = (phone: string): string | null => {
  if (!phone || phone.length < 10) {
    return "Please enter a valid phone number";
  }
  return null;
};

const validateOtp = (otp: string): string | null => {
  if (!otp || otp.length !== 6) {
    return "Please enter a 6-digit verification code";
  }
  return null;
};

const formatPhone = (phone: string): string => {
  return  `+${phone}`;
};

// Component for phone input form
const PhoneForm = ({
  phone,
  setPhone,
  onSubmit,
  loading,
}: {
  phone: string;
  setPhone: (phone: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="phone">Phone Number</Label>
      <PhoneField
        value={phone}
        onChange={(value: string) => setPhone(value)}
        disabled={loading}
        placeholder="Enter phone number"
        inputStyle={{
          width: '100%',
          height: '48px',
          fontSize: '18px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          paddingLeft: '58px', // Increased padding to show the + sign
        }}
        containerStyle={{
          width: '100%',
        }}
        buttonStyle={{
          border: '1px solid #d1d5db',
          borderRadius: '6px 0 0 6px',
          backgroundColor: '#f9fafb',
          width: '50px', // Fixed width for country selector
        }}
        dropdownStyle={{
          borderRadius: '6px',
          border: '1px solid #d1d5db',
        }}
      />
      <p className="text-xs text-gray-500">
        Select your country and enter your phone number
      </p>
    </div>
    <Button
      type="submit"
      disabled={loading || !phone}
      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
          Sending Code...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Phone className="w-5 h-5 mr-3" />
          Send Verification Code
        </div>
      )}
    </Button>
  </form>
);

// Component for OTP verification form
const OtpForm = ({
  phone,
  otp,
  setOtp,
  onVerify,
  onResend,
  otpLoading,
  resendLoading,
}: {
  phone: string;
  otp: string;
  setOtp: (otp: string) => void;
  onVerify: (e: React.FormEvent) => void;
  onResend: () => void;
  otpLoading: boolean;
  resendLoading: boolean;
}) => (
  <form onSubmit={onVerify} className="space-y-6">
    <div className="text-center bg-blue-50 rounded-lg p-4">
      <p className="text-sm text-blue-600">Code sent to:</p>
      <p className="font-medium text-blue-800">{phone}</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="otp" className="text-center block">
        Verification Code
      </Label>
      <Input
        id="otp"
        type="text"
        placeholder="000000"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={otpLoading}
        className="h-14 text-center text-2xl tracking-widest font-mono"
        maxLength={6}
        autoComplete="one-time-code"
      />
      <p className="text-xs text-gray-500 text-center">
        Enter the 6-digit code from your SMS
      </p>
    </div>

    <div className="space-y-3">
      <Button
        type="submit"
        disabled={otpLoading || otp.length !== 6}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {otpLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Verifying...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Verify & Sign In
          </div>
        )}
      </Button>

      <Button
        type="button"
        onClick={onResend}
        variant="outline"
        disabled={resendLoading}
        className="w-full"
      >
        {resendLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : (
          "Resend Code"
        )}
      </Button>
    </div>
  </form>
);

// Benefits section component
const PracticeBenefits = () => (
  <div className="space-y-3 pt-4 border-t">
    <h4 className="font-medium text-gray-900 text-center">
      Manage Your Practice:
    </h4>
    <div className="space-y-2 text-sm text-gray-600">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
        Update practice information and photos
      </div>
      <div className="flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
        Access DentiStar mapping features
      </div>
    </div>
  </div>
);

export default function LoginPage() {
  const { signInWithPhone, verifyOtp, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔍 Starting phone sign in with:", phone);

    const phoneError = validatePhone(phone);
    if (phoneError) {
      console.log("❌ Phone validation failed:", phone);
      toast.error(phoneError);
      return;
    }

    const formattedPhone = formatPhone(phone);
    console.log("📱 Formatted phone:", formattedPhone);

    try {
      console.log("📤 Calling signInWithPhone...");
      const result = await signInWithPhone(formattedPhone);

      console.log("📥 SignInWithPhone result:", result);

      if (result.error) {
        console.log("❌ Error in signInWithPhone:", result.error);
        toast.error(result.error.message || "Failed to send verification code");
        return;
      }

      console.log("✅ OTP sent successfully, showing OTP form");
      setShowOtpForm(true);
      toast.success(`Verification code sent to ${phone}`);
    } catch (error) {
      console.error("💥 Phone sign in error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔍 Starting OTP verification with:", otp);

    const otpError = validateOtp(otp);
    if (otpError) {
      console.log("❌ OTP validation failed:", otp);
      toast.error(otpError);
      return;
    }

    const formattedPhone = formatPhone(phone);
    console.log("📱 Verifying OTP for phone:", formattedPhone);

    setOtpLoading(true);

    try {
      console.log("📤 Calling verifyOtp...");
      const result = await verifyOtp(formattedPhone, otp);

      console.log("📥 VerifyOtp result:", result);

      if (result.error) {
        console.log("❌ OTP verification failed:", result.error);
        toast.error(
          result.error.message || "Invalid verification code. Please try again."
        );
        setOtp("");
        return;
      }

      console.log("✅ OTP verified successfully");
      toast.success("Phone verified successfully! Redirecting...");
    } catch (error) {
      console.error("💥 OTP verification error:", error);
      toast.error("An unexpected error occurred");
      setOtp("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    console.log("🔄 Resending OTP...");
    setResendLoading(true);

    const formattedPhone = formatPhone(phone);

    try {
      const result = await signInWithPhone(formattedPhone);

      if (result.error) {
        toast.error("Failed to resend code. Please try again.");
      } else {
        toast.success("New verification code sent!");
        setOtp("");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    console.log("🔄 Resetting phone auth form");
    setShowOtpForm(false);
    setOtp("");
    setPhone("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <LogoIcon />
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
              {showOtpForm ? "🔐" : "🦷"}
            </div>

            <div>
              <CardTitle className="text-2xl font-bold">
                {showOtpForm
                  ? "Verify Your Phone"
                  : "DentiStar Provider Portal"}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {showOtpForm
                  ? "Enter the 6-digit code sent to your phone"
                  : "Sign in with your phone number to manage your dental practice profile"}
              </CardDescription>
            </div>

            {!showOtpForm && (
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                For Subscribed Providers Only
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {showOtpForm ? (
              <OtpForm
                phone={phone}
                otp={otp}
                setOtp={setOtp}
                onVerify={handleOtpVerification}
                onResend={handleResendOtp}
                otpLoading={otpLoading}
                resendLoading={resendLoading}
              />
            ) : (
              <PhoneForm
                phone={phone}
                setPhone={setPhone}
                onSubmit={handlePhoneSignIn}
                loading={loading}
              />
            )}

            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
              Debug: showOtpForm = {showOtpForm.toString()}, loading ={" "}
              {loading.toString()}
            </div>

            {!showOtpForm && <PracticeBenefits />}

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                🔒 Secure phone verification for dental providers
              </p>
            </div>
          </CardContent>
        </Card>

        {!showOtpForm && (
          <div className="text-center mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Not subscribed yet?</strong>
                <br />
                Contact us to get access to DentiStar Guide's provider features
              </p>
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-400">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-blue-400 hover:text-blue-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}