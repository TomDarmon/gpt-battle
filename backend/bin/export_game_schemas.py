import json
from pathlib import Path

import fire
from lib.games.tictactoe.spec import TicTacToeGameSpec


def main(out: str) -> None:
    """Export game schemas to JSON files.
    
    Args:
        out: Output directory for JSON Schemas
    """
    out_dir = Path(out)
    out_dir.mkdir(parents=True, exist_ok=True)

    specs = [TicTacToeGameSpec()]
    for spec in specs:
        base = out_dir / spec.game_key / spec.game_version
        base.mkdir(parents=True, exist_ok=True)
        schemas = spec.schemas()
        for name in ["state", "action", "observation", "event"]:
            with (base / f"{name}.schema.json").open("w") as f:
                json.dump(schemas.get(name, {}), f, indent=2)


if __name__ == "__main__":
    fire.Fire(main)


