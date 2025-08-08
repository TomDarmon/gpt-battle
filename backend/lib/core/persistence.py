from typing import Any, Optional
from lib import db


def create_match(seed: str, *, game_key: str, game_version: str) -> int:
    return db.insert_match(seed=seed, status="created", game_key=game_key, game_version=game_version)


def record_turn(
    match_id: int,
    idx: int,
    actor: str,
    *,
    action: dict[str, Any] | None = None,
    action_type: Optional[str] = None,
) -> int:
    return db.insert_turn(
        match_id=match_id,
        idx=idx,
        actor=actor,
        action=action or {},
        action_type=action_type,
    )


def record_event(match_id: int, type: str, payload: dict[str, Any], turn_id: Optional[int] = None) -> int:
    return db.insert_event(match_id=match_id, event_type=type, payload=payload, turn_id=turn_id)


def record_snapshot(
    match_id: int,
    *,
    game_key: str,
    game_version: str,
    state: dict[str, Any],
    turn_id: Optional[int] = None,
) -> int:
    return db.insert_state_snapshot(
        match_id=match_id,
        game_key=game_key,
        game_version=game_version,
        state=state,
        turn_id=turn_id,
    )


def mark_match_status(match_id: int, status: str) -> None:
    db.update_match_status(match_id=match_id, status=status)


