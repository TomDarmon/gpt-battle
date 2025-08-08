from typing import Literal, Dict, Any, Iterable
from loguru import logger

from lib.core.agent import Agent
from lib.core.engine import Engine
from lib.db import upsert_game_definition

Actor = Literal["agentA", "agentB"]


def register_games(specs: Iterable[Any]) -> None:
    """Upsert game definitions and schemas to the DB."""
    for spec in specs:
        schemas = spec.schemas()
        upsert_game_definition(
            game_key=spec.game_key,
            game_version=spec.game_version,
            state_schema=schemas.get("state", {}),
            action_schema=schemas.get("action", {}),
            observation_schema=schemas.get("observation", {}),
            event_schema=schemas.get("event", {}),
        )


def run_match(
    agent_a: Agent,
    agent_b: Agent,
    *,
    max_turns: int = 9,
    game: Any,
) -> Dict[str, Any]:
    """Run a match between two provided agents using the core Engine.

    Keeps the external API stable for Modal and CLI.
    """
    logger.info(f"Starting match with {agent_a.name} vs {agent_b.name}")
    engine = Engine()
    # Ensure the game's schema is present in DB
    register_games([game])
    return engine.run_match(agent_a=agent_a, agent_b=agent_b, game=game, max_turns=max_turns)


