# Changelog

All notable changes to LikasLens will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.4] - 2026-06-09

### Changed
- **Docs**: Updated all 4 sprint roadmap docs with accurate task completion status
- **Docs**: Dev 1 (Lou) — 14 checkboxes flipped, 8 new items added (changelog, loading states, EXIF, offline queue, etc.)
- **Docs**: Dev 2 (Jeff) — 3 new items added (rate limiting, logging, stability hardening); flagged missing `asean_expansion.py`
- **Docs**: Dev 3 (Charlyn) — 2 checkboxes flipped, 8 new items added (security fixes, HasApiTokens, pagination, etc.)
- **Docs**: Dev 4 (Katherine) — 3 checkboxes flipped, 4 new items added (mobile PWA, icons, i18n, .env.example)

## [0.7.3] - 2026-06-09

### Removed
- **Frontend**: Deleted `Untitled-1.txt` (XAMPP config accidentally committed)
- **Frontend**: Deleted stale `pnpm-lock.yaml` (workspace uses root lockfile)
- **Frontend**: Deleted duplicate `tailwind.config.js` (`.ts` version already exists)
- **Frontend**: Deleted 11 dead/orphaned files (theme-provider, quick-actions, mock-data, pdf-export-config, region6 data, duplicate re-exports)

### Changed
- **Docs**: Moved 16 root-level markdown files to `docs/archive/` (historical artifacts)
- **Backend**: Moved `.sql` migration to `database/sql/` (was misleadingly in PHP migrations dir)
- **Shared**: Renamed `LikasyChat.tsx` → `likasy-chat.tsx` (kebab-case consistency)
- **Frontend**: Renamed `exifStripper.ts` → `exif-stripper.ts` (kebab-case consistency)

## [0.7.2] - 2026-06-09

### Fixed
- **Frontend**: Added loading spinner to login form submit button via `useFormStatus`
- **Frontend**: Contact form now shows success only after API responds (was showing before)
- **Frontend**: Contact form submit button shows loading state during submission
- **Frontend**: Fixed storage validation message from "2MB" to "25MB"
- **Backend**: Added pagination to `TicketAssignment::index()` (20 per page)
- **Backend**: Added pagination to `AchievementController::catalog()` (50 per page)
- **Shared**: Fixed abort signal override in `laravelFetch` — caller's signal now properly chains with timeout controller

## [0.7.1] - 2026-06-09

### Fixed
- **Backend**: Added rate limiting to auth endpoints (5/min register, 10/min login, 20/min sync)
- **Backend**: Added rate limiting to report endpoints (10/min submit, 20/min triage)
- **Backend**: Removed reporter email from public `GET /tickets/{id}` response (PII leak)
- **Backend**: Fixed N+1 query in `UserImpactController` — batch-fetches tickets instead of per-report queries
- **Frontend**: EXIF stripping now applied in all modes, not just Ghost Mode (AGENTS.md compliance)
- **Mobile PWA**: Wired Supabase session token to shared API client after login/register
- **Mobile PWA**: Created `.env.example` with required environment variables
- **Shared**: Created missing `yolo-labels` JSON files for fil, vi, id, ms, ta locales

## [0.7.0] - 2026-06-09

### Fixed
- **Backend**: Removed `role` parameter from `/auth/sync` — prevents privilege escalation (CVE-like)
- **Backend**: Moved `/admin/users` index behind `auth:sanctum` + `role:super_admin` middleware
- **Backend**: Added `role:analyst,super_admin` middleware to `/reports/verify` — prevents self-verification fraud
- **Backend**: Replaced `JULIANDAY()` with `EXTRACT(EPOCH FROM ...)` for PostgreSQL compatibility
- **Frontend**: Fixed double `/api` prefix in dashboard `laravelGet("/api/user/impact")` → `laravelGet("/user/impact")`
- **Frontend**: Fixed double `/api` prefix in auth sync URL
- **Frontend**: Set `secure: true` on `laravel_token` cookie in production environments
- **Mobile PWA**: Fixed middleware auth bypass — `isLocalePath` was skipping auth for ALL locale-prefixed routes
- **Mobile PWA**: Public route matching now uses segment-based check instead of `includes()` substring match
- **Mobile PWA**: Login redirect now preserves user's locale instead of hardcoding "en"

## [0.6.3] - 2026-06-09

### Added
- **AI Service**: Request logging middleware with timing, status codes, and request IDs
- **AI Service**: Rate limiting middleware (60 req/min general, 10 req/min for expensive endpoints)
- **AI Service**: Structured logging configuration with timestamps

### Fixed
- **AI Service**: Synced `pyproject.toml` with `requirements.txt` (was missing ultralytics, Pillow, numpy, python-multipart)
- **AI Service**: Updated version to 0.2.0 in pyproject.toml

## [0.6.2] - 2026-06-09

### Fixed
- **AI Service**: Added try/except with proper error handling in `analyze_image()` — no more raw tracebacks to clients
- **AI Service**: Added image size validation (20MB max, 16MP cap with auto-resize) to prevent OOM
- **AI Service**: Fixed Gremlin injection vulnerability — all IDs validated against `^[a-zA-Z0-9_\-:.@]+$` pattern
- **AI Service**: Added Gremlin query timeouts (30s) with `asyncio.wait_for()`
- **AI Service**: Added Gremlin reconnection with retry logic (2 retries on stale connection)
- **AI Service**: Moved `analyze_image()` to `asyncio.to_thread()` — no longer blocks the event loop
- **AI Service**: Added global FastAPI exception handler with consistent JSON error responses
- **AI Service**: Added Gemini API timeouts (30s) in both `chat_proxy.py` and `hazard_analyzer.py`
- **AI Service**: `genai.configure()` called once at startup instead of on every request
- **AI Service**: Error messages no longer leak internal details (connection strings, API keys)
- **AI Service**: CORS now reads from `CORS_ORIGINS` env var (falls back to localhost defaults)
- **AI Service**: Pinned all dependency versions with upper bounds
- **AI Service**: Dockerfile now uses non-root user and includes `HEALTHCHECK`

## [0.6.1] - 2026-06-09

### Fixed
- **DevOps**: Fixed `outputDirectory` in root `vercel.json` — changed from `.next` to `apps/frontend/.next` (was causing 404 on all pages)
- **DevOps**: Fixed `outputDirectory` in `apps/admin-portal/vercel.json` — changed from `.next` to `apps/admin-portal/.next`
- **DevOps**: Re-added `ignoreCommand` to root `vercel.json` for branch-based deployment filtering

## [0.6.0] - 2026-06-09

### Added
- **Frontend**: New `mobile-pwa` app with onboarding, dashboard, report, scoreboard, login/register
- **Frontend**: Impact dashboard page with recharts bar charts and activity feed
- **Frontend**: Public changelog page at `/changelog` parsing `CHANGELOG.md` at build time
- **Shared**: New UI components — sidebar, skeleton, dashboard-layout, mobile-layout, app-header, bottom-nav
- **Shared**: Civic Brutalism CSS design tokens
- **Mobile PWA**: PWA icons (192x192, 512x512, maskable, apple-touch)
- **Mobile PWA**: i18n messages for fil, id, ms, ta, vi locales
- **Mobile PWA**: Not-found page
- **Docs**: Restored sprint and hackathon docs under `docs/roadmap/`
- **Docs**: Updated sprint roadmap with new team structure and task completion status

### Fixed
- **Frontend**: Recharts type errors in impact dashboard (Next.js 16 stricter type checking)
- **Frontend**: Framer-motion `ease` type error on landing page (tuple vs readonly array)
- **Frontend**: Added `next` as peer dependency to shared package
- **Build**: Corrected `.gitignore` encoding (UTF-16 to UTF-8)
- **Build**: Updated `pnpm-lock.yaml` for shared package changes
- **Admin Portal**: Login client and sidebar improvements

### Changed
- **Team**: Roseby removed; Lou joined as Dev 1 (Frontend); Katherine moved to Dev 4 (Integration)
- **Docs**: Sprint docs reorganized with new team roster (Lou=Dev1, Jeff=Dev2, Charlyn=Dev3, Katherine=Dev4)
- **Docs**: Removed `.next` build cache directories from git tracking
- **Shared**: API client improvements and mobile layout adjustments
- **Shared**: Bottom nav component refinements

## [0.5.0] - 2026-06-08

### Added
- **Backend**: ASEAN LawSeeder with Philippine environmental laws for regional compliance
- **Backend**: DemoDataSeeder to populate initial demo data in the database
- **Backend**: ViolationTypeSeeder and updated DatabaseSeeder orchestration
- **Backend**: User achievements seeding for demo data
- **Backend**: Soft deletes for EnvironmentalLawPh with restore capability
- **Backend**: Audit logging for CRUD operations in Admin controllers
- **Frontend**: `useOfflineQueue` hook for managing offline report submissions
- **Docs**: Dataflow architecture diagrams (Mermaid, ASCII, HTML)
- **Docs**: Demo script and one-pager for ASEAN AI Hackathon
- **Docs**: Pitch deck for ASEAN AI Hackathon presentation
- **Docs**: Sprint Dev-2 and Dev-3 guide updates

### Fixed
- **Backend**: Seeder compatibility with Supabase UUID primary keys
- **Backend**: NgoSeeder column filtering against actual schema to survive pre-migration runs
- **Frontend**: Ticket statistics query optimization and leaderboard caching
- **Backend**: Azure environment variable update script

### Changed
- **Backend**: Optimized ticket statistics queries with caching for leaderboard endpoint

## [0.4.0] - 2026-05-18

### Added
- **Frontend**: Multilingual i18n with `next-intl` supporting 6 locales (en, fil, vi, id, ms, ta)
- **Frontend**: Locale-based routing with `[locale]` dynamic segment
- **Frontend**: Gamified profile component with achievement tracking and user stats
- **Frontend**: Account deletion functionality with Supabase and Laravel integration
- **Frontend**: Password visibility toggle in login and registration forms
- **Frontend**: Tabbed settings navigation (notifications, security, account, platform)
- **Frontend**: Toast notification system across admin and frontend
- **Frontend**: Global toast provider for consistent notification handling
- **Frontend**: Local storage preferences in settings page
- **Shared**: LikasyChat persona/locale support for multilingual chatbot
- **Shared**: Manual translations for all 5 non-English locales
- **Backend**: Supabase user synchronization and profile management controllers
- **Backend**: LawSeeder registered in DatabaseSeeder
- **Backend**: Ghost role validation in AdminUserController
- **Backend**: Auto deployment workflows for AI service and backend (Azure)
- **Backend**: CI/CD pipeline fixes for Azure Container Apps
- **DevOps**: Azure deployment workflow corrections and Dockerfile improvements

### Fixed
- **Frontend**: Settings page language dropdown wired to all 6 locales
- **Frontend**: Header double text rendering
- **Frontend**: Global toast contrast and accessibility issues
- **Frontend**: Account deletion action double `/api` prefix
- **Frontend**: Language toggle, law search, and report double-prefix issues
- **Frontend**: Supabase `citizen_achievements` UUID query guard and CORS credentials
- **Frontend**: `localeNames` TypeScript cast for i18n compatibility
- **Backend**: Absolute API URL enforcement with protocol guard to prevent 404s
- **Backend**: Docker `bootstrap/cache` directory creation for deployment
- **Backend**: `--no-scripts` flag on `composer install` to avoid missing artisan during build
- **Backend**: localhost fallback removal and missing Sanctum dependency
- **Backend**: `.single()` coercion crash in Supabase queries
- **Backend**: Production CORS custom domain configuration
- **DevOps**: `libgl1-mesa-glx` replaced with `libgl1` for Debian Trixie compatibility
- **DevOps**: Duplicate `deploy-ai-service.yml` workflow removed
- **DevOps**: Azure `appSourcePath` and placeholder input corrections

### Changed
- **Frontend**: Button hover styles standardized across components
- **Frontend**: Sidebar active link styles and hover effects improved for accessibility
- **Frontend**: Code structure refactored for readability and performance

## [0.3.0] - 2026-05-17

### Added
- **AI Service**: Neuro-symbolic hazard analysis endpoint with Gremlin graph traversal + Gemini synthesis
- **AI Service**: Hazard analyzer models (`HazardRequest`, `HazardResponse`) for incident summaries
- **AI Service**: Secure chat proxy endpoint (`/api/v1/chat`) for Likasy chatbot
- **Frontend**: Likasy AI chat assistant component with interactive Gemini chat interface
- **Frontend**: `useGeminiChat` hook for AI chat integration
- **Frontend**: Chatbot markdown parsing with nested ordered list cleanup
- **Frontend**: Privacy Policy, Terms of Service, and Contact pages with brutalist design
- **Frontend**: Contact message submission form connected to backend API
- **Frontend**: Profile image upload with EXIF stripping for privacy
- **Frontend**: Manual coordinate entry for GPS location failures
- **Frontend**: Notification dropdown with mock notifications in header
- **Frontend**: Incident row action dropdown with keyboard and mouse event handling
- **Frontend**: Eco-Credit system with wallet management and user event handling
- **Frontend**: Citizen Dashboard UI with brutalist design and status indicators
- **Frontend**: Footer component integrated into layout
- **Backend**: ContactMessage model and migration for `contact_messages` table
- **Backend**: Contact message controller with store and admin index endpoints
- **Backend**: EnsureRoleMiddleware for role-based authorization
- **Backend**: Feature tests for EnsureRoleMiddleware authorization logic
- **Backend**: Eco-Credit engine with `CitizenWallet`, `CreditPool`, `RewardPointLedger` models
- **Shared**: UI components moved to shared library for cross-app reuse
- **Admin Portal**: Role-based responsive sidebar component
- **Admin Portal**: LikasyChat integration for admin-portal
- **Admin Portal**: Tailwind CSS configuration and brutalist design system
- **Admin Portal**: Admin landing page with hero background and backdrop-blur

### Fixed
- **Frontend**: EXIF metadata stripping only applied when Ghost Mode is enabled (preserves forensic evidence otherwise)
- **Frontend**: Turbopack compile failure from missing div in IncidentsPage
- **Frontend**: Sidebar active link styles and hover effects for accessibility
- **Frontend**: `aria-label` on home link in AppHeader for accessibility
- **Security**: Likasy chatbot secured by proxying Gemini through ai-service
- **Security**: Likasy chat routed through Laravel backend to reach internal AI service

### Changed
- **Frontend**: Primary color variables and button styles updated in IncidentsPage
- **Frontend**: Layout and sidebar styles refactored for responsiveness and visual consistency
- **Shared**: Build tracing refactored and dashboard reports improved

## [0.2.0] - 2026-05-14

### Added
- **Frontend**: Supabase authentication integration (login, register, email confirmation)
- **Frontend**: Dashboard page with contributor profile and citizen impact data
- **Frontend**: Report submission page with image upload and GPS data handling
- **Frontend**: Camera test page with `useCamera` hook for photo capture
- **Frontend**: Ghost Mode functionality with EXIF metadata stripping
- **Frontend**: PWA configuration with manifest, theming, and icon support
- **Frontend**: Public scoreboard and leaderboard display
- **Frontend**: Eco-Brutalist UI redesign with forest backgrounds and dynamic theming
- **Frontend**: Theme switching (civic/ghost) with persistent state
- **Frontend**: Edge interceptor modal for risk assessment
- **Frontend**: User profile page with settings
- **Frontend**: Role-aware sidebar gating for analyst/super_admin navigation
- **Frontend**: Region 6 town analytics pages with role-based access
- **Frontend**: BottomNav component for mobile navigation
- **Frontend**: Data-driven progress bars across dashboard components
- **Frontend**: PDF export functionality for reports
- **Frontend**: GeoTagMap component for location-based reporting
- **Frontend**: Offline status handling on report page
- **Frontend**: Responsive mobile improvements across all pages
- **Backend**: Report submission endpoint and controller
- **Backend**: CORS configuration for cross-origin requests
- **Backend**: Leaderboard API endpoint with active users sorted by reward points
- **Backend**: Report storage with Supabase integration and reports migration
- **Backend**: Incident seeder with 26 Region VI environmental tickets
- **Backend**: NGO seeder with 34 realistic Region VI NGOs
- **Backend**: Baseline laws, NGOs, and jurisdictions with migration scripts and models
- **Backend**: Supabase S3 configuration for file storage
- **Backend**: Middleware for route protection and authentication flow
- **Backend**: Admin user seeder for creating admin/analyst users via Supabase Admin API
- **Scripts**: Integration check and auth flow test scripts

### Fixed
- **Frontend**: Spelling correction in camera test page (`initialising` -> `initializing`)
- **Frontend**: Merge conflicts in `pnpm-lock.yaml` resolved
- **Frontend**: Vercel deployment metadata and output directory path
- **Frontend**: State initialization in OfflineBanner
- **Backend**: Laravel API URL to use localhost with PHP extension configuration
- **Backend**: Report controller Data URI prefix stripping for base64 decode
- **Build**: `pnpm-workspace.yaml` `allowBuilds` option enabled
- **Build**: Turbopack configuration added to Next.js setup

### Changed
- **Frontend**: Login and home pages revamped with improved UI and structure
- **Frontend**: Sign-up form restyled with additional user data handling
- **Frontend**: Conditional logic simplified in login page for readability
- **Frontend**: Dashboard enhanced with new components and mock data for alerts
- **Frontend**: Report submission form UI enhanced with improved layout and visual feedback

## [0.1.0] - 2026-04-11

### Added
- **Monorepo**: pnpm workspace configuration with `apps/frontend`, `apps/backend`, `apps/ai-service`
- **Monorepo**: Root `package.json` with workspace scripts (`dev`, `build`, `lint`)
- **Monorepo**: Syncpack configuration for dependency version management
- **Monorepo**: `.gitignore` and `.gitattributes` for monorepo hygiene
- **Frontend**: Next.js 16 App Router project with TypeScript and Tailwind CSS
- **Frontend**: Supabase client/server helpers in `src/utils/supabase`
- **Backend**: Laravel 12 project with PHP 8.2+ and Composer
- **Backend**: Sanctum authentication setup
- **AI Service**: FastAPI project with Python 3.12
- **AI Service**: Gremlin graph topology and bootstrap queries
- **AI Service**: YOLOv8 model integration for image analysis
- **Docs**: README with project overview, prerequisites, and setup instructions
- **Docs**: System status and setup documentation
- **Agents**: Specialized agent instructions for backend, frontend, and AI service
- **Agents**: LikasLens Copilot Skills Library

[Unreleased]: https://github.com/J-Akiru5/LikasLens/compare/v0.7.4...HEAD
[0.7.4]: https://github.com/J-Akiru5/LikasLens/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/J-Akiru5/LikasLens/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/J-Akiru5/LikasLens/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/J-Akiru5/LikasLens/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/J-Akiru5/LikasLens/compare/v0.6.3...v0.7.0
[0.6.3]: https://github.com/J-Akiru5/LikasLens/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/J-Akiru5/LikasLens/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/J-Akiru5/LikasLens/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/J-Akiru5/LikasLens/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/J-Akiru5/LikasLens/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/J-Akiru5/LikasLens/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/J-Akiru5/LikasLens/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/J-Akiru5/LikasLens/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/J-Akiru5/LikasLens/releases/tag/v0.1.0
