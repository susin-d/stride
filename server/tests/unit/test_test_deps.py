"""Unit tests for the per-test-file dependency analysis (scripts/lib/test_deps.py)."""

import importlib.util
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))


def _repo_root() -> str:
    """Walk up to the directory that contains both `server/` and `scripts/`."""
    current = HERE
    while True:
        if os.path.isdir(os.path.join(current, "scripts", "lib")) and os.path.isdir(
            os.path.join(current, "server")
        ):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            raise RuntimeError("repo root not found")
        current = parent


REPO = _repo_root()
LIB = os.path.join(REPO, "scripts", "lib")


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, os.path.join(LIB, filename))
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def deps():
    return _load("test_deps", "test_deps.py")


def _build(deps, files: dict[str, str]):
    """Run compute_affected over an in-memory file map."""
    return deps.compute_affected(
        "server",
        sorted(files),
        lambda rel: files[rel],
        "GLOBAL",
    )


def test_leaf_module_only_affects_its_importers(deps):
    files = {
        "server/app/core/errors.py": "X = 1\n",
        "server/app/services/leaf.py": "from app.core.errors import X\n",
        "server/tests/test_leaf.py": "from app.services.leaf import X\n",
        "server/tests/test_other.py": "from app.core.errors import X\n",
    }
    report = _build(deps, files)
    leaf = report["tests"]["server/tests/test_leaf.py"]
    other = report["tests"]["server/tests/test_other.py"]

    assert "server/app/services/leaf.py" in leaf["deps"]
    assert "server/app/core/errors.py" in leaf["deps"]  # transitive
    assert "server/app/services/leaf.py" not in other["deps"]
    assert leaf["sha"] != other["sha"]


def test_changing_a_dependency_changes_only_dependent_shas(deps):
    base = {
        "server/app/services/leaf.py": "X = 1\n",
        "server/tests/test_leaf.py": "from app.services.leaf import X\n",
        "server/tests/test_other.py": "y = 2\n",
    }
    before = _build(deps, base)
    changed = dict(base)
    changed["server/app/services/leaf.py"] = "X = 2\n"
    after = _build(deps, changed)

    assert before["tests"]["server/tests/test_leaf.py"]["sha"] != after["tests"]["server/tests/test_leaf.py"]["sha"]
    assert (
        before["tests"]["server/tests/test_other.py"]["sha"]
        == after["tests"]["server/tests/test_other.py"]["sha"]
    )


def test_test_file_edit_changes_only_its_own_sha(deps):
    base = {
        "server/app/services/leaf.py": "X = 1\n",
        "server/tests/test_leaf.py": "from app.services.leaf import X\n",
        "server/tests/test_other.py": "y = 2\n",
    }
    before = _build(deps, base)
    changed = dict(base)
    changed["server/tests/test_leaf.py"] = "from app.services.leaf import X  # edited\n"
    after = _build(deps, changed)

    assert before["tests"]["server/tests/test_leaf.py"]["sha"] != after["tests"]["server/tests/test_leaf.py"]["sha"]
    assert (
        before["tests"]["server/tests/test_other.py"]["sha"]
        == after["tests"]["server/tests/test_other.py"]["sha"]
    )


def test_guard_file_invalidates_every_test(deps):
    base = {
        "server/tests/conftest.py": "# guard\n",
        "server/tests/test_a.py": "x = 1\n",
        "server/tests/test_b.py": "y = 2\n",
    }
    before = _build(deps, base)
    changed = dict(base)
    changed["server/tests/conftest.py"] = "# guard changed\n"
    after = _build(deps, changed)

    for name in ("server/tests/test_a.py", "server/tests/test_b.py"):
        assert before["tests"][name]["sha"] != after["tests"][name]["sha"], name


def test_relative_python_import_is_followed(deps):
    files = {
        "server/app/services/__init__.py": "",
        "server/app/services/base.py": "B = 1\n",
        "server/app/services/impl.py": "from .base import B\n",
        "server/tests/test_impl.py": "from app.services.impl import B\n",
    }
    report = _build(deps, files)
    deps_list = report["tests"]["server/tests/test_impl.py"]["deps"]
    assert "server/app/services/base.py" in deps_list


def test_unparseable_test_always_runs(deps):
    files = {
        "server/tests/test_broken.py": "def (:\n",
    }
    report = _build(deps, files)
    entry = report["tests"]["server/tests/test_broken.py"]
    assert entry["reason"] == "unparseable"
    assert entry["sha"] == "GLOBAL"


def test_js_relative_import_is_followed(deps):
    files = {
        "website/src/utils/format.js": "export const f = () => 1\n",
        "website/src/utils/format.test.js": "import { f } from './format'\n",
        "website/src/lib/other.test.js": "import { f } from '../utils/format'\n",
    }
    report = deps.compute_affected(
        "website", sorted(files), lambda rel: files[rel], "GLOBAL"
    )
    assert "website/src/utils/format.js" in report["tests"]["website/src/utils/format.test.js"]["deps"]
    assert "website/src/utils/format.js" in report["tests"]["website/src/lib/other.test.js"]["deps"]


def test_import_cycle_terminates(deps):
    files = {
        "server/app/a.py": "import app.b\n",
        "server/app/b.py": "import app.a\n",
        "server/tests/test_cycle.py": "import app.a\n",
    }
    report = _build(deps, files)
    entry = report["tests"]["server/tests/test_cycle.py"]
    assert entry["reason"] == "ok"
    # The test file itself is part of its own closure; the cycle is bounded.
    assert set(entry["deps"]) == {
        "server/app/a.py",
        "server/app/b.py",
        "server/tests/test_cycle.py",
    }


def test_test_files_exclude_package_inits(deps):
    assert deps.is_test_file("server/tests/api/test_auth.py") is True
    assert deps.is_test_file("website/src/x/y.test.js") is True
    assert deps.is_test_file("server/tests/__init__.py") is False
    assert deps.is_test_file("server/app/services/leaf.py") is False
