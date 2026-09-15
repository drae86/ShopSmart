import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ingredientsTable } from "./ingredients";

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").notNull().default(2),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipesTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredientsTable.id, { onDelete: "cascade" }),
  qtyG: numeric("qty_g", { precision: 10, scale: 2 }).notNull(),
});

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({ id: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredientsTable).omit({ id: true });

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
export type RecipeIngredient = typeof recipeIngredientsTable.$inferSelect;
