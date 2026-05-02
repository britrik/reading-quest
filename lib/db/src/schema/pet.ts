import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const shopItemsTable = pgTable("shop_items", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // snack|hat|glow|decor
  name: text("name").notNull(),
  description: text("description").notNull(),
  gemPrice: integer("gem_price").notNull(),
  fullnessBoost: integer("fullness_boost").notNull().default(0),
  happinessBoost: integer("happiness_boost").notNull().default(0),
  requiresPetLevel: integer("requires_pet_level").notNull().default(0),
  emoji: text("emoji").notNull(),
  glowColor: text("glow_color"),
  sortIndex: integer("sort_index").notNull().default(0),
});

export const ownedItemsTable = pgTable("owned_items", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  itemId: text("item_id").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
});

export const decorStateTable = pgTable("decor_state", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  itemId: text("item_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  kind: text("kind").notNull(), // earn|spend
  amountGems: integer("amount_gems").notNull().default(0),
  amountStars: integer("amount_stars").notNull().default(0),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShopItem = typeof shopItemsTable.$inferSelect;
