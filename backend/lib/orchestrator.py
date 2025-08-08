from typing import Literal, Dict, Any
from loguru import logger

from lib.core.agent import Agent
from lib.core.engine import Engine

Actor = Literal["agentA", "agentB"]


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
    return engine.run_match(agent_a=agent_a, agent_b=agent_b, game=game, max_turns=max_turns)


