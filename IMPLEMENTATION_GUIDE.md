# Pulse Fitness — Implementation Guide

> Work through milestones in order. Check off steps as you go. Commit after each numbered step.

---

## Tech Stack (Updated)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Database | **Neon (PostgreSQL 16)** | Serverless, auto-resumes, no manual unpausing |
| Backend | **Python 3.12 + FastAPI** | Async, OpenAPI auto-docs |
| Auth | **FastAPI + JWT** | passlib + python-jose, self-managed |
| AI/Agents | **LangGraph + Gemini 2.5 Flash** | Multi-step reasoning |
| Local Storage | **IndexedDB via Dexie.js** | Offline-first |
| Frontend | **Next.js** | Already built |

---

## Time Estimate

| Milestone | Est. Time | Pace (evenings + weekends) |
|-----------|-----------|---------------------------|
| 1 — Database & Neon | 2–3 days | ~1 week |
| 2 — FastAPI Backend + Auth | 5–7 days | ~2 weeks |
| 3 — Frontend Integration | 4–5 days | ~1.5 weeks |
| 4 — AI Coach (LangGraph) | 5–7 days | ~2 weeks |
| 5 — Polish & Deploy | 2–3 days | ~1 week |
| **Total** | **~18–25 days** | **~4–6 weeks** |

> [!TIP]
> You'll have a fully working app with real data after Milestone 3. Milestones 4–5 are the "wow factor" layer.

---

## Prerequisites

- [ ] **Install Xcode Command Line Tools**
  ```bash
  sudo xcode-select --install
  ```
- [ ] **Install Python 3.12+**
  ```bash
  brew install python@3.12
  ```
- [ ] **Verify project structure**
  ```
  fitness-tracker/
  ├── frontend/          # Next.js app (exists)
  ├── backend/           # FastAPI app (you'll create)
  ├── migrations/        # SQL migration files (you'll create)
  ├── .gitignore
  └── IMPLEMENTATION_GUIDE.md
  ```

---

## Milestone 1: Database & Neon Setup
> **Goal:** Production-ready Postgres database with full schema, indexes, and seed data.
> **Done when:** All 15 tables exist and you can run the example queries from your schema doc.

### 1.1 — Create Neon Project

- [ ] Go to [neon.tech](https://neon.tech), sign up, create a project called `pulse-fitness`
- [ ] Pick the region closest to you (e.g., `us-east-1`)
- [ ] Copy the connection string from the dashboard — it looks like:
  ```
  postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
- [ ] Create `.env` at the project root:
  ```env
  DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
  JWT_SECRET=generate-a-random-64-char-string-here
  GEMINI_API_KEY=your-key-later
  ```

### 1.2 — Set Up Migration Tooling

- [ ] Create a `migrations/` folder at the project root
- [ ] You'll write numbered SQL files: `001_create_tables.sql`, `002_create_indexes.sql`, etc.
- [ ] To run migrations, you'll use `psql` or Neon's SQL Editor in the dashboard
- [ ] Install `psql` if you don't have it:
  ```bash
  brew install libpq && brew link --force libpq
  ```
- [ ] Test connection:
  ```bash
  psql "$DATABASE_URL" -c "SELECT 1;"
  ```

### 1.3 — Migration: Core Tables

- [ ] Create `migrations/001_create_tables.sql`
- [ ] Write CREATE TABLE statements in this order (respecting FK dependencies):

**Users table** (replaces Supabase `auth.users` — you manage this yourself now):
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Then the rest of your schema tables in order:
1. `profiles` — FK → `users(id)` (instead of `auth.users`)
2. `health_conditions` — FK → profiles
3. `exercise_library` — standalone
4. `exercise_muscles` — FK → exercise_library
5. `exercise_contraindications` — FK → exercise_library
6. `workouts` — FK → profiles
7. `workout_exercises` — FK → workouts, exercise_library
8. `exercise_sets` — FK → workout_exercises
9. `body_measurements` — FK → profiles
10. `workout_templates` — FK → profiles
11. `template_exercises` — FK → workout_templates, exercise_library
12. `personal_records` — FK → profiles, exercise_library, workouts
13. `coach_conversations` — FK → profiles
14. `coach_messages` — FK → coach_conversations
15. `monthly_summaries` — FK → profiles

> [!WARNING]
> Use your schema doc as the exact reference for column types and CHECK constraints. The only change: replace all `auth.users` references with your new `users` table. Remove all RLS policies — access control is handled in FastAPI.

- [ ] Add the `updated_at` trigger function and apply to relevant tables
- [ ] Add a trigger to auto-create a `profiles` row when a `users` row is inserted:
  ```sql
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, 'User');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ```
- [ ] Run the migration:
  ```bash
  psql "$DATABASE_URL" -f migrations/001_create_tables.sql
  ```

### 1.4 — Migration: Indexes

- [ ] Create `migrations/002_create_indexes.sql`
- [ ] Add all indexes from your schema doc (the CREATE INDEX block)
- [ ] Run it: `psql "$DATABASE_URL" -f migrations/002_create_indexes.sql`

### 1.5 — Migration: Seed Exercise Library

- [ ] Create `migrations/003_seed_exercises.sql`
- [ ] Insert ~50 common exercises with correct categories, equipment, difficulty
- [ ] Insert corresponding `exercise_muscles` rows (primary/secondary)
- [ ] Insert `exercise_contraindications` for PFPS-relevant exercises
- [ ] Run it: `psql "$DATABASE_URL" -f migrations/003_seed_exercises.sql`

> [!TIP]
> Use an LLM to generate the seed INSERT statements — give it your table schema and ask for 50 exercises with muscle mappings. Verify before running.

### 1.6 — Verify

- [ ] Open Neon dashboard → SQL Editor
- [ ] Run `\dt` or `SELECT tablename FROM pg_tables WHERE schemaname = 'public';` — verify all tables exist
- [ ] Run the 4 example queries from your schema doc — should work with no errors
- [ ] Verify exercise_library has data: `SELECT COUNT(*) FROM exercise_library;`

**✅ Milestone 1 complete when:** All tables exist, indexes are in place, and exercise library is seeded.

---

## Milestone 2: FastAPI Backend + Auth
> **Goal:** REST API with self-managed JWT auth, workout CRUD, profile, exercise search, and analytics.
> **Done when:** All endpoints work in Swagger UI (`/docs`) with real data from Neon.

### 2.1 — Scaffold the Project

- [ ] Create the directory structure:
  ```bash
  mkdir -p backend/app/{routers,models,services,agents}
  touch backend/app/{__init__,main,config,dependencies,auth}.py
  touch backend/app/routers/{__init__,auth,workouts,profile,exercise_library,analytics,coach}.py
  touch backend/app/models/{__init__,schemas}.py
  touch backend/app/services/{__init__,workout_service,analytics_service,ai_coach_service}.py
  touch backend/requirements.txt
  ```
- [ ] Write `requirements.txt`:
  ```
  fastapi[standard]>=0.115
  uvicorn[standard]>=0.30
  asyncpg>=0.29
  sqlalchemy[asyncio]>=2.0
  psycopg2-binary>=2.9
  pydantic-settings>=2.0
  python-dotenv>=1.0
  python-jose[cryptography]>=3.3
  passlib[bcrypt]>=1.7
  httpx>=0.27
  ```
- [ ] Create venv and install:
  ```bash
  cd backend && python3.12 -m venv venv
  source venv/bin/activate && pip install -r requirements.txt
  ```

> [!NOTE]
> **Key difference from Supabase:** You're using `asyncpg` + `SQLAlchemy` (or raw asyncpg) to talk to Neon directly. No Supabase client library needed.

### 2.2 — Config & Database Connection

- [ ] **`config.py`**: Use `pydantic-settings` to load `DATABASE_URL`, `JWT_SECRET` from env
- [ ] **`dependencies.py`**: Create an async database connection pool using asyncpg:
  ```python
  import asyncpg
  from app.config import settings

  pool: asyncpg.Pool | None = None

  async def get_db() -> asyncpg.Connection:
      async with pool.acquire() as conn:
          yield conn
  ```
- [ ] **`main.py`**: Create FastAPI app, init DB pool on startup, add CORS for `localhost:3000`

### 2.3 — Auth System (Self-Managed JWT)

This replaces Supabase Auth. ~100 lines of code total.

- [ ] **`auth.py`** — core auth utilities:
  ```python
  from passlib.context import CryptContext
  from jose import jwt, JWTError
  from datetime import datetime, timedelta

  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

  def hash_password(password: str) -> str:
      return pwd_context.hash(password)

  def verify_password(plain: str, hashed: str) -> bool:
      return pwd_context.verify(plain, hashed)

  def create_access_token(user_id: str, expires_delta: timedelta = timedelta(hours=24)) -> str:
      payload = {"sub": user_id, "exp": datetime.utcnow() + expires_delta}
      return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

  def decode_token(token: str) -> str:
      payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
      return payload["sub"]  # returns user_id
  ```
- [ ] **`dependencies.py`** — add `get_current_user` dependency:
  ```python
  from fastapi import Depends, HTTPException
  from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

  security = HTTPBearer()

  async def get_current_user(
      credentials: HTTPAuthorizationCredentials = Depends(security),
  ) -> str:
      try:
          user_id = decode_token(credentials.credentials)
          return user_id
      except JWTError:
          raise HTTPException(status_code=401, detail="Invalid token")
  ```
- [ ] **Auth router** (`routers/auth.py`):
  - `POST /auth/signup` — hash password, insert into `users` table, return JWT
  - `POST /auth/login` — verify password, return JWT + refresh token
  - `POST /auth/refresh` — issue new JWT from refresh token

> [!IMPORTANT]
> This is the backbone of your app. Every protected route uses `user_id = Depends(get_current_user)`. Test it thoroughly before moving on.

### 2.4 — Profile Router

- [ ] `GET /profile` — fetch current user's profile + active health_conditions
- [ ] `PUT /profile` — update profile fields
- [ ] `POST /profile/health-conditions` — add a health condition
- [ ] `PUT /profile/health-conditions/{id}` — update (verify ownership via user_id)
- [ ] `DELETE /profile/health-conditions/{id}` — remove

### 2.5 — Exercise Library Router

- [ ] `GET /exercises/search?q=squat&muscle_group=quads&equipment=barbell`
  - Use the GIN full-text index for name search
  - Filter by muscle_group via join to `exercise_muscles`
  - Include user's custom exercises (`created_by = user_id OR is_system = true`)
- [ ] `POST /exercises` — create custom exercise
- [ ] `GET /exercises/{id}` — single exercise with muscles + contraindications

### 2.6 — Workout CRUD Router

Most complex router. Build a service layer in `workout_service.py`.

- [ ] **Pydantic models** (`models/schemas.py`):
  - `SetCreate`, `ExerciseCreate`, `WorkoutCreate`, `WorkoutResponse`
- [ ] `POST /workouts` — create with nested exercises + sets (use a DB transaction)
- [ ] `GET /workouts?limit=20&offset=0` — paginated, exclude soft-deleted, filter by `user_id`
- [ ] `GET /workouts/{id}` — full workout with exercises/sets (verify ownership)
- [ ] `PUT /workouts/{id}` — update metadata
- [ ] `PUT /workouts/{id}/complete` — set `completed_at`
- [ ] `DELETE /workouts/{id}` — soft delete

> [!TIP]
> Use `asyncpg`'s transaction support: `async with conn.transaction():` to ensure the nested create is atomic.

### 2.7 — Analytics Router

- [ ] `GET /analytics/summary?months=1` — total workouts, volume, duration, top muscle groups
- [ ] `GET /analytics/volume?exercise_id=xxx&months=6` — weekly volume progression
- [ ] `GET /analytics/personal-records` — all PRs for the user
- [ ] These are mostly SQL aggregation queries — build in `analytics_service.py`

### 2.8 — Verify Everything

- [ ] Start: `uvicorn app.main:app --reload --port 8000`
- [ ] Open `http://localhost:8000/docs`
- [ ] Test full flow: signup → login → update profile → add health condition → create workout → fetch history → get analytics
- [ ] Verify access control: use User A's JWT, try to fetch User B's data — should fail

**✅ Milestone 2 complete when:** All endpoints work in Swagger, data persists in Neon, and auth protects all routes.

---

## Milestone 3: Frontend ↔ Backend Integration
> **Goal:** Replace all mock data with real API calls. Add offline support.
> **Done when:** You can sign up, log a workout, see it in history, and view real dashboard stats.

### 3.1 — Set Up API Client

- [x] Create `frontend/lib/api.ts`:
  - Wraps `fetch` with base URL (`http://localhost:8000` from env)
  - Attaches `Authorization: Bearer <token>` from stored session
  - Handles 401 → redirect to login
  - Typed methods: `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.delete()`

### 3.2 — Build Auth State Management

- [x] Create `frontend/lib/auth-context.tsx`:
  - React context providing `user`, `token`, `login()`, `signup()`, `logout()`
  - Store JWT in `localStorage` (or Capacitor-safe storage later)
  - On app load: check for stored token, validate it, set user state
  - Wrap the app in `<AuthProvider>`

### 3.3 — Build Auth Pages

- [x] Create `/login` page — email + password, big touch targets for parents
- [x] Create `/signup` page — email, password, display name
- [x] Add route protection: layout-level check → redirect to `/login` if no token
- [x] Test: sign up → auto-redirect to dashboard

### 3.4 — Set Up Dexie.js for Offline-First

- [x] `npm install dexie` in `frontend/`
- [x] Create `frontend/lib/db.ts` — Dexie schema mirroring your API responses
- [x] Pattern: **write to IndexedDB first → sync to backend in background**

### 3.5 — Build Data Hooks

In `frontend/lib/hooks/`:

- [ ] `useAuth()` — login state, user info
- [ ] `useProfile()` — fetch/update profile (local-first)
- [ ] `useWorkouts()` — list, create, paginate
- [ ] `useWorkout(id)` — single workout detail
- [ ] `useExerciseSearch(query)` — debounced search
- [ ] `useAnalytics()` — dashboard summary

### 3.6 — Wire Up Pages

Replace mock data page by page:

- [ ] **Dashboard** — `useAnalytics()` for stats, `useWorkouts(limit=5)` for recent
- [ ] **Workout Page** — exercise search + `POST /workouts` on complete
- [ ] **History Page** — `useWorkouts()` with pagination
- [ ] **Profile Page** — `useProfile()` + health conditions CRUD
- [ ] **Coach Page** — leave for Milestone 4

### 3.7 — Test End-to-End

- [ ] Start both servers (backend :8000, frontend :3000)
- [ ] Full flow: signup → profile → log workout → check history → check dashboard
- [ ] Test offline: stop backend → save workout → restart → verify sync

**✅ Milestone 3 complete when:** Real data flows end-to-end. No more mock data (except Coach).

---

## Milestone 4: AI Coach — LangGraph Agent
> **Goal:** Interactive AI coach aware of workout history, injuries, and goals.
> **Done when:** You can chat with the coach and get personalized, injury-aware advice.

### 4.1 — Install AI Dependencies

- [ ] Add to `requirements.txt`: `langgraph>=0.2`, `langchain-google-genai>=2.0`, `langchain-core>=0.3`
- [ ] Get Gemini API key from [AI Studio](https://aistudio.google.com/), add to `.env`

### 4.2 — Build Agent Tools (`agents/tools.py`)

- [ ] `get_workout_history(user_id, days=30)` — recent workouts with exercises/sets
- [ ] `get_user_profile(user_id)` — age, weight, health conditions
- [ ] `get_volume_trends(user_id, muscle_group, months=3)` — weekly volume
- [ ] `search_safe_exercises(muscle_group, user_id)` — filtered by contraindications
- [ ] Wrap each as a LangChain `@tool`

### 4.3 — Build LangGraph State Machine (`agents/coach_graph.py`)

- [ ] Define `CoachState(TypedDict)` — messages, user_profile, workouts, intent
- [ ] **Router node** → classify: "general" / "planning" / "recovery"
- [ ] **General Fitness node** — basic questions with workout context
- [ ] **Workout Planner node** — plans using volume trends + contraindications
- [ ] **Recovery Advisor node** — health conditions × recent activity
- [ ] **Response node** — format output with optional exercise suggestions
- [ ] Compile the graph

### 4.4 — Build Prompt Templates (`agents/prompts.py`)

- [ ] System prompt with user profile, health conditions, volume stats
- [ ] Injury-aware hard rules (PFPS: avoid deep squats, prefer leg press, etc.)
- [ ] Age-aware rules (>50: lower impact, longer warmups)

### 4.5 — Build Coach Endpoints

- [ ] `POST /coach/chat` — send message, get response (non-streaming first)
- [ ] `GET /coach/conversations` — list past chats
- [ ] `GET /coach/conversations/{id}` — full history
- [ ] Test: "What should I do for leg day given my knee issues?"

### 4.6 — Add Streaming (SSE)

- [ ] `POST /coach/chat/stream` — StreamingResponse with event generator
- [ ] Test with curl

### 4.7 — Monthly Summary Generation

- [ ] `backend/app/services/summary_service.py` — pull 30 days, call Gemini, write to `monthly_summaries`
- [ ] `POST /admin/generate-summaries` endpoint (or CLI command)

### 4.8 — Wire Up Frontend

- [ ] `useCoach()` hook — send message, handle streamed response
- [ ] Replace static Coach page with real chat
- [ ] Show monthly summary on Dashboard or Coach page

**✅ Milestone 4 complete when:** Real AI conversations referencing your workout data and respecting injury constraints.

---

## Milestone 5: Polish & Deploy
> **Goal:** Production-ready and live on your parents' phones.

### 5.1 — Error Handling & Validation

- [ ] Consistent error response format across all endpoints
- [ ] Rate limiting on `/coach/chat`
- [ ] Frontend error boundaries + toast notifications

### 5.2 — Testing

- [ ] Unit tests for analytics (pytest)
- [ ] Integration tests for workout CRUD
- [ ] Access control tests (user A can't see user B's data)

### 5.3 — Dockerize & Deploy

- [ ] `backend/Dockerfile` (multi-stage, slim Python)
- [ ] Deploy FastAPI to Railway or Fly.io
- [ ] Deploy Next.js frontend to Vercel
- [ ] Set env vars, update CORS for production domain
- [ ] Add `GET /health` endpoint

### 5.4 — Ship

- [ ] Create accounts for parents, walk them through the app
- [ ] Optional: add Capacitor for native mobile wrapper

**✅ Milestone 5 complete when:** App is live, all 3 users can sign up and use it.

---

## Quick Reference

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Run a migration
psql "$DATABASE_URL" -f migrations/001_create_tables.sql
```

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI entry point |
| `backend/app/auth.py` | Password hashing + JWT creation |
| `backend/app/dependencies.py` | DB pool + `get_current_user` |
| `backend/app/routers/workouts.py` | Workout CRUD |
| `backend/app/agents/coach_graph.py` | LangGraph state machine |
| `frontend/lib/api.ts` | API client wrapper |
| `frontend/lib/auth-context.tsx` | Auth state management |
| `frontend/lib/db.ts` | Dexie.js offline storage |
| `frontend/lib/hooks/*.ts` | Data hooks |
| `migrations/*.sql` | Database schema |

> [!IMPORTANT]
> **Don't skip Milestone 1.** A solid schema saves you from painful refactors later.

> [!TIP]
> **Commit after each numbered step** for clean rollback points and a great git history.
