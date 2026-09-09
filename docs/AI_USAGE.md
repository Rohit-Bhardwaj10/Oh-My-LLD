# AI Usage Note

Throughout the development of the LLD Practice Platform, several concrete AI-assisted decisions were made to accelerate development and improve the architecture. Here are 5 concrete examples with their accept/reject reasoning:

## 1. Domain Modeling and State Machines
- **Decision:** Use a strict State Machine (`StatusMachine`) for Attempt and Stage transitions.
- **AI Assistance:** The AI proposed representing the transition constraints as a strict graph (`DRAFT` -> `SUBMITTED` -> `EVALUATING` -> `COMPLETED` | `FAILED`) enforced by a `StatusMachine` class, rather than scattering `if/else` checks in the controllers.
- **Outcome (Accepted):** This greatly improved testability. We could write exhaustive unit tests for `StatusMachine` without mocking the database.

## 2. LLM Prompt Engineering for Structured JSON Output
- **Decision:** Use a single prompt to evaluate all three stages at once, requesting a strict JSON schema.
- **AI Assistance:** Initially, we considered making sequential calls to the LLM. The AI suggested that a single holistic prompt would provide better context (so the LLM knows if the Design matches the Requirements) and would be faster and cheaper. It also generated the exact JSON schema required.
- **Outcome (Accepted):** The single holistic prompt significantly reduced evaluation time and provided much more coherent feedback across stages.

## 3. Dealing with Neon Database Keepalive
- **Decision:** Implement a Keepalive ping mechanism for Prisma.
- **AI Assistance:** We encountered frequent `P1001` (Can't reach database server) errors due to Neon Database suspending idle compute. The AI identified the issue and suggested implementing a keepalive timer that runs a lightweight `SELECT 1` query to keep the pooler connection warm.
- **Outcome (Accepted):** This completely resolved the intermittent connection errors.

## 4. Better Auth Integration Architecture
- **Decision:** Fetch History via Client-Side `useEffect` instead of Server-Side Next.js fetch.
- **AI Assistance:** When attempting to fetch history from the Express backend inside Next.js Server Components, we encountered `401 Unauthorized` errors because the session cookies were not easily forwarded. The AI recommended falling back to client-side fetching with `credentials: 'include'` for the History tab to bypass manual cookie forwarding logic.
- **Outcome (Accepted):** The implementation was much faster, less brittle, and successfully maintained the `better-auth` session context.

## 5. UI/UX Syntax Highlighting in the Editor
- **Decision:** Use `react-simple-code-editor` and `prismjs` over Monaco Editor.
- **AI Assistance:** The user requested syntax highlighting to differentiate comments from code. We weighed options and the AI suggested `react-simple-code-editor` combined with `prismjs` for a lightweight footprint, avoiding the heavy bundle size and complexity of Monaco Editor.
- **Outcome (Accepted):** It provided the exact visual distinction requested without over-engineering the text area.
