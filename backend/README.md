## Backend Refactor Notes

- Engine now uses `game_key` and `game_version` instead of `game_id`.
- Turns store `action` JSON and optional `action_type` instead of a `message` string.
- State snapshots store `game_key` and `game_version`.
- Added `register_games` to upsert game schemas into `game_definitions` at match start.

# Backend (Modal)

Dev notes

```bash
# install deps
uv sync

# run modal locally authenticated
modal token set  # already configured per project note
```

