# Frontend Folder Structure Rationale

This document explains the production-standard, scalable frontend layout for this repo and the reasons behind it. It does not replace or modify the existing technical decisions doc.

## Goals
- Keep routing clean and easy to audit.
- Make business logic reusable across routes.
- Support multiple teams working in parallel without merge conflicts.
- Allow gradual scaling without a full rewrite.

## Recommended Layout (Feature-Based)

```
services/web/src
├── app/                  # Routing layer (thin)
│   ├── layout.tsx
│   ├── (auth)/
│   ├── forum/
│   └── chat/
├── features/             # Business logic + domain UI
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── forum/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   └── chat/
│       ├── components/
│       ├── hooks/
│       └── services/
├── components/           # Shared UI (design system)
│   └── ui/
├── lib/                  # Shared utilities (api, config)
└── hooks/                # Shared hooks (useDebounce, useMediaQuery)
```

## Why This Works at Scale
- **Thin routing layer**: All pages in `app/` stay small and focused on routing, params, and simple composition. This makes it easy to read and reduces churn.
- **Feature ownership**: `features/` is domain-based, so the chat team can own chat logic without touching unrelated routes.
- **Reusable logic**: Hooks, services, and components in `features/` can be reused by multiple routes (for example, a chat widget and a full chat page).
- **Clear boundaries**: Shared UI and utilities are centralized, which prevents duplication and inconsistent patterns.

## What Goes Where
- **app/**: route entry points only. Typically `return <FeaturePage />`.
- **features/**: domain UI, business logic, data fetching, state.
- **components/**: shared UI building blocks (buttons, inputs, cards).
- **lib/**: shared utilities and API clients.
- **hooks/**: shared hooks that are not domain-specific.

## Example: Forum Page

**Route entry** (thin):
```
app/forum/page.tsx
```
- calls `ForumPage` from `features/forum/components`.

**Feature page** (thick):
```
features/forum/components/ForumPage.tsx
```
- renders toolbar + list
- uses `useForum` hook
- calls API from `features/forum/services`

## Tradeoffs
- **More folders upfront**: Slightly more structure than a route-colocated style.
- **Better long-term scaling**: Easier to maintain when the app grows.

## Migration Notes
This layout can be adopted gradually. You can start with a single feature (forum or chat), move its logic into `features/`, and keep the rest route-colocated until you are ready.

## Mapping Current Web To This Layout
This is a concrete mapping from the current `services/web/src` structure to the feature-based layout described above. It keeps the routes the same and splits the UI and logic into `features/`.

### Current Routes
- `app/(main)/home/page.tsx` (forum-style home list)
- `app/(main)/home/projects/page.tsx` (projects grid)
- `app/(main)/home/projects/[slug]/page.tsx` (project detail + forum list)
- `app/(main)/forum/page.tsx` (forum placeholder)
- `app/login/page.tsx` (login)
- `app/auth/callback/page.tsx` (OAuth callback)

### Suggested Feature Mapping

```
services/web/src
├── app/
│   ├── (main)/
│   │   ├── home/
│   │   │   ├── page.tsx                 # uses features/forum/components/HomeForumPage
│   │   │   └── projects/
│   │   │       ├── page.tsx             # uses features/projects/components/ProjectsGridPage
│   │   │       └── [slug]/page.tsx      # uses features/projects/components/ProjectForumPage
│   │   └── forum/page.tsx               # uses features/forum/components/ForumPage
│   ├── login/page.tsx                   # uses features/auth/components/LoginPage
│   └── auth/callback/page.tsx           # uses features/auth/components/AuthCallbackPage
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginPage.tsx
│   │   │   └── AuthCallbackPage.tsx
│   │   └── services/
│   │       └── auth-api.ts
│   ├── forum/
│   │   ├── components/
│   │   │   ├── ForumPage.tsx
│   │   │   └── HomeForumPage.tsx
│   │   ├── hooks/
│   │   │   └── useForum.ts
│   │   └── store/
│   │       └── forum-store.ts
│   └── projects/
│       ├── components/
│       │   ├── ProjectsGridPage.tsx
│       │   └── ProjectForumPage.tsx
│       ├── hooks/
│       │   └── useProjects.ts
│       └── data/
│           └── projects.ts
```

### How The Pages Would Look
- **Route files stay thin**: they import a feature page and return it.
- **Feature pages hold UI + logic**: they render toolbars, lists, and call hooks/services.
- **Shared UI stays in components/ui**: buttons, cards, inputs.
- **Data mock file moves**: current `app/(main)/home/projects/data.ts` becomes `features/projects/data/projects.ts`.

This mapping keeps your current URLs but aligns the code organization with the scalable layout.
