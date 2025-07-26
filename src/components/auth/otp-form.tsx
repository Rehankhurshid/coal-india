"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";

interface OtpFormProps {
  sessionId: string;
  employeeId: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function OtpForm({ sessionId, employeeId, onSuccess, onBack }: OtpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otpValue.length === 6) {
      handleSubmit();
    }
  }, [otpValue]);

  // Generate session token
  const generateSessionToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Get development OTP on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const otpData = localStorage.getItem(`otp_${sessionId}`);
      if (otpData) {
        try {
          const parsed = JSON.parse(otpData);
          setDevelopmentOtp(parsed.otp);
          console.log(`OTP for ${employeeId}: ${parsed.otp}`);
        } catch (e) {
          console.error('Failed to parse OTP data:', e);
        }
      }
    }
  }, [sessionId, employeeId]);

  const handleSubmit = async () => {
    if (otpValue.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    if (!/^\d{6}$/.test(otpValue)) {
      setError('OTP must contain only numbers');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get stored OTP data
      const otpData = localStorage.getItem(`otp_${sessionId}`);
      if (!otpData) {
        throw new Error('OTP session not found. Please request a new OTP.');
      }

      const parsed = JSON.parse(otpData);

      // Check if OTP is expired
      if (Date.now() > parsed.expiresAt) {
        throw new Error('OTP has expired. Please request a new one.');
      }

      // Verify OTP
      if (otpValue !== parsed.otp) {
        throw new Error('Invalid OTP. Please try again.');
      }

      // Mark OTP as verified
      parsed.verified = true;
      localStorage.setItem(`otp_${sessionId}`, JSON.stringify(parsed));

      // Create session token
      const sessionToken = generateSessionToken();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

      // Store session
      localStorage.setItem('auth_session', JSON.stringify({
        token: sessionToken,
        employeeId,
        expiresAt
      }));

      // Clean up OTP data
      localStorage.removeItem(`otp_${sessionId}`);

      onSuccess();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate new OTP
      const newOtp = process.env.NODE_ENV === 'development' ? '123456' : 
        Math.floor(100000 + Math.random() * 900000).toString();

      // Update stored OTP data
      const otpData = localStorage.getItem(`otp_${sessionId}`);
      if (otpData) {
        const parsed = JSON.parse(otpData);
        parsed.otp = newOtp;
        parsed.expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        parsed.verified = false;
        localStorage.setItem(`otp_${sessionId}`, JSON.stringify(parsed));

        if (process.env.NODE_ENV === 'development') {
          setDevelopmentOtp(newOtp);
          console.log(`New OTP for ${employeeId}: ${newOtp}`);
        }

        // Reset timer
        setTimeLeft(300);
        setCanResend(false);
        setOtpValue("");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSkip = () => {
    if (process.env.NODE_ENV === 'development') {
      const sessionToken = generateSessionToken();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

      localStorage.setItem('auth_session', JSON.stringify({
        token: sessionToken,
        employeeId,
        expiresAt
      }));

      localStorage.removeItem(`otp_${sessionId}`);
      onSuccess();
    }
  };

  const handleDevTest = () => {
    if (process.env.NODE_ENV === 'development') {
      setOtpValue("000000");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Verify OTP</h2>
        <p className="text-gray-600">
          Enter the 6-digit code sent to your registered mobile number
        </p>
        <p className="text-sm text-gray-500">Employee ID: {employeeId}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Development OTP Display */}
      {process.env.NODE_ENV === 'development' && developmentOtp && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <div className="text-sm font-medium">Development OTP: {developmentOtp}</div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-center block">
            Enter 6-digit OTP
          </Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-600">
              OTP expires in {formatTime(timeLeft)}
            </p>
          ) : (
            <p className="text-sm text-red-600">OTP has expired</p>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          disabled={isLoading || timeLeft === 0 || otpValue.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </Button>
      </div>

      {/* Resend OTP */}
      <div className="text-center space-y-4">
        {canResend ? (
          <Button
            variant="outline"
            onClick={handleResendOtp}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Resend OTP
          </Button>
        ) : (
          <p className="text-sm text-gray-500">
            Didn't receive the code? You can resend in {formatTime(timeLeft)}
          </p>
        )}
      </div>

      {/* Development Controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs text-gray-500 text-center">Development Controls</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDevSkip}
              className="flex-1"
            >
              Skip OTP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDevTest}
              className="flex-1"
            >
              Fill Test OTP
            </Button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Button>
    </div>
  );
}
