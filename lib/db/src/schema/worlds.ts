import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const worldsTable = pgTable("worlds", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull(),
  difficulty: integer("difficulty").notNull(),
  difficultyLabel: text("difficulty_label").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  accentColor: text("accent_color").notNull(),
  chipColor: text("chip_color").notNull(),
  chipTextColor: text("chip_text_color").notNull(),
  sortIndex: integer("sort_index").notNull().default(0),
});

export const storiesTable = pgTable("stories", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => worldsTable.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  sortIndex: integer("sort_index").notNull().default(0),
});

export type TappableWord = {
  key: string;
  word: string;
  syllables: string[];
  reaction: string;
};

export const chaptersTable = pgTable("chapters", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => storiesTable.id),
  sortIndex: integer("sort_index").notNull(),
  title: text("title").notNull(),
  sceneImageUrl: text("scene_image_url").notNull(),
  paragraphs: jsonb("paragraphs").$type<string[]>().notNull(),
  tappableWords: jsonb("tappable_words").$type<TappableWord[]>().notNull(),
});

export const finishedChaptersTable = pgTable("finished_chapters", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }).notNull().defaultNow(),
});

export type World = typeof worldsTable.$inferSelect;
export type Story = typeof storiesTable.$inferSelect;
export type Chapter = typeof chaptersTable.$inferSelect;