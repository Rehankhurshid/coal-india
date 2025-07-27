"use client";

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  employeeId: string;
  expiresAt: number;
}

interface LoginResponse {
  success: boolean;
  sessionId?: string;
  phoneNumber?: string;
  message: string;
}

interface VerifyOTPResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  employee?: any;
  message: string;
}

/**
 * Enterprise-grade client authentication service
 */
export class ClientAuthService {
  private static readonly STORAGE_KEY = 'auth_session';
  private static refreshPromise: Promise<string | null> | null = null;

  /**
   * Login with employee ID
   */
  static async login(employeeId: string): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  /**
   * Verify OTP and complete authentication
   */
  static async verifyOTP(sessionId: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      console.log('[ClientAuth] Calling verify-otp API with:', { sessionId, otp });
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp }),
      });

      console.log('[ClientAuth] Response status:', response.status);
      console.log('[ClientAuth] Response ok:', response.ok);

      if (!response.ok) {
        console.error('[ClientAuth] Response not ok:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        // Try to get error details
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        return { 
          success: false, 
          message: errorMessage 
        };
      }

      const result = await response.json();
      console.log('[ClientAuth] Parsed result:', { success: result.success, hasToken: !!result.accessToken });

      if (result.success && result.accessToken) {
        // Store session data
        const sessionData = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          employeeId: result.employee.emp_code, // Use emp_code as the key identifier
          expiresAt: new Date(result.expiresAt).getTime(),
        };
        
        console.log('[ClientAuth] Storing session data:', { 
          employeeId: sessionData.employeeId,
          hasToken: !!sessionData.accessToken 
        });
        this.setSession(sessionData);
      }

      return result;
    } catch (error) {
      console.error('[ClientAuth] OTP verification error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error occurred' 
      };
    }
  }

  /**
   * Get authentication headers for API requests
   */
  static getAuthHeaders(): HeadersInit {
    const session = this.getSession();
    
    if (!session) {
      return { 'Content-Type': 'application/json' };
    }

    return {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get current authenticated user's employee ID
   */
  static getCurrentUserId(): string | null {
    const session = this.getSession();
    return session?.employeeId || null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Check if token is expired (with 5-minute buffer)
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() < (session.expiresAt - fiveMinutes);
  }

  /**
   * Get valid session, refreshing if necessary
   */
  static async getValidSession(): Promise<AuthSession | null> {
    const session = this.getSession();
    if (!session) return null;

    // Check if token is expired or will expire in the next 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    const willExpireSoon = Date.now() > (session.expiresAt - fiveMinutes);

    if (willExpireSoon) {
      const newToken = await this.refreshAccessToken();
      if (!newToken) {
        this.clearSession();
        return null;
      }
      return this.getSession();
    }

    return session;
  }

  /**
   * Refresh access token using refresh token
   */
  private static async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  /**
   * Perform the actual token refresh
   */
  private static async performTokenRefresh(): Promise<string | null> {
    try {
      const session = this.getSession();
      if (!session?.refreshToken) return null;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const result = await response.json();
      
      if (result.success && result.accessToken) {
        // Update session with new token
        this.setSession({
          ...session,
          accessToken: result.accessToken,
          expiresAt: new Date(result.expiresAt).getTime(),
        });
        
        return result.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Logout and clear session
   */
  static async logout(): Promise<void> {
    try {
      // Call logout API to invalidate server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearSession();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Get current user data
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      const session = await this.getValidSession();
      if (!session) return null;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.success ? result.employee : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Store session data securely
   */
  private static setSession(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Get session data from storage
   */
  private static getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const sessionData = localStorage.getItem(this.STORAGE_KEY);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // Validate session structure
      if (!session.accessToken || !session.employeeId || !session.expiresAt) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Failed to parse session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Backward compatibility exports
export const getAuthHeaders = () => ClientAuthService.getAuthHeaders();
export const getCurrentUserId = () => ClientAuthService.getCurrentUserId();
export const isAuthenticated = () => ClientAuthService.isAuthenticated();
export const clearSession = () => ClientAuthService.clearSession();
