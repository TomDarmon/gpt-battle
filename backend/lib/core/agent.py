from __future__ import annotations

from typing import Protocol, TypeVar, Generic
from pydantic import BaseModel
from .types import Event


ActionT = TypeVar("ActionT", bound=BaseModel)
ObservationT = TypeVar("ObservationT", bound=BaseModel)


class Agent(Generic[ActionT, ObservationT], Protocol):
    name: str

    def produce_action(self, turn_index: int, observation: ObservationT) -> ActionT: ...

    def receive_outcome(self, event: Event) -> None: ...


