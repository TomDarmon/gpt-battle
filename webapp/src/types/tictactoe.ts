export type TicTacToeActor = "agentA" | "agentB";

// Types mirrored from backend JSON Schemas
export type TicTacToeAction = {
  type: "move";
  payload: Record<string, number>;
};

export type TicTacToeState = {
  board: string[][];
  player: TicTacToeActor;
  winner: TicTacToeActor | null;
};

export type TicTacToeObservation = {
  board: string[][];
  you: TicTacToeActor;
};

export type TicTacToeEvent = Record<string, unknown>;

// Helper aliases for UI code
export type TicTacToeBoard = TicTacToeState["board"];
export type TicTacToeMark = string;

// Backward-compat alias (keeps existing imports working)
export type TicTacToeMoveMessage = TicTacToeAction;

export type MatchSummary = {
  id: number;
  seed: string;
  status: string;
  gameKey: string;
  gameVersion: string;
  createdAt: Date;
};

export type TicTacToeTurn = {
  id: number;
  idx: number;
  actor: TicTacToeActor;
  action: TicTacToeAction;
};

export type TicTacToeReplayStep = {
  idx: number;
  actor: TicTacToeActor;
  action: TicTacToeAction | null;
  state: TicTacToeState | null; // state after this move if snapshot exists
};

export type TicTacToeReplay = {
  match: MatchSummary;
  initialState: TicTacToeState | null;
  steps: TicTacToeReplayStep[];
};


