from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field


# Identifiers for the two actors supported by the engine.
ActorId = Literal["agentA", "agentB"]


# Generic type variables for game-specific models
StateT = TypeVar("StateT", bound=BaseModel)
ActionT = TypeVar("ActionT", bound=BaseModel)
ObservationT = TypeVar("ObservationT", bound=BaseModel)


class Event(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class TransitionResult(BaseModel, Generic[StateT]):
    state_after: StateT
    events: list[Event] = Field(default_factory=list)


