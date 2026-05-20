"""
Tests for the Workout CRUD router — incremental blank-session approach.

Flow tested:
  signup → create workout → add exercise → add sets → update → complete → list → delete

Uses the real database (same pattern as test_auth.py).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid


# ── Fixtures ──────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_header(client):
    """Sign up a fresh user and return an Authorization header."""
    email = f"workout_test_{uuid.uuid4()}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": "testpassword123"})
    assert res.status_code == 200, f"Signup failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def exercise_id(client, auth_header):
    """Fetch a system exercise id to use in workout tests."""
    res = client.get("/exercises/search?q=bench", headers=auth_header)
    assert res.status_code == 200
    exercises = res.json()
    assert len(exercises) > 0, "No exercises found — is the library seeded?"
    return str(exercises[0]["id"])


# ── Workout Session Tests ────────────────────────────────────

class TestWorkoutCRUD:

    workout_id = None  # shared across tests in this class

    def test_create_blank_workout(self, client, auth_header):
        res = client.post(
            "/workouts",
            json={"title": "Test Push Day", "workout_type": "strength"},
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Test Push Day"
        assert data["workout_type"] == "strength"
        assert data["completed_at"] is None
        assert data["exercises"] == []
        TestWorkoutCRUD.workout_id = str(data["id"])

    def test_create_minimal_workout(self, client, auth_header):
        """Can create with no body fields (all optional)."""
        res = client.post("/workouts", json={}, headers=auth_header)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] is None
        assert data["workout_type"] is None

    def test_list_workouts(self, client, auth_header):
        res = client.get("/workouts", headers=auth_header)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # we created 2 above

    def test_list_workouts_pagination(self, client, auth_header):
        res = client.get("/workouts?limit=1&offset=0", headers=auth_header)
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_workout_detail(self, client, auth_header):
        res = client.get(f"/workouts/{self.workout_id}", headers=auth_header)
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Test Push Day"
        assert "exercises" in data

    def test_update_workout(self, client, auth_header):
        res = client.put(
            f"/workouts/{self.workout_id}",
            json={"notes": "Felt strong today", "rating": 4},
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["notes"] == "Felt strong today"
        assert data["rating"] == 4

    def test_complete_workout(self, client, auth_header):
        res = client.put(
            f"/workouts/{self.workout_id}/complete",
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["completed_at"] is not None

    def test_soft_delete_workout(self, client, auth_header):
        # Create a throwaway workout to delete
        create_res = client.post(
            "/workouts", json={"title": "To Delete"}, headers=auth_header
        )
        delete_id = str(create_res.json()["id"])

        res = client.delete(f"/workouts/{delete_id}", headers=auth_header)
        assert res.status_code == 200

        # Should not appear in list anymore
        list_res = client.get("/workouts", headers=auth_header)
        ids = [str(w["id"]) for w in list_res.json()]
        assert delete_id not in ids

        # Direct GET should also 404 (is_deleted = true filtered out)
        get_res = client.get(f"/workouts/{delete_id}", headers=auth_header)
        assert get_res.status_code == 404


# ── Workout Exercise Tests ────────────────────────────────────

class TestWorkoutExercises:

    workout_id = None
    workout_exercise_id = None

    def test_setup_workout(self, client, auth_header):
        """Create a fresh workout for exercise tests."""
        res = client.post(
            "/workouts",
            json={"title": "Exercise Test Session"},
            headers=auth_header,
        )
        assert res.status_code == 200
        TestWorkoutExercises.workout_id = str(res.json()["id"])

    def test_add_exercise(self, client, auth_header, exercise_id):
        res = client.post(
            f"/workouts/{self.workout_id}/exercises",
            json={
                "exercise_id": exercise_id,
                "sort_order": 1,
                "notes": "Focus on form",
                "rest_seconds": 120,
            },
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert str(data["exercise_id"]) == exercise_id
        assert data["sort_order"] == 1
        assert data["exercise_name"] is not None  # joined from exercise_library
        assert data["sets"] == []
        TestWorkoutExercises.workout_exercise_id = str(data["id"])

    def test_exercise_appears_in_workout(self, client, auth_header):
        res = client.get(
            f"/workouts/{self.workout_id}", headers=auth_header
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["exercises"]) == 1
        assert data["exercises"][0]["exercise_name"] is not None

    def test_remove_exercise(self, client, auth_header, exercise_id):
        # Add a second exercise, then remove it
        add_res = client.post(
            f"/workouts/{self.workout_id}/exercises",
            json={"exercise_id": exercise_id, "sort_order": 2},
            headers=auth_header,
        )
        second_id = str(add_res.json()["id"])

        del_res = client.delete(
            f"/workouts/{self.workout_id}/exercises/{second_id}",
            headers=auth_header,
        )
        assert del_res.status_code == 200

        # Verify only 1 exercise remains
        get_res = client.get(
            f"/workouts/{self.workout_id}", headers=auth_header
        )
        assert len(get_res.json()["exercises"]) == 1


# ── Set Tests ─────────────────────────────────────────────────

class TestSets:

    workout_id = None
    workout_exercise_id = None
    set_id = None

    def test_setup(self, client, auth_header, exercise_id):
        """Create a workout + exercise for set tests."""
        w_res = client.post(
            "/workouts", json={"title": "Set Test"}, headers=auth_header
        )
        TestSets.workout_id = str(w_res.json()["id"])

        e_res = client.post(
            f"/workouts/{self.workout_id}/exercises",
            json={"exercise_id": exercise_id, "sort_order": 1},
            headers=auth_header,
        )
        TestSets.workout_exercise_id = str(e_res.json()["id"])

    def test_add_set(self, client, auth_header):
        res = client.post(
            f"/workouts/{self.workout_id}/exercises/{self.workout_exercise_id}/sets",
            json={
                "set_number": 1,
                "set_type": "warmup",
                "weight_lbs": 135.0,
                "reps": 10,
                "rpe": 5,
            },
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["set_number"] == 1
        assert data["set_type"] == "warmup"
        assert float(data["weight_lbs"]) == 135.0
        assert data["reps"] == 10
        TestSets.set_id = str(data["id"])

    def test_add_second_set(self, client, auth_header):
        res = client.post(
            f"/workouts/{self.workout_id}/exercises/{self.workout_exercise_id}/sets",
            json={
                "set_number": 2,
                "set_type": "working",
                "weight_lbs": 185.0,
                "reps": 8,
                "rpe": 7,
            },
            headers=auth_header,
        )
        assert res.status_code == 200

    def test_sets_appear_in_workout(self, client, auth_header):
        res = client.get(
            f"/workouts/{self.workout_id}", headers=auth_header
        )
        data = res.json()
        sets = data["exercises"][0]["sets"]
        assert len(sets) == 2
        assert sets[0]["set_number"] == 1
        assert sets[1]["set_number"] == 2

    def test_update_set(self, client, auth_header):
        res = client.put(
            f"/workouts/{self.workout_id}/exercises/{self.workout_exercise_id}/sets/{self.set_id}",
            json={"weight_lbs": 140.0, "is_completed": True},
            headers=auth_header,
        )
        assert res.status_code == 200
        data = res.json()
        assert float(data["weight_lbs"]) == 140.0
        assert data["is_completed"] is True

    def test_delete_set(self, client, auth_header):
        res = client.delete(
            f"/workouts/{self.workout_id}/exercises/{self.workout_exercise_id}/sets/{self.set_id}",
            headers=auth_header,
        )
        assert res.status_code == 200

        # Verify only 1 set remains
        get_res = client.get(
            f"/workouts/{self.workout_id}", headers=auth_header
        )
        sets = get_res.json()["exercises"][0]["sets"]
        assert len(sets) == 1


# ── Auth / Ownership Tests ────────────────────────────────────

class TestOwnership:

    def test_cannot_access_other_users_workout(self, client, auth_header):
        # Create a workout as user A
        res = client.post(
            "/workouts", json={"title": "Private"}, headers=auth_header
        )
        workout_id = str(res.json()["id"])

        # Sign up a different user
        email_b = f"other_user_{uuid.uuid4()}@example.com"
        signup_b = client.post(
            "/auth/signup",
            json={"email": email_b, "password": "testpassword123"},
        )
        header_b = {"Authorization": f"Bearer {signup_b.json()['access_token']}"}

        # User B should get 403
        get_res = client.get(f"/workouts/{workout_id}", headers=header_b)
        assert get_res.status_code == 403

    def test_unauthenticated_request_rejected(self, client):
        res = client.get("/workouts")
        assert res.status_code == 401  # HTTPBearer returns 401 when no creds

    def test_nonexistent_workout_404(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        res = client.get(f"/workouts/{fake_id}", headers=auth_header)
        assert res.status_code == 404
