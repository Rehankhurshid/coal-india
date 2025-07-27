import { createServerClient } from '@/lib/supabase-server'
import { generateSecureId, createJWT, createRefreshToken, verifyJWT, AUTH_CONFIG } from './auth-config'

export interface AuthSession {
  id: string
  employee_id: string
  session_token: string
  refresh_token: string
  device_info?: string
  ip_address?: string
  expires_at: string
  last_used_at: string
  is_active: boolean
  created_at: string
}

export interface OTPVerification {
  id: string
  employee_id: string
  phone_number: string
  otp_code: string
  session_id: string
  expires_at: string
  verified: boolean
  attempts: number
  created_at: string
}

export interface LoginAttempt {
  id: string
  employee_id?: string
  ip_address: string
  user_agent?: string
  success: boolean
  failure_reason?: string
  created_at: string
}

/**
 * Enterprise-grade session manager with database persistence
 */
export class SessionManager {
  private supabase = createServerClient()

  /**
   * Create a new authentication session
   */
  async createSession(
    employeeId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const sessionId = generateSecureId()
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION)
    
    // Create JWT tokens
    const accessToken = await createJWT({ employeeId, sessionId })
    const refreshToken = await createRefreshToken({ 
      employeeId, 
      sessionId, 
      tokenVersion: 1 
    })

    // Store session in database
    const { error } = await this.supabase
      .from('auth_sessions')
      .insert({
        id: sessionId,
        employee_id: employeeId,
        session_token: accessToken,
        refresh_token: refreshToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString(),
        last_used_at: new Date().toISOString(),
        is_active: true
      })

    if (error) {
      console.error('Failed to create session:', error)
      throw new Error('Failed to create authentication session')
    }

    return { accessToken, refreshToken, expiresAt }
  }

  /**
   * Validate session token and return session data
   */
  async validateSession(token: string): Promise<AuthSession | null> {
    try {
      // Verify JWT first
      const payload = await verifyJWT(token)
      if (!payload) return null

      // Get session from database
      const { data: session, error } = await this.supabase
        .from('auth_sessions')
        .select('*')
        .eq('id', payload.sessionId)
        .eq('employee_id', payload.employeeId)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        console.error('Session not found or inactive:', error)
        return null
      }

      // Check if session has expired
      if (new Date(session.expires_at) < new Date()) {
        await this.invalidateSession(session.id)
        return null
      }

      // Update last used timestamp
      await this.supabase
        .from('auth_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', session.id)

      return session
    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  /**
   * Refresh an access token using refresh token
   */
  async refreshSession(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
    try {
      const payload = await verifyJWT(refreshToken)
      if (!payload) return null

      const session = await this.validateSession(payload.sessionId)
      if (!session) return null

      // Generate new access token
      const newAccessToken = await createJWT({
        employeeId: session.employee_id,
        sessionId: session.id
      })

      const expiresAt = new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION)

      // Update session in database
      await this.supabase
        .from('auth_sessions')
        .update({
          session_token: newAccessToken,
          expires_at: expiresAt.toISOString(),
          last_used_at: new Date().toISOString()
        })
        .eq('id', session.id)

      return { accessToken: newAccessToken, expiresAt }
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.supabase
      .from('auth_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllSessions(employeeId: string): Promise<void> {
    await this.supabase
      .from('auth_sessions')
      .update({ is_active: false })
      .eq('employee_id', employeeId)
  }

  /**
   * Create OTP verification record
   */
  async createOTPVerification(
    employeeId: string,
    phoneNumber: string,
    otpCode: string
  ): Promise<string> {
    const sessionId = generateSecureId()
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_DURATION)

    const { error } = await this.supabase
      .from('otp_verifications')
      .insert({
        id: generateSecureId(),
        employee_id: employeeId,
        phone: phoneNumber,  // Add phone number here too
        phone_number: phoneNumber,
        otp_code: otpCode,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      })

    if (error) {
      console.error('Failed to create OTP verification:', error)
      throw new Error('Failed to create OTP verification')
    }

    return sessionId
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(sessionId: string, otpCode: string): Promise<string | null> {
    const { data: verification, error } = await this.supabase
      .from('otp_verifications')
      .select('*')
      .eq('session_id', sessionId)
      .eq('verified', false)
      .single()

    if (error || !verification) {
      return null
    }

    // Check expiration
    if (new Date(verification.expires_at) < new Date()) {
      return null
    }

    // Check attempts
    if (verification.attempts >= AUTH_CONFIG.RATE_LIMITS.OTP_ATTEMPTS) {
      return null
    }

    // Increment attempts
    await this.supabase
      .from('otp_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id)

    // Verify OTP
    if (verification.otp_code !== otpCode) {
      return null
    }

    // Mark as verified
    await this.supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    return verification.employee_id
  }

  /**
   * Log login attempt
   */
  async logLoginAttempt(
    employeeId: string | undefined,
    ipAddress: string,
    userAgent: string | undefined,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    await this.supabase
      .from('login_attempts')
      .insert({
        id: generateSecureId(),
        employee_id: employeeId,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        failure_reason: failureReason
      })
  }

  /**
   * Check rate limiting for login attempts
   */
  async checkRateLimit(ipAddress: string): Promise<boolean> {
    const timeWindow = new Date(Date.now() - AUTH_CONFIG.RATE_LIMITS.TIME_WINDOW)
    
    const { count } = await this.supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gte('created_at', timeWindow.toISOString())

    return (count || 0) < AUTH_CONFIG.RATE_LIMITS.LOGIN_ATTEMPTS
  }

  /**
   * Clean up expired sessions and verifications
   */
  async cleanupExpired(): Promise<void> {
    const now = new Date().toISOString()
    
    // Clean expired sessions
    await this.supabase
      .from('auth_sessions')
      .update({ is_active: false })
      .lt('expires_at', now)

    // Delete old OTP verifications
    await this.supabase
      .from('otp_verifications')
      .delete()
      .lt('expires_at', now)

    // Delete old login attempts (keep for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await this.supabase
      .from('login_attempts')
      .delete()
      .lt('created_at', thirtyDaysAgo)
  }
}
