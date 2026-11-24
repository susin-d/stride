# ADR 0066 — Per-test-file selection in the smart test cache

## Status

Accepted

- Date: 2026-11-24
- Deciders: @susindran
- Tags: `tooling`, `testing`, `ci`, `cache`

## Context

`scripts/test-smart.ps1` already cached at **suite** granularity: it hashes the whole scope (`scripts/lib/test-hash.py`) and skips the suite when nothing in it changed. That works for a no-op run, but the moment any file changes the *entire* suite reruns — editing one test file cost all 569 backend tests and ~50s. Most edits are local, so this wasted most of the benefit and discouraged running tests while working.

A useful cache here must be selective *without* ever skipping a test that could observe the change. A wrong skip is far worse than a slow run: it reports green on a broken tree.

## Decision

Add static dependency analysis so the runner selects the tests that can reach a change.

- **`scripts/lib/test_deps.py`** — for each test file, walks its imports transitively and hashes the test plus every reachable source file into one SHA.
  - Python: `import x` / `from x import y`, relative imports (`from . import`), function-local imports, and cycles (visited set).
  - JavaScript: relative `import` / `export … from` / `require()`, resolved against the file list.
- **`test-hash.py affected <scope>`** — emits `{ global, guards, tests: { path: { sha, deps, reason } } }`. `test-hash.py` remains the single hashing source of truth.
- **Guard files** (`conftest.py`, `pytest.ini`, `requirements.txt`, `package.json`, lockfiles, vite/vitest configs, `test-hash.py`, `test_deps.py`) are folded into **every** per-file SHA. `conftest.py` mutates process-wide env (DB URL, secrets, WS intervals), so a test's result depends on it regardless of what it imports.
- **`test-smart.ps1 -PerFile`** runs only the selected files. Suite-level caching still short-circuits first.
- **Fail-closed everywhere:** a missing record runs the test; an unparseable test file gets the global SHA and always runs; a partial run only records the files it actually ran; a failing run deletes the per-file baseline. Invariants are unit-tested in `server/tests/unit/test_test_deps.py`.
- The runner resolves `server/.venv` (via `Resolve-PythonForServer` in `scripts/lib/common.ps1`), which also fixes the pre-existing case where bare `python` lacked pytest.

## Consequences

Measured on this repo (57 backend test files):

| Edit | Files run | Tests | Wall |
|---|---|---|---|
| none (unchanged tree) | 0 | 0 | ~2s (suite SKIP) |
| one test file | 1 / 57 | 22 | 13s |
| leaf service `whatsapp_trigger.py` | 24 / 57 | 215 | 46s |
| `core/errors.py` | 29 / 57 | 258+ | 43s |
| `tests/conftest.py` (guard) | 57 / 57 | 578 | 45s |

- **Positive:** local edits are fast again; guard files force a full run; the analysis is pure-Python stdlib with no new dependencies.
- **Negative / Cost:** breadth is limited by `app.main` — any test that boots the FastAPI app transitively imports every router, so broad modules (and `core/*`) still select many files. Vite/vitest config changes are caught via the guard list, not by analysis.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| pytest-testmon / pytest-cache | New dependency plus runtime coverage instrumentation; `test-hash.py` already owns hashing. Requires approval (AGENTS §7.5). |
| Run `git diff --name-only` and guess | Filename heuristics cannot see transitive imports, so they skip too much. |
| Keep suite-level caching only | Correct but gives up the benefit on every edit. |
| Port to `test-smart.sh` in this change | Not verifiable on this Windows host; shipping unexercised skip logic risks silently skipping tests. Left as follow-up. |

## References

- `scripts/lib/test_deps.py`, `scripts/lib/test-hash.py`, `scripts/test-smart.ps1`
- `server/tests/unit/test_test_deps.py`
