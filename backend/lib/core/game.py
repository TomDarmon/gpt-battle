from typing import Protocol, TypeVar, Generic, TypedDict
from pydantic import BaseModel
from .types import TransitionResult


StateT = TypeVar("StateT", bound=BaseModel)
ActionT = TypeVar("ActionT", bound=BaseModel)
ObservationT = TypeVar("ObservationT", bound=BaseModel)


class GameSchemas(TypedDict, total=False):
    state: dict
    action: dict
    observation: dict
    event: dict


class GameSpec(Generic[StateT, ActionT, ObservationT], Protocol):
    # Split game id into a typed key and version for stable versioning
    game_key: str
    game_version: str

    def initial_state(self, seed: str) -> StateT: ...

    def current_actor(self, state: StateT) -> str: ...

    def apply_action(self, state: StateT, action: ActionT) -> TransitionResult[StateT]: ...

    def is_terminal(self, state: StateT) -> bool: ...

    def score(self, state: StateT) -> dict[str, float]: ...

    def observation_for(self, state: StateT, actor: str) -> ObservationT: ...

    # Export JSON Schemas for persistence/validation and frontend codegen
    def schemas(self) -> GameSchemas: ...


