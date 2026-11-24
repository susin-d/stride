#!/usr/bin/env python3
"""Per-test-file dependency analysis for the smart test cache.

Split from ``test-hash.py`` (which stays the CLI + data source). This module
answers exactly one question: *for a given change, which test files can
possibly observe it?*

It never runs tests. It computes, per test file, a SHA-256 over the test file
and every source file it can statically reach, so a change only invalidates
the tests that depend on it. Anything ambiguous resolves to "run it".
"""

from __future__ import annotations

import ast
import hashlib
import os
import re

# --------------------------------------------------------------------------
# Guard files: anything here changes behaviour for *every* test, so it must
# invalidate all cached results. Matched by exact relative path or basename.
# --------------------------------------------------------------------------
GUARD_BASENAMES = {
    "conftest.py",
    "pytest.ini",
    "pyproject.toml",
    "setup.cfg",
    "tox.ini",
    "requirements.txt",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "vite.config.ts",
    "vitest.config.js",
    "vitest.config.ts",
    "vitest.workspace.js",
    "test-hash.py",
    "test_deps.py",
}

TEST_FILE_PATTERNS = (
    # Python: any *.py under a `tests/` directory (paths are repo-relative,
    # e.g. `server/tests/api/test_auth.py`), excluding package __init__ files.
    re.compile(r"(?:^|/)tests/(?!.*__init__\.py$).*\.py$"),
    re.compile(r"\.test\.jsx?$"),
    re.compile(r"\.spec\.jsx?$"),
)


def is_test_file(rel_posix: str) -> bool:
    return any(p.search(rel_posix) for p in TEST_FILE_PATTERNS)


def is_guard_file(rel_posix: str) -> bool:
    return os.path.basename(rel_posix) in GUARD_BASENAMES


def _module_name(rel_posix: str) -> str | None:
    """`server/app/services/x.py` -> `app.services.x` (None if not importable)."""
    if not rel_posix.startswith("server/") or not rel_posix.endswith(".py"):
        return None
    inner = rel_posix[len("server/"):]
    if inner.startswith("tests/"):
        return None
    if inner.endswith("/__init__.py"):
        inner = inner[: -len("/__init__.py")]
    elif inner.endswith(".py"):
        inner = inner[: -len(".py")]
    return inner.replace("/", ".")


# --------------------------------------------------------------------------
# Python imports
# --------------------------------------------------------------------------
def _py_imports(source: str, rel_posix: str, module_index: dict[str, str]) -> set[str]:
    """Return repo-relative paths this Python file imports (not transitive)."""
    found: set[str] = set()
    try:
        tree = ast.parse(source)
    except SyntaxError:
        # Unparseable -> caller fails closed (always runs).
        raise

    file_dir_parts = rel_posix.split("/")[:-1]
    # Repo-relative path is `server/app/services/impl.py`; the importable
    # package is `app.services` (drop the leading `server/`). Works identically
    # for a package's `__init__.py`, where the package is `app.services`.
    pkg_parts = file_dir_parts[len(["server"]):]

    def resolve(modname: str) -> None:
        if not modname:
            return
        parts = modname.split(".")
        # Longest prefix that maps to a real module file.
        for cut in range(len(parts), 0, -1):
            candidate = ".".join(parts[:cut])
            target = module_index.get(candidate)
            if target:
                found.add(target)
                return

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                resolve(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                # Level 1 = current package, level 2 = parent package, ...
                drop = node.level - 1
                base = pkg_parts[: len(pkg_parts) - drop] if drop else list(pkg_parts)
                if node.module:
                    resolve(".".join(base + node.module.split(".")))
                for alias in node.names:
                    resolve(".".join(base + [alias.name]))
            elif node.module:
                resolve(node.module)
                for alias in node.names:
                    resolve(f"{node.module}.{alias.name}")
    return found


# --------------------------------------------------------------------------
# JavaScript imports
# --------------------------------------------------------------------------
_JS_IMPORT_RE = re.compile(
    r"""(?:^|[\s;])(?:import\s+(?:[\w*\s{},]+?\s+from\s+)?|export\s+[\w*\s{},]+?\s+from\s+|require\s*\(\s*)['"]([^'"]+)['"]""",
    re.MULTILINE,
)


def _js_imports(source: str, rel_posix: str, file_set: set[str]) -> set[str]:
    """Resolve relative JS/JSX imports against the repo file list."""
    found: set[str] = set()
    base_dir = os.path.dirname(rel_posix)
    for spec in _JS_IMPORT_RE.findall(source):
        if not spec.startswith("."):
            continue  # bare package specifier -> covered by package-lock guard
        target = os.path.normpath(os.path.join(base_dir, spec)).replace(os.sep, "/")
        for cand in (
            target,
            target + ".js",
            target + ".jsx",
            target + ".ts",
            target + ".tsx",
            target + "/index.js",
            target + "/index.jsx",
        ):
            if cand in file_set:
                found.add(cand)
                break
    return found


# --------------------------------------------------------------------------
# Analysis entry point
# --------------------------------------------------------------------------
def compute_affected(scope: str, files: list[str], read_source, global_sha: str) -> dict:
    """Build the per-test-file dependency map.

    ``files`` — every in-scope repo-relative file (POSIX paths).
    ``read_source(rel) -> str`` — decoded text (CRLF-normalized) or raises OSError.
    ``global_sha`` — the whole-scope digest, used for guard/unparseable cases.
    """
    file_set = set(files)
    module_index: dict[str, str] = {}
    for rel in files:
        name = _module_name(rel)
        if name:
            module_index[name] = rel

    source_cache: dict[str, str] = {}

    def get_source(rel: str) -> str | None:
        if rel in source_cache:
            return source_cache[rel]
        try:
            text = read_source(rel)
        except OSError:
            return None
        source_cache[rel] = text
        return text

    def direct_deps(rel: str) -> tuple[set[str], bool]:
        """(imports, parsed_ok). parsed_ok=False means 'cannot reason' -> fail closed."""
        text = get_source(rel)
        if text is None:
            return set(), False
        try:
            if rel.endswith(".py"):
                return _py_imports(text, rel, module_index), True
            if re.search(r"\.(jsx?|tsx?)$", rel):
                return _js_imports(text, rel, file_set), True
        except SyntaxError:
            return set(), False
        return set(), True

    guard_paths = sorted(f for f in files if is_guard_file(f))
    tests = sorted(f for f in files if is_test_file(f))

    per_file: dict[str, dict] = {}
    for test_rel in tests:
        digest = hashlib.sha256()
        digest.update(f"test:{test_rel}\0".encode())

        # Walk the import graph breadth-first from the test file.
        seen: set[str] = set()
        queue = [test_rel]
        unparseable = False
        while queue:
            current = queue.pop()
            if current in seen:
                continue
            seen.add(current)
            imports, ok = direct_deps(current)
            if not ok:
                unparseable = True
            for dep in imports:
                if dep not in seen:
                    queue.append(dep)

        if unparseable:
            # Cannot reason about this test -> it must always run.
            per_file[test_rel] = {"sha": global_sha, "deps": [], "reason": "unparseable"}
            continue

        deps = sorted(d for d in seen if not is_guard_file(d))
        for rel in deps:
            text = get_source(rel)
            payload = (text or "").encode("utf-8")
            digest.update(f"{rel}\0{len(payload)}\0".encode())
            digest.update(payload)
            digest.update(b"\0")

        # Guard files are folded in, so touching one invalidates every test.
        for rel in guard_paths:
            text = get_source(rel)
            payload = (text or "").encode("utf-8")
            digest.update(f"guard:{rel}\0{len(payload)}\0".encode())
            digest.update(payload)
            digest.update(b"\0")

        per_file[test_rel] = {"sha": digest.hexdigest(), "deps": deps, "reason": "ok"}

    return {"global": global_sha, "guards": guard_paths, "tests": per_file}


def summarize(report: dict) -> dict:
    """Human-facing stats about how selective the cache can be."""
    tests = report["tests"]
    sizes = sorted((len(t["deps"]), name) for name, t in tests.items())
    unparseable = [n for n, t in tests.items() if t["reason"] != "ok"]
    return {
        "tests": len(tests),
        "guards": len(report["guards"]),
        "unparseable": unparseable,
        "smallest": [n for _, n in sizes[:3]],
        "widest_count": sizes[-1][0] if sizes else 0,
    }
