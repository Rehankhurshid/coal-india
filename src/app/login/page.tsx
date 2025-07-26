"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { OtpForm } from "@/components/auth/otp-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

interface LoginState {
  step: 'login' | 'otp';
  sessionId?: string;
  employeeId?: string;
  phoneNumber?: string;
}

export default function LoginPage() {
  const [loginState, setLoginState] = useState<LoginState>({ step: 'login' });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleLoginSuccess = (sessionId: string, employeeId: string, phoneNumber: string) => {
    setLoginState({
      step: 'otp',
      sessionId,
      employeeId,
      phoneNumber
    });
  };

  const handleOtpSuccess = () => {
    // Redirect to main directory
    window.location.href = '/';
  };

  const handleBackToLogin = () => {
    setLoginState({ step: 'login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SECL Directory</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">South Eastern Coalfields Limited</p>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>
              {loginState.step === 'login' ? 'Employee Login' : 'Verify OTP'}
            </CardTitle>
            <CardDescription>
              {loginState.step === 'login' 
                ? 'Enter your employee ID to continue'
                : `Enter the OTP sent to ${loginState.phoneNumber?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginState.step === 'login' ? (
              <LoginForm onSuccess={handleLoginSuccess} />
            ) : (
              <OtpForm
                sessionId={loginState.sessionId!}
                employeeId={loginState.employeeId!}
                onSuccess={handleOtpSuccess}
                onBack={handleBackToLogin}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 South Eastern Coalfields Limited</p>
          <p className="mt-1">Secure employee directory access</p>
        </div>
      </div>
    </div>
  );
}
