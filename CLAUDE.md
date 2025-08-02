# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Juna**, a modern blogging platform built with Vue 3, TypeScript, and Supabase. The application features a Japanese-optimized search system, real-time functionality, and a rich text editor for content creation.

## Essential Commands

### Development
```bash
cd project
npm install          # Install dependencies
npm run dev          # Start development server
```

### Build & Analysis
```bash
npm run build        # Build for production
npm run analyze      # Analyze bundle size
npm run deps         # Generate dependency graph
```

### Database Management
```bash
cd project
supabase link                    # Link to Supabase project
supabase db push --include-all   # Push database migrations
```

### Supabase Functions Deployment
```bash
supabase functions deploy register-user
supabase functions deploy login-with-account
supabase functions deploy delete-user
```

## Architecture Overview

### Core Technology Stack
- **Frontend**: Vue 3 with Composition API, TypeScript, Vite
- **State Management**: Pinia stores (primarily `auth.ts`)
- **Routing**: Vue Router with authentication guards
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Styling**: Tailwind CSS with custom color system
- **Rich Text Editor**: TipTap with custom extensions

### Directory Structure
```
project/
├── src/
│   ├── pages/           # Route components (lazy-loaded)
│   ├── components/      # Reusable Vue components
│   │   ├── App/         # Global components (Navbar, Footer, Notifications)
│   │   ├── common/      # Shared components
│   │   └── [PageName]/  # Page-specific components
│   ├── stores/          # Pinia stores (auth state)
│   ├── composables/     # Vue composables (image handling, notifications)
│   ├── lib/            # Core utilities (supabase client, storage helpers)
│   └── router/         # Vue Router configuration
└── supabase/
    ├── functions/      # Edge Functions (auth, user management)
    └── migrations/     # Database schema
```

### Key Architectural Patterns

1. **Authentication Flow**
   - Centralized in `stores/auth.ts` using Pinia
   - Supports both email and custom account ID login
   - Session management with automatic refresh
   - Profile data synced with auth state

2. **Component Architecture**
   - Page components in `pages/` are route endpoints
   - Feature-specific components grouped by page
   - Shared components in `common/`
   - All components use Composition API

3. **Data Flow**
   - Supabase client (`lib/supabase.ts`) for all database operations
   - Storage utilities (`lib/storage.ts`) for image URL management
   - Composables for reusable logic (notifications, image uploads)

4. **Styling System**
   - Custom Tailwind configuration with CSS variables
   - Predefined color palette using RGB values
   - Component utility classes (glass-card, btn variants)
   - Mobile-first responsive design

5. **Image Handling**
   - Three storage buckets: profile_images, post_images, cover_images
   - Image upload with compression (`useImageUpload.ts`)
   - Automatic cleanup of unused images (`useImageCleanup.ts`)
   - WebP conversion for optimized delivery

6. **Security**
   - Row Level Security (RLS) policies on all tables
   - Storage policies for user-specific uploads
   - Edge Functions for sensitive operations
   - Auth guards on protected routes

### Critical Dependencies
- `@supabase/supabase-js`: Database and auth client
- `@tiptap/*`: Rich text editor components
- `pinia`: State management
- `vue-router`: Application routing
- `browser-image-compression`: Client-side image optimization

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Public anonymous key

### Database Schema Highlights
- **profiles**: User profiles with account_id, nickname, avatar
- **posts**: Blog posts with rich content, categories, tags
- **comments**: Nested comment system with parent-child relationships
- **categories**: Hierarchical category system
- **post_likes**: User engagement tracking
- Full-text search configuration for Japanese content

### Common Development Tasks

When implementing features:
1. Check existing patterns in similar components
2. Use the established color system from `tailwind.config.js`
3. Utilize `useNotification.ts` for user feedback
4. Follow the existing routing patterns in `router.ts`
5. Maintain TypeScript strict mode compliance

When working with images:
1. Use appropriate storage bucket via `lib/storage.ts`
2. Implement upload with `useImageUpload.ts`
3. Clean up unused images with `useImageCleanup.ts`
4. Always convert to WebP format for optimization

When adding new routes:
1. Add route definition in `router/router.ts`
2. Create page component in `pages/`
3. Add auth meta if authentication required
4. Implement lazy loading for optimal performance