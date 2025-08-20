# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
OnlyFarms is a Next.js 15 content creator platform similar to OnlyFans, enabling creators to monetize content through subscriptions and pay-per-view models. Built with JavaScript (following user rules), React, MongoDB, and includes authentication, payment processing (Stripe), and media management (Cloudinary with local fallback).

## Development Commands

### Core Commands
- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Production build**: `npm run build`  
- **Start production**: `npm start`
- **Linting**: `npm run lint`

### Testing & Database
- No test framework configured yet
- MongoDB connection via Mongoose (check MONGODB_URI in environment)
- Use MongoDB Compass or CLI for database inspection: `mongosh <connection-string>`

### File Uploads
- **Development**: Uses local storage fallback in `public/uploads/`
- **Production**: Uses Cloudinary (requires CLOUDINARY_* environment variables)

## Architecture Overview

### App Structure (Next.js 15 App Router)
```
src/app/
├── api/                    # API routes
│   ├── auth/[...nextauth]/ # NextAuth configuration
│   ├── content/            # Content CRUD operations
│   └── creators/           # Creator management
├── auth/                   # Authentication pages (login/register)
├── content/create/         # Content creation for creators
├── dashboard/              # User dashboard (different views for creators vs fans)
├── feed/                   # Content discovery feed
└── creators/               # Creator browsing/discovery
```

### Data Models (MongoDB/Mongoose)
- **User**: Handles both creators and fans with role-based permissions
  - Creators: subscription pricing, earnings, subscriber management
  - Fans: subscription tracking, spending history
- **Content**: Media posts with access control (free/subscription/pay-per-view)
  - Supports images/videos with engagement tracking (likes, comments)
  - Integrated with Cloudinary for media optimization
- **Additional models**: Message, Notification, Transaction

### Key Libraries & Services
- **Authentication**: NextAuth.js with Google OAuth + credentials
- **Styling**: TailwindCSS + DaisyUI (per user rules)
- **Database**: MongoDB with Mongoose ODM
- **Media**: Cloudinary (prod) with local storage fallback (dev)
- **Payments**: Stripe integration (configured but implementation pending)
- **State**: React hooks + NextAuth session management

## User Roles & Access Control
- **Creators**: Can upload content, manage subscribers, view analytics, set pricing
- **Fans**: Can subscribe to creators, purchase pay-per-view content, browse feed
- Role-based UI rendering throughout the application (check `session.user.role`)

## Environment Variables Required
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/onlyfarms
GOOGLE_ID=your-google-oauth-client-id
GOOGLE_SECRET=your-google-oauth-client-secret

# Production only
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (configured but not fully implemented)
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

## Development Workflows

### Adding New Features
1. Check user authentication and role permissions in page components
2. API routes should validate sessions using `getServerSession(authOptions)`
3. Use the established pattern: UI components in `src/components/`, utilities in `src/lib/`
4. Follow existing patterns for database operations (connect, query, close)

### Content Management
- File uploads handled in `/api/content` route with FormData processing
- Images/videos processed through Cloudinary helper functions
- Content access control implemented in `Content.hasAccess()` model method
- Preview generation for dashboard and feeds

### Database Operations
- Always use `connectDB()` helper before database operations
- Implement proper indexes for performance (see existing model schemas)
- Use MongoDB aggregation for complex queries like analytics

### Working with Media
- Development uses local storage in `public/uploads/` directory
- Production uploads to Cloudinary with automatic optimization
- Video thumbnails generated automatically
- File type validation implemented in upload handlers

## Common Debugging
- Check browser network tab for API route errors
- Verify MongoDB connection with database logs
- Authentication issues: check NEXTAUTH_SECRET and provider credentials
- File upload issues: check file size limits and MIME type validation
- Role-based access: verify session.user.role matches expected value

## Code Patterns
- Use `'use client'` directive for client components with hooks
- API routes return `NextResponse.json()` with proper status codes
- Database models include virtual properties for computed fields (e.g., `subscriberCount`)
- CSS uses Tailwind utility classes with DaisyUI component classes
- Form handling uses controlled components with state management

## Performance Considerations
- Database queries use indexes and pagination (see content fetching)
- Images optimized through Cloudinary transformations
- Next.js Image component used for automatic optimization
- MongoDB connection pooling implemented via cached connections
