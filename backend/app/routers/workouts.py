from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_db, get_current_user
from app.models.schemas import (
    WorkoutCreate, WorkoutUpdate,
    WorkoutExerciseCreate,
    SetCreate, SetUpdate,
)
from app.services import workout_service as ws

router = APIRouter(prefix="/workouts")


# ── Workout Session Endpoints ─────────────────────────────────

@router.post("")
async def create_workout(
    data: WorkoutCreate,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Start a blank workout session."""
    return await ws.create_workout(conn, user_id, data.title, data.workout_type)


@router.get("")
async def list_workouts(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Paginated list of workouts (excludes soft-deleted)."""
    return await ws.list_workouts(conn, user_id, limit, offset)


@router.get("/{workout_id}")
async def get_workout(
    workout_id: UUID,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Full workout with all exercises and sets."""
    return await ws.get_workout_with_details(conn, str(workout_id), user_id)


@router.put("/{workout_id}")
async def update_workout(
    workout_id: UUID,
    data: WorkoutUpdate,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Update workout metadata (title, notes, rating, etc.)."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    return await ws.update_workout(conn, str(workout_id), data.model_dump(exclude_unset=True))


@router.put("/{workout_id}/complete")
async def complete_workout(
    workout_id: UUID,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Mark a workout as completed (sets completed_at = now())."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    return await ws.complete_workout(conn, str(workout_id))


@router.delete("/{workout_id}")
async def delete_workout(
    workout_id: UUID,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Soft-delete a workout (is_deleted = true)."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    await ws.soft_delete_workout(conn, str(workout_id))
    return {"detail": "Workout deleted"}


# ── Workout Exercise Endpoints ────────────────────────────────

@router.post("/{workout_id}/exercises")
async def add_exercise(
    workout_id: UUID,
    data: WorkoutExerciseCreate,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Add an exercise to a workout."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    return await ws.add_exercise_to_workout(
        conn, str(workout_id), data.exercise_id, data.sort_order, data.notes, data.rest_seconds
    )


@router.delete("/{workout_id}/exercises/{workout_exercise_id}")
async def remove_exercise(
    workout_id: UUID,
    workout_exercise_id: UUID,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Remove an exercise from a workout (cascades to sets)."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    await ws.verify_workout_exercise(conn, str(workout_id), str(workout_exercise_id))
    await ws.remove_exercise_from_workout(conn, str(workout_exercise_id))
    return {"detail": "Exercise removed"}


# ── Set Endpoints ─────────────────────────────────────────────

@router.post("/{workout_id}/exercises/{workout_exercise_id}/sets")
async def add_set(
    workout_id: UUID,
    workout_exercise_id: UUID,
    data: SetCreate,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Log a set for a workout exercise."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    await ws.verify_workout_exercise(conn, str(workout_id), str(workout_exercise_id))
    return await ws.add_set(conn, str(workout_exercise_id), data.model_dump(exclude_unset=True))


@router.put("/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}")
async def update_set(
    workout_id: UUID,
    workout_exercise_id: UUID,
    set_id: UUID,
    data: SetUpdate,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Edit a logged set."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    await ws.verify_workout_exercise(conn, str(workout_id), str(workout_exercise_id))
    return await ws.update_set(conn, str(set_id), data.model_dump(exclude_unset=True))


@router.delete("/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}")
async def delete_set(
    workout_id: UUID,
    workout_exercise_id: UUID,
    set_id: UUID,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Remove a set."""
    await ws.verify_workout_ownership(conn, str(workout_id), user_id)
    await ws.verify_workout_exercise(conn, str(workout_id), str(workout_exercise_id))
    await ws.delete_set(conn, str(set_id))
    return {"detail": "Set deleted"}
