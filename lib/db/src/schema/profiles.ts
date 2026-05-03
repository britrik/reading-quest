import { pgTable, serial, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const childProfilesTable = pgTable("child_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull().default("fox"),
  gems: integer("gems").notNull().default(0),
  stars: integer("stars").notNull().default(0),
  petLevel: integer("pet_level").notNull().default(1),
  petXp: integer("pet_xp").notNull().default(0),
  fullness: integer("fullness").notNull().default(70),
  happiness: integer("happiness").notNull().default(70),
  equippedHat: text("equipped_hat"),
  glowColor: text("glow_color").notNull().default("mint"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preferencesTable = pgTable(
  "preferences",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").notNull(),
    fontSize: text("font_size").notNull().default("medium"),
    highContrast: boolean("high_contrast").notNull().default(false),
    reducedMotion: boolean("reduced_motion").notNull().default(false),
    voiceSpeed: integer("voice_speed_x10").notNull().default(9),
    soundscape: text("soundscape").notNull().default("none"),
    soundEnabled: boolean("sound_enabled").notNull().default(true),
    sessionLengthSuggestionMin: integer("session_length_min").notNull().default(15),
    breakReminders: boolean("break_reminders").notNull().default(true),
  },
  (t) => ({
    profileUnique: uniqueIndex("preferences_profile_unique").on(t.profileId),
  }),
);

export type ChildProfile = typeof childProfilesTable.$inferSelect;
export type Preferences = typeof preferencesTable.$inferSelect;
