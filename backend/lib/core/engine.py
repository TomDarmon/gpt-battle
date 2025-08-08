import random
import string
from typing import Any, Dict, TypeVar
from loguru import logger

from pydantic import BaseModel
from lib.core.agent import Agent
from .game import GameSpec
from .types import Event
from lib.core import persistence


def generate_seed(length: int = 12) -> str:
    rng = random.SystemRandom()
    alphabet = string.ascii_letters + string.digits
    return "".join(rng.choice(alphabet) for _ in range(length))


StateT = TypeVar("StateT", bound=BaseModel)
ActionT = TypeVar("ActionT", bound=BaseModel)
ObservationT = TypeVar("ObservationT", bound=BaseModel)


class Engine:
    def run_match(
        self,
        agent_a: Agent,
        agent_b: Agent,
        game: GameSpec[StateT, ActionT, ObservationT],
        max_turns: int = 6,
    ) -> Dict[str, Any]:
        seed = generate_seed()
        match_id = self._initialize_match(seed, game)
        state = self._setup_initial_state(match_id, game, seed)

        try:
            state, scores = self._run_game_loop(match_id, agent_a, agent_b, game, state, max_turns)
            return self._finalize_match(match_id, seed, agent_a, agent_b, scores)
        except Exception as exc:  # pragma: no cover
            self._handle_match_error(match_id, exc)
            raise

    def _initialize_match(self, seed: str, game: GameSpec[StateT, ActionT, ObservationT]) -> int:
        logger.info(
            f"engine.match_started seed={seed} game_key={game.game_key} version={game.game_version}"
        )
        match_id = persistence.create_match(
            seed=seed,
            game_key=game.game_key,
            game_version=game.game_version,
        )
        persistence.record_event(
            match_id,
            "engine.match_started",
            {"seed": seed, "game_key": game.game_key, "game_version": game.game_version},
        )
        return match_id

    def _setup_initial_state(self, match_id: int, game: GameSpec[StateT, ActionT, ObservationT], seed: str) -> StateT:
        state = game.initial_state(seed)
        persistence.record_snapshot(
            match_id,
            game_key=game.game_key,
            game_version=game.game_version,
            state=state.model_dump(),
            turn_id=None,
        )
        return state

    def _run_game_loop(
        self,
        match_id: int,
        agent_a: Agent,
        agent_b: Agent,
        game: GameSpec[StateT, ActionT, ObservationT],
        state: StateT,
        max_turns: int,
    ) -> tuple[StateT, Dict[str, float]]:
        for turn_idx in range(1, max_turns + 1):
            if game.is_terminal(state):
                break

            actor = game.current_actor(state)
            persistence.record_event(match_id, "engine.turn_started", {"turn": turn_idx, "actor": actor})

            acting_agent = agent_a if actor == "agentA" else agent_b
            action = self._get_agent_action(acting_agent, turn_idx, game, state, actor)

            # Handle illegal actions
            forfeit_result = self._try_apply_action(match_id, game, state, action, turn_idx, actor)
            if forfeit_result is not None:
                return state, forfeit_result

            # Apply valid action
            result = game.apply_action(state, action)
            state = self._process_turn_result(match_id, game, result, action, turn_idx, actor)

            persistence.record_event(match_id, "engine.turn_finished", {"turn": turn_idx, "actor": actor})

            if game.is_terminal(state):
                break

        scores = game.score(state) if game.is_terminal(state) else {"agentA": 0.0, "agentB": 0.0}
        return state, scores

    def _get_agent_action(
        self,
        acting_agent: Agent,
        turn_idx: int,
        game: GameSpec[StateT, ActionT, ObservationT],
        state: StateT,
        actor: str,
    ) -> ActionT:
        observation = game.observation_for(state, actor)
        action = acting_agent.produce_action(turn_idx, observation)
        logger.debug(f"engine.agent_action actor={actor} action={action.model_dump_json()}")
        return action

    def _try_apply_action(
        self,
        match_id: int,
        game: GameSpec[StateT, ActionT, ObservationT],
        state: StateT,
        action: ActionT,
        turn_idx: int,
        actor: str,
    ) -> Dict[str, float] | None:
        try:
            # Validate by attempting to apply on a copy; if it fails, forfeit
            game.apply_action(state, action)
            return None  # No forfeit, action is valid
        except ValueError as ve:
            return self._handle_illegal_action(match_id, action, turn_idx, actor, ve)

    def _handle_illegal_action(
        self,
        match_id: int,
        action: ActionT,
        turn_idx: int,
        actor: str,
        error: ValueError,
    ) -> Dict[str, float]:
        persistence.record_event(
            match_id,
            "engine.illegal_action",
            {"turn": turn_idx, "actor": actor, "message": str(error), "action": action.model_dump()},
        )
        forfeiter = actor
        winner = "agentB" if forfeiter == "agentA" else "agentA"
        scores = {"agentA": 1.0 if winner == "agentA" else 0.0, "agentB": 1.0 if winner == "agentB" else 0.0}
        persistence.record_event(match_id, "engine.match_finished", {"scores": scores, "reason": "forfeit"})
        persistence.mark_match_status(match_id, "finished")
        return scores

    def _process_turn_result(
        self,
        match_id: int,
        game: GameSpec[StateT, ActionT, ObservationT],
        result: Any,
        action: ActionT,
        turn_idx: int,
        actor: str,
    ) -> StateT:
        # persist turn and events (store JSON as typed action)
        turn_id = persistence.record_turn(
            match_id,
            idx=turn_idx,
            actor=actor,
            action=action.model_dump(),
            action_type=getattr(action, "type", None),
        )
        for ev in result.events:
            persistence.record_event(match_id, ev.type, ev.payload, turn_id=turn_id)

        # update state and snapshot
        state = result.state_after
        persistence.record_snapshot(
            match_id,
            game_key=game.game_key,
            game_version=game.game_version,
            state=state.model_dump(),
            turn_id=turn_id,
        )
        return state

    def _finalize_match(
        self,
        match_id: int,
        seed: str,
        agent_a: Agent,
        agent_b: Agent,
        scores: Dict[str, float],
    ) -> Dict[str, Any]:
        persistence.record_event(match_id, "engine.match_finished", {"scores": scores})
        persistence.mark_match_status(match_id, "finished")
        self._notify_agents_of_outcome(agent_a, agent_b, scores)
        logger.info(f"engine.match_finished match_id={match_id} seed={seed} scores={scores}")
        return {"match_id": match_id, "seed": seed, "status": "finished", "scores": scores}

    def _notify_agents_of_outcome(
        self,
        agent_a: Agent,
        agent_b: Agent,
        scores: Dict[str, float],
        reason: str | None = None,
    ) -> None:
        payload = {"scores": scores}
        if reason:
            payload["reason"] = reason

        try:
            agent_a.receive_outcome(Event(type="engine.match_finished", payload=payload))
        except Exception:
            logger.exception("agent_a.receive_outcome error")
        try:
            agent_b.receive_outcome(Event(type="engine.match_finished", payload=payload))
        except Exception:
            logger.exception("agent_b.receive_outcome error")

    def _handle_match_error(self, match_id: int, exc: Exception) -> None:
        logger.exception(f"engine.error match_id={match_id}")
        persistence.mark_match_status(match_id, "error")
        persistence.record_event(match_id, "engine.error", {"message": str(exc), "type": exc.__class__.__name__})
