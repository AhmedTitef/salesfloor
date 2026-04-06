# SalesFloor

**Log. Track. Win.** — A real-time sales activity tracking and leaderboard app for sales teams.

## What It Does

SalesFloor lets sales reps quickly log activities (calls, callbacks, inspections, etc.) with single-tap buttons, then tracks performance via leaderboards, streaks, personal bests, and daily goals. Managers get a dashboard with team-wide stats and can configure activity types, goals, and team access.

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui components, Lucide React icons
- **Database**: Drizzle ORM + Neon serverless PostgreSQL (production), in-memory DB (local dev — no setup needed)
- **Auth**: Custom session-based auth with HTTP-only cookies, PIN-based team access (4-6 digit, SHA-256 hashed)

## Database Schema

### teams
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | text | Team name |
| pin | text | Hashed PIN |
| createdAt | timestamp | |

In-memory also stores `dailyGoal` (int, default 50) and `plainPin` (for display).

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| teamId | UUID | FK → teams |
| name | text | |
| role | enum | 'rep' or 'manager' |
| createdAt | timestamp | |

### activityTypes
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| teamId | UUID | FK → teams |
| name | text | e.g. "Call", "Callback Booked" |
| color | text | Hex color code |
| icon | text | Lucide icon name or emoji |
| sortOrder | integer | Display order |
| isActive | boolean | Default true |

### activityLogs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| teamId | UUID | FK → teams |
| activityTypeId | UUID | FK → activityTypes |
| notes | text | Optional |
| createdAt | timestamp | |

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page — "Join Your Team" / "Create a Team" |
| `/setup` | Public | Create a new team (manager name, team name, PIN) |
| `/join` | Public | Join existing team (name + team PIN) |
| `/log` | Authenticated | Activity logging — tap buttons, see personal stats, streak, PB, leaderboard position, recent feed. Confetti on milestones. |
| `/dashboard` | Authenticated | Manager/team overview — date filters (Today/Week/Month), totals, top rep, callback %, goal progress, leaderboard, per-activity breakdown |
| `/settings` | Manager only | Display/copy team PIN, set daily goal, manage activity types (add/enable/disable with custom name, color, emoji) |

## API Routes

### Auth & Session
- `GET /api/session` — Get current session
- `DELETE /api/session` — Clear session (logout)

### Teams
- `POST /api/team/create` — Create team (form data)
- `POST /api/team/join` — Join team (JSON body)
- `POST /api/team/join-form` — Join team (form data)
- `PATCH /api/team/goal` — Update daily goal (manager only)

### Activities
- `GET /api/activities` — Get recent activity logs
- `POST /api/activities` — Log a new activity

### Stats
- `GET /api/stats?period=today|week|month` — Team stats, per-rep breakdowns, leaderboard

### Activity Types
- `GET /api/activity-types` — List team's activity types
- `POST /api/activity-types` — Create new type (manager only)
- `PATCH /api/activity-types` — Update type (toggle active, etc.)

## Server Actions

- **`createTeamAction`** (`app/setup/actions.ts`) — Validates form, creates team with 5 default activity types, creates manager user, sets session, redirects to `/dashboard`
- **`joinTeamAction`** (`app/join/actions.ts`) — Validates name + PIN, creates rep user, sets session, redirects to `/log`
- **`logActivityAction`** (`app/log/actions.ts`) — Logs activity from session context, revalidates `/log`

## Default Activity Types

Every new team starts with:
1. **Call** (blue, phone icon)
2. **Callback Booked** (green, calendar icon)
3. **No Book** (red, X icon)
4. **Raffle Sign-up** (gold, ticket icon)
5. **Inspection Booked** (purple, home icon)

## Middleware (`proxy.ts`)

- Protects `/log`, `/dashboard`, `/settings` — redirects to `/` if no session
- Protects `/api/activities`, `/api/stats`, `/api/activity-types` — returns 401 if no session
- Uses `sf_session` cookie

## Auth (`lib/auth.ts`)

- **Session shape**: `{ userId, teamId, role, userName, teamName, dailyGoal }`
- PIN hashing via SHA-256
- `sf_session` HTTP-only cookie, 30-day max age
- Functions: `hashPin()`, `verifyPin()`, `createSession()`, `getSession()`, `clearSession()`

## Components

### Custom
- **Leaderboard** — Ranked reps, gold/silver/bronze styling for top 3
- **StatCard** — Small metric card with optional icon and color border
- **Confetti** — Celebration animation with floating particles and toast
- **DashboardFilter** — Period selector (Today/Week/Month) with client-side routing
- **ActivityButton** — Activity type button with emoji, color, count badge

### shadcn/ui
Button, Card, Input, Label, Badge, Separator, Skeleton, ScrollArea, Tabs, AlertDialog, Avatar, DropdownMenu

## Database Strategy

- **Development**: In-memory via `globalThis` — zero setup, data resets on server restart
- **Production**: PostgreSQL via Neon + Drizzle ORM — persistent, scalable
- Switch by setting `DATABASE_URL` environment variable

## User Flows

**Create Team**: `/` → `/setup` → form (team name, manager name, PIN) → server action creates team + default types + manager user → session cookie → `/dashboard`

**Join Team**: `/` → `/join` → form (name, team PIN) → server action verifies PIN, creates rep → session cookie → `/log`

**Rep Daily Use**: Opens `/log` → sees personal stats (total, by type, PB, streak, rank) → taps activity buttons → page revalidates → confetti on goal/PB hit

**Manager**: Accesses `/dashboard` for team metrics across time periods → `/settings` for PIN management, goal setting, activity type curation

## Getting Started

```bash
npm install
npm run dev
```

No database setup needed for local dev — the in-memory DB works out of the box. For production, set `DATABASE_URL` to a Neon PostgreSQL connection string.

## Key Features

- Single-tap activity logging with emoji/color-coded buttons
- Real-time leaderboards ranked by total activities
- Daily team goal with progress bar and confetti celebration
- Streak tracking (consecutive days of activity)
- Personal best tracking with new-record celebrations
- Competitive nudges (shows gap to #1)
- Time-based filtering (Today/Week/Month)
- Recent activity feed (last 10 entries)
- Customizable activity types (name, color, emoji)
- PIN-based team access (no registration flow)
- Role-based UI (rep vs manager)
