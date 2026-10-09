<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Overview

CalmaFit is a mobile-first calorie, macronutrient, and body weight tracking web application.

The application should prioritize simplicity, usability, performance, and maintainability.

## Design Guidelines

### Mobile-First

- Always design and implement mobile layouts first.
- Use responsive layouts that adapt gracefully to tablet and desktop screens.
- Prioritize touch-friendly interactions and comfortable tap targets.
- Ensure primary actions are easily accessible on mobile devices.
- Avoid horizontal scrolling and unnecessary visual clutter.
- Treat the application as a mobile-first web app that may eventually support PWA installation.

### Design System

- Use Linear (https://linear.app/) as the primary design reference.
- Follow Linear's visual design principles: minimalism, consistency, subtlety, and attention to detail.
- Prefer clean layouts, restrained colors, subtle borders, and thoughtful spacing.
- Maintain consistent typography, spacing, border radii, and component styling.
- Avoid unnecessary gradients, excessive shadows, and decorative elements.
- If uncertain about a design decision, refer to Linear's website for inspiration.
- Do not blindly copy Linear's interface. Adapt its design principles to CalmaFit's functionality and mobile-first requirements.

### UI Components

- Use shadcn/ui as the primary UI component library.
- Always check whether a suitable shadcn/ui component exists before creating a custom component.
- Prefer composing and customizing existing shadcn/ui components.
- Only create custom UI components when the required functionality or component is not available in shadcn/ui.
- Follow shadcn/ui conventions and use Tailwind CSS for styling.
- Maintain consistent component variants, sizes, and interaction states.
- Avoid introducing additional UI component libraries unless absolutely necessary.

### User Experience

- Prioritize clarity and ease of use over visual complexity.
- Minimize the number of interactions required to complete common tasks.
- Provide clear feedback for user actions.
- Ensure loading, empty, error, and success states are handled appropriately.
- Use accessible components with proper keyboard navigation and screen reader support.
- Keep animations subtle, purposeful, and performant.
