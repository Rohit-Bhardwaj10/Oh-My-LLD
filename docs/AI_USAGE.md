# AI Usage Note

Throughout the development of the LLD Practice Platform, several concrete AI-assisted decisions were made to accelerate development and improve the architecture. Here are 5 concrete examples with their accept/reject reasoning:

## 1. LLM Prompt Engineering for Structured JSON Output
- **Decision:** Use a single prompt to evaluate all three stages at once, requesting a strict JSON schema.
- **AI Assistance:** Initially, we considered making sequential calls to the LLM. The AI suggested that a single holistic prompt would provide better context (so the LLM knows if the Design matches the Requirements) and would be faster and cheaper. It also generated the exact JSON schema required.
- **Outcome (Accepted):** The single holistic prompt significantly reduced evaluation time and provided much more coherent feedback across stages.

## 2. Better Auth Integration Architecture
- **Decision:** Fetch History via Client-Side `useEffect` instead of Server-Side Next.js fetch.
- **AI Assistance:** When attempting to fetch history from the Express backend inside Next.js Server Components, we encountered `401 Unauthorized` errors because the session cookies were not easily forwarded. The AI recommended falling back to client-side fetching with `credentials: 'include'` for the History tab to bypass manual cookie forwarding logic.
- **Outcome (Accepted):** The implementation was much faster, less brittle, and successfully maintained the `better-auth` session context.

## 3. UI/UX Syntax Highlighting in the Editor
- **Decision:** Use `react-simple-code-editor` and `prismjs` over Monaco Editor.
- **AI Assistance:** The user requested syntax highlighting to differentiate comments from code. The AI initially suggested embedding the full Microsoft Monaco Editor (used in VS Code) for robust IDE-like capabilities. 
- **Outcome (Rejected):** I rejected this suggestion. Monaco Editor is too heavy, increases the bundle size significantly, and introduces unnecessary complexity for our simple text-based LLD inputs. Instead, I independently opted for the much lighter `react-simple-code-editor` combined with `prismjs`, which provided the exact visual distinction requested without over-engineering the application.
