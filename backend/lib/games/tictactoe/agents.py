import random
from typing import List, Tuple
from lib.core.agent import Agent
from .models import TicTacToeAction, TicTacToeObservation


class RandomLegalAgent(Agent[TicTacToeAction, TicTacToeObservation]):
    def __init__(self, name: str, *, seed: str | None = None) -> None:
        self.name = name
        self._rng = random.Random(seed)

    def produce_action(self, turn_index: int, observation: TicTacToeObservation) -> TicTacToeAction:
        obs = observation

        legal: List[Tuple[int, int]] = [
            (r, c) for r in range(3) for c in range(3) if obs.board[r][c] == " "
        ]
        if not legal:
            # Should not happen if engine checks terminal, but return a dummy move
            return TicTacToeAction(type="move", payload={"row": 0, "col": 0})
        row, col = self._rng.choice(legal)
        return TicTacToeAction(type="move", payload={"row": row, "col": col})

    def receive_outcome(self, event):
        return None


