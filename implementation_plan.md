# Frontend Redesign Plan

This plan details the massive architectural and aesthetic overhaul to shift the platform from a "glassmorphism/AI-default" style to a serious, developer-focused, information-dense tool (inspired by NeetCode/LeetCode).

## User Review Required
> [!IMPORTANT]
> Please review this plan to ensure the chosen accent color (Deep Amber on Off-White) and layout structures align with your vision for a "serious practice tool." 

## Proposed Changes

---

### Global Styling & Theming
- **Palette**: Transition from dark mode (`slate-900`/`black`) to a neutral light theme (Background: `zinc-50`, Text: `zinc-900`).
- **Accent Color**: Deep Amber (`amber-600`) for primary actions (Submit, Start Attempt) and minimal borders.
- **Typography**: 
  - Sans-serif: `Inter` for prose and feedback.
  - Monospace: `JetBrains Mono` or `SF Mono` for the editor and code snippets.
  - *Constraint*: No all-caps, no tracked-out eyebrows, no gradient text.
- **Cleanup**: Remove all `.glass` CSS classes, soft shadows, and radial background gradients from `globals.css`.

#### [MODIFY] globals.css
- Strip all custom variables related to dark mode and glassmorphism. Define simple root variables for light mode.

#### [MODIFY] app/layout.tsx
- Update the `body` classes to reflect the new `zinc-50` background and `zinc-900` text color.

---

### Landing Page
#### [MODIFY] app/page.tsx
- Replace the default Next.js boilerplate.
- Build a restrained, functional landing page.
- Layout: A simple text introduction followed by a concrete, text-based representation of the practice loop (Problem → Design → Feedback → Retry). 
- Call to Action: A simple solid button to "View Problems".

---

### Problems List View
#### [MODIFY] app/problems/page.tsx
- Convert the current grid of glass cards into a dense, data-rich reference table.
- Columns: `Status` (icon), `Title`, `Category`, `Last Attempt`.
- Styling: Flat borders (`border-zinc-200`), minimal padding, hover states that only slightly darken the row background (`bg-zinc-100`).

---

### Problem Detail & History View
#### [MODIFY] app/problems/[id]/ProblemDetailClient.tsx
- Remove the tabbed interface (Problem vs History).
- Restructure into a clean, split-pane or unified view where requirements are presented as a technical spec document.
- **History Section**: Redesign the history list to be a dense, chronological list (like a git log or deployment history) rather than large decorated cards. Use quiet indicators for status states.

---

### Editor & Feedback View
#### [MODIFY] app/problems/[id]/attempt/[attemptId]/Editor.tsx
- **Editor Layout**: Remove the top tab navigation (`activeStage`). Stack all three stages (Requirements, Class Design, Extension) vertically in a single, continuous scrolling pane to simulate a unified document or IDE view.
- **Syntax Highlighting**: Update `react-simple-code-editor` and `prismjs` themes to a light theme (`prism-coy` or default light).
- **Feedback UI**: Restructure the evaluation results into a "lint report" or "code review" style. 
  - Instead of accordion cards with stars, use structured, monospaced-adjacent blocks.
  - Format: `[4/5] CRITERION_NAME` followed by indented lines for Evidence, Concern, and Suggestion.
- **Toolbar**: Simplify the header. Remove icons where unnecessary. Use plain text buttons (e.g., "[ Save Draft (Cmd+S) ]", "[ Submit ]").

## Verification Plan
### Manual Verification
1. Verify the landing page contains no generic SaaS illustrations or gradients.
2. Ensure the problem list is a clean table without shadows.
3. Validate that the editor allows continuous scrolling through all three stages.
4. Submit an attempt and verify the feedback renders as a clean, structured lint-style report.
