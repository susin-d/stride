import pytest


async def _get_token(client, email="tasks@example.com", password="password123") -> str:
    await client.post("/api/v1/auth/register", json={
        "name": "Task User", "email": email, "password": password
    })
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]


@pytest.mark.asyncio
async def test_create_task(client):
    token = await _get_token(client)
    r = await client.post(
        "/api/v1/tasks",
        json={"title": "Test Task", "priority": "high"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    assert r.json()["title"] == "Test Task"


@pytest.mark.asyncio
async def test_list_tasks(client):
    token = await _get_token(client, "list@example.com")
    await client.post("/api/v1/tasks", json={"title": "Task 1"}, headers={"Authorization": f"Bearer {token}"})
    await client.post("/api/v1/tasks", json={"title": "Task 2"}, headers={"Authorization": f"Bearer {token}"})
    r = await client.get("/api/v1/tasks", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()) >= 2


@pytest.mark.asyncio
async def test_complete_task(client):
    token = await _get_token(client, "complete@example.com")
    create_r = await client.post(
        "/api/v1/tasks",
        json={"title": "Complete Me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    task_id = create_r.json()["id"]
    r = await client.post(
        f"/api/v1/tasks/{task_id}/complete",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "done"


@pytest.mark.asyncio
async def test_delete_task(client):
    token = await _get_token(client, "delete@example.com")
    create_r = await client.post(
        "/api/v1/tasks",
        json={"title": "Delete Me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    task_id = create_r.json()["id"]
    r = await client.delete(
        f"/api/v1/tasks/{task_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 204
