"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Fingerprint, CreditCard } from "lucide-react";
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="employeeId" className="text-sm font-medium">
          Employee ID
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="employeeId"
            {...register("employeeId")}
            placeholder="Enter your Employee ID"
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.employeeId && (
          <p className="text-sm text-red-600">{errors.employeeId.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          'Send OTP'
        )}
      </Button>

      {/* Placeholder buttons for future features */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Alternative methods (Coming Soon)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Biometric
          </Button>
          <Button variant="outline" disabled className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Smart Card
          </Button>
        </div>
      </div>
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
