"use client";

import { useState, useEffect } from 'react';
import { supabase, Employee } from '@/lib/supabase';

interface AuthSession {
  token: string;
  employeeId: string;
  expiresAt: number;
}

interface AuthState {
  isAuthenticated: boolean;
  employee: Employee | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    employee: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      const sessionData = localStorage.getItem('auth_session');
      
      if (!sessionData) {
        setAuthState({
          isAuthenticated: false,
          employee: null,
          isLoading: false,
        });
        return;
      }

      const session: AuthSession = JSON.parse(sessionData);

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem('auth_session');
        setAuthState({
          isAuthenticated: false,
          employee: null,
          isLoading: false,
        });
        return;
      }

      // Fetch employee details from Supabase
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('emp_code', session.employeeId)
        .single();

      if (error || !employee) {
        localStorage.removeItem('auth_session');
        setAuthState({
          isAuthenticated: false,
          employee: null,
          isLoading: false,
        });
        return;
      }

      setAuthState({
        isAuthenticated: true,
        employee,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error checking auth session:', error);
      localStorage.removeItem('auth_session');
      setAuthState({
        isAuthenticated: false,
        employee: null,
        isLoading: false,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_session');
    setAuthState({
      isAuthenticated: false,
      employee: null,
      isLoading: false,
    });
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const refreshSession = () => {
    checkAuthSession();
  };

  return {
    ...authState,
    logout,
    refreshSession,
  };
}
