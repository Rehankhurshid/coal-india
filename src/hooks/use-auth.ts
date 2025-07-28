'use client';

import { useState, useEffect } from 'react';
import { ClientAuthService } from '@/lib/auth/client-auth';
import type { Employee } from '@/types/employee';

interface UseAuthReturn {
  currentUserId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  employee: Employee | null;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const authenticated = ClientAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Get current user ID
        const userId = ClientAuthService.getCurrentUserId();
        setCurrentUserId(userId);
        
        // Get user data
        const userData = await ClientAuthService.getCurrentUser();
        setEmployee(userData);
      } else {
        setCurrentUserId(null);
        setEmployee(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setCurrentUserId(null);
      setEmployee(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await ClientAuthService.logout();
    setCurrentUserId(null);
    setEmployee(null);
    setIsAuthenticated(false);
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_session') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    currentUserId,
    loading,
    isAuthenticated,
    employee,
    logout,
    refreshAuth,
  };
}
