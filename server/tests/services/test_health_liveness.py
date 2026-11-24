"""Health probes: readiness carries dependency statuses, liveness stays zero-I/O."""

import asyncio

from fastapi.testclient import TestClient

from app.main import app
from app.services import health
from app.services.health import build_liveness


class TestLivenessPayload:
    def test_status_ok_without_dependency_probes(self):
        payload = build_liveness()
        assert payload["status"] == "ok"
        assert payload["checks"] is None
        assert payload["endpoint_count"] is None
        assert payload["service"]
        assert isinstance(payload["took_ms"], int)

    def test_root_health_exposes_service_check_aliases(self, monkeypatch):
        async def fake_checks():
            return {"database": {"status": "ok", "latency_ms": 1, "detail": "ok"}}

        monkeypatch.setattr("app.services.health.collect_checks", fake_checks)
        response = TestClient(app).get("/health/checks")

        assert response.status_code == 200
        assert response.json()["database"]["status"] == "ok"

    def test_root_ready_alias_serves_liveness(self):
        response = TestClient(app).get("/health/ready")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["checks"] is None


class TestLivenessRoute:
    def test_health_carries_dependency_checks(self):
        response = TestClient(app).get("/api/v1/health")
        assert response.status_code == 200
        body = response.json()
        assert body["checks"] is not None
        assert {"database", "cache", "whatsapp_worker"}.issubset(body["checks"])

    def test_root_health_alias(self):
        response = TestClient(app).get("/health")
        assert response.status_code == 200
        assert response.json()["status"] in {"ok", "degraded"}


class TestProbeBoundedness:
    """A blocked probe must report a failure, never stall the response."""

    def test_hanging_probe_reports_error_within_budget(self, monkeypatch):
        async def hanging_probe():
            await asyncio.sleep(60)
            return {"status": "ok", "latency_ms": 0, "detail": "never"}

        monkeypatch.setattr("app.services.health.aggregator.PROBE_TIMEOUT_SECONDS", 0.05)
        result = asyncio.run(_run_bounded(hanging_probe))

        assert result["status"] == "error"
        assert "timed out" in result["detail"]

    def test_degraded_database_marks_overall_degraded(self, monkeypatch):
        async def degraded_db():
            return {"status": "degraded", "latency_ms": 1, "detail": "missing tables: ai_usage"}

        async def ok_probe():
            return {"status": "ok", "latency_ms": 0, "detail": "ok"}

        monkeypatch.setattr("app.services.health.aggregator.check_database", degraded_db)
        monkeypatch.setattr("app.services.health.aggregator.check_cache", ok_probe)
        monkeypatch.setattr("app.services.health.aggregator.check_whatsapp_worker", ok_probe)
        monkeypatch.setattr("app.services.health.aggregator.check_workspace_storage", ok_probe)

        payload = asyncio.run(health.collect_health(detailed=False))

        assert payload["status"] == "degraded"


async def _run_bounded(probe):
    from app.services.health.aggregator import _bounded_check

    return await _bounded_check("database", probe)
