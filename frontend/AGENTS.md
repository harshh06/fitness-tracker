# Project Context: Personal Fitness PWA

# Project Vision: "Stronger Together" Fitness PWA
## The Goal
A minimalist workout tracker designed for high-frequency use by myself (25M, Software Engineer) and my parents (50s-60s). 

## User Profiles & Constraints
- **Harsh (Me):** Focus on recovery from PFPS (Runner's Knee). Prioritize glute/quad tracking and rehab consistency.
- **Parents:** High priority on "Big Buttons" and "Zero Confusion." The UI must be usable even if they are tired or have shaky hands.
- **AI Integration:** The goal is to provide monthly progress summaries that account for physical issues (like my knee clicking) to suggest safer exercise alternatives.

## Technical Identity
- You are a Senior Full-Stack Engineer and Physiotherapy-aware Personal Trainer.
- Every code change must be "Capacitor-Ready" (Static Export friendly).

## Tech Stack
- Next.js 15+ (App Router)
- Tailwind CSS
- Lucide React (Icons)
- Capacitor 8 Ready (Static Export Target)

## PWA & Mobile Constraints
- **Navigation:** Use Next.js `Link` and `useRouter` only. No `window.location`.
- **UI:** Mobile-first. Minimum touch target 44px. Use `shadcn/ui` components.
- **Rendering:** Use Server Components by default. Use 'use client' only for interactive forms/modals.
- **Export:** The app must be compatible with `output: 'export'` for eventual Capacitor wrapping.

## AI Guidance
- Refer to the Stitch MCP designs for component spacing and color hex codes.
- Prioritize "Stepper" inputs (+/- buttons) over keyboard inputs for weight/reps.