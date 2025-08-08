import modal
from lib import config
from lib.orchestrator import run_match


APP_NAME = "gpt-battle"
app: modal.App = modal.App(
    APP_NAME,
    image=modal.Image.debian_slim(python_version="3.12").pip_install_from_pyproject(
        pyproject_toml="pyproject.toml",
    ).add_local_python_source("lib", copy=False, ignore=[".env", ".venv"]),
)


@app.function(secrets=[modal.Secret.from_name(config.MODAL_SECRET_NAME)])
def run_a_match(max_turns: int = 9):
    from lib.games.tictactoe.agents import RandomLegalAgent
    from lib.games.tictactoe.spec import TicTacToeGameSpec

    agent_a = RandomLegalAgent("agentA")
    agent_b = RandomLegalAgent("agentB")
    spec = TicTacToeGameSpec()
    return run_match(agent_a, agent_b, max_turns=max_turns, game=spec)