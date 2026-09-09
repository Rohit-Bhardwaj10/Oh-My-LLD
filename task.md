# Frontend Redesign (V2)

## Global Styles
- `[x]` Update `globals.css` (remove dark theme/glass, add light theme)
- `[x]` Update `app/layout.tsx` (background and text color classes)
- `[x]` Update `prismjs` theme to a light theme in `Editor.tsx`

## Pages
- `[x]` Redesign `app/page.tsx` (restrained, text-based practice loop)
- `[x]` Redesign `app/problems/page.tsx` (dense reference table)

## Problem Detail & Editor
- `[x]` Refactor `app/problems/[id]/ProblemDetailClient.tsx` (remove tabs, create dense layout)
- `[x]` Refactor `app/problems/[id]/attempt/[attemptId]/Editor.tsx` (continuous vertical scroll for all stages)
- `[x]` Refactor Feedback View in `Editor.tsx` (lint-report style, structured blocks)

## Final Polish
- `[x]` Ensure status states (Draft, Completed, Evaluating) are quiet indicators (e.g. text/dot colors)
- `[x]` Verify responsiveness and clean typography hierarchy
