# Design Note: LLD Practice Platform

## 1. MVP Scope
The Minimum Viable Product (MVP) focuses on the core loop of an LLD practice session:
1. **Browse**: User views available LLD problems.
2. **Attempt**: User starts an attempt, drafting their solution across three distinct stages (Requirements, Design, Extension).
3. **Evaluate**: User submits the draft. The system evaluates the solution using an LLM and returns structured feedback.
4. **Review**: User reviews the feedback and can view their historical attempts.

## 2. High-Level Design (HLD)
- **Frontend**: Next.js 14 App Router (React). Handles UI, routing, and client-side state for the editor. 
- **Backend API**: Express.js server providing RESTful endpoints for problems and attempts.
- **Database**: PostgreSQL (Neon Serverless).
- **ORM**: Prisma for schema management and type-safe queries.
- **Authentication**: `better-auth` using email/password, integrated with both Express and Next.js.
- **AI Evaluation**: Groq API using open-source models for fast, cost-effective LLM evaluations.

## 3. Class Inventory & Domain Layer
The backend logic is driven by a clean, testable domain layer independent of the database and external APIs:

- `Evaluator` (Interface): Defines `evaluate(stages, problem)`.
- `LLMEvaluator`: Implements `Evaluator` using the Groq SDK. Constructs prompts and parses JSON responses.
- `StubEvaluator`: Implements `Evaluator` for deterministic unit and integration testing.
- `Stage`: Represents a phase of the LLD process (Requirements, Design, Extension). Handles immutability and content updates.
- `Attempt`: Aggregates stages. Determines eligibility for submission.
- `StatusMachine`: Validates state transitions (e.g., `DRAFT` -> `SUBMITTED` -> `EVALUATING` -> `COMPLETED`).
- `SubmissionValidator`: Enforces business rules before submission (e.g., minimum character length).

**Extensibility**: How would the design accommodate another submission format later (e.g., visual diagrams)? Since `Stage.content` is currently a plain string, supporting a diagram format would only require adding a `format` field to the `Stage` model and a corresponding renderer/parser on the frontend. The core domain layer and the `Evaluator` interface would remain completely unaffected.

## 4. Evaluation Approach
We opted for a **Single-Prompt, Multi-Stage Evaluation**. Instead of making three separate LLM calls for Requirements, Design, and Extension, we send the entire context in one prompt. 
- *Why?* LLD is holistic. The AI needs to see if the Design actually satisfies the Requirements, and if the Extension makes sense given the Design.
- *Output*: We enforce a strict JSON schema output from the LLM, containing a list of `results` (one per stage), which includes specific `feedback` criteria (score, evidence, concern, suggestion).

## 5. Trade-offs
- **Custom Express Backend vs Next.js API Routes**: We separated the backend into an Express server to allow a distinct separation of concerns and to make it easier to swap out the frontend or backend independently. 
- **Synchronous vs Asynchronous Evaluation**: Currently, the LLM evaluation runs synchronously in the request lifecycle. 
  - *Trade-off*: It's simpler to implement and deploy (no background queues needed), but it holds the HTTP connection open. If the LLM is slow, it could time out. In a production scenario, this should be moved to a background job queue (e.g., BullMQ or AWS SQS) with WebSockets or long-polling for updates.
