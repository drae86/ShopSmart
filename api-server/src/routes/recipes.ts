import { Router, type IRouter } from "express";
import { db, recipesTable, recipeIngredientsTable, ingredientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListRecipesResponse,
  GetRecipeParams,
  GetRecipeResponse,
  CreateRecipeBody,
  UpdateRecipeParams,
  UpdateRecipeBody,
  UpdateRecipeResponse,
  DeleteRecipeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getRecipeWithIngredients(id: number) {
  const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, id));
  if (!recipe) return null;

  const ingredients = await db
    .select({
      ingredientId: recipeIngredientsTable.ingredientId,
      ingredientName: ingredientsTable.name,
      qtyG: recipeIngredientsTable.qtyG,
    })
    .from(recipeIngredientsTable)
    .innerJoin(ingredientsTable, eq(recipeIngredientsTable.ingredientId, ingredientsTable.id))
    .where(eq(recipeIngredientsTable.recipeId, id));

  return {
    ...recipe,
    ingredients: ingredients.map((i) => ({
      ingredientId: i.ingredientId,
      ingredientName: i.ingredientName,
      qtyG: Number(i.qtyG),
    })),
  };
}

router.get("/recipes", async (_req, res): Promise<void> => {
  const recipes = await db.select().from(recipesTable).orderBy(recipesTable.id);

  const allIngredients = await db
    .select({
      recipeId: recipeIngredientsTable.recipeId,
      ingredientId: recipeIngredientsTable.ingredientId,
      ingredientName: ingredientsTable.name,
      qtyG: recipeIngredientsTable.qtyG,
    })
    .from(recipeIngredientsTable)
    .innerJoin(ingredientsTable, eq(recipeIngredientsTable.ingredientId, ingredientsTable.id));

  const result = recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    ingredients: allIngredients
      .filter((i) => i.recipeId === recipe.id)
      .map((i) => ({
        ingredientId: i.ingredientId,
        ingredientName: i.ingredientName,
        qtyG: Number(i.qtyG),
      })),
  }));

  res.json(ListRecipesResponse.parse(result));
});

router.get("/recipes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRecipeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const recipe = await getRecipeWithIngredients(params.data.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(GetRecipeResponse.parse(recipe));
});

router.post("/recipes", async (req, res): Promise<void> => {
  const parsed = CreateRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ingredients, ...recipeData } = parsed.data;

  const [recipe] = await db.insert(recipesTable).values(recipeData).returning();

  if (ingredients && ingredients.length > 0) {
    await db.insert(recipeIngredientsTable).values(
      ingredients.map((i) => ({
        recipeId: recipe.id,
        ingredientId: i.ingredientId,
        qtyG: String(i.qtyG),
      }))
    );
  }

  const result = await getRecipeWithIngredients(recipe.id);
  res.status(201).json(GetRecipeResponse.parse(result));
});

router.put("/recipes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRecipeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(recipesTable).where(eq(recipesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  const { ingredients, ...recipeData } = parsed.data;

  await db.update(recipesTable).set(recipeData).where(eq(recipesTable.id, params.data.id));

  if (ingredients !== undefined) {
    await db.delete(recipeIngredientsTable).where(eq(recipeIngredientsTable.recipeId, params.data.id));
    if (ingredients.length > 0) {
      await db.insert(recipeIngredientsTable).values(
        ingredients.map((i) => ({
          recipeId: params.data.id,
          ingredientId: i.ingredientId,
          qtyG: String(i.qtyG),
        }))
      );
    }
  }

  const result = await getRecipeWithIngredients(params.data.id);
  res.json(UpdateRecipeResponse.parse(result));
});

router.delete("/recipes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteRecipeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(recipesTable).where(eq(recipesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  await db.delete(recipesTable).where(eq(recipesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
