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
      // Import ClientAuthService at the top of the file
      const { ClientAuthService } = await import('@/lib/auth/client-auth');
      
      // Use ClientAuthService to verify OTP and store session
      const result = await ClientAuthService.verifyOTP(sessionId, otpValue);

      if (!result.success) {
        throw new Error(result.message || 'OTP verification failed');
      }

      // Session is now stored, redirect to home
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

  // Development mode: Skip OTP
  const handleSkipOtp = async () => {
    if (process.env.NODE_ENV !== 'development') return
    
    console.log('[OTP] Development mode: Skipping OTP verification')
    
    setIsLoading(true);
    setError(null);

    try {
      // Import ClientAuthService
      const { ClientAuthService } = await import('@/lib/auth/client-auth');
      
      // Use ClientAuthService to verify OTP and store session
      const result = await ClientAuthService.verifyOTP(sessionId, '123456');

      if (!result.success) {
        throw new Error(result.message || 'Development skip failed');
      }

      console.log('[OTP] Development: Skipped OTP verification')
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip OTP');
    } finally {
      setIsLoading(false);
    }
  }

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
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm animate-in fade-in-0 slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      {/* Development OTP Display */}
      {process.env.NODE_ENV === 'development' && developmentOtp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg backdrop-blur-sm">
          <div className="font-medium">Development OTP: {developmentOtp}</div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center block">
            Enter Verification Code
          </Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              disabled={isLoading}
              className="gap-3"
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot index={0} className="w-14 h-14 text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 transform hover:scale-105 focus:scale-105 transition-all duration-200 ease-out shadow-sm hover:shadow-md focus:shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-0" />
                <InputOTPSlot index={1} className="w-14 h-14 text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 transform hover:scale-105 focus:scale-105 transition-all duration-200 ease-out shadow-sm hover:shadow-md focus:shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75" />
                <InputOTPSlot index={2} className="w-14 h-14 text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 transform hover:scale-105 focus:scale-105 transition-all duration-200 ease-out shadow-sm hover:shadow-md focus:shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150" />
                <InputOTPSlot index={3} className="w-14 h-14 text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 transform hover:scale-105 focus:scale-105 transition-all duration-200 ease-out shadow-sm hover:shadow-md focus:shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-225" />
                <InputOTPSlot index={4} className="w-14 h-14 text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 transform hover:scale-105 focus:scale-105 transition-all duration-200 ease-out shadow-sm hover:shadow-md focus:shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300" />
                <InputOTPSlot index={5} className="w-14 h-14 text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 transform hover:scale-105 focus:scale-105 transition-all duration-200 ease-out shadow-sm hover:shadow-md focus:shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-375" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 transition-all duration-300">
              <svg className={`w-4 h-4 ${timeLeft <= 60 ? 'animate-pulse text-orange-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span className={timeLeft <= 60 ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}>
                Code expires in {formatTime(timeLeft)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-1 animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4" y1="4" x2="20" y2="20"></line>
              </svg>
              Verification code expired
            </p>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          className={`w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 ${
            isLoading ? 'animate-pulse' : ''
          } ${otpValue.length === 6 && !isLoading ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
          disabled={isLoading || timeLeft === 0 || otpValue.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Verifying your identity...
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* Resend OTP */}
      <div className="text-center">
        {canResend ? (
          <Button
            variant="outline"
            onClick={handleResendOtp}
            disabled={isLoading}
            className="h-10 px-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 hover:scale-105 transform"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Resend Code
          </Button>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the code? Resend available in {formatTime(timeLeft)}
          </p>
        )}
      </div>

      {/* Development Controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs text-gray-500 text-center">Dev Controls</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
                              onClick={handleSkipOtp}
              className="flex-1 text-xs"
            >
              Skip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDevTest}
              className="flex-1 text-xs"
            >
              Fill Test
            </Button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full h-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Login
      </Button>
    </div>
  );
}
