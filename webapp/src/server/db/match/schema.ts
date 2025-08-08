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
  gameId: varchar("game_id").notNull(), // The game id from the differnet game available
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const games = pgTable("state_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  turnId: integer("turn_id").references(() => turns.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchesRelations = relations(matches, ({ many }) => ({
  turns: many(turns),
  events: many(events),
  games: many(games),
}));

export const turnsRelations = relations(turns, ({ one, many }) => ({
  match: one(matches, {
    fields: [turns.matchId],
    references: [matches.id],
  }),
  games: many(games),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  match: one(matches, {
    fields: [games.matchId],
    references: [matches.id],
  }),
  turn: one(turns, {
    fields: [games.turnId],
    references: [turns.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  match: one(matches, {
    fields: [events.matchId],
    references: [matches.id],
  }),
  turn: one(turns, {
    fields: [events.turnId],
    references: [turns.id],
  }),
}));
