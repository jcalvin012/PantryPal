# PantryPal Pantry & Expiry MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working mobile-first PantryPal web app covering authentication, pantry CRUD, expiry prioritization, consumption logging, deterministic meals, and grocery suggestions.

**Architecture:** Use a dependency-light static web app with browser-side Supabase Auth and REST access. Keep expiry and recommendation algorithms as pure modules with Node built-in tests; keep UI state and Supabase integration in focused browser modules.

**Tech Stack:** HTML5, CSS, modern browser JavaScript modules, Supabase Auth/REST API, PostgreSQL/RLS, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-14-pantrypal-pantry-expiry-design.md`

## Global Constraints

- Use only the Supabase publishable key in browser code; never use a service-role or secret key.
- Preserve the existing RLS ownership model for user-owned tables.
- Expiry categories are: expired, expiring soon (0–3 days), upcoming (4–7 days), safe (>7 days).
- Pantry items with no expiry date remain valid but are not treated as urgent.
- Smart logic remains deterministic and testable in this MVP.
- The interface is mobile-first, friendly, minimal, and accessible.

---

### Task 1: Expiry domain logic

**Files:**
- Create: `src/logic/expiry.mjs`
- Test: `tests/expiry.test.mjs`

**Interfaces:**
- Produces `getExpiryStatus(expiryDate, today)` returning `{ label, tone, daysLeft }`.
- Produces `sortByExpiryUrgency(items, today)` returning a new array sorted by expiry date, with undated items last.

- [x] **Step 1: Write the failing test**

The test suite already asserts urgent, expired, and sorting behavior.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/expiry.test.mjs`
Expected: FAIL because `src/logic/expiry.mjs` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement date-only parsing so timezone offsets cannot shift a date. Return `daysLeft` as integer calendar-day difference.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/expiry.test.mjs`
Expected: 3 passing tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/logic/expiry.mjs tests/expiry.test.mjs
git commit -m "feat: add pantry expiry logic"
```

### Task 2: Static application shell and Supabase configuration

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/config.mjs`
- Create: `src/supabase.mjs`
- Create: `src/app.mjs`
- Create: `.env.example`
- Create: `README.md`

**Interfaces:**
- `src/config.mjs` exports `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
- `src/supabase.mjs` exports `authRequest(path, options)` and `restRequest(table, options)`.
- `src/app.mjs` owns current session and renders the active screen.

- [ ] **Step 1: Write a failing smoke test for API URL construction**

Create `tests/supabase.test.mjs` with a pure helper assertion for joining the configured Supabase URL with `/rest/v1/pantry_items` and `/auth/v1/token` paths.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/supabase.test.mjs`
Expected: FAIL because the URL helper is not implemented.

- [ ] **Step 3: Implement the shell**

Create a semantic app shell with auth screen, top header, bottom navigation, Home/Pantry/Meals/Grocery/Settings views, and responsive CSS. Store only the Supabase URL and publishable key in `src/config.mjs`; provide placeholders in `.env.example` for future bundler migration.

- [ ] **Step 4: Run tests and syntax checks**

Run: `node --test tests/supabase.test.mjs tests/expiry.test.mjs` and `node --check src/app.mjs`.
Expected: all tests pass and JavaScript syntax checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css src/config.mjs src/supabase.mjs src/app.mjs tests/supabase.test.mjs .env.example README.md
git commit -m "feat: add PantryPal application shell"
```

### Task 3: Authentication and pantry CRUD

**Files:**
- Modify: `src/app.mjs`
- Modify: `src/supabase.mjs`
- Modify: `index.html`
- Modify: `styles.css`
- Test: `tests/pantry.test.mjs`

**Interfaces:**
- `loadPantryItems()` returns the authenticated user's non-consumed pantry rows.
- `createPantryItem(input)`, `updatePantryItem(id, input)`, `deletePantryItem(id)`, and `consumePantryItem(item, amount)` perform RLS-scoped REST operations.
- Auth actions support email/password sign-up, sign-in, sign-out, and session restore.

- [ ] **Step 1: Write failing pantry validation tests**

Test that a pantry item requires a non-empty name and a positive quantity, and that an invalid expiry date is rejected before network access.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/pantry.test.mjs`
Expected: FAIL because validation functions do not exist.

- [ ] **Step 3: Implement authentication and CRUD**

Use Supabase Auth password endpoints and bearer tokens for REST calls. Keep the access token in session storage only. Add an item form with name, category, quantity, unit, purchase date, expiry date, location, and notes. Render items grouped by category and sorted by expiry urgency.

- [ ] **Step 4: Run tests and syntax checks**

Run: `node --test tests/*.test.mjs` and `node --check src/app.mjs && node --check src/supabase.mjs`.
Expected: all tests pass and syntax checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css src/app.mjs src/supabase.mjs tests/pantry.test.mjs
git commit -m "feat: add authenticated pantry management"
```

### Task 4: Expiry dashboard and consumption tracking

**Files:**
- Modify: `src/app.mjs`
- Modify: `styles.css`
- Create: `src/logic/consumption.mjs`
- Test: `tests/consumption.test.mjs`

**Interfaces:**
- `calculateRemainingQuantity(current, consumed)` returns a non-negative quantity.
- `buildConsumptionLog(item, amount, source)` returns a validated insert payload.

- [ ] **Step 1: Write failing consumption tests**

Test partial consumption, full consumption, and rejection when requested consumption exceeds available quantity.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/consumption.test.mjs`
Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement consumption flow**

Add quick consume controls to pantry cards. Update pantry quantity and mark `is_consumed=true` when quantity reaches zero; insert a corresponding `consumption_logs` row. Home displays counts for total items, expiring soon, and expired.

- [ ] **Step 4: Run tests**

Run: `node --test tests/*.test.mjs`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/logic/consumption.mjs src/app.mjs styles.css tests/consumption.test.mjs
git commit -m "feat: add expiry dashboard and consumption tracking"
```

### Task 5: Deterministic meals and grocery recommendations

**Files:**
- Create: `src/logic/recommendations.mjs`
- Modify: `src/app.mjs`
- Modify: `styles.css`
- Test: `tests/recommendations.test.mjs`

**Interfaces:**
- `rankMeals(pantryItems, recipes, today)` returns meals sorted by pantry coverage and expiry urgency.
- `buildGrocerySuggestions(pantryItems, recipes)` returns missing ingredient suggestions with `source` and `priority` values compatible with `grocery_items`.

- [ ] **Step 1: Write failing recommendation tests**

Test that a meal using an expiring ingredient ranks above a meal with equal pantry coverage but no urgent ingredient, and that missing ingredients become grocery suggestions.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/recommendations.test.mjs`
Expected: FAIL because the recommendation module is missing.

- [ ] **Step 3: Implement recommendation engine**

Seed a small set of practical meals in the app if the `recipes` table has no rows, while continuing to support database recipes. Normalize ingredient names case-insensitively. Weight recipe pantry coverage first, then urgent-item usage, then missing-ingredient count. Save grocery suggestions through `grocery_items` and allow marking them completed.

- [ ] **Step 4: Run tests and syntax checks**

Run: `node --test tests/*.test.mjs` and `node --check src/app.mjs`.
Expected: all tests pass and syntax checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/logic/recommendations.mjs src/app.mjs styles.css tests/recommendations.test.mjs
git commit -m "feat: add meal and grocery recommendations"
```

### Task 6: Final verification and handoff

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-14-pantrypal-pantry-expiry-mvp.md`

- [ ] **Step 1: Run the complete test suite**

Run: `node --test tests/*.test.mjs`
Expected: 0 failures.

- [ ] **Step 2: Run all JavaScript syntax checks**

Run: `find src -name '*.mjs' -print0 | xargs -0 -n1 node --check`
Expected: every file exits 0.

- [ ] **Step 3: Inspect the repository status and commit history**

Run: `git status --short && git log --oneline --decorate -8`
Expected: only intentional working-tree changes remain and each completed task has a focused commit.

- [ ] **Step 4: Update README with local run instructions**

Document that this version is a static web app: serve the project directory with any static HTTP server, configure the Supabase publishable key in `src/config.mjs`, and never substitute a secret key.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md docs/superpowers/plans/2026-09-14-pantrypal-pantry-expiry-mvp.md
git commit -m "docs: document PantryPal MVP setup"
```
