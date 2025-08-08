from __future__ import annotations

from typing import Any, Optional
from lib import db


def create_match(seed: str, game_id: str) -> int:
    return db.insert_match(seed=seed, status="running", game_id=game_id)


def record_turn(match_id: int, idx: int, actor: str, message: Optional[str] = None) -> int:
    return db.insert_turn(match_id=match_id, idx=idx, actor=actor, message=message or "")


def record_event(match_id: int, type: str, payload: dict[str, Any], turn_id: Optional[int] = None) -> int:
    return db.insert_event(match_id=match_id, event_type=type, payload=payload, turn_id=turn_id)


def record_snapshot(match_id: int, game_id: str, state: dict[str, Any], turn_id: Optional[int] = None) -> int:
    return db.insert_state_snapshot(match_id=match_id, game_id=game_id, state=state, turn_id=turn_id)


def mark_match_status(match_id: int, status: str) -> None:
    db.update_match_status(match_id=match_id, status=status)


