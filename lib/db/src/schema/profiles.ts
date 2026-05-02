import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const childProfilesTable = pgTable("child_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gems: integer("gems").notNull().default(0),
  stars: integer("stars").notNull().default(0),
  petLevel: integer("pet_level").notNull().default(1),
  petXp: integer("pet_xp").notNull().default(0),
  fullness: integer("fullness").notNull().default(70),
  happiness: integer("happiness").notNull().default(70),
  equippedHat: text("equipped_hat"),
  glowColor: text("glow_color").notNull().default("mint"),
});

export type ChildProfile = typeof childProfilesTable.$inferSelect;
