- `[x]` Update `server/prisma/schema.prisma` with domain models (User, Problem, Attempt, Stage, Evaluation)
- `[x]` Run `npx prisma db push` and `npx prisma generate` in `server`
- `[x]` Create `server/prisma/seed.ts` and run it to seed Problems
- `[x]` Install backend dependencies (`express`, `cors`, `better-auth`, etc.)
- `[x]` Set up `server/src/auth.ts` and `server/src/index.ts`
- `[x]` Install `better-auth` client in `web`
- `[x]` Create `web/lib/auth-client.ts`
- `[x]` Create `web/middleware.ts` to protect `/problems` and `/attempts`
- `[x]` Create `web/app/(auth)/login/page.tsx` and `web/app/(auth)/signup/page.tsx`
- `[x]` Add global styles in `web/app/globals.css`
- `[x]` Create stub page at `web/app/problems/page.tsx`
- `[x]` Test full flow (Signup -> Redirect to /problems -> Ensure db reflects the new user)

### SLICE 2: Domain Layer
- `[x]` Install `groq-sdk` and `vitest` in `server/`
- `[x]` Setup `vitest.config.ts`
- `[x]` Create `types.ts`, `Evaluator.ts`, `StatusMachine.ts`, `Stage.ts`, `Attempt.ts`, `SubmissionValidator.ts`
- `[x]` Create `StubEvaluator.ts` and `LLMEvaluator.ts`
- `[x]` Write unit tests for `StatusMachine`, `Stage`, `SubmissionValidator`, and `StubEvaluator`
- `[x]` Verify all tests pass

### SLICE 3: Problems API + Problem List UI
- `[x]` Create `server/src/routes/problems.ts` (GET /api/problems, GET /api/problems/:id)
- `[x]` Register problems router in `server/src/index.ts`
- `[x]` Rewrite `web/app/problems/page.tsx` with glassmorphism cards
- `[x]` Create `web/app/problems/[id]/page.tsx` with Problem/History tabs
- `[x]` Install `lucide-react` in `web/`
