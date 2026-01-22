# Vibes - Social Community Platform for Vibecoders

## Overview
Vibes is a social community platform built for vibecoders - creative developers who use AI-assisted coding to build innovative projects. The platform combines features from Product Hunt, GitHub, and learning communities.

## Current State
- MVP fully implemented with authentication, projects, profiles, learning resources, grants, and notifications
- Using Replit Auth for authentication (supports Google, GitHub, email)
- PostgreSQL database for persistent data storage
- React + TypeScript frontend with Tailwind CSS
- Express.js backend with Drizzle ORM

## Key Features
1. **Authentication**: Replit Auth with OAuth support
2. **User Profiles**: Bio, skills, tools, social links, follow/unfollow
3. **Projects**: Submit, view, upvote, comment on vibecoded projects
4. **Learning Hub**: Curated resources with categories, upvotes, bookmarks
5. **Grants**: Submit projects to grant programs for funding
6. **Notifications**: Real-time notifications for interactions

## Project Architecture

### Frontend (client/)
- `src/App.tsx` - Main app with routing and layout
- `src/pages/` - Page components (landing, home, discover, learn, grants, etc.)
- `src/components/` - Reusable UI components
- `src/hooks/use-auth.ts` - Authentication hook

### Backend (server/)
- `routes.ts` - All API endpoints
- `storage.ts` - Database storage layer (DatabaseStorage)
- `db.ts` - Drizzle database connection
- `replit_integrations/auth/` - Replit Auth integration

### Shared (shared/)
- `schema.ts` - Drizzle ORM schema with all tables and types
- `models/auth.ts` - Auth-related models (users, sessions)

## Database Tables
- users, sessions (auth)
- profiles
- projects, project_upvotes, project_comments
- follows
- resources, resource_upvotes, resource_bookmarks, resource_comments
- grants, grant_submissions
- notifications

## API Endpoints
- `/api/auth/user` - Get current user
- `/api/profile` - User profile CRUD
- `/api/projects` - Project CRUD + upvotes + comments
- `/api/resources` - Learning resources + upvotes + bookmarks
- `/api/grants` - Grant programs + submissions
- `/api/notifications` - User notifications
- `/api/users/:id/follow` - Follow/unfollow users

## Running the App
1. Database is automatically provisioned via Replit
2. Run `npm run db:push` to apply schema changes
3. The app runs on port 5000

## Data Policy
- All statistics on the landing page are real-time counts from the database
- No mock or placeholder data is used
- Resources and grants should be added by admins through the platform

## User Preferences
- Cyan/teal primary color (matching rainbow logo)
- Twitter/X-style social media aesthetic
- Pure black dark mode (#000)
- Rainbow gradient accents for key text
- Inter font family for sans-serif
- Clean, minimal card-based layout
