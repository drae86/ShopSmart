# SmartShopper

SmartShopper is a weekly grocery planner with recipes, an editable meal plan, a combined shopping list and an optional live supermarket price lookup.

## Workspace

- `shopsmart/` — React + Vite web application
- `api-server/` — Express API
- `db/` — PostgreSQL schema and Drizzle configuration
- `api-spec/` — OpenAPI contract
- `api-zod/` — generated request/response validation
- `api-client-react/` — generated React Query client

## Local development

Use Node.js 24 and pnpm.

1. Install dependencies: `pnpm install`
2. Configure `DATABASE_URL` for PostgreSQL.
3. Apply the development schema: `pnpm --filter @workspace/db run push`
4. Start the API on port 8080: `pnpm --filter @workspace/api-server run dev`
5. In another terminal, start the frontend: `pnpm --filter @workspace/shopsmart run dev`

The Vite development server proxies `/api` to `http://127.0.0.1:8080`. Set `API_PROXY_TARGET` if the API runs elsewhere.

## Live supermarket pricing

The live price route is opt-in. Set these as private server environment secrets, never in frontend code:

- `APIFY_TOKEN` — Apify API token
- `APIFY_MONTHLY_BUDGET_CAP_USD` — optional internal allowance, capped in code at USD $4.50

The adapter uses the `scrape-lads/au-grocery-scraper` actor for Coles, Woolworths and ALDI, with postcode-specific Coles/Woolworths pricing and national ALDI pricing. Each request is capped at eight search terms and 24 returned product rows. Results are cached in-process for five minutes. The app displays only positive AUD prices returned by the provider; absent prices remain unavailable.

The internal spend guard reserves USD $0.10 per uncached run against a monthly USD $4.50 allowance. This is a conservative application-level estimate, not a substitute for setting an account-level Apify spending limit. Verify the Apify account cap before enabling the token.

The new `price_provider_usage` table must be applied to the database before enabling the route. A missing token returns a configuration message; the app does not fabricate prices.

## Checks

- `pnpm run typecheck`
- `pnpm run build`

After changing `api-spec/openapi.yaml`, regenerate the API packages with `pnpm --filter @workspace/api-spec run codegen`.

## Important limitations

The initial recipe catalogue is starter content, not a nutrition-verified clinical meal plan. The price adapter needs a configured Apify token and a live test against the actor's current output before production use. Retailer terms and commercial data-use permissions must be reviewed before public commercial launch.
