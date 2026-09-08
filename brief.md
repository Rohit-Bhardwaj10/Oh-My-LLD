# LLD Practice Platform — Build Spec & Handoff Doc

Assignment: CipherSchools 2-Day Engineering Assignment (LLD Practice Platform)
This document captures every decision made during planning, the reasoning behind each,
and the exact build order. Intended to be handed to any engineer/agent with zero prior
context and be immediately actionable.

---

## 1. What We're Building

A small end-to-end practice tool for LLD (Low-Level Design). A learner picks a canonical
LLD problem, works through a staged submission (requirements → class design → extension
reasoning) in one continuous editor panel, submits it, and receives structured,
evidence-based feedback per stage from an LLM evaluator. Past attempts are visible so the
tool supports repeated practice, not one-shot solving.

This is explicitly an **LLD/domain-design exercise**, not an HLD or infra exercise. A
monolith is correct. No Kubernetes, no microservices, no queues/brokers unless justified
as a one-paragraph future extension in the write-up — never implemented.

---

## 2. Inspiration & Deliberate Deviation

We researched Hello Interview's LLD practice product as a reference point.

**What we borrowed:** their staged flow (breaking one attempt into ordered sections with
feedback that can reference earlier sections) and the idea of "change tests" — asking the
learner how their design holds up if a requirement changes — as a gradable dimension.

**What we deliberately did not build:** their live conversational AI-interviewer
simulation, multi-language code execution, and diagram-drawing/reading. Those are
high-fidelity but heavy for a 2-day async practice tool, and out of scope for what this
assignment is grading (domain design, not simulation infra).

This deviation and its reasoning should appear explicitly in the Research Note — it is a
genuine "gap found + product direction" the grading rubric asks for.

---

## 3. Core Product Decisions (confirmed, do not re-litigate)

| Decision | Choice | Why |
|---|---|---|
| Submission format | Single continuous editor, visually one panel, structurally 3 labeled sections (not free-form, not diagram, not executable code) | Smallest format that gives enough evidence of design quality without building a code sandbox or diagram parser |
| Submission structure | Staged: (1) Requirements & Assumptions, (2) Class Design, (3) Extension / Trade-off | Produces stage-specific, referential feedback; bakes the "change test" directly into the product rather than as an afterthought |
| Stage unlock behavior | All 3 sections visible and editable at once; single "Submit" submits all 3 together | Simpler than sequential gating; still yields independently evaluated, independently displayed feedback |
| Evaluation granularity | One LLM call per submission, given all 3 stage contents + problem context, returning a structured array of per-stage results | Cheaper/faster than 3 separate calls; per-stage independent evaluation is noted as a future extension point, not built now |
| Evaluator scope | LLM does ONLY design-quality judgment (responsibility clarity, coupling/cohesion, encapsulation, extensibility, edge-case coverage, explanation quality). Everything else (empty check, duplicate check, state transitions, idempotency) is deterministic, non-LLM code that runs BEFORE the evaluator is ever called | Matches doc's explicit deterministic-vs-LLM split; keeps `Evaluator` responsibility pure and swappable |
| Evaluation output shape | Structured JSON per criterion: `criterion → score → evidence → concern → suggestion` | Avoids the "unconstrained AI score" the doc explicitly warns against; each judgment must cite evidence from the learner's own text |
| Failure handling | Stage/Attempt status machine: `Draft → Submitted → Evaluating → Completed / Failed`. Submission is persisted BEFORE evaluation starts, so a crashed/failed LLM call never loses learner work. Failed attempts are retryable. | Directly answers the doc's "what happens if evaluation takes time or fails" question, without building a distributed system |
| Idempotency | Duplicate submission of identical content while status is `Evaluating` is rejected/no-op, not re-processed | Cheap, deterministic, testable — answers the doc's idempotency callout |
| Architecture | Single Node/Express monolith, single Postgres DB | Matches explicit scope boundary in the assignment |
| Async handling | No message queue/broker. A simple background function call (or same-request await if Groq is fast enough) with DB status tracking is sufficient for 2 days | Doc explicitly forbids turning this into a distributed-systems project |
| Stack | Node.js + Express, PostgreSQL | User's confirmed choice |
| LLM provider | Groq API | User's confirmed choice; keep the call wrapped so provider is swappable |
| Auth | Better Auth, email + password only | User's confirmed choice; real auth, no social/OAuth needed |
| Problems (seed data, 3 total) | Parking Lot, Elevator, Vending Machine | Canonical, well-understood LLD problems — lets rubric be problem-specific without needing more research |
| HLD treatment | Mentioned only as a short paragraph in the Design Note (e.g. "if evaluation load increased, extract Evaluator calls to a background worker behind a queue") — never implemented | Matches doc's "light consideration" instruction exactly |

---

## 4. Domain Model

```
Problem
  - id, title, description, requirements[], constraints[]

Attempt
  - id, problemId, learnerId, status, createdAt
  - has many Stage (exactly 3: requirements, design, extension)

Stage
  - id, attemptId, stageType (enum: REQUIREMENTS | DESIGN | EXTENSION)
  - content (text — free text or mixed pseudocode/text, single field)
  - status (enum: DRAFT | SUBMITTED | EVALUATING | COMPLETED | FAILED)
  - submittedAt

Evaluation
  - id, attemptId
  - results: EvaluationResult[]  (one set per stage, grouped by stageType)
  - createdAt

EvaluationResult
  - stageType, criterion, score, evidence, concern, suggestion

Evaluator (interface)
  - evaluate(stages: Stage[], problem: Problem) -> EvaluationResult[]

LLMEvaluator implements Evaluator
  - wraps Groq API call
  - constructs one prompt containing: problem context, all 3 stage contents,
    fixed rubric per stage type
  - parses structured JSON response into EvaluationResult[]
  - on malformed/failed response: throws, caller marks Attempt/Stage as FAILED
```

**Why `Evaluator` is an interface, not a concrete class used directly:** this is the
single most important design decision for the "extensibility & engineering judgement"
grading criterion (10%) and for answering the doc's question "how would your design
accommodate another evaluation approach later." The practice flow calls
`evaluator.evaluate(...)` and never knows or cares whether the implementation is an LLM
call, a rule-based checker, or a human-review queue. Swapping or adding an evaluator
means writing a new class, not touching the submission flow.

**Where the deterministic gate lives:** as validation logic on `Stage`/`Attempt`
(e.g. a `SubmissionValidator` used before `Evaluator` is ever invoked) — not inside
`LLMEvaluator`. This keeps `LLMEvaluator`'s only job "given valid content, judge it,"
and makes the validation logic trivially unit-testable without mocking an LLM.

---

## 5. Request Flow

1. Learner selects a `Problem`, starts a new `Attempt` (creates 3 `Stage` rows in `DRAFT`).
2. Learner fills all 3 sections in the single editor panel, clicks Submit.
3. Deterministic gate runs (no LLM call yet):
   - all 3 stages non-empty / meet minimum length
   - attempt not already `EVALUATING`
   - not a duplicate of the last identical submission
   - on failure: return validation error, stages stay `DRAFT`, no status change
4. On gate pass: all 3 stages → `SUBMITTED`, then `EVALUATING`. Persist immediately.
5. `LLMEvaluator.evaluate()` is invoked (Groq call) with problem context + all 3 stage
   contents (each later stage's evaluation can reference earlier stage content).
6. On success: parse structured JSON, save `EvaluationResult[]`, stages → `COMPLETED`.
7. On failure/malformed response: stages → `FAILED`, learner can retry (re-trigger step 5
   without re-entering content).
8. Learner views feedback: 3 stacked blocks (one per stage), each showing
   `criterion → score → evidence → concern → suggestion`.
9. Learner can view History: list of past `Attempt`s for a `Problem`, each attempt's
   status and feedback, to support repeated practice.

---

## 6. API Surface (minimal)

```
POST   /auth/signup            (email, password)
POST   /auth/login
GET    /problems                        — list of 3 seeded problems
GET    /problems/:id                    — problem detail
POST   /attempts                        — create new attempt (problemId)
PUT    /attempts/:id/stages             — save/update the 3 stage contents (draft saves)
POST   /attempts/:id/submit             — run deterministic gate + trigger evaluation
GET    /attempts/:id                    — attempt detail incl. status + evaluation if ready
GET    /problems/:id/attempts           — history of attempts for a problem (this learner)
```

---

## 7. Frontend Flow

```
Login/Signup
  → Problem List (3 problems)
    → Problem Detail
      → Editor Panel (one panel, 3 labeled sections: Requirements, Class Design, Extension)
        → Submit
          → Status view (Evaluating spinner → Completed/Failed)
            → Feedback view (3 stacked blocks, one per stage)
      → History tab (past attempts for this problem, revisit any attempt's feedback)
```

---

## 8. Testing Requirements

Per the doc: "tests for important behaviour and at least a few failure/edge cases."
Prioritize testing the deterministic layer (cheap, no mocking needed) and the state
machine over trying to test LLM output quality.

- Unit: `Stage` status transitions (valid transitions only, reject invalid ones)
- Unit: deterministic gate — empty content rejected, duplicate submission rejected,
  submission while `EVALUATING` rejected
- Unit: `Evaluator` interface — a fake/stub `Evaluator` swapped in to prove the flow
  doesn't depend on Groq specifically
- Integration: one full happy-path test — create attempt → submit → (mock Groq response)
  → evaluation saved → status `COMPLETED`
- Integration: one failure-path test — Groq call throws/malformed → status `FAILED` →
  retry succeeds

---

## 9. Build Order (do in this sequence)

1. **Postgres schema** — all 5 tables/enums from Section 4.
2. **Domain classes/interfaces** — `Stage`, `Attempt`, `Evaluator` interface, status enum
   and transition logic (no LLM yet — use a stub `Evaluator` that returns fake data).
3. **Deterministic validation layer** — empty check, duplicate check, state-guard. Write
   its unit tests now, before the LLM exists, since it doesn't depend on Groq.
4. **API routes** — wire up schema + domain classes behind the endpoints in Section 6,
   still using the stub evaluator. Confirm the full flow works end-to-end with fake data.
5. **Auth** — Better Auth email/password, gate the attempt/history routes behind it.
6. **Groq integration (`LLMEvaluator`)** — prompt template (problem + 3 stages + rubric →
   structured JSON), replace the stub evaluator with this real one. Test failure/malformed
   response handling here.
7. **Frontend** — problem list → editor panel → status/feedback view → history view.
8. **Seed data** — Parking Lot, Elevator, Vending Machine problem definitions.
9. **Tests** — fill in the integration tests from Section 8 now that both the stub and
   real evaluator paths exist.
10. **Write-ups** (do not leave to the last hour — this is ~35%+ of the grade):
    - Research Note (1–2 pages): learner problem, tools researched (incl. Hello
      Interview), gaps found, product direction — use Section 2 as the core content.
    - Design Note: MVP explanation, user flow, class/interface list, evaluation
      approach, key trade-offs — use Sections 3–5 as the core content, condensed.
    - README: how to run, key decisions, limitations.
    - AI_USAGE.md: 3–5 concrete AI-assisted decisions (e.g. adopting staged submission
      after comparing to Hello Interview, deciding evaluator interface abstraction,
      deciding one-LLM-call-for-all-stages vs three separate calls, and why each was
      accepted or adjusted).

---

## 10. Deliverables Checklist (final submission)

- [ ] Research Note (1–2 pages)
- [ ] Design Note (MVP, flow, classes, evaluation approach, trade-offs)
- [ ] Working prototype (problem selection → staged submission → feedback → history)
- [ ] Tests (unit + integration, incl. failure/edge cases)
- [ ] README.md (run instructions, decisions, limitations)
- [ ] AI_USAGE.md (3–5 meaningful AI-assisted decisions)
- [ ] Submit via the provided Google Form