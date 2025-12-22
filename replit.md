# Mozart - Portal Management System

## Overview
Mozart is a portal management system built with Next.js 16, React 19, TypeScript, and Supabase. The application allows users to manage portals, teams, users, and content with role-based access control. Now featuring the "Nixio Rebrand" premium SaaS design system.

## Technology Stack
- **Framework**: Next.js 16.0.3 (App Router)
- **UI**: React 19.2.0, Tailwind CSS 4.x
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript 5.x
- **UI Components**: Radix UI, Lucide React icons
- **Design System**: Nixio Rebrand (Premium SaaS)

## Design System
The application uses a comprehensive design system with:
- **Primary Color**: Pink (#FF2D78)
- **Background**: White/Off-white (#F8F9FB)
- **Sidebar**: Light Gray (#F1F3F5)
- **Border Radius**: 28px for cards and major components
- **Typography**: Inter font family with proper hierarchy
- **Shadows**: Soft, medium, card, and floating shadow variants

### CSS Variables & Tailwind Integration
All design tokens are defined as CSS custom properties in `globals.css` and integrated with Tailwind config:
- Color variables: `--primary-main`, `--bg-default`, `--text-primary`, etc.
- Spacing variables: `--spacing-xs` through `--spacing-xxl`
- Border radius: `--radius-sm` through `--radius-xl`
- Shadows: `--shadow-soft`, `--shadow-medium`, `--shadow-card`, `--shadow-floating`

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
├── app/globals.css       # Design system CSS variables
└── public/               # Static assets
```

## Running the Project
- **Development**: `npm run dev` (runs on port 5000 with 0.0.0.0 binding)
- **Build**: `npm run build`
- **Production**: `npm run start` (runs on port 5000)

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Deployment
- **Type**: Autoscale (stateless)
- **Build**: `cd sistema-recuperado && npm run build`
- **Run**: `cd sistema-recuperado && npm run start`
- **Port**: 5000

## Key Features
- User authentication via Supabase
- Portal management with modern design
- Team management
- User management with role-based access
- Content management
- AI integration (ViewAI)
- Dashboard with analytics
- Responsive design with light theme

## Recent Changes
- 2024-12-22: Layout Fixes
  - Fixed complete layout structure with proper flex layout
  - Sidebar: 260px fixed width with light gray background
  - Icons: Limited to 20px size (no longer gigantic)
  - Background: Forced white (#FFFFFF) throughout
  - Text: Dark (#1A1A1A) for proper contrast and readability
  - Spacing: Added 12px gap between sidebar menu items
  - Removed dark mode class from HTML tag
  - Removed any overlapping elements
  - Pink (#FF2D78) applied only to MOZART logo and active menu items
  - "Criar Novo Portal" button in pink
  - Red logout button

- 2024-12-22: Design System Implementation
  - Implemented Nixio Rebrand (Premium SaaS) design system
  - Created CSS variables for all design tokens (colors, spacing, shadows, typography)
  - Updated Tailwind config to use CSS custom properties
  - Applied pink (#FF2D78) primary color to buttons and active menu items
  - Updated Sidebar with light gray background (#F1F3F5)
  - Set border radius to 28px for cards and major components
  - Applied soft shadows to card elements
  - Updated all UI components to use new design system colors

- 2024-12-22: Initial Replit Environment Setup
  - Configured Next.js to run on port 5000 with 0.0.0.0 host binding
  - Set up environment variables for Supabase integration
  - Configured deployment settings for autoscale
  - Created workflow for development server
