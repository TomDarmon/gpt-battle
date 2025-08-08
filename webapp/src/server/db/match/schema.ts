import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const matches = pgTable("matches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  seed: varchar("seed").notNull(),
  status: varchar("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const turns = pgTable("turns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  idx: integer("idx").notNull(),
  actor: varchar("actor").notNull(),
  message: varchar("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  turnId: integer("turn_id"),
  type: varchar("type").notNull(),
  payload: jsonb("payload").notNull(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
});

export const matchesRelations = relations(matches, ({ many }) => ({
  turns: many(turns),
  events: many(events),
}));

export const turnsRelations = relations(turns, ({ one }) => ({
  match: one(matches, {
    fields: [turns.matchId],
    references: [matches.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  match: one(matches, {
    fields: [events.matchId],
    references: [matches.id],
  }),
}));
