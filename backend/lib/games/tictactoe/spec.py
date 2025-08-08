from __future__ import annotations

import random
from typing import Any
from pydantic import BaseModel
from lib.core.types import TransitionResult, Event
from lib.core.game import GameSpec as GameSpecProto
from .models import TicTacToeState, TicTacToeAction, TicTacToeObservation


class TicTacToeGameSpec(GameSpecProto[TicTacToeState, TicTacToeAction, TicTacToeObservation]):
    game_id: str = "tictactoe/v1"

    def initial_state(self, seed: str) -> TicTacToeState:
        random.seed(seed)
        return TicTacToeState().model_copy(update={})

    def current_actor(self, state: TicTacToeState) -> str:
        return state.player

    def apply_action(self, state: TicTacToeState, action: TicTacToeAction) -> TransitionResult[TicTacToeState]:
        # interpret as ttt move
        if not isinstance(action, TicTacToeAction):
            raise ValueError("Illegal action type for TicTacToeAction")

        row = int(action.payload.get("row", -1))
        col = int(action.payload.get("col", -1))
        if row not in range(3) or col not in range(3):
            raise ValueError("Move out of bounds")
        if state.board[row][col] != " ":
            raise ValueError("Cell occupied")
        if state.winner is not None:
            raise ValueError("Game already finished")

        mark = "X" if state.player == "agentA" else "O"
        new_board = [r.copy() for r in state.board]
        new_board[row][col] = mark
        next_player = "agentB" if state.player == "agentA" else "agentA"
        new_state = TicTacToeState(board=new_board, player=next_player, winner=None)

        events: list[Event] = [Event(type="game.move_applied", payload={"row": row, "col": col, "mark": mark})]

        winner = self._check_winner(new_board)
        if winner:
            new_state.winner = "agentA" if winner == "X" else "agentB"
            events.append(Event(type="game.win", payload={"winner": new_state.winner}))
        elif self._is_draw(new_board):
            events.append(Event(type="game.draw", payload={}))

        return TransitionResult[TicTacToeState](state_after=new_state, events=events)

    def is_terminal(self, state: TicTacToeState) -> bool:
        return state.winner is not None or self._is_draw(state.board)

    def score(self, state: TicTacToeState) -> dict[str, float]:
        if state.winner == "agentA":
            return {"agentA": 1.0, "agentB": 0.0}
        if state.winner == "agentB":
            return {"agentA": 0.0, "agentB": 1.0}
        # draw
        return {"agentA": 0.5, "agentB": 0.5}

    def observation_for(self, state: TicTacToeState, actor: str) -> TicTacToeObservation:
        return TicTacToeObservation(board=[r.copy() for r in state.board], you=actor)

    @staticmethod
    def _check_winner(board: list[list[str]]) -> str | None:
        lines = []
        # rows and cols
        for i in range(3):
            lines.append(board[i])
            lines.append([board[0][i], board[1][i], board[2][i]])
        # diagonals
        lines.append([board[0][0], board[1][1], board[2][2]])
        lines.append([board[0][2], board[1][1], board[2][0]])
        for line in lines:
            if line[0] != " " and line[0] == line[1] == line[2]:
                return line[0]
        return None

    @staticmethod
    def _is_draw(board: list[list[str]]) -> bool:
        return all(cell != " " for row in board for cell in row)


