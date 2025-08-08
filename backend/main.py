import fire

from remote.deploy import run_a_match, app
from lib.orchestrator import run_match as run_match_local
from lib.games.tictactoe.agents import RandomLegalAgent
from lib.games.tictactoe.spec import TicTacToeGameSpec


def match(game: str = "tictactoe", turns: int = 9, mode: str = "local"):
    """
    Run a match.

    - mode="remote": run on Modal infra
    - mode="local": run locally using in-memory agents
    """
    if game != "tictactoe":
        raise ValueError("Only 'tictactoe' is supported in MVP")

    if mode == "remote":
        # Do not run modal locally per instruction; keep function available
        with app.run():
            run_a_match.remote(max_turns=turns)
    elif mode == "local":
        a = RandomLegalAgent("agentA")
        b = RandomLegalAgent("agentB")
        spec = TicTacToeGameSpec()
        return run_match_local(agent_a=a, agent_b=b, max_turns=turns, game=spec)
    else:
        raise ValueError("mode must be 'remote' or 'local'")


if __name__ == "__main__":
    fire.Fire({"match": match})
