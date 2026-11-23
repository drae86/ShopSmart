import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const priceProviderUsageTable = pgTable("price_provider_usage", {
  month: text("month").primaryKey(),
  estimatedSpendUsd: numeric("estimated_spend_usd", { precision: 10, scale: 4 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
