export const TICTACTOE_GAME_ID = "tictactoe/v1" as const;

export type TicTacToeActor = "agentA" | "agentB";

export type TicTacToeMark = "X" | "O" | " ";

export type TicTacToeBoard = TicTacToeMark[][]; // 3x3 expected

export type TicTacToeMoveMessage = {
  type: "move";
  payload: {
    row: number;
    col: number;
  };
};

export type TicTacToeState = {
  board: TicTacToeBoard;
  player: TicTacToeActor; // player to move
  winner: TicTacToeActor | null;
};

export type MatchSummary = {
  id: number;
  seed: string;
  status: string;
  gameId: string;
  createdAt: Date;
};

export type TicTacToeTurn = {
  id: number;
  idx: number;
  actor: TicTacToeActor;
  message: TicTacToeMoveMessage;
};

export type TicTacToeReplayStep = {
  idx: number;
  actor: TicTacToeActor;
  move: TicTacToeMoveMessage | null;
  state: TicTacToeState | null; // state after this move if snapshot exists
};

export type TicTacToeReplay = {
  match: MatchSummary;
  initialState: TicTacToeState | null;
  steps: TicTacToeReplayStep[];
};


