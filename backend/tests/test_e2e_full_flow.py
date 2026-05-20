"""
Full end-to-end verification of the entire API.

Simulates a real user session:
  signup → login → profile → health conditions → exercise search →
  create workout → add exercises → log sets → complete → history →
  analytics → cross-user access control
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ══════════════════════════════════════════════════════════════
#  FULL FLOW — single user journey
# ══════════════════════════════════════════════════════════════

class TestFullFlow:

    # Shared state across ordered tests
    email = f"e2e_{uuid.uuid4()}@example.com"
    password = "securepass123"
    access_token = None
    refresh_token = None
    headers = None
    workout_id = None
    workout_exercise_id = None
    exercise_id = None
    set_id = None

    # ── 1. Auth ───────────────────────────────────────────────

    def test_01_signup(self, client):
        res = client.post("/auth/signup", json={
            "email": self.email,
            "password": self.password,
        })
        assert res.status_code == 200, f"Signup failed: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert "refresh_token" in data
        TestFullFlow.access_token = data["access_token"]
        TestFullFlow.refresh_token = data["refresh_token"]
        TestFullFlow.headers = {"Authorization": f"Bearer {data['access_token']}"}

    def test_02_login(self, client):
        res = client.post("/auth/login", json={
            "email": self.email,
            "password": self.password,
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        # Use the fresh token from login
        TestFullFlow.access_token = data["access_token"]
        TestFullFlow.headers = {"Authorization": f"Bearer {data['access_token']}"}

    def test_03_refresh_token(self, client):
        res = client.post("/auth/refresh", json={
            "refresh_token": self.refresh_token,
        })
        assert res.status_code == 200
        assert "access_token" in res.json()

    # ── 2. Profile ────────────────────────────────────────────

    def test_04_get_profile(self, client):
        res = client.get("/profile/", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["profile"]["email"] == self.email
        assert data["profile"]["display_name"] == "User"  # default from trigger

    def test_05_update_profile(self, client):
        res = client.put("/profile/", json={
            "display_name": "E2E Tester",
            "height_cm": 175,
            "weight_kg": 80,
            "fitness_level": "intermediate",
            "gender": "male",
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["display_name"] == "E2E Tester"
        assert data["fitness_level"] == "intermediate"

    # ── 3. Health Conditions ──────────────────────────────────

    def test_06_add_health_condition(self, client):
        res = client.post("/profile/health-conditions", json={
            "condition_name": "PFPS",
            "body_area": "knee",
            "severity": "moderate",
            "notes": "Avoid deep squats",
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["condition_name"] == "PFPS"
        TestFullFlow.condition_id = str(data["id"])

    def test_07_update_health_condition(self, client):
        res = client.put(
            f"/profile/health-conditions/{self.condition_id}",
            json={"severity": "mild", "notes": "Getting better"},
            headers=self.headers,
        )
        assert res.status_code == 200
        assert res.json()["severity"] == "mild"

    def test_08_profile_includes_conditions(self, client):
        res = client.get("/profile/", headers=self.headers)
        assert res.status_code == 200
        conditions = res.json()["health_conditions"]
        assert len(conditions) >= 1
        names = [c["condition_name"] for c in conditions]
        assert "PFPS" in names

    # ── 4. Exercise Library ───────────────────────────────────

    def test_09_search_exercises(self, client):
        res = client.get("/exercises/search?q=bench", headers=self.headers)
        assert res.status_code == 200
        exercises = res.json()
        assert len(exercises) > 0
        TestFullFlow.exercise_id = str(exercises[0]["id"])

    def test_10_get_single_exercise(self, client):
        res = client.get(f"/exercises/{self.exercise_id}", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "exercise_muscles" in data
        assert "exercise_contraindications" in data

    # ── 5. Workout Session (full lifecycle) ───────────────────

    def test_11_create_blank_workout(self, client):
        res = client.post("/workouts", json={
            "title": "E2E Push Day",
            "workout_type": "strength",
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "E2E Push Day"
        assert data["completed_at"] is None
        assert data["exercises"] == []
        TestFullFlow.workout_id = str(data["id"])

    def test_12_add_exercise_to_workout(self, client):
        res = client.post(
            f"/workouts/{self.workout_id}/exercises",
            json={
                "exercise_id": self.exercise_id,
                "sort_order": 1,
                "rest_seconds": 90,
            },
            headers=self.headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["exercise_name"] is not None
        TestFullFlow.workout_exercise_id = str(data["id"])

    def test_13_log_sets(self, client):
        base_url = f"/workouts/{self.workout_id}/exercises/{self.workout_exercise_id}/sets"

        # Set 1 — warmup
        r1 = client.post(base_url, json={
            "set_number": 1, "set_type": "warmup",
            "weight_lbs": 95, "reps": 12, "rpe": 4,
        }, headers=self.headers)
        assert r1.status_code == 200

        # Set 2 — working
        r2 = client.post(base_url, json={
            "set_number": 2, "set_type": "working",
            "weight_lbs": 135, "reps": 10, "rpe": 7,
        }, headers=self.headers)
        assert r2.status_code == 200
        TestFullFlow.set_id = str(r2.json()["id"])

        # Set 3 — working
        r3 = client.post(base_url, json={
            "set_number": 3, "set_type": "working",
            "weight_lbs": 155, "reps": 8, "rpe": 8,
        }, headers=self.headers)
        assert r3.status_code == 200

    def test_14_update_set(self, client):
        url = f"/workouts/{self.workout_id}/exercises/{self.workout_exercise_id}/sets/{self.set_id}"
        res = client.put(url, json={
            "weight_lbs": 140, "is_completed": True,
        }, headers=self.headers)
        assert res.status_code == 200
        assert res.json()["is_completed"] is True

    def test_15_update_workout_metadata(self, client):
        res = client.put(f"/workouts/{self.workout_id}", json={
            "notes": "Great session, no knee pain",
            "rating": 5,
            "energy_level": 4,
            "duration_mins": 55,
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["rating"] == 5

    def test_16_complete_workout(self, client):
        res = client.put(
            f"/workouts/{self.workout_id}/complete",
            headers=self.headers,
        )
        assert res.status_code == 200
        assert res.json()["completed_at"] is not None

    # ── 6. Fetch History ──────────────────────────────────────

    def test_17_list_workouts(self, client):
        res = client.get("/workouts?limit=10&offset=0", headers=self.headers)
        assert res.status_code == 200
        workouts = res.json()
        assert len(workouts) >= 1
        titles = [w["title"] for w in workouts]
        assert "E2E Push Day" in titles

    def test_18_get_workout_detail(self, client):
        res = client.get(f"/workouts/{self.workout_id}", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "E2E Push Day"
        assert data["completed_at"] is not None
        assert data["rating"] == 5
        assert len(data["exercises"]) == 1
        assert len(data["exercises"][0]["sets"]) == 3

    # ── 7. Analytics ──────────────────────────────────────────

    def test_19_analytics_summary(self, client):
        res = client.get("/analytics/summary?months=1", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_workouts"] >= 1
        assert data["total_volume_lbs"] > 0
        assert data["total_duration_mins"] >= 55

    def test_20_analytics_volume(self, client):
        res = client.get(
            f"/analytics/volume?exercise_id={self.exercise_id}&months=1",
            headers=self.headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["weeks"]) >= 1
        assert data["weeks"][0]["volume"] > 0

    def test_21_analytics_personal_records(self, client):
        res = client.get("/analytics/personal-records", headers=self.headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)


# ══════════════════════════════════════════════════════════════
#  ACCESS CONTROL — cross-user isolation
# ══════════════════════════════════════════════════════════════

class TestAccessControl:

    def test_cross_user_workout_blocked(self, client):
        """User A's workout is invisible to User B."""
        # User A
        email_a = f"user_a_{uuid.uuid4()}@example.com"
        a = client.post("/auth/signup", json={"email": email_a, "password": "testpass12345"})
        header_a = {"Authorization": f"Bearer {a.json()['access_token']}"}
        w = client.post("/workouts", json={"title": "Private"}, headers=header_a)
        workout_id = str(w.json()["id"])

        # User B
        email_b = f"user_b_{uuid.uuid4()}@example.com"
        b = client.post("/auth/signup", json={"email": email_b, "password": "testpass12345"})
        header_b = {"Authorization": f"Bearer {b.json()['access_token']}"}

        # B cannot GET A's workout
        assert client.get(f"/workouts/{workout_id}", headers=header_b).status_code == 403
        # B cannot UPDATE A's workout
        assert client.put(f"/workouts/{workout_id}", json={"title": "Hacked"}, headers=header_b).status_code == 403
        # B cannot DELETE A's workout
        assert client.delete(f"/workouts/{workout_id}", headers=header_b).status_code == 403
        # B cannot COMPLETE A's workout
        assert client.put(f"/workouts/{workout_id}/complete", headers=header_b).status_code == 403

    def test_cross_user_workout_list_isolated(self, client):
        """User B's workout list shouldn't contain User A's workouts."""
        email_a = f"iso_a_{uuid.uuid4()}@example.com"
        a = client.post("/auth/signup", json={"email": email_a, "password": "testpass12345"})
        header_a = {"Authorization": f"Bearer {a.json()['access_token']}"}
        client.post("/workouts", json={"title": "A's workout"}, headers=header_a)

        email_b = f"iso_b_{uuid.uuid4()}@example.com"
        b = client.post("/auth/signup", json={"email": email_b, "password": "testpass12345"})
        header_b = {"Authorization": f"Bearer {b.json()['access_token']}"}

        workouts = client.get("/workouts", headers=header_b).json()
        titles = [w["title"] for w in workouts]
        assert "A's workout" not in titles

    def test_cross_user_analytics_isolated(self, client):
        """User B's analytics should show 0 workouts (hasn't logged any)."""
        email = f"clean_{uuid.uuid4()}@example.com"
        signup = client.post("/auth/signup", json={"email": email, "password": "testpass12345"})
        header = {"Authorization": f"Bearer {signup.json()['access_token']}"}

        res = client.get("/analytics/summary?months=1", headers=header)
        assert res.status_code == 200
        assert res.json()["total_workouts"] == 0

    def test_no_auth_rejected_everywhere(self, client):
        """All protected endpoints reject unauthenticated requests."""
        endpoints = [
            ("GET",  "/profile/"),
            ("GET",  "/workouts"),
            ("POST", "/workouts"),
            ("GET",  "/analytics/summary"),
            ("GET",  "/analytics/personal-records"),
            ("GET",  "/exercises/search"),
        ]
        for method, path in endpoints:
            res = client.request(method, path)
            assert res.status_code == 401, f"{method} {path} returned {res.status_code}, expected 401"
