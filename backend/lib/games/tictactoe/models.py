from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


Player = Literal["agentA", "agentB"]


class TicTacToeState(BaseModel):
    board: list[list[str]] = Field(default_factory=lambda: [[" ", " ", " "] for _ in range(3)])
    player: Player = "agentA"
    winner: Player | None = None


class TicTacToeAction(BaseModel):
    type: Literal["move"]
    payload: dict[str, int]


class TicTacToeObservation(BaseModel):
    board: list[list[str]]
    you: Player


