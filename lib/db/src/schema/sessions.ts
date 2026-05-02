import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  storyId: integer("story_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  activeMs: integer("active_ms").notNull().default(0),
  status: text("status").notNull().default("active"), // active|paused|finished
});

export const wordHelpEventsTable = pgTable("word_help_events", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  sessionId: integer("session_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  wordKey: text("word_key").notNull(),
  word: text("word").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Session = typeof sessionsTable.$inferSelect;
export type WordHelpEvent = typeof wordHelpEventsTable.$inferSelect;
