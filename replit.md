# Mozart - Portal Management System

## Overview
Mozart is a portal management system built with Next.js 16, React 19, TypeScript, and Supabase. The application allows users to manage portals, teams, users, and content with role-based access control.

## Technology Stack
- **Framework**: Next.js 16.0.3 (App Router)
- **UI**: React 19.2.0, Tailwind CSS 4.x
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript 5.x
- **UI Components**: Radix UI, Lucide React icons

## Project Structure
```
sistema-recuperado/
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin routes (dashboard, users, portals, etc.)
│   ├── login/             # Login page
│   ├── members/           # Member/student area
│   └── teams/             # Team management
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── members/          # Member-specific components
│   └── ui/               # Reusable UI components
├── context/              # React context providers (Auth)
├── lib/                  # Utility functions and Supabase clients
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Running the Project
- **Development**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Production**: `npm run start` (runs on port 5000)

## Environment Variables
The project uses the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)

## Key Features
- User authentication via Supabase
- Portal management
- Team management
- User management with role-based access
- Content management
- AI integration (ViewAI)
- Dashboard with analytics

## Recent Changes
- 2024-12-22: Initial import and Replit environment setup
  - Configured Next.js to run on port 5000 with 0.0.0.0 host binding
  - Set up environment variables for Supabase integration
  - Configured deployment settings
