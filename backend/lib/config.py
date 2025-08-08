import os
from dotenv import load_dotenv

load_dotenv()

def safe_load_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(f"Environment variable {key} is not set")
    return value

# Optional for MVP (OpenRouter is out of scope). Keep lazy access for later use.
OPEN_ROUTER_API_KEY = os.environ.get("OPEN_ROUTER_API_KEY")

# Required for DB access
DATABASE_URL = safe_load_env("DATABASE_URL")


ENV = os.environ.get("APP_ENV", "prod")
MODAL_SECRET_NAME = "gpt-battle-prod" if ENV == "prod" else "gpt-battle-dev"