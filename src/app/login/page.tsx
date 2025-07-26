"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { OtpForm } from "@/components/auth/otp-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginState {
  step: 'login' | 'otp';
  sessionId?: string;
  employeeId?: string;
  phoneNumber?: string;
}

export default function LoginPage() {
  const [loginState, setLoginState] = useState<LoginState>({ step: 'login' });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            SECL Directory
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm">Secure Employee Access Portal</p>
        </div>

        {/* Main Card */}
        <Card className="w-full backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {loginState.step === 'login' ? 'Welcome Back' : 'Verify Identity'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
              {loginState.step === 'login' ? (
                'Enter your employee credentials to continue'
              ) : (
                `Verification code sent to ${loginState.phoneNumber?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
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
                {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
          <p>&copy; 2024 SECL. All rights reserved.</p>
        </div>
        </div>
      </div>
    </div>
  );
}
