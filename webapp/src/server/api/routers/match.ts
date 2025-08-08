import { z } from "zod";
import { asc, desc, eq } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { matches, turns, games } from "~/server/db/match/schema";
import {
  TICTACTOE_GAME_ID,
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
          gameId: z.string().optional().default(TICTACTOE_GAME_ID),
          limit: z.number().int().min(1).max(200).optional().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const gameId = input?.gameId ?? TICTACTOE_GAME_ID;
      const limit = input?.limit ?? 50;
      const rows = await ctx.db.query.matches.findMany({
        where: eq(matches.gameId, gameId),
        orderBy: desc(matches.createdAt),
        limit,
        columns: {
          id: true,
          seed: true,
          status: true,
          gameId: true,
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
      });
      if (!match) return null;

      const [turnRows, snapshotRows] = await Promise.all([
        ctx.db.query.turns.findMany({
          where: eq(turns.matchId, input.matchId),
          orderBy: asc(turns.idx),
        }),
        ctx.db.query.games.findMany({
          where: eq(games.matchId, input.matchId),
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
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(t.message);
        } catch {
          parsed = null;
        }
        const safeMove = moveMessageSchema.safeParse(parsed);
        const move: TicTacToeMoveMessage | null = safeMove.success
          ? safeMove.data
          : null;
        return {
          id: t.id,
          idx: t.idx,
          actor: (t.actor as TicTacToeActor) ?? "agentA",
          move,
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


