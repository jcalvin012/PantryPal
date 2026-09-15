# Nouri

Nouri is a mobile-first food management app backed by Supabase.

**Eat smarter. Waste less.**

## Current MVP

- Supabase email/password sign-up and sign-in
- Food inventory add/edit/delete
- Expiry-aware sorting and status labels
- Consumption logging
- Deterministic meal recommendations that prioritize urgent food
- Grocery suggestions from missing meal ingredients
- Food category/search filtering and Quick Snack suggestions
- Smart grocery grouping, quantities, and shopping-list controls
- Installable Progressive Web App (PWA) experience for phones
- Realtime sync across devices using the same account

## Run locally

This version is intentionally dependency-light and can be served as static files. From this directory run a static HTTP server, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Install on your phone

Nouri is a Progressive Web App. When served from a secure HTTPS host, it can be installed from the browser:

- **iPhone/iPad:** open Nouri in Safari → Share → **Add to Home Screen**.
- **Android:** open Nouri in Chrome → menu → **Install app** or **Add to Home screen**.

The service worker caches the app shell and static assets. Internet access is still required for Supabase authentication and database operations.

The browser configuration in `src/config.mjs` contains only the Supabase project URL and **publishable** key. Never replace it with a Supabase secret/service-role key.

## Database

The app expects the existing Nouri Supabase project schema. Row Level Security must remain enabled so each authenticated user can access only their own food, consumption, purchase, and grocery rows.

## Development note

The execution environment used to build this snapshot cannot reach the npm registry, so the app is implemented as a static browser application rather than depending on a package installation/build step. The product architecture can be migrated to Next.js later without changing the database or domain logic.
