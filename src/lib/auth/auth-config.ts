import { SignJWT, jwtVerify } from 'jose'

// Authentication configuration
export const AUTH_CONFIG = {
  JWT_SECRET: new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  ),
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  OTP_DURATION: 5 * 60 * 1000, // 5 minutes
  REFRESH_TOKEN_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS || '5'),
    OTP_ATTEMPTS: parseInt(process.env.RATE_LIMIT_OTP_ATTEMPTS || '3'),
    TIME_WINDOW: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '15') * 60 * 1000, // minutes to milliseconds
    ENABLED: process.env.DISABLE_RATE_LIMITING !== 'true'
  }
}

export interface JWTPayload {
  employeeId: string
  sessionId: string
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  employeeId: string
  sessionId: string
  tokenVersion: number
  iat: number
  exp: number
}

/**
 * Generate a cryptographically secure session ID
 */
export function generateSecureId(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a signed JWT token
 */
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION / 1000)
    .sign(AUTH_CONFIG.JWT_SECRET)
  
  return jwt
}

/**
 * Verify and decode JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_CONFIG.JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Create a refresh token
 */
export async function createRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + AUTH_CONFIG.REFRESH_TOKEN_DURATION / 1000)
    .sign(AUTH_CONFIG.JWT_SECRET)
  
  return jwt
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_CONFIG.JWT_SECRET)
    return payload as unknown as RefreshTokenPayload
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

/**
 * Hash password using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate secure OTP
 */
export function generateSecureOTP(): string {
  const array = new Uint8Array(3)
  crypto.getRandomValues(array)
  return Array.from(array, byte => (byte % 10).toString()).join('').padStart(6, '0')
}
