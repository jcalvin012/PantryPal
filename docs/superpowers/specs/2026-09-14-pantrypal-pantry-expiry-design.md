# PantryPal Pantry & Expiry MVP Design

## Goal
Build the first usable PantryPal slice: authenticated household pantry tracking with expiry-aware dashboarding, quick inventory entry, consumption, deterministic meal suggestions, and grocery prompts.

## Product experience
PantryPal is a mobile-first, friendly pantry assistant. The primary navigation is Home, Pantry, Meals, Grocery, and Settings. Home emphasizes what needs attention now: expired items, items expiring within seven days, pantry count, and meals that can use urgent ingredients.

## Architecture
The frontend is a dependency-light static web app so it can be run immediately without a build server in environments where npm installation is unavailable. Supabase provides Auth and PostgreSQL; the browser calls the Supabase Auth and REST APIs using the publishable key, while existing RLS policies enforce per-user ownership. Smart logic is deterministic in this MVP and lives in small pure functions so it can later be replaced or extended with AI without changing the UI contracts.

## Data flow
1. User signs up or logs in through Supabase Auth.
2. Pantry items are loaded from `public.pantry_items` for the authenticated user.
3. Expiry logic classifies each item as expired, expiring soon (0–3 days), upcoming (4–7 days), or safe (>7 days).
4. Home and Pantry sort urgent items first.
5. Consumption decreases the selected pantry quantity and records a `consumption_logs` row.
6. Meal suggestions rank recipes by how many pantry ingredients are available and whether they consume urgent items.
7. Grocery suggestions use missing meal ingredients and low/empty pantry signals; purchase history is retained for the next recommendation iteration.

## Security
Only the Supabase publishable key is used in the browser. No service-role or secret key is embedded in the app. Pantry, consumption, purchase, and grocery data remain protected by the existing RLS policies keyed to `auth.uid()`.

## Current database
The Supabase project already contains `profiles`, `pantry_items`, `recipes`, `recipe_ingredients`, `consumption_logs`, `purchase_logs`, and `grocery_items`. The generated TypeScript schema was verified on 2026-09-14.

## MVP success criteria
- A user can create an account and sign in.
- A signed-in user can add, edit, consume, and delete pantry items.
- Expiry urgency is visible at a glance and sorted consistently.
- Home shows urgent pantry items and useful meal suggestions.
- Meals show deterministic recommendations based on current pantry contents.
- Grocery shows actionable missing-ingredient suggestions.
- The UI works on mobile and desktop and has a modern, minimal visual hierarchy.
