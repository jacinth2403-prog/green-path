# Carbon Compass 

## Chosen Vertical

**Sustainability & Climate Awareness**

Carbon Compass is a web application that helps users understand, track, and reduce their carbon footprint through personalized insights, recommendations, and progress tracking.

---

## Problem Statement

Many people want to live more sustainably but do not know which daily activities contribute most to their carbon footprint.

Carbon Compass addresses this challenge by transforming everyday lifestyle choices into measurable environmental impact and actionable recommendations.

---

## Approach & Logic

The application collects user inputs across four major categories:

* ⚡ Energy
* 🚗 Transportation
* 🥗 Food
* ♻️ Waste

Each response is processed using activity-based emission factors to estimate monthly carbon emissions.

The system then:

1. Calculates the user's estimated carbon footprint.
2. Identifies major contributing categories.
3. Generates personalized insights.
4. Suggests practical reduction strategies.
5. Allows users to simulate changes through an Impact Simulator.
6. Tracks progress across multiple assessments.

---

## How the Solution Works

### Assessment Engine

Users complete a lifestyle questionnaire covering energy consumption, transportation habits, food choices, and waste generation.

### Carbon Calculation Engine

Assessment responses are converted into estimated monthly emissions using predefined emission factors.

### Insights & Recommendation Engine

The application analyzes the footprint breakdown and generates personalized recommendations based on user responses.

### Impact Simulator

Users can explore how lifestyle changes may affect their overall footprint through interactive controls.

### Carbon Journey

Previous assessments are stored locally and visualized through charts and progress tracking.

---

## Tech Stack

### Frontend

* React
* TypeScript
* TanStack Start
* TanStack Router
* Tailwind CSS

### Data Visualization

* Recharts

### Storage

* Browser Local Storage

### Deployment

* Lovable

### AI-Assisted Development Tools

* Lovable
* ChatGPT

---

## AI Usage

### Lovable

* Rapid UI prototyping
* Frontend generation
* Component creation and refinement

### ChatGPT

* Feature planning
* Carbon calculation review
* Recommendation logic improvements
* UX feedback and debugging assistance

---

## Assumptions

* Emission factors are simplified and intended for educational use.
* Results are estimates and not official carbon audits.
* User-provided information is assumed to be accurate.
* Assessment history is stored locally within the browser.

---

## Future Enhancements

* Regional emission factor databases
* User accounts and cloud synchronization
* Advanced recommendation personalization
* Community sustainability challenges
* AI-powered carbon reduction coaching

---

## Repository

GitHub Repository:
https://github.com/jacinth2403-prog/green-path

## Live Demo

https://jacicarboncompass.lovable.app/



# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
is a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
