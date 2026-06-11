# LikasLens

> Neuro-symbolic civic reporting platform
> The platform is a smart community watchdog that lets everyday citizens earn rewards for reporting minor environmental issues, while a public scoreboard holds local governments accountable for how fast they resolve them. For highly dangerous crimes like illegal logging, a built-in safety scanner can instantly warn users to switch into an untraceable "Ghost Mode" to protect their identity. Behind the scenes, a powerful AI brain automatically analyzes the photos, checks local laws, and instantly forwards the report to the exact government agency responsible for taking action.

## Project Structure

```
likaslens/
├── apps/
│   ├── frontend/        # Public marketing website + full web app (port 3000)
│   ├── mobile-pwa/      # Installable mobile PWA with native feel (port 3003)
│   ├── admin-portal/    # Desktop admin dashboard (port 3002)
│   ├── backend/         # Laravel 12 API
│   ├── ai-service/      # Python FastAPI + Google Generative AI
│   └── shared/          # Shared components, API client, types, CSS tokens
├── package.json         # Root pnpm workspace
├── pnpm-workspace.yaml  # Workspace configuration
└── .gitignore
```

## Apps Overview

| App | Port | Audience | Features |
|-----|------|----------|----------|
| **Frontend** | 3000 | Public visitors, citizens | Landing page, dashboard, report, scoreboard, laws, contact |
| **Mobile PWA** | 3003 | Citizens (installed on phone) | Splash screen, onboarding, camera capture, bottom nav, Ghost Mode |
| **Admin Portal** | 3002 | Analysts, super admins | Dashboard, tickets, users, NGOs, laws, rewards, audit logs |

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PHP** >= 8.2 with Composer
- **Python** >= 3.12

## Getting Started

### 1. Install Dependencies

```bash
# Install all Node.js dependencies
pnpm install

# Install PHP dependencies (backend)
cd apps/backend && composer install

# Install Python dependencies (ai-service)
cd apps/ai-service
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment Variables

#### Frontend (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001
```

#### Mobile PWA (`apps/mobile-pwa/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

#### Admin Portal (`apps/admin-portal/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

#### Backend (`apps/backend/.env`) - Supabase Configuration
```env
DB_CONNECTION=pgsql
DB_HOST=db.<your-project-ref>.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<your-supabase-database-password>
```

#### AI Service (`apps/ai-service/.env`)
```env
AI_SERVICE_PORT=8001
GOOGLE_API_KEY=<your-google-api-key>
ENVIRONMENT=development
```

### 3. Run Development Servers

```bash
# Terminal 1: Frontend (Next.js)
pnpm --filter frontend dev

# Terminal 2: Mobile PWA (Next.js)
pnpm --filter mobile-pwa dev

# Terminal 3: Admin Portal (Next.js)
pnpm --filter admin-portal dev

# Terminal 4: Backend (Laravel)
cd apps/backend && php artisan serve --host=127.0.0.1 --port=8000

# Terminal 5: AI Service (FastAPI)
cd apps/ai-service
.venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

## Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Public website + web app |
| Mobile PWA | http://localhost:3003 | Installable mobile app |
| Admin Portal | http://localhost:3002 | Admin dashboard |
| Backend API | http://localhost:8000/api | Laravel REST API |
| AI Service | http://localhost:8001 | FastAPI microservice |
| AI Docs | http://localhost:8001/docs | Swagger UI |

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, PWA (next-pwa)
- **Mobile PWA**: Next.js 16, TypeScript, Tailwind CSS, Embla Carousel, PWA
- **Admin Portal**: Next.js 16, TypeScript, Tailwind CSS
- **Shared**: React components, API client, TypeScript types, CSS design tokens
- **Backend**: Laravel 12, PHP 8.2+
- **AI Service**: FastAPI, Python 3.12+, Google Generative AI
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: pnpm workspaces

## License

MIT
