# LLD Practice Platform — Master Build Plan

> **Stack:** Next.js 14 (App Router, full-stack — API Routes replace Express), PostgreSQL, Better Auth, Groq API  
> **Structure:** Single Next.js app — `app/api/` handles the backend, `app/(routes)/` handles the UI  
> **Env:** `.env.local` — you supply `DATABASE_URL`, `GROQ_API_KEY`, `BETTER_AUTH_SECRET`  
> **Test runner:** Vitest (works natively with TypeScript + Next.js, no babel config needed)

---

## Repository Layout (final state)

```
lld-platform/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── problems/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── attempts/route.ts
│   │   └── attempts/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── stages/route.ts
│   │           └── submit/route.ts
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── problems/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── attempt/[attemptId]/
│   │           ├── page.tsx
│   │           └── feedback/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── Stage.ts
│   │   ├── Attempt.ts
│   │   ├── StatusMachine.ts
│   │   ├── SubmissionValidator.ts
│   │   ├── Evaluator.ts            # Interface
│   │   ├── LLMEvaluator.ts         # Groq implementation
│   │   └── StubEvaluator.ts        # Test double
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── migrate.ts
│   └── auth.ts
├── tests/
│   ├── unit/
│   │   ├── StatusMachine.test.ts
│   │   ├── SubmissionValidator.test.ts
│   │   ├── Stage.test.ts
│   │   └── StubEvaluator.test.ts
│   └── integration/
│       ├── happyPath.test.ts
│       ├── failurePath.test.ts
│       └── duplicate.test.ts
├── docs/
│   ├── RESEARCH_NOTE.md
│   ├── DESIGN_NOTE.md
│   └── AI_USAGE.md
├── .env.local.example
├── docker-compose.yml
├── README.md
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Vertical Slices

---

### SLICE 1 — Foundation: Scaffold + DB + Auth

**Goal:** Project runs, DB schema exists, login/signup works, protected routes redirect unauthenticated users.

**Files:**
- `package.json` — next, react, better-auth, pg, groq-sdk, zod; devDeps: typescript, vitest
- `next.config.ts` — serverExternalPackages: ['pg']
- `tsconfig.json` — strict, @/* alias
- `docker-compose.yml` — Postgres 16, port 5432, db: lld_platform
- `.env.local.example`
- `lib/db/schema.sql` — 5 tables + 2 enums (see Appendix A)
- `lib/db/seed.sql` — 3 problems (Parking Lot, Elevator, Vending Machine)
- `lib/db/client.ts` — pg.Pool singleton
- `lib/db/migrate.ts` — runs schema.sql then seed.sql idempotently
- `lib/auth.ts` — Better Auth config, email+password, Postgres adapter
- `app/api/auth/[...all]/route.ts` — Better Auth Next.js handler
- `middleware.ts` — protect /problems /attempts routes
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/layout.tsx` — Inter font, dark background
- `app/globals.css` — CSS custom properties (dark navy, indigo, cyan)

**Done when:** signup works, login redirects to /problems stub page.

---

### SLICE 2 — Domain Layer: Core LLD Classes

**Goal:** All domain classes + interfaces exist, fully typed, unit tests pass — zero DB/LLM dependency.

> Graded at 25%. Every class has a single, named responsibility.

**Files:**
- `lib/domain/types.ts` — StageType, StageStatus, AttemptStatus enums; Problem, StageData, AttemptData, EvaluationResult interfaces
- `lib/domain/Evaluator.ts` — THE KEY INTERFACE: evaluate(stages, problem) => EvaluationResult[]
- `lib/domain/StatusMachine.ts` — canTransition(), assertTransition(), valid transitions map
- `lib/domain/Stage.ts` — transitionTo(), withContent(), toRecord()
- `lib/domain/Attempt.ts` — getStage(), isEligibleForSubmission(), getOverallStatus()
- `lib/domain/SubmissionValidator.ts` — validateNotEmpty, validateNotEvaluating, validateNotDuplicate (SHA-256 hash)
- `lib/domain/StubEvaluator.ts` — implements Evaluator, returns deterministic fake results
- `lib/domain/LLMEvaluator.ts` — implements Evaluator, wraps Groq, buildPrompt(), parseResponse(), throws EvaluationParseError

**Unit tests:**
- `tests/unit/StatusMachine.test.ts` — all valid/invalid transitions
- `tests/unit/Stage.test.ts` — transition enforcement, immutable withContent
- `tests/unit/SubmissionValidator.test.ts` — empty reject, duplicate reject, evaluating-state reject, happy path
- `tests/unit/StubEvaluator.test.ts` — satisfies Evaluator interface contract

**Done when:** `npm test` passes all unit tests with zero DB/Groq needed.

---

### SLICE 3 — Problems API + Problem List UI

**Goal:** Learner sees 3 LLD problems and clicks into problem detail.

**Files:**
- `app/api/problems/route.ts` — GET list
- `app/api/problems/[id]/route.ts` — GET detail
- `app/problems/page.tsx` — 3 glassmorphism cards, hover animation
- `app/problems/[id]/page.tsx` — Problem tab + History tab shell (History populated in Slice 6)

**Seed data in seed.sql:**
- Parking Lot: multi-floor, vehicle types, spot types, fee calc, concurrency notes
- Elevator System: multiple lifts, SCAN scheduling, door state machine
- Vending Machine: inventory, payment (exact+change), idle/has-money/dispensing states

**Done when:** /problems shows 3 cards, click shows full requirements.

---

### SLICE 4 — Attempt Creation + Editor

**Goal:** Learner starts an attempt, writes in 3 sections, auto-save works.

**Files:**
- `app/api/attempts/route.ts` — POST: create Attempt row + 3 Stage rows (DRAFT)
- `app/api/attempts/[id]/route.ts` — GET: attempt + stages + evaluation
- `app/api/attempts/[id]/stages/route.ts` — PUT: update stage content (DRAFT only)
- `app/problems/[id]/attempt/[attemptId]/page.tsx` — Editor (client component):
  - 3 labeled textareas (Requirements, Class Design, Extension)
  - Char count + 50-char minimum indicator
  - Auto-save every 30s (debounced)
  - Manual "Save Draft" button
  - "Submit Design" button

**Done when:** Editor loads, 3 sections save to DB, content persists on refresh.

---

### SLICE 5 — Submission + Evaluation + Feedback

**Goal:** Submit triggers deterministic gate then Groq evaluation; feedback renders per stage; failures are retryable.

**Files:**
- `app/api/attempts/[id]/submit/route.ts`:
  1. Load attempt + stages from DB
  2. Load last attempt (for duplicate check)
  3. SubmissionValidator.validate() — 400 on failure
  4. Mark stages SUBMITTED → EVALUATING, persist
  5. LLMEvaluator.evaluate() — await in-request
  6a. Success: save EvaluationResult[], stages → COMPLETED
  6b. Failure: stages → FAILED, return { retryable: true }
- `app/problems/[id]/attempt/[attemptId]/feedback/page.tsx`:
  - Polls GET /api/attempts/:id every 2s while EVALUATING
  - Spinner with pulsing stage labels
  - On COMPLETED: 3 accordion blocks, criterion cards (score stars, evidence quote, concern, suggestion)
  - On FAILED: "Retry Evaluation" button

**Groq prompt design:** one call, all 3 stages, structured JSON response.

**Integration tests:**
- `tests/integration/happyPath.test.ts` — full flow with StubEvaluator → COMPLETED
- `tests/integration/failurePath.test.ts` — FailingEvaluator → FAILED → retry → COMPLETED
- `tests/integration/duplicate.test.ts` — same content re-submit → 400

**Done when:** Full loop works: select problem → write → submit → see feedback.

---

### SLICE 6 — History + UI Polish

**Goal:** History tab works. UI is premium and responsive. All edge cases covered.

**Files:**
- `app/api/problems/[id]/attempts/route.ts` — GET attempts for learner+problem, ordered by date
- Update `app/problems/[id]/page.tsx` — History tab with attempt list, status badges, avg score, "View Feedback" links
- UI polish: loading skeletons, toast notifications, Cmd+Enter shortcut, mobile responsive, empty states

**Done when:** History shows past attempts; starting new attempt while history exists works correctly.

---

### SLICE 7 — Documentation + Final Checks

**Goal:** All deliverables written. Submission-ready.

**Files:**
- `docs/RESEARCH_NOTE.md` — learner problem, tools researched (Hello Interview, Educative, NeetCode), gaps, direction
- `docs/DESIGN_NOTE.md` — MVP, flow, class inventory, evaluation approach, trade-offs, brief HLD note
- `docs/AI_USAGE.md` — 5 concrete AI-assisted decisions with accept/reject reasoning
- `README.md` — setup, env vars, run instructions, test instructions, limitations
- Final checks: `npm run build` (zero TS errors), `npm test` (all pass), manual E2E

---

## Appendix A — Full Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE stage_type     AS ENUM ('REQUIREMENTS', 'DESIGN', 'EXTENSION');
CREATE TYPE stage_status   AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATING', 'COMPLETED', 'FAILED');
CREATE TYPE attempt_status AS ENUM ('DRAFT', 'SUBMITTED', 'EVALUATING', 'COMPLETED', 'FAILED');

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]',
  constraints  JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  UUID NOT NULL REFERENCES problems(id),
  learner_id  UUID NOT NULL REFERENCES users(id),
  status      attempt_status NOT NULL DEFAULT 'DRAFT',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id   UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  stage_type   stage_type NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  status       stage_status NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  UNIQUE (attempt_id, stage_type)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) UNIQUE,
  results    JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Appendix B — Environment Variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lld_platform
GROQ_API_KEY=gsk_...
BETTER_AUTH_SECRET=your-32-char-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

---

## Slice Status Tracker

| Slice | Status | Notes |
|-------|--------|-------|
| 1 — Foundation | ⬜ Not started | |
| 2 — Domain Layer | ⬜ Not started | |
| 3 — Problems API + UI | ⬜ Not started | |
| 4 — Attempt + Editor | ⬜ Not started | |
| 5 — Submission + Evaluation | ⬜ Not started | |
| 6 — History + Polish | ⬜ Not started | |
| 7 — Documentation | ⬜ Not started | |
