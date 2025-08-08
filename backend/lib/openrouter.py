from typing import Any
from lib import config
from openai import OpenAI


class OpenRouter:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=config.OPEN_ROUTER_API_KEY,
        )

    def generate(self, model_name: str, messages: list[dict[str, Any]]):
        return self.client.chat.completions.create(
            model=model_name,
            messages=messages,
        )