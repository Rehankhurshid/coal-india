"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  employeeId: z.string()
    .min(1, "Employee ID is required")
    .regex(/^[A-Za-z0-9]+$/, "Employee ID must contain only letters and numbers")
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (sessionId: string, employeeId: string, phoneNumber: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Find employee in Supabase
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('emp_code, name, phone_1, phone_2')
        .eq('emp_code', data.employeeId.toUpperCase())
        .single();

      if (employeeError || !employee) {
        throw new Error('Employee not found. Please check your Employee ID.');
      }

      // Validate phone number exists
      const phoneNumber = employee.phone_1 || employee.phone_2;
      if (!phoneNumber) {
        throw new Error('No phone number found for this employee. Please contact HR.');
      }

      // Validate Indian phone number format
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Invalid phone number format. Please contact HR.');
      }

      // Generate OTP and session ID
      const sessionId = generateSessionId();
      const otp = generateOTP();

      // In development, we'll simulate the OTP storage
      // In production, this would be stored in a secure backend
      localStorage.setItem(`otp_${sessionId}`, JSON.stringify({
        otp,
        employeeId: employee.emp_code,
        phoneNumber: phoneNumber,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        verified: false
      }));

      // In development, show OTP in console
      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${employee.emp_code}: ${otp}`);
      }

      // Simulate SMS sending (in production, integrate with SMS service)
      await simulateSMSSending(phoneNumber, otp);

      onSuccess(sessionId, employee.emp_code, phoneNumber);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Employee ID
        </Label>
        <div className="relative group">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 h-5 w-5 transition-colors" />
          <Input
            id="employeeId"
            {...register("employeeId")}
            placeholder="Enter your employee ID"
            className="pl-10 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            disabled={isLoading}
          />
        </div>
        {errors.employeeId && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
            {errors.employeeId.message}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending verification code...
          </>
        ) : (
          <>
            <span>Send Verification Code</span>
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </Button>
    </form>
  );
}

// Utility functions
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateOTP(): string {
  if (process.env.NODE_ENV === 'development') {
    return '123456'; // Fixed OTP for development
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function simulateSMSSending(phoneNumber: string, otp: string): Promise<void> {
  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`SMS sent to ${phoneNumber}: Your SECL Directory OTP is ${otp}. Valid for 5 minutes.`);
  }
  
  // In production, integrate with SMS service like Twilio:
  // await twilioClient.messages.create({
  //   body: `Your SECL Directory OTP is ${otp}. Valid for 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: `+91${phoneNumber}`
  // });
}
