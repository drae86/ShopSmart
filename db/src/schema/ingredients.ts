import { pgTable, serial, text, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

export const ingredientsTable = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("g"),
});

export const ingredientPricesTable = pgTable("ingredient_prices", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredientsTable.id, { onDelete: "cascade" }),
  storeId: integer("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  pricePer100g: numeric("price_per_100g", { precision: 10, scale: 4 }).notNull(),
});

export const insertIngredientSchema = createInsertSchema(ingredientsTable).omit({ id: true });
export const insertIngredientPriceSchema = createInsertSchema(ingredientPricesTable).omit({ id: true });

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type InsertIngredientPrice = z.infer<typeof insertIngredientPriceSchema>;
export type Ingredient = typeof ingredientsTable.$inferSelect;
export type IngredientPrice = typeof ingredientPricesTable.$inferSelect;
