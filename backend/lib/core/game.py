from __future__ import annotations

from typing import Protocol, TypeVar, Generic
from pydantic import BaseModel
from .types import TransitionResult


StateT = TypeVar("StateT", bound=BaseModel)
ActionT = TypeVar("ActionT", bound=BaseModel)
ObservationT = TypeVar("ObservationT", bound=BaseModel)


class GameSpec(Generic[StateT, ActionT, ObservationT], Protocol):
    game_id: str

    def initial_state(self, seed: str) -> StateT: ...

    def current_actor(self, state: StateT) -> str: ...

    def apply_action(self, state: StateT, action: ActionT) -> TransitionResult[StateT]: ...

    def is_terminal(self, state: StateT) -> bool: ...

    def score(self, state: StateT) -> dict[str, float]: ...

    def observation_for(self, state: StateT, actor: str) -> ObservationT: ...


