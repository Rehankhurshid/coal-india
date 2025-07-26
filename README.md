# SECL Employee Directory

A modern employee directory application for South Eastern Coalfields Limited (SECL), part of Coal India Limited.

## Features

- **Employee Search**: Search employees by name, employee code, designation, or department
- **Advanced Filtering**: Filter by department, location, grade, category, gender, and blood group
- **Multiple View Modes**: Switch between grid and list views
- **Real-time Statistics**: View department-wise employee distribution and statistics
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Built with shadcn/ui components following V0 design principles

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui, Lucide React icons
- **State Management**: React hooks

## Database Schema

The application uses the following main tables:

- `employees`: Main employee data with personal, contact, and job information
- `departments`: Department structure and hierarchy
- `areas`: Mining areas and locations
- `designations`: Job titles and grades

## Features Overview

### Employee Cards

- Employee photo placeholder with initials
- Contact information (phone, email)
- Job details (designation, department, area)
- Grade and category badges
- Quick action buttons for calling and emailing

### Advanced Search & Filters

- Real-time search across multiple fields
- Department-wise filtering
- Location-based filtering
- Grade and category filters
- Gender and blood group filters
- Filter count indicators
- One-click filter clearing

### Statistics Dashboard

- Total employee count with gender breakdown
- Number of active departments
- Mining location count
- Employee category distribution
- Top departments by employee count

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Data Security

- All employee data is securely stored in Supabase
- Row Level Security (RLS) policies implemented
- Environment variables for sensitive configuration
- No sensitive data exposed in client-side code

## Contributing

This application follows modern React and Next.js best practices:

- TypeScript for type safety
- Component composition over inheritance
- Responsive design with mobile-first approach
- Accessible UI components
- Clean code structure with proper separation of concerns

## License

Built for South Eastern Coalfields Limited (SECL), Coal India Limited.
