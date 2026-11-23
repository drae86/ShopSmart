import { Router, type IRouter } from "express";
import { db, storesTable, ingredientsTable, ingredientPricesTable, recipesTable, recipeIngredientsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  GetShoppingListQueryParams, GetShoppingListResponse,
  CompareStoresQueryParams, CompareStoresResponse, GetShoppingSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildShoppingData(recipeIds: number[]) {
  if (!recipeIds.length) return { totals: {} as Record<number, number>, ingredients: [], prices: [] };
  const rows = await db.select({ ingredientId: recipeIngredientsTable.ingredientId, qtyG: recipeIngredientsTable.qtyG })
    .from(recipeIngredientsTable).where(inArray(recipeIngredientsTable.recipeId, recipeIds));
  const totals: Record<number, number> = {};
  for (const row of rows) totals[row.ingredientId] = (totals[row.ingredientId] ?? 0) + Number(row.qtyG);
  const ids = Object.keys(totals).map(Number);
  if (!ids.length) return { totals, ingredients: [], prices: [] };
  const ingredients = await db.select().from(ingredientsTable).where(inArray(ingredientsTable.id, ids));
  const prices = await db.select({
    ingredientId: ingredientPricesTable.ingredientId,
    storeId: ingredientPricesTable.storeId,
    pricePer100g: ingredientPricesTable.pricePer100g
  }).from(ingredientPricesTable);
  return { totals, ingredients, prices };
}

function costForStore(storeId: number, ingredients: Array<{id:number}>, totals: Record<number,number>, prices: Array<{ingredientId:number;storeId:number;pricePer100g:string}>) {
  let total = 0;
  for (const ingredient of ingredients) {
    const price = prices.find(p => p.ingredientId === ingredient.id && p.storeId === storeId);
    const per100g = price ? Number(price.pricePer100g) : NaN;
    if (!Number.isFinite(per100g) || per100g <= 0) return null;
    total += per100g * ((totals[ingredient.id] ?? 0) / 100);
  }
  return Math.round(total * 100) / 100;
}

router.get("/shopping/list", async (req, res): Promise<void> => {
  const parsed = GetShoppingListQueryParams.safeParse({
    recipeIds: req.query.recipeIds,
    storeId: req.query.storeId ? Number(req.query.storeId) : undefined,
    budget: req.query.budget ? Number(req.query.budget) : undefined
  });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const recipeIds = parsed.data.recipeIds.split(",").map(Number).filter(n => Number.isInteger(n) && n > 0);
  const { totals, ingredients, prices } = await buildShoppingData(recipeIds);
  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, parsed.data.storeId));
  if (!store) { res.status(404).json({ error: "Store not found" }); return; }

  const items = ingredients.map(ing => {
    const price = prices.find(p => p.ingredientId === ing.id && p.storeId === store.id);
    const per100g = price ? Number(price.pricePer100g) : NaN;
    const estimatedCost = Number.isFinite(per100g) && per100g > 0
      ? Math.round(per100g * ((totals[ing.id] ?? 0) / 100) * 100) / 100
      : null;
    return { ingredientId: ing.id, ingredientName: ing.name, totalQtyG: totals[ing.id] ?? 0, estimatedCost, checked: false };
  });
  const complete = items.every(item => item.estimatedCost !== null);
  const totalCost = complete ? Math.round(items.reduce((sum,item)=>sum+(item.estimatedCost ?? 0),0)*100)/100 : null;
  const budget = parsed.data.budget ?? null;
  const withinBudget = totalCost === null || budget === null ? null : totalCost <= budget;

  let cheaperStoreId: number|null = null, cheaperStoreName: string|null = null, cheaperStoreCost: number|null = null;
  if (totalCost !== null && withinBudget === false) {
    const stores = await db.select().from(storesTable);
    for (const candidate of stores) {
      if (candidate.id === store.id) continue;
      const cost = costForStore(candidate.id, ingredients, totals, prices);
      if (cost !== null && (cheaperStoreCost === null || cost < cheaperStoreCost)) {
        cheaperStoreId = candidate.id; cheaperStoreName = candidate.name; cheaperStoreCost = cost;
      }
    }
  }
  res.json(GetShoppingListResponse.parse({storeId:store.id,storeName:store.name,items,totalCost,budget,withinBudget,cheaperStoreId,cheaperStoreName,cheaperStoreCost}));
});

router.get("/shopping/compare", async (req,res):Promise<void>=>{
  const parsed=CompareStoresQueryParams.safeParse({recipeIds:req.query.recipeIds});
  if(!parsed.success){res.status(400).json({error:parsed.error.message});return;}
  const recipeIds=parsed.data.recipeIds.split(",").map(Number).filter(n=>Number.isInteger(n)&&n>0);
  const {totals,ingredients,prices}=await buildShoppingData(recipeIds);
  const stores=await db.select().from(storesTable);
  const costs=stores.map(store=>({store,totalCost:costForStore(store.id,ingredients,totals,prices)}));
  const completeCosts=costs.map(x=>x.totalCost).filter((v):v is number=>v!==null);
  const min=completeCosts.length?Math.min(...completeCosts):null;
  const max=completeCosts.length?Math.max(...completeCosts):null;
  const result=costs.map(({store,totalCost})=>({
    storeId:store.id,storeName:store.name,color:store.color,totalCost,
    isCheapest:totalCost!==null&&min!==null&&totalCost===min,
    savingsVsMostExpensive:totalCost!==null&&max!==null?Math.round((max-totalCost)*100)/100:null
  }));
  res.json(CompareStoresResponse.parse(result));
});

router.get("/shopping/summary",async(_req,res):Promise<void>=>{
  const [{count:totalRecipes}]=await db.select({count:sql<number>\`count(*)::int\`}).from(recipesTable);
  const [{count:totalIngredients}]=await db.select({count:sql<number>\`count(*)::int\`}).from(ingredientsTable);
  const [{count:totalStores}]=await db.select({count:sql<number>\`count(*)::int\`}).from(storesTable);
  const stores=await db.select().from(storesTable);
  const recipes=await db.select().from(recipesTable);
  const {totals,ingredients,prices}=await buildShoppingData(recipes.map(r=>r.id));
  const costs=stores.map(store=>({store,cost:costForStore(store.id,ingredients,totals,prices)}));
  const complete=costs.filter(x=>x.cost!==null);
  const cheapest=complete.length?complete.reduce((a,b)=>(a.cost as number)<(b.cost as number)?a:b):null;
  const values=complete.map(x=>x.cost as number);
  const average=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*100)/100:0;
  const savings=values.length>1?Math.round((Math.max(...values)-Math.min(...values))*100)/100:0;
  res.json(GetShoppingSummaryResponse.parse({
    totalRecipes,totalIngredients,totalStores,
    cheapestStore:cheapest?.store.name??"Price data unavailable",
    averageWeeklyBudget:average,maxSavings:savings
  }));
});
export default router;
