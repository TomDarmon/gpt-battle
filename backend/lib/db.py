import json
from contextlib import contextmanager
from typing import Any, Optional
from lib import config
import psycopg


@contextmanager
def get_conn():
    with psycopg.connect(config.DATABASE_URL) as conn:
        yield conn


def insert_match(seed: str, status: str = "created", game_id: Optional[str] = None) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            if game_id is None:
                cur.execute(
                    """
                    insert into matches (seed, status)
                    values (%s, %s)
                    returning id
                    """,
                    (seed, status),
                )
            else:
                cur.execute(
                    """
                    insert into matches (seed, status, game_id)
                    values (%s, %s, %s)
                    returning id
                    """,
                    (seed, status, game_id),
                )
            (match_id,) = cur.fetchone()
            conn.commit()
            return match_id


def update_match_status(match_id: int, status: str) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "update matches set status = %s where id = %s",
                (status, match_id),
            )
            conn.commit()


def insert_turn(match_id: int, idx: int, actor: str, message: str) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into turns (match_id, idx, actor, message)
                values (%s, %s, %s, %s)
                returning id
                """,
                (match_id, idx, actor, message),
            )
            (turn_id,) = cur.fetchone()
            conn.commit()
            return turn_id


def insert_event(
    match_id: int,
    event_type: str,
    payload: dict[str, Any],
    turn_id: Optional[int] = None,
) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into events (match_id, turn_id, type, payload)
                values (%s, %s, %s, %s::jsonb)
                returning id
                """,
                (match_id, turn_id, event_type, json.dumps(payload)),
            )
            (event_id,) = cur.fetchone()
            conn.commit()
            return event_id


def insert_state_snapshot(
    match_id: int,
    game_id: str,
    state: dict[str, Any],
    *,
    turn_id: Optional[int] = None,
) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into state_snapshots (match_id, turn_id, game_id, state)
                values (%s, %s, %s, %s::jsonb)
                returning id
                """,
                (match_id, turn_id, game_id, json.dumps(state)),
            )
            (snapshot_id,) = cur.fetchone()
            conn.commit()
            return snapshot_id


