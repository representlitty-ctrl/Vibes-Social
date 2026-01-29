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
2. **User Profiles**: Bio, skills, tools, social links, follow/unfollow, profile pictures
3. **Posts**: Create text posts with images, videos, and voice notes; like and comment on posts
4. **Stories**: 24-hour expiring stories with circular profile previews and color-coded rings
5. **Unified Feed**: Combined feed showing posts and projects from followed users
6. **Projects**: Submit, view, upvote, comment, bookmark, emoji reactions on projects
7. **Learning Hub**: Curated resources and courses with categories, upvotes, bookmarks
8. **Courses**: Learning courses with lessons, enrollment, and progress tracking
9. **Grants**: Submit projects to grant programs for funding
10. **Notifications**: Real-time notifications for interactions with user avatars
11. **Direct Messaging**: Private conversations with voice notes, image sharing, and file attachments
12. **Emoji Reactions**: React to projects and comments with emojis

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
- posts, post_media, post_likes, post_comments
- stories
- projects, project_upvotes, project_downvotes, project_comments, project_bookmarks
- follows
- resources, resource_upvotes, resource_bookmarks, resource_comments
- grants, grant_submissions
- notifications
- conversations, messages (DMs with voice notes)
- reactions (emoji reactions on projects and comments)
- courses, course_lessons, course_enrollments, course_progress

## API Endpoints
- `/api/auth/user` - Get current user
- `/api/profile` - User profile CRUD
- `/api/posts` - Post CRUD + likes + comments
- `/api/stories` - Story CRUD (24-hour expiry)
- `/api/feed` - Unified feed (posts + projects from followed users)
- `/api/projects` - Project CRUD + upvotes + comments + bookmarks
- `/api/resources` - Learning resources + upvotes + bookmarks
- `/api/grants` - Grant programs + submissions
- `/api/notifications` - User notifications
- `/api/users/:id/follow` - Follow/unfollow users
- `/api/conversations` - Direct messaging conversations
- `/api/messages` - Messages within conversations (text, voice notes, images, files)
- `/api/reactions` - Emoji reactions on projects and comments
- `/api/courses` - Learning courses with lessons and enrollments
- `/api/lessons` - Course lessons with completion tracking

## Running the App
1. Database is automatically provisioned via Replit
2. Run `npm run db:push` to apply schema changes
3. The app runs on port 5000

## Data Policy
- All statistics on the landing page are real-time counts from the database
- No mock or placeholder data is used
- Resources and grants should be added by admins through the platform

## Locked-In Standards (DO NOT VIOLATE)
These are permanent rules that must always be followed:

### Daily News Summary
- News MUST come from Google News RSS (free source)
- News MUST NOT be older than 24 hours
- Categories: Crypto, AI, Finance, Politics ONLY (no tech)
- NO hashtags (# symbols) anywhere
- NO markdown headers (# or ##) - use **bold** for titles
- Only include headlines with real, specific information
- Posts autonomously at 8:00 AM daily

### Text Formatting
- Double asterisks (**text**) MUST render as visible bold text (not show raw asterisks)
- Triple dashes (---) MUST render as horizontal divider lines
- renderFormattedText function handles this in both post-card.tsx and post-detail.tsx
- Preview text strips formatting markers for clean display

### Image Viewing
- Images MUST be viewable inline without redirecting to a new page
- Image modal MUST include a download/save button
- Support gallery navigation (left/right) for multiple images

### Sharing
- Share function MUST only include the URL - no pre-message text
- Copy to clipboard as fallback if Web Share API is not available
- Consistent across all share buttons (posts, projects, detail pages)

### Cover Art Uploads
- Project and grant cover art MUST use 16:9 aspect ratio cropping
- ImageCropper component used for consistent cropping experience
- Cropping dialog appears before upload is finalized

### Profile Tabs
- Non-automated profiles MUST show Posts, Projects, and Learning tabs
- Automated profiles (isNewsBot) ONLY show Posts tab
- Profile statistics section hidden for automated accounts

### Profile Pictures
- Profile pictures MUST display as thumbnails everywhere:
  - Project cards, grant submissions, posts, comments, notifications, messages
- All avatars MUST be clickable to navigate to user profile
- Use Avatar component with AvatarFallback for missing images

### Post Design Consistency
- Same PostCard component MUST be used for all posts (feed and global)
- Automated account posts use same design as regular user posts
- Bot icon distinguishes automated accounts in avatar slot

### Data Policy
- NO mock data or placeholder statistics
- All numbers MUST reflect real database counts
- Resources and grants added by admins only

## User Preferences
- Red primary color (hue 0) with 5 theme options available
- Facebook-style social media aesthetic with light gray background
- Pure black dark mode as default with elevated cards
- Red gradient accents for key elements
- Inter font family for sans-serif
- Clean, card-based layout with subtle shadows
- White sidebar/nav with white cards on gray background

## Recent Changes
- **Performance Optimizations**: Super-fast app experience
  - Instant theme switching (dark/light mode with no transition delay)
  - 50ms button/interaction transitions for snappy feedback
  - GPU acceleration for smooth animations
  - Instant click feedback with scale transform
  - Fast modal/dropdown animations (80-100ms)
- **Daily News Summary**: Vibesnews bot posts one daily summary
  - Uses Google News RSS (free) to gather real news from past 24 hours
  - AI-powered summarization using Replit AI integration
  - Categories: Crypto, AI, Finance, Politics (no tech)
  - Uses **bold text** formatting (no hashtags or markdown headers)
  - Only includes headlines with real information (filters out vague/clickbait)
  - Header shows exact 24-hour time range covered (e.g., "Wed, Jan 28, 5:11 AM UTC to Thu, Jan 29, 5:11 AM UTC")
  - Appears in all users' feeds automatically
  - Posts autonomously at 8:00 AM daily (checks every 5 minutes)
- Added posts feature with text, images, videos, and voice notes support
- Added stories feature with 24-hour expiry and circular profile previews
- Added unified feed combining posts and projects from followed users
- Added color-coded story rings (purple for 5+, orange for 3+, blue for 2+, primary for 1)
- Added user search functionality (search by username, name, email)
- Added 1:1 image cropping for profile picture uploads
- Added delete project feature
- Switched from Twitter/X-style to Facebook-style design
- Profile pictures display everywhere (notifications, messages, comments, projects)
- Enhanced direct messaging with image uploads and file attachments
- Made all avatars clickable to navigate to user profiles
- Added learning courses with lessons, enrollment, and progress tracking
- Added Range request support for audio/video streaming in object storage
- Added communities system with feed tabs and category filtering
- Added verification badges for users with email, profile picture, and custom username
- Removed @ prefix from usernames display
- **User Online/Offline Status**: Track and display user online status in messages
  - Heartbeat mechanism updates lastSeenAt every 60 seconds via POST /api/users/heartbeat
  - Online threshold: users seen within 5 minutes are considered online
  - Green/gray status indicators on avatar overlays in conversation list and chat header
  - Text label shows "Online" or "Offline" in chat header
- **Profile Vibes101 Panel**: Display vibecoding learning progress in profile learning tab
  - Shows lessons completed (X / 23) with progress bar
  - Shows quizzes passed (X / 5) with progress bar
  - Displays earned badges with Award icons
  - Shows certificate earned status when complete
  - Continue/Start Learning buttons link to /learn/vibecoding
- **Learn Vibecoding**: Comprehensive 5-module curriculum with real educational content
  - Content based on Andrej Karpathy's original vibecoding concept (February 2025)
  - 23 lessons covering fundamentals to advanced techniques (4+5+5+4+5 per module)
  - All content is readable articles (no fake videos)
  - Lesson viewer dialog with navigation between lessons
  - Modules: Introduction, Prompt Engineering, Workflow, Building Projects, Advanced Techniques
  - **Quiz System**: 25 real questions (5 per module) with 80% passing threshold
  - **Sequential Progression**: Lessons must be completed in order, quizzes unlock after all module lessons
  - **Server-Side Validation**: Quiz answers validated server-side, prevents cheating
  - **Certificate & Badge**: Earned upon completing all 23 lessons and passing all 5 quizzes
  - Database tables: vibecodingProgress, vibecodingQuizProgress, vibecodingCertificates
