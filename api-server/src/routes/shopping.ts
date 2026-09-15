import { Router, type IRouter } from "express";
import { db, storesTable, ingredientsTable, ingredientPricesTable, recipesTable, recipeIngredientsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  GetShoppingListQueryParams,
  GetShoppingListResponse,
  CompareStoresQueryParams,
  CompareStoresResponse,
  GetShoppingSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildShoppingData(recipeIdList: number[]) {
  const recipeIngredients = await db
    .select({
      ingredientId: recipeIngredientsTable.ingredientId,
      qtyG: recipeIngredientsTable.qtyG,
    })
    .from(recipeIngredientsTable)
    .where(inArray(recipeIngredientsTable.recipeId, recipeIdList));

  // Aggregate ingredient quantities
  const totals: Record<number, number> = {};
  for (const ri of recipeIngredients) {
    totals[ri.ingredientId] = (totals[ri.ingredientId] ?? 0) + Number(ri.qtyG);
  }

  const ingredientIds = Object.keys(totals).map(Number);
  if (ingredientIds.length === 0) return { totals: {}, ingredients: [], prices: [] };

  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(inArray(ingredientsTable.id, ingredientIds));

  const prices = await db
    .select({
      ingredientId: ingredientPricesTable.ingredientId,
      storeId: ingredientPricesTable.storeId,
      storeName: storesTable.name,
      pricePer100g: ingredientPricesTable.pricePer100g,
    })
    .from(ingredientPricesTable)
    .innerJoin(storesTable, eq(ingredientPricesTable.storeId, storesTable.id))
    .where(inArray(ingredientPricesTable.ingredientId, ingredientIds));

  return { totals, ingredients, prices };
}

router.get("/shopping/list", async (req, res): Promise<void> => {
  const rawQuery = {
    recipeIds: req.query.recipeIds,
    storeId: req.query.storeId ? Number(req.query.storeId) : undefined,
    budget: req.query.budget ? Number(req.query.budget) : undefined,
  };

  const parsed = GetShoppingListQueryParams.safeParse(rawQuery);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const recipeIdList = parsed.data.recipeIds.split(",").map(Number).filter(Boolean);
  const { totals, ingredients, prices } = await buildShoppingData(recipeIdList);

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, parsed.data.storeId!));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const items = ingredients.map((ing) => {
    const priceRow = prices.find((p) => p.ingredientId === ing.id && p.storeId === store.id);
    const pricePer100g = priceRow ? Number(priceRow.pricePer100g) : 0;
    const totalQtyG = totals[ing.id] ?? 0;
    const estimatedCost = pricePer100g * (totalQtyG / 100);
    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      totalQtyG,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      checked: false,
    };
  });

  const totalCost = Math.round(items.reduce((s, i) => s + i.estimatedCost, 0) * 100) / 100;
  const budget = parsed.data.budget ?? null;
  const withinBudget = budget == null ? true : totalCost <= budget;

  // Find cheapest store
  const allStores = await db.select().from(storesTable);
  let cheaperStoreId: number | null = null;
  let cheaperStoreName: string | null = null;
  let cheaperStoreCost: number | null = null;

  if (!withinBudget) {
    let minCost = totalCost;
    for (const s of allStores) {
      if (s.id === store.id) continue;
      const cost = ingredients.reduce((sum, ing) => {
        const priceRow = prices.find((p) => p.ingredientId === ing.id && p.storeId === s.id);
        const pricePer100g = priceRow ? Number(priceRow.pricePer100g) : 0;
        return sum + pricePer100g * ((totals[ing.id] ?? 0) / 100);
      }, 0);
      if (cost < minCost) {
        minCost = cost;
        cheaperStoreId = s.id;
        cheaperStoreName = s.name;
        cheaperStoreCost = Math.round(cost * 100) / 100;
      }
    }
  }

  res.json(
    GetShoppingListResponse.parse({
      storeId: store.id,
      storeName: store.name,
      items,
      totalCost,
      budget,
      withinBudget,
      cheaperStoreId,
      cheaperStoreName,
      cheaperStoreCost,
    })
  );
});

router.get("/shopping/compare", async (req, res): Promise<void> => {
  const rawQuery = { recipeIds: req.query.recipeIds };
  const parsed = CompareStoresQueryParams.safeParse(rawQuery);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const recipeIdList = parsed.data.recipeIds.split(",").map(Number).filter(Boolean);
  const { totals, ingredients, prices } = await buildShoppingData(recipeIdList);

  const stores = await db.select().from(storesTable);

  const storeCosts = stores.map((store) => {
    const cost = ingredients.reduce((sum, ing) => {
      const priceRow = prices.find((p) => p.ingredientId === ing.id && p.storeId === store.id);
      const pricePer100g = priceRow ? Number(priceRow.pricePer100g) : 0;
      return sum + pricePer100g * ((totals[ing.id] ?? 0) / 100);
    }, 0);
    return { store, totalCost: Math.round(cost * 100) / 100 };
  });

  const minCost = Math.min(...storeCosts.map((s) => s.totalCost));
  const maxCost = Math.max(...storeCosts.map((s) => s.totalCost));

  const result = storeCosts.map(({ store, totalCost }) => ({
    storeId: store.id,
    storeName: store.name,
    color: store.color,
    totalCost,
    isCheapest: totalCost === minCost,
    savingsVsMostExpensive: Math.round((maxCost - totalCost) * 100) / 100,
  }));

  res.json(CompareStoresResponse.parse(result));
});

router.get("/shopping/summary", async (_req, res): Promise<void> => {
  const [{ count: totalRecipes }] = await db.select({ count: sql<number>`count(*)::int` }).from(recipesTable);
  const [{ count: totalIngredients }] = await db.select({ count: sql<number>`count(*)::int` }).from(ingredientsTable);
  const [{ count: totalStores }] = await db.select({ count: sql<number>`count(*)::int` }).from(storesTable);

  const stores = await db.select().from(storesTable);
  const recipes = await db.select().from(recipesTable);
  const allRecipeIngredients = await db.select().from(recipeIngredientsTable);
  const prices = await db
    .select({
      ingredientId: ingredientPricesTable.ingredientId,
      storeId: ingredientPricesTable.storeId,
      pricePer100g: ingredientPricesTable.pricePer100g,
    })
    .from(ingredientPricesTable);

  // Compute average cost per recipe across all stores
  let totalCostSum = 0;
  let cheapestStoreName = stores[0]?.name ?? "N/A";
  let maxSavings = 0;

  if (recipes.length > 0 && stores.length > 0) {
    const allIds = recipes.map((r) => r.id);
    const totals: Record<number, number> = {};
    for (const ri of allRecipeIngredients) {
      if (allIds.includes(ri.recipeId)) {
        totals[ri.ingredientId] = (totals[ri.ingredientId] ?? 0) + Number(ri.qtyG);
      }
    }

    const storeCosts = stores.map((store) => {
      const cost = Object.entries(totals).reduce((sum, [ingId, qty]) => {
        const priceRow = prices.find((p) => p.ingredientId === Number(ingId) && p.storeId === store.id);
        const pricePer100g = priceRow ? Number(priceRow.pricePer100g) : 0;
        return sum + pricePer100g * (qty / 100);
      }, 0);
      return { store, totalCost: Math.round(cost * 100) / 100 };
    });

    const minCost = Math.min(...storeCosts.map((s) => s.totalCost));
    const maxCost = Math.max(...storeCosts.map((s) => s.totalCost));
    const cheapest = storeCosts.find((s) => s.totalCost === minCost);

    cheapestStoreName = cheapest?.store.name ?? "N/A";
    totalCostSum = storeCosts.reduce((s, c) => s + c.totalCost, 0);
    maxSavings = Math.round((maxCost - minCost) * 100) / 100;
  }

  const averageWeeklyBudget = stores.length > 0 ? Math.round((totalCostSum / stores.length) * 100) / 100 : 0;

  res.json(
    GetShoppingSummaryResponse.parse({
      totalRecipes,
      totalIngredients,
      totalStores,
      cheapestStore: cheapestStoreName,
      averageWeeklyBudget,
      maxSavings,
    })
  );
});

export default router;
