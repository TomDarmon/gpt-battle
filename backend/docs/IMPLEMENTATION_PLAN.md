## Turn-Based Multi-Game Framework – MVP Implementation Plan (TicTacToe First)

### MVP Goals

- **Minimal, modular core**: Small, clean engine and types that run turn-based games.
- **Persistence**: Event-sourced with state snapshots for replay.
- **Portability**: Works locally and on Modal using the same engine.
- **DB managed by Drizzle**: Schema is owned by `webapp/` (no SQL migrations in Python) later a UI will be added to visualize game, replay games, etc...
- **Scope-limited**: Only TicTacToe for MVP, but framework makes adding chess or others trivial later.

---

### MVP Scope (What we will build now)

- **Game**: TicTacToe only (`tictactoe/v1`).
- **Runtime**: Local and Modal.
- **DB**: `matches`, `turns`, `events` (already present) + `state_snapshots` (add via Drizzle in `webapp/`).
- **Illegal actions**: Simplest policy – emit `engine.illegal_action` and end match as forfeit.
- **Observability**: Engine/game events + snapshots every turn (MVP).
- **Agents**: In-memory scripted agents only (no LLM for MVP).

Out of scope for MVP: chess, CTF/sandbox, OpenRouter/LLM agents, partial observability, fancy UI.

---

### High-Level Architecture (MVP)

- **Core Engine**: Drives the generic turn loop.
- **GameSpec**: Per-game rules and transitions.
- **Typed Models**: `Action`, `Observation`, `GameState`, `TransitionResult`, `Event` via Pydantic v2.
- **Persistence**: Thin wrapper over `lib/db.py` for events/turns/snapshots.
- **Runtimes**: Local and Modal both call the same engine.

---

### File/Module Layout (MVP)

```
lib/
  core/
    types.py            # Action, Observation, GameState, TransitionResult, Event, ActorId
    agent.py            # Agent Protocol (+ base class if helpful)
    game.py             # GameSpec Protocol
    engine.py           # Core turn loop engine
    persistence.py      # Thin repository over lib.db (events/turns/snapshots)
  games/
    tictactoe/
      models.py        # Pydantic models: state/action/observation
      spec.py          # TicTacToeGameSpec implementing GameSpec
      agents.py        # Simple agents: random/legal move

lib/orchestrator.py       # Delegates to core.engine.Engine (keep external API stable)
lib/db.py                 # Add state_snapshots helpers if needed by persistence
remote/deploy.py          # Builds image, constructs agents/spec, calls Engine on Modal
main.py                   # CLI: selects game + mode; calls Engine
```

Keep `lib/openrouter.py` untouched for MVP (not used).

---

### Core Contracts (MVP)

These signatures are the source of truth for implementation. Use Pydantic v2 models in `core/types.py`.

```python
# lib/core/agent.py
from typing import Protocol
from .types import Action, Observation, Event

class Agent(Protocol):
    name: str
    def produce_action(self, turn_index: int, observation: Observation) -> Action: ...
    def receive_outcome(self, event: Event) -> None: ...  # optional
```

```python
# lib/core/game.py
from typing import Protocol
from .types import Action, Observation, GameState, TransitionResult

class GameSpec(Protocol):
    game_id: str  # e.g., "tictactoe/v1"
    def initial_state(self, seed: str) -> GameState: ...
    def current_actor(self, state: GameState) -> str: ...  # "agentA" | "agentB"
    def apply_action(self, state: GameState, action: Action) -> TransitionResult: ...
    def is_terminal(self, state: GameState) -> bool: ...
    def score(self, state: GameState) -> dict[str, float]: ...  # when terminal
    def observation_for(self, state: GameState, actor: str) -> Observation: ...
```

```python
# lib/core/engine.py (essentials)
class Engine:
    def run_match(self, agent_a, agent_b, game, max_turns: int) -> dict: ...
    # Behavior detailed in Engine Flow below
```

---

### TicTacToe (Reference Game for MVP)

- `lib/games/tictactoe/models.py` (Pydantic types)
  - `TicTacToeState`: `board: list[list[str]]` (3x3, values: " ", "X", "O"), `player: str` ("agentA"|"agentB"), `winner: str | None`.
  - `TicTacToeAction`: `type: Literal["move"]`, `payload: { row: int, col: int }`.
  - `TicTacToeObservation`: `board: list[list[str]]`, `you: str`.

- `lib/games/tictactoe/spec.py` (implements `GameSpec`)
  - `game_id = "tictactoe/v1"`.
  - `initial_state(seed)`: empty board, `player = "agentA"` starts.
  - `current_actor(state)`: returns `state.player`.
  - `apply_action(state, action)`: validate bounds, cell empty, correct actor; place mark; check win/draw; switch player.
  - `is_terminal(state)`: win or draw.
  - `score(state)`: `{winner: 1.0, loser: 0.0}` or `{agentA: 0.5, agentB: 0.5}` for draw.
  - Emit game-level events: `game.move_applied`, `game.win`, `game.draw` via `TransitionResult.events`.

- `lib/games/tictactoe/agents.py`
  - `RandomLegalAgent`: picks a random empty cell from the board to move.

---

### Engine Flow (MVP)

1. Create `match` with `seed` and `game_id`.
2. `state = game.initial_state(seed)`; persist snapshot (`turn_id = null`).
3. For `turn in 1..max_turns` until `game.is_terminal(state)`:
   - `actor = game.current_actor(state)`.
   - `observation = game.observation_for(state, actor)`.
   - Get `action = agent.produce_action(turn, observation)` from the correct agent.
   - Apply with validation: `result = game.apply_action(state, action)`.
   - Persist: `turn` (actor, message optional), `events` (engine+game), `snapshot` of `result.state_after`.
   - If terminal: compute `score`, emit `engine.match_finished`, break.
4. Illegal action policy (MVP): on validation failure, emit `engine.illegal_action` and end match as forfeit (score 1.0 to the other actor).
5. Return `MatchResult` with `match_id`, `seed`, `status`, and `scores`.

Event naming (MVP):
- Engine: `engine.match_started`, `engine.turn_started`, `engine.turn_finished`, `engine.match_finished`, `engine.illegal_action`.
- Game: `game.move_applied`, `game.win`, `game.draw`.

---

### Persistence (MVP)

- Use `lib/core/persistence.py` to wrap `lib/db.py` calls:
  - `create_match(seed: str, game_id: str) -> int`
  - `record_turn(match_id: int, idx: int, actor: str, message: str | None) -> int`
  - `record_event(match_id: int, type: str, payload: dict, turn_id: int | None = None) -> int`
  - `record_snapshot(match_id: int, game_id: str, state: dict, turn_id: int | None) -> int`
  - `mark_match_status(match_id: int, status: str) -> None`

`lib/db.py` may need a helper for `state_snapshots` inserts. Keep payloads small and structured.

---

### Database – Drizzle (webapp/)

- All schema changes are made in `webapp/` and pushed via Drizzle.
- Add `state_snapshots` table and optional `matches.game_id` column.

Required tables (Drizzle definitions to implement in `webapp/src/db/schema.ts`):
- `matches`: already exists; add `game_id: text | null` (MVP may set it).
- `turns`: already exists.
- `events`: already exists.
- `state_snapshots`:
  - `id` identity primary key
  - `match_id` FK → `matches.id` cascade on delete
  - `turn_id` FK → `turns.id` cascade on delete, nullable
  - `game_id` text not null
  - `state` jsonb not null
  - `created_at` timestamptz default now()

Relations (in `webapp/src/db/relations.ts`):
- `matches` has many `state_snapshots`.
- `state_snapshots` belongs to `matches` and optionally to `turns`.

Commands to apply schema:

```bash
cd webapp
bun install  # first time only
bun run db:generate
bun run db:push
```

Environment: `DATABASE_URL` must be set for Drizzle.

---

### Orchestration and CLI (backend)

- `lib/orchestrator.py`: Replace the internal loop by delegating to `core.engine.Engine` while preserving the existing external function name used by Modal (`run_match`).
- `main.py`: add `--game` flag and accept `--mode local|remote`.
  - Local: build TicTacToe `GameSpec` + two `RandomLegalAgent` instances and call `Engine`.
  - Remote: call Modal function which does the same remotely.
- `remote/deploy.py`: ensure the image includes `lib/core` and `lib/games`; instantiate TicTacToe spec and agents; call `Engine`.

---

### Acceptance Criteria (MVP)

Running:

```bash
python backend/main.py match --game tictactoe --turns 9 --mode local
```

Produces:
- A row in `matches` with `seed`, `status = "finished"`, and `game_id = "tictactoe/v1"`.
- Up to 9 `turns` with alternating `actor` values (stops early on terminal state).
- `events` including `engine.match_started`, `engine.turn_started`, `game.move_applied`, terminal (`game.win` or `game.draw`), `engine.match_finished`.
- `state_snapshots` for the initial state (`turn_id = null`) and after each turn.
- If an illegal action is attempted (can simulate), `engine.illegal_action` is emitted and the match ends with a forfeit score.

Remote execution:
- `python backend/main.py match --game tictactoe --turns 9 --mode remote` executes on Modal with the same DB effects.

---

### Implementation Steps (Ordered)

1) Database (Drizzle in `webapp/`)
- Add `state_snapshots` table to `webapp/src/db/schema.ts`.
- Optionally add `game_id` column to `matches`.
- Update `webapp/src/db/relations.ts` to include snapshot relations.
- Push schema via Drizzle.

2) Core (backend `lib/core/`)
- Implement `types.py` (Pydantic models), `agent.py` (Protocol), `game.py` (Protocol).
- Implement `engine.py` (turn loop, seeded RNG, event emission, snapshotting).
- Implement `persistence.py` wrapping `lib/db.py`.

3) TicTacToe (backend `lib/games/tictactoe/`)
- Implement `models.py` (state/action/observation models).
- Implement `spec.py` (`GameSpec` with full legality/win/draw checks and events).
- Implement `agents.py` (`RandomLegalAgent`).

4) Wire-up
- Update `lib/orchestrator.py` to call `Engine` with provided agents and `GameSpec`.
- Update `main.py` to accept `--game tictactoe` and `--mode local|remote`.
- Update `remote/deploy.py` to construct TicTacToe spec + agents and call engine on Modal.

5) Smoke tests (manual)
- Run local match; verify DB rows and correct early stop on win/draw.
- Run remote match on Modal; verify same behavior.

Nice-to-have (time-permitting)
- Unit tests for `TicTacToeGameSpec.apply_action` and `is_terminal`.
- Engine-level test with deterministic scripted agents for a draw.

---

### Conventions & Guidelines

- **Event naming**: Prefix with `engine.` or `game.`; keep payloads small and versionable (add `schema_version` if needed).
- **Serialization**: All state and events must be JSON-serializable; prefer simple primitives.
- **Determinism**: Derive any randomness from a seed stored on the match.
- **Error handling**: On unexpected exceptions, mark match `status = "error"` and emit an `engine.error` event with a safe message.
- **Code style**: Prefer explicit names, guard clauses, and shallow nesting. Keep functions small and testable.

---

### Post-MVP Roadmap (Do Later)

- Chess (`python-chess`) as `chess/v1` implementing `GameSpec`.
- `LLMAgent` using OpenRouter with JSON Schema tool-calling.
- CTF game with sandboxed `Executor` (Docker/Modal) and strict limits.
- Observability/UI in the webapp to browse matches, turns, events, and state replay.

This plan intentionally limits scope to a high-quality MVP while establishing stable interfaces so new games and agent types can be added without changing the engine.