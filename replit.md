# ShopSmart

A weekly grocery co-pilot that helps households plan meals, generate shopping lists, and find the cheapest store for their groceries.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/shopsmart run dev` — run the ShopSmart frontend (port 18883)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (stores, ingredients, recipes)
- `artifacts/api-server/src/routes/` — Express route handlers (stores, ingredients, recipes, shopping)
- `artifacts/shopsmart/src/` — React frontend (pages: Dashboard, Planner, Recipes, RecipeForm)

## Architecture decisions

- Contract-first: OpenAPI spec gates all codegen; frontend hooks are generated, never hand-written.
- Shopping list and store comparison are computed server-side from DB prices, not hardcoded.
- Prices stored as `price_per_100g` for consistent cost estimation regardless of ingredient quantity.
- Recipe ingredients use a junction table (`recipe_ingredients`) to allow flexible recipe composition.
- Summary endpoint aggregates stats across all recipes/stores for the dashboard.

## Product

- **Dashboard** — Key stats (recipes, stores, avg budget, max savings) and quick navigation
- **Planner** — Select recipes for the week, pick a store, set a budget, generate a shopping list with cost breakdown and over-budget alerts
- **Recipes** — Browse and manage all recipes; add, edit, delete with full CRUD
- **Store comparison** — Side-by-side cost comparison across Aldi, Coles, and Woolworths

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always re-run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Drizzle count: use `sql<number>\`count(*)::int\`` not `db.$count()` (not a valid Drizzle API)
- `db.$count` is not valid Drizzle ORM — use `db.select({ count: sql\`count(*)\` })`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
