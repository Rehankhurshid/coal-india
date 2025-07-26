# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Coal India employee directory application built with Next.js 15, TypeScript, and Supabase. It provides search, filtering, and viewing capabilities for employee data from South Eastern Coalfields Limited (SECL).

## Development Commands

```bash
# Development server
npm run dev              # Uses Turbopack (recommended)
npm run dev:webpack      # Uses Webpack (fallback if Turbopack issues)

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Architecture Overview

### Database & Backend
- **Database**: Supabase (PostgreSQL) with TypeScript interfaces in `src/lib/supabase.ts`
- **Main entities**: Employee, Department, Area, Designation
- **Employee interface** includes: emp_code, name, designation, dept, area_name, grade, category, gender, blood_group, contact info
- **Authentication**: Supabase auth with OTP-based login system

### Frontend Architecture  
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components (New York style, stone base color)
- **Components**: Located in `src/components/` with UI primitives in `src/components/ui/`
- **Layout**: Root layout in `src/app/layout.tsx` with AppNav component

### Key Components
- `employee-list.tsx` - Main employee grid/list view
- `employee-card.tsx` - Individual employee display
- `filters.tsx` & `filters-sidebar.tsx` - Search and filter functionality
- `stats-card.tsx` - Employee statistics display
- `app-nav.tsx` - Main navigation with auth state

### Authentication System
- Login flow: `src/app/login/page.tsx` with `login-form.tsx` and `otp-form.tsx`
- Auth hook: `src/lib/hooks/use-auth.ts`
- Protected routes: `protected-route.tsx` wrapper component

## Key Technical Details

### Supabase Configuration
- Client instance configured in `src/lib/supabase.ts`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- TypeScript interfaces defined for all database entities

### shadcn/ui Setup
- **Style**: New York variant
- **Base color**: Stone
- **Icon library**: Lucide React
- **Path aliases**: `@/components`, `@/lib`, `@/hooks`
- Use the shadcn MCP server to add new components instead of writing from scratch

### Filter System Architecture
The application has a sophisticated multi-layer filtering system documented in `instructions/FILTER-LOGIC-DETAILED.md`:

1. **Database Layer**: Optimized indexes for search fields (name, emp_code, department, designation)
2. **Service Layer**: 5-minute in-memory caching for filter options
3. **API Layer**: RESTful endpoints with pagination support
4. **Frontend Layer**: Debounced search (200ms), URL-based state management

Key filtering capabilities:
- Multi-field text search across name, emp_code, designation, email
- Exact match filters for department, area, grade, category, gender, blood_group
- Optimized with composite database indexes and client-side search index pre-building

### File Structure Patterns
```
src/
├── app/                 # Next.js App Router pages
│   ├── login/          # Authentication pages
│   └── test/           # Test/demo pages
├── components/         # React components
│   ├── auth/          # Authentication components
│   └── ui/            # shadcn/ui components
└── lib/               # Utilities and configurations
    └── hooks/         # Custom React hooks
```

## Development Guidelines

### Component Development
- Use shadcn/ui components from the MCP server when possible
- Follow the established TypeScript interfaces from `src/lib/supabase.ts`
- Implement responsive design with Tailwind CSS mobile-first approach
- Use Lucide React icons for consistency

### Database Interactions
- All database queries go through the Supabase client in `src/lib/supabase.ts`
- Use the defined TypeScript interfaces (Employee, Department, Area, Designation)
- Maintain the `is_active` boolean pattern for soft deletes
- Follow the established pagination patterns for large datasets

### Authentication Flow
- Use the `use-auth.ts` hook for auth state management
- Wrap protected pages with `protected-route.tsx`
- OTP-based login system is implemented - don't change without user request

### Performance Considerations
- Filter options are cached for 5 minutes in memory
- Search is debounced at 200ms to reduce API calls
- Database queries use optimized indexes for search fields
- Large employee lists use pagination (default 50 per page)

## Important Files to Review Before Changes

- `src/lib/supabase.ts` - Database schema and TypeScript interfaces
- `instructions/FILTER-LOGIC-DETAILED.md` - Complete filtering system documentation
- `src/components/app-nav.tsx` - Main navigation and auth integration
- `components.json` - shadcn/ui configuration

## CLI Notes

- `claude --resume --dangerously-skip-permissions`: Command for resuming without strict permission checks