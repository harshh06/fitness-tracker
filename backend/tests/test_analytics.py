"""
Tests for the Analytics router.

Creates a workout with exercises + sets so aggregation queries have real data.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_header(client):
    email = f"analytics_test_{uuid.uuid4()}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "testpassword123"})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture(scope="module")
def exercise_id(client, auth_header):
    """Get a seeded exercise that has muscle mappings."""
    res = client.get("/exercises/search?q=bench", headers=auth_header)
    assert res.status_code == 200 and len(res.json()) > 0
    return str(res.json()[0]["id"])


@pytest.fixture(scope="module", autouse=True)
def seed_workout_data(client, auth_header, exercise_id):
    """Create a completed workout with sets so analytics queries return data."""
    # Create workout
    w = client.post(
        "/workouts",
        json={"title": "Analytics Test", "workout_type": "strength"},
        headers=auth_header,
    ).json()
    wid = str(w["id"])

    # Add exercise
    e = client.post(
        f"/workouts/{wid}/exercises",
        json={"exercise_id": exercise_id, "sort_order": 1},
        headers=auth_header,
    ).json()
    eid = str(e["id"])

    # Add 3 sets with weight + reps
    for i in range(1, 4):
        client.post(
            f"/workouts/{wid}/exercises/{eid}/sets",
            json={"set_number": i, "weight_lbs": 135.0 + i * 10, "reps": 10},
            headers=auth_header,
        )

    # Complete the workout with duration
    client.put(f"/workouts/{wid}/complete", headers=auth_header)
    client.put(
        f"/workouts/{wid}",
        json={"duration_mins": 45},
        headers=auth_header,
    )

    return wid


# ── Summary ───────────────────────────────────────────────────

class TestSummary:

    def test_summary_returns_data(self, client, auth_header):
        res = client.get("/analytics/summary?months=1", headers=auth_header)
        assert res.status_code == 200
        data = res.json()
        assert data["total_workouts"] >= 1
        assert data["total_duration_mins"] >= 45
        assert data["total_volume_lbs"] > 0
        assert isinstance(data["workouts_per_week"], list)
        assert isinstance(data["top_muscle_groups"], list)

    def test_summary_default_months(self, client, auth_header):
        """Default is 1 month."""
        res = client.get("/analytics/summary", headers=auth_header)
        assert res.status_code == 200
        assert res.json()["months"] == 1

    def test_summary_wider_range(self, client, auth_header):
        res = client.get("/analytics/summary?months=12", headers=auth_header)
        assert res.status_code == 200
        assert res.json()["total_workouts"] >= 1

    def test_summary_empty_for_new_user(self, client):
        """A brand-new user should get zeros, not errors."""
        email = f"fresh_{uuid.uuid4()}@example.com"
        signup = client.post("/auth/signup", json={"email": email, "password": "testpassword123"})
        header = {"Authorization": f"Bearer {signup.json()['access_token']}"}

        res = client.get("/analytics/summary?months=1", headers=header)
        assert res.status_code == 200
        data = res.json()
        assert data["total_workouts"] == 0
        assert data["total_volume_lbs"] == 0
        assert data["total_duration_mins"] == 0


# ── Volume Progression ────────────────────────────────────────

class TestVolumeProgression:

    def test_volume_returns_data(self, client, auth_header, exercise_id):
        res = client.get(
            f"/analytics/volume?exercise_id={exercise_id}&months=1",
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["exercise_id"] == exercise_id
        assert isinstance(data["weeks"], list)
        assert len(data["weeks"]) >= 1
        week = data["weeks"][0]
        assert week["volume"] > 0
        assert week["max_weight"] > 0
        assert week["total_reps"] > 0

    def test_volume_default_months(self, client, auth_header, exercise_id):
        res = client.get(
            f"/analytics/volume?exercise_id={exercise_id}",
            headers=auth_header,
        )
        assert res.status_code == 200
        assert res.json()["months"] == 6

    def test_volume_empty_exercise(self, client, auth_header):
        """Non-existent exercise should return empty weeks, not error."""
        fake_id = str(uuid.uuid4())
        res = client.get(
            f"/analytics/volume?exercise_id={fake_id}&months=1",
            headers=auth_header,
        )
        assert res.status_code == 200
        assert res.json()["weeks"] == []

    def test_volume_requires_exercise_id(self, client, auth_header):
        res = client.get("/analytics/volume", headers=auth_header)
        assert res.status_code == 422  # missing required query param


# ── Personal Records ──────────────────────────────────────────

class TestPersonalRecords:

    def test_personal_records_returns_list(self, client, auth_header):
        res = client.get("/analytics/personal-records", headers=auth_header)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_personal_records_empty_for_new_user(self, client):
        email = f"nopr_{uuid.uuid4()}@example.com"
        signup = client.post("/auth/signup", json={"email": email, "password": "testpassword123"})
        header = {"Authorization": f"Bearer {signup.json()['access_token']}"}

        res = client.get("/analytics/personal-records", headers=header)
        assert res.status_code == 200
        assert res.json() == []


# ── Auth Guard ────────────────────────────────────────────────

class TestAnalyticsAuth:

    def test_summary_requires_auth(self, client):
        assert client.get("/analytics/summary").status_code == 401

    def test_volume_requires_auth(self, client):
        assert client.get(f"/analytics/volume?exercise_id={uuid.uuid4()}").status_code == 401

    def test_pr_requires_auth(self, client):
        assert client.get("/analytics/personal-records").status_code == 401
