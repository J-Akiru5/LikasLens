# LikasLens

> Neuro-symbolic civic reporting platform
>The platform is a smart community watchdog that lets everyday  citizens earn rewards for reporting minor environmental issues, while a public scoreboard holds local governments accountable for how fast they resolve them. For highly dangerous crimes like illegal logging, a built-in safety scanner can instantly warn users to switch into an untraceable "Ghost Mode" to protect their identity. Behind the scenes, a powerful AI brain automatically analyzes the photos, checks local laws, and instantly forwards the report to the exact government agency responsible for taking action.

## Project Structure

```
likaslens/
├── apps/
│   ├── frontend/       # Next.js (App Router) + TypeScript + Tailwind CSS + PWA
│   ├── backend/        # Laravel 12 API
│   └── ai-service/     # Python FastAPI + Google Generative AI
├── package.json        # Root pnpm workspace
├── pnpm-workspace.yaml # Workspace configuration
├── .syncpackrc         # Syncpack configuration
└── .gitignore
```

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PHP** >= 8.2 with Composer
- **Python** >= 3.12

## Getting Started

### 1. Install Dependencies

```bash
# Install Node.js dependencies (frontend)
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
cd apps/frontend && pnpm dev

# Terminal 2: Backend (Laravel)
cd apps/backend && php artisan serve --host=127.0.0.1 --port=8000

# Terminal 3: AI Service (FastAPI)
cd apps/ai-service
.venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

Or from root (workspace package dev scripts only):
```bash
pnpm dev
```

Important:
- `pnpm dev` executes the root workspace script `pnpm -r --parallel run dev`.
- That runs each package `dev` script in the workspace, but it does **not** run Laravel's PHP server command.
- The Laravel API must still be started explicitly from `apps/backend` using `php artisan serve`.
- If AI service dependencies are missing (e.g. `No module named uvicorn`), run `pip install -r requirements.txt` inside `apps/ai-service` after activating the virtual environment.

## Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js PWA |
| Backend API | http://localhost:8000/api | Laravel REST API |
| AI Service | http://localhost:8001 | FastAPI microservice |
| AI Docs | http://localhost:8001/docs | Swagger UI |

## Health Checks

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/up
- Backend API: http://localhost:8000/api/health
- AI Service: http://localhost:8001/health

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, PWA (next-pwa)
- **Backend**: Laravel 12, PHP 8.2+
- **AI Service**: FastAPI, Python 3.12+, Google Generative AI
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: pnpm workspaces, syncpack

## License

MIT
