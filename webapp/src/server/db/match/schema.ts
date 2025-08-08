import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  uniqueIndex,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", [
  "created",
  "running",
  "finished",
  "error",
]);

export const actorEnum = pgEnum("actor", ["agentA", "agentB"]);

export const matches = pgTable("matches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  seed: varchar("seed").notNull(),
  status: matchStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  gameKey: varchar("game_key").notNull(),
  gameVersion: varchar("game_version").notNull(),
});

export const turns = pgTable("turns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  idx: integer("idx").notNull(),
  actor: actorEnum("actor").notNull(),
  action: jsonb("action").$type<unknown>().notNull(),
  actionType: varchar("action_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  turnId: integer("turn_id"),
  eventType: varchar("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stateSnapshots = pgTable("state_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  turnId: integer("turn_id").references(() => turns.id, { onDelete: "cascade" }),
  gameKey: varchar("game_key").notNull(),
  gameVersion: varchar("game_version").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchesRelations = relations(matches, ({ many }) => ({
  turns: many(turns),
  events: many(events),
  games: many(stateSnapshots),
}));

export const turnsRelations = relations(turns, ({ one, many }) => ({
  match: one(matches, {
    fields: [turns.matchId],
    references: [matches.id],
  }),
  games: many(stateSnapshots),
}));

export const gamesRelations = relations(stateSnapshots, ({ one }) => ({
  match: one(matches, {
    fields: [stateSnapshots.matchId],
    references: [matches.id],
  }),
  turn: one(turns, {
    fields: [stateSnapshots.turnId],
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

export const gameDefinitions = pgTable(
  "game_definitions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    gameKey: varchar("game_key").notNull(),
    gameVersion: varchar("game_version").notNull(),
    stateSchema: jsonb("state_schema").$type<Record<string, unknown>>().notNull(),
    actionSchema: jsonb("action_schema").$type<Record<string, unknown>>().notNull(),
    observationSchema: jsonb("observation_schema").$type<Record<string, unknown>>().notNull(),
    eventSchema: jsonb("event_schema").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    gameKeyVersionIdx: uniqueIndex("game_definitions_key_version_idx").on(
      t.gameKey,
      t.gameVersion,
    ),
  }),
);
