import { z } from "zod";
import { asc, desc, eq, and } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { matches, turns, stateSnapshots as games } from "~/server/db/match/schema";
import {
  type TicTacToeActor,
  type TicTacToeState,
  type TicTacToeMoveMessage,
} from "../../../types/tictactoe";

const moveMessageSchema = z.object({
  type: z.literal("move"),
  payload: z.object({
    row: z.number().int().min(0).max(2),
    col: z.number().int().min(0).max(2),
  }),
});

export const matchRouter = createTRPCRouter({
  listMatches: publicProcedure
    .input(
      z
        .object({
          gameKey: z.string().optional().default("tictactoe"),
          gameVersion: z.string().optional().default("v1"),
          limit: z.number().int().min(1).max(200).optional().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const gameKey = input?.gameKey ?? "tictactoe";
      const gameVersion = input?.gameVersion ?? "v1";
      const limit = input?.limit ?? 50;
      const rows = await ctx.db.query.matches.findMany({
        where: and(eq(matches.gameKey, gameKey), eq(matches.gameVersion, gameVersion)),
        orderBy: desc(matches.createdAt),
        limit,
        columns: {
          id: true,
          seed: true,
          status: true,
          gameKey: true,
          gameVersion: true,
          createdAt: true,
        },
      });
      return rows;
    }),

  getReplay: publicProcedure
    .input(
      z.object({
        matchId: z.number().int().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.query.matches.findFirst({
        where: eq(matches.id, input.matchId),
        columns: {
          id: true,
          seed: true,
          status: true,
          gameKey: true,
          gameVersion: true,
          createdAt: true,
        },
      });
      if (!match) return null;

      const [turnRows, snapshotRows] = await Promise.all([
        ctx.db.query.turns.findMany({
          where: eq(turns.matchId, input.matchId),
          orderBy: asc(turns.idx),
          columns: {
            id: true,
            idx: true,
            actor: true,
            action: true,
          },
        }),
        ctx.db.query.stateSnapshots.findMany({
          where: eq(games.matchId, input.matchId),
          columns: {
            id: true,
            matchId: true,
            turnId: true,
            gameKey: true,
            gameVersion: true,
            state: true,
            createdAt: true,
          },
        }),
      ]);

      // Index snapshots by turnId; detect initial snapshot with null turnId if present
      const snapshotByTurnId = new Map<number, TicTacToeState>();
      let initialState: TicTacToeState | null = null;
      for (const s of snapshotRows) {
        if (s.turnId == null) initialState = isValidState(s.state) ? s.state : null;
        else if (isValidState(s.state)) snapshotByTurnId.set(s.turnId, s.state);
      }

      const steps = turnRows.map((t) => {
        const safeMove = moveMessageSchema.safeParse(t.action as unknown);
        const move: TicTacToeMoveMessage | null = safeMove.success
          ? safeMove.data
          : null;
        return {
          id: t.id,
          idx: t.idx,
          actor: (t.actor as TicTacToeActor) ?? "agentA",
          action: move,
          state: snapshotByTurnId.get(t.id) ?? null,
        };
      });

      return {
        match,
        initialState,
        steps,
      };
    }),
});

function isValidState(state: unknown): state is TicTacToeState {
  if (!state || typeof state !== "object") return false;
  const s = state as Record<string, unknown>;
  const player = s.player;
  const winner = s.winner;
  const board = s.board;
  const isActor = (v: unknown): v is TicTacToeActor => v === "agentA" || v === "agentB";
  if (!Array.isArray(board)) return false;
  if (!isActor(player)) return false;
  if (!(winner === null || isActor(winner))) return false;
  return true;
}


