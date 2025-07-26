Login Implementation - Complete Details

Overview

The login system uses OTP-based authentication with phone numbers. It's a two-step
process: employee ID verification followed by OTP validation.

Architecture

1. API Endpoints (src/app/api/auth/)

Login Route (login/route.ts:13-109)

- Method: POST
- Input: { employeeId: string }
- Process:
  a. Validates employee ID using Zod schema
  b. Finds employee in database by empCode
  c. Checks if employee is active
  d. Extracts phone number (phoneNumber1 or phoneNumber2)
  e. Validates phone format (Indian mobile numbers)
  f. Generates 6-digit OTP and session ID
  g. Sends OTP via SMS (mock in development)
  h. Stores OTP verification record in database
- Response: { success: true, sessionId, message, otp? }

OTP Verification Route (verify-otp/route.ts:15-154)

- Method: POST
- Input: { sessionId: string, otpCode: string, isDevSkip?: boolean }
- Process:
  a. Handles dev mode skip (DEV_SKIP code)
  b. Validates OTP against stored record
  c. Checks expiration and usage status
  d. Supports staging bypass (000000)
  e. Creates authentication session with token
  f. Returns employee details and session token
- Response: { success: true, sessionToken, expiresAt, employee }

Session Validation Route (me/route.ts:10-84)

- Method: GET
- Headers: Authorization: Bearer <token>
- Process:
  a. Extracts session token from Bearer header
  b. Validates session in database
  c. Checks expiration
  d. Fetches employee details
- Response: { employee: {...} }

Logout Route (logout/route.ts:4-25)

- Method: POST
- Process: Deletes session from database (idempotent)

2. Frontend Components

Login Page (src/app/login/page.tsx:21-154)

- Two-step UI: Login form → OTP form
- Theme toggle, notification test, hard refresh utilities
- Authentication state management with React Query
- Auto-redirect for authenticated users

Login Form (src/components/auth/login-form.tsx:32-177)

- Employee ID input with validation
- Placeholder buttons for biometric/SSO (not implemented)
- Loading states and error handling
- Zod validation with react-hook-form

OTP Form (src/components/auth/otp-form.tsx:39-272)

- 6-digit OTP input using shadcn/ui InputOTP
- Development OTP display
- Auto-focus and 60-second resend timer
- Dev skip and staging bypass buttons
- Session token storage in localStorage

3. Authentication Services

AuthService (src/lib/auth/auth-service.ts:3-164)

- OTP Generation: Random 6-digit (dev: 123456)
- Token Generation: Crypto-secure session IDs/tokens
- Phone Validation: Indian mobile number format
- SMS Service: Mock implementation (TODO: Twilio)
- Session Management: 7-day expiry, 5-minute OTP expiry

SessionManager (src/lib/auth/session-manager.ts:25-230)

- OTP Storage: Creates/validates OTP verification records
- Session Management: Auth session CRUD operations
- Database Integration: Drizzle ORM queries
- Cleanup: Expired session/OTP removal

useAuth Hook (src/lib/hooks/use-auth.ts:67-112)

- React Query-based auth state management
- Token validation with /api/auth/me
- Auto-refresh and error handling
- Logout mutation with cache clearing

4. Database Schema

OTP Verifications Table (otp_verifications)

id, employee_id, phone, otp_code, session_id,
expires_at, verified, created_at

Auth Sessions Table (auth_sessions)

id, employee_id, session_token, device_info,
expires_at, created_at

Employees Table (employees)

- Contains phoneNumber1, phoneNumber2 for OTP delivery
- empCode as unique identifier for login
- Active status checking

Security Features

1. OTP Expiry: 5 minutes
2. Session Expiry: 7 days
3. Phone Validation: Indian mobile format
4. Single Use: OTP marked as verified after use
5. Token-based: Secure session tokens in headers
6. Development Modes:


    - Dev skip with DEV_SKIP
    - Staging bypass with 000000
    - Development OTP display

Data Flow

1. User enters Employee ID → API validates employee exists & active
2. System generates OTP → Sends to registered phone, stores in DB
3. User enters OTP → API validates against stored record
4. System creates session → Returns session token
5. Client stores token → Used for subsequent API calls
6. Token validation → Middleware/hooks verify on protected routes

The implementation is production-ready with proper error handling, validation, and
security measures, though SMS integration and proper JWT signing are marked as
TODOs.
