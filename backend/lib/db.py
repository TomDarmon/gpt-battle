import json
from contextlib import contextmanager
from typing import Any, Optional
from lib import config
import psycopg


@contextmanager
def get_conn():
    with psycopg.connect(config.DATABASE_URL) as conn:
        yield conn


def insert_match(seed: str, status: str, game_key: str, game_version: str) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into matches (seed, status, game_key, game_version)
                values (%s, %s, %s, %s)
                returning id
                """,
                (seed, status, game_key, game_version),
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


def insert_turn(
    match_id: int,
    idx: int,
    actor: str,
    *,
    action: dict[str, Any],
    action_type: Optional[str] = None,
) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into turns (match_id, idx, actor, action, action_type)
                values (%s, %s, %s, %s::jsonb, %s)
                returning id
                """,
                (match_id, idx, actor, json.dumps(action), action_type),
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
                insert into events (match_id, turn_id, event_type, payload)
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
    *,
    game_key: str,
    game_version: str,
    state: dict[str, Any],
    turn_id: Optional[int] = None,
) -> int:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into state_snapshots (match_id, turn_id, game_key, game_version, state)
                values (%s, %s, %s, %s, %s::jsonb)
                returning id
                """,
                (match_id, turn_id, game_key, game_version, json.dumps(state)),
            )
            (snapshot_id,) = cur.fetchone()
            conn.commit()
            return snapshot_id


def upsert_game_definition(
    *,
    game_key: str,
    game_version: str,
    state_schema: dict[str, Any],
    action_schema: dict[str, Any],
    observation_schema: dict[str, Any],
    event_schema: dict[str, Any],
) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into game_definitions (
                    game_key, game_version, state_schema, action_schema, observation_schema, event_schema
                ) values (%s, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb)
                on conflict (game_key, game_version)
                do update set
                    state_schema = excluded.state_schema,
                    action_schema = excluded.action_schema,
                    observation_schema = excluded.observation_schema,
                    event_schema = excluded.event_schema
                """,
                (
                    game_key,
                    game_version,
                    json.dumps(state_schema),
                    json.dumps(action_schema),
                    json.dumps(observation_schema),
                    json.dumps(event_schema),
                ),
            )
            conn.commit()


