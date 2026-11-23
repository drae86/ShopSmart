import { Router, type IRouter } from "express";
import { db, priceProviderUsageTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();
const cache = new Map<string, { expiresAt: number; payload: unknown }>();
const STORES = ["coles", "woolworths", "aldi"] as const;
const RESERVED_RUN_COST_USD = 0.10;

router.post("/prices/search", async (req, res): Promise<void> => {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(503).json({ configured: false, error: "Live price lookup is not configured yet. Add APIFY_TOKEN to the server's private environment secrets." });
    return;
  }
  const searchTerms = Array.isArray(req.body?.searchTerms)
    ? [...new Set(req.body.searchTerms.filter((term: unknown): term is string => typeof term === "string").map((term: string) => term.trim()).filter(Boolean))].slice(0, 8)
    : [];
  const postcode = typeof req.body?.postcode === "string" && /^\d{4}$/.test(req.body.postcode) ? req.body.postcode : "3025";
  if (!searchTerms.length) { res.status(400).json({ error: "Add at least one ingredient to search." }); return; }

  const cacheKey = postcode + ":" + searchTerms.map(t => t.toLowerCase()).sort().join("|");
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) { res.json({ ...(cached.payload as object), cached: true }); return; }

  const configuredCap = Number(process.env.APIFY_MONTHLY_BUDGET_CAP_USD || 4.5);
  const cap = Number.isFinite(configuredCap) ? Math.min(4.5, Math.max(0.1, configuredCap)) : 4.5;
  const month = new Date().toISOString().slice(0, 7);
  const statement = "INSERT INTO price_provider_usage (month, estimated_spend_usd) VALUES ('" + month + "', " + RESERVED_RUN_COST_USD + ") ON CONFLICT (month) DO UPDATE SET estimated_spend_usd = price_provider_usage.estimated_spend_usd + " + RESERVED_RUN_COST_USD + ", updated_at = NOW() WHERE price_provider_usage.estimated_spend_usd + " + RESERVED_RUN_COST_USD + " <= " + cap + " RETURNING estimated_spend_usd";
  const reservation = await db.execute(sql.raw(statement));
  const rows = (reservation as unknown as { rows?: Array<{ estimated_spend_usd: string | number }> }).rows ?? [];
  if (!rows.length) { res.status(429).json({ error: "The monthly SmartShopper price-check allowance has reached its $4.50 USD operating cap. No new paid run was started." }); return; }
  const estimatedUsed = Number(rows[0].estimated_spend_usd);

  try {
    const response = await fetch("https://api.apify.com/v2/acts/scrape-lads~au-grocery-scraper/run-sync-get-dataset-items", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ searchTerms, stores: [...STORES], maxItemsPerQuery: 3, maxItems: Math.min(24, searchTerms.length * 3), postcodes: [postcode],  }),
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) { const detail = (await response.text()).slice(0, 300); res.status(502).json({ error: "Price provider returned " + response.status + ". " + detail }); return; }
    const raw: unknown = await response.json();
    const items = (Array.isArray(raw) ? raw : []).flatMap((entry: any) => {
      if (!entry || typeof (entry.productName || entry.name || entry.title) !== "string" || !Number.isFinite(Number(entry.price)) || Number(entry.price) <= 0) return [];
      const retailer = String(entry.retailer || entry.storeName || entry.store || entry.chain || "").toLowerCase();
      const matchedStore = STORES.find(store => retailer.includes(store));
      if (!matchedStore) return [];
      if (entry.currency && String(entry.currency).toUpperCase() !== "AUD") return [];
      return [{
        retailer: matchedStore === "aldi" ? "ALDI" : matchedStore === "coles" ? "Coles" : "Woolworths",
        name: entry.productName || entry.name || entry.title, brand: typeof entry.brand === "string" ? entry.brand : undefined,
        size: typeof (entry.packSize || entry.size || entry.packageSize) === "string" ? (entry.packSize || entry.size || entry.packageSize) : undefined, price: Number(entry.price),
        wasPrice: Number(entry.wasPrice || entry.originalPrice || entry.regularPrice) > Number(entry.price) ? Number(entry.wasPrice || entry.originalPrice || entry.regularPrice) : undefined,
        unitPrice: Number(entry.unitPrice) > 0 ? Number(entry.unitPrice) : undefined,
        unit: typeof (entry.unitPriceUnit || entry.unit || entry.unitPriceBasis) === "string" ? (entry.unitPriceUnit || entry.unit || entry.unitPriceBasis) : undefined,
        inStock: typeof entry.inStock === "boolean" ? entry.inStock : String(entry.availability || "").toLowerCase().includes("out") ? false : String(entry.availability || "").toLowerCase().includes("stock") ? true : null,
        productUrl: typeof entry.productUrl === "string" && entry.productUrl.startsWith("https://") ? entry.productUrl : undefined,
        scrapedAt: typeof entry.scrapedAt === "string" ? entry.scrapedAt : undefined,
        query: typeof (entry.searchTerm || entry.query) === "string" ? (entry.searchTerm || entry.query) : undefined
      }];
    });
    const payload = { configured: true, postcode, items, refreshedAt: new Date().toISOString(), budget: { cap, used: estimatedUsed }, cached: false };
    cache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, payload });
    res.json(payload);
  } catch {
    res.status(502).json({ error: "The live price check could not complete. No estimated prices have been substituted." });
  }
});

export default router;
