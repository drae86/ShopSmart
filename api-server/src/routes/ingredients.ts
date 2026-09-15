import { Router, type IRouter } from "express";
import { db, ingredientsTable, ingredientPricesTable, storesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListIngredientsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ingredients", async (_req, res): Promise<void> => {
  const ingredients = await db.select().from(ingredientsTable).orderBy(ingredientsTable.name);

  const prices = await db
    .select({
      ingredientId: ingredientPricesTable.ingredientId,
      storeId: ingredientPricesTable.storeId,
      storeName: storesTable.name,
      pricePer100g: ingredientPricesTable.pricePer100g,
    })
    .from(ingredientPricesTable)
    .innerJoin(storesTable, eq(ingredientPricesTable.storeId, storesTable.id));

  const result = ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    unit: ing.unit,
    prices: prices
      .filter((p) => p.ingredientId === ing.id)
      .map((p) => ({
        storeId: p.storeId,
        storeName: p.storeName,
        pricePer100g: Number(p.pricePer100g),
      })),
  }));

  res.json(ListIngredientsResponse.parse(result));
});

export default router;
