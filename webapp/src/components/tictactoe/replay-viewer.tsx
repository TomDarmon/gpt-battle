"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import type {
  TicTacToeActor,
  TicTacToeBoard,
  TicTacToeMark,
  TicTacToeMoveMessage,
  TicTacToeReplay,
  TicTacToeState,
} from "../../types/tictactoe";

type Props = { matchId: number };

export function ReplayViewer({ matchId }: Props) {
  const { data, isLoading } = api.match.getReplay.useQuery({ matchId });
  const [stepIndex, setStepIndex] = useState<number>(-1); // -1 means before first move

  const derived = useMemo(() => buildDerived(data, stepIndex), [data, stepIndex]);

  if (isLoading) return <div>Loading…</div>;
  if (!data) return <div>Match not found.</div>;

  const total = data.steps.length;
  const canPrev = stepIndex >= 0;
  const canNext = stepIndex < total - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} moves — viewing {stepIndex + 1} / {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => setStepIndex(-1)}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            |⟨
          </button>
          <button
            disabled={!canPrev}
            onClick={() => setStepIndex((i) => Math.max(-1, i - 1))}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            ◀
          </button>
          <button
            disabled={!canNext}
            onClick={() => setStepIndex((i) => Math.min(total - 1, i + 1))}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            ▶
          </button>
          <button
            disabled={!canNext}
            onClick={() => setStepIndex(total - 1)}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            ⟩|
          </button>
        </div>
      </div>

      <Board board={derived.board} />

      <div className="text-sm">
        <div>Turn: {stepIndex >= 0 ? stepIndex + 1 : 0}</div>
        <div>Next player: {derived.state.player}</div>
        <div>Winner: {derived.state.winner ?? "—"}</div>
      </div>
    </div>
  );
}

function Board({ board }: { board: TicTacToeBoard }) {
  return (
    <div className="grid grid-cols-3 gap-1 w-56">
      {board.flatMap((row: TicTacToeBoard[number], rIdx: number) =>
        row.map((cell: TicTacToeMark, cIdx: number) => (
          <div
            key={`${rIdx}-${cIdx}`}
            className="flex h-16 w-16 items-center justify-center rounded border text-2xl font-bold"
          >
            {cell}
          </div>
        ))
      )}
    </div>
  );
}

function buildDerived(data: TicTacToeReplay | null | undefined, stepIndex: number) {
  const empty: TicTacToeBoard = [
    [" ", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ];
  if (!data) return { board: empty, state: makeState(empty, "agentA", null) };

  // Prefer initial snapshot when provided
  let board: TicTacToeBoard = cloneBoard(empty);
  let player: TicTacToeActor = "agentA";
  let winner: TicTacToeActor | null = null;
  if (data.initialState && isValidState(data.initialState)) {
    board = normalizeBoard(data.initialState.board);
    player = data.initialState.player;
    winner = data.initialState.winner;
  }

  // Apply moves up to stepIndex, using snapshot after each move if present
  const stepsToApply = stepIndex >= 0 ? data.steps.slice(0, stepIndex + 1) : [];
  for (const step of stepsToApply) {
    if (step.state && isValidState(step.state)) {
      board = normalizeBoard(step.state.board);
      player = step.state.player;
      winner = step.state.winner;
      continue;
    }
    if (step.move) {
      board = applyMove(board, step.actor, step.move);
      player = step.actor === "agentA" ? "agentB" : "agentA";
      // Basic winner detection if three in a row
      winner = detectWinner(board);
    }
  }

  return { board, state: makeState(board, player, winner) };
}

function makeState(board: TicTacToeBoard, player: TicTacToeActor, winner: TicTacToeActor | null): TicTacToeState {
  return { board, player, winner };
}

function cloneBoard(board: TicTacToeBoard): TicTacToeBoard {
  return board.map((row: TicTacToeBoard[number]) => row.slice());
}

function normalizeBoard(board: TicTacToeBoard): TicTacToeBoard {
  const b = cloneBoard(board);
  // Ensure 3x3 with safe values
  for (let r = 0; r < 3; r++) {
    b[r] ??= [" ", " ", " "];
    for (let c = 0; c < 3; c++) {
      const v = b[r]?.[c] ?? " ";
      b[r]![c] = v === "X" || v === "O" ? v : " ";
    }
  }
  return b;
}

function applyMove(board: TicTacToeBoard, actor: TicTacToeActor, move: TicTacToeMoveMessage): TicTacToeBoard {
  const next = cloneBoard(board);
  const mark = actor === "agentA" ? "X" : "O";
  const { row, col } = move.payload;
  if (row >= 0 && row < 3 && col >= 0 && col < 3 && next[row]) {
    next[row][col] = mark;
  }
  return next;
}

function detectWinner(board: TicTacToeBoard): TicTacToeActor | null {
  const safe = (r: number, c: number): TicTacToeMark => board[r]?.[c] ?? " ";
  const lines: [TicTacToeMark, TicTacToeMark, TicTacToeMark][] = [
    [safe(0, 0), safe(0, 1), safe(0, 2)],
    [safe(1, 0), safe(1, 1), safe(1, 2)],
    [safe(2, 0), safe(2, 1), safe(2, 2)],
    [safe(0, 0), safe(1, 0), safe(2, 0)],
    [safe(0, 1), safe(1, 1), safe(2, 1)],
    [safe(0, 2), safe(1, 2), safe(2, 2)],
    [safe(0, 0), safe(1, 1), safe(2, 2)],
    [safe(0, 2), safe(1, 1), safe(2, 0)],
  ];
  for (const line of lines) {
    if (line[0] !== " " && line[0] === line[1] && line[1] === line[2]) {
      return line[0] === "X" ? "agentA" : "agentB";
    }
  }
  return null;
}

function isValidState(state: TicTacToeState): boolean {
  return (
    state &&
    Array.isArray(state.board) &&
    (state.player === "agentA" || state.player === "agentB") &&
    (state.winner === null || state.winner === "agentA" || state.winner === "agentB")
  );
}

export default ReplayViewer;


