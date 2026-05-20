from fastapi import APIRouter, Depends
from app.dependencies import get_db, get_current_user
from app.services import analytics_service as analytics

router = APIRouter(prefix="/analytics")


@router.get("/summary")
async def summary(
    months: int = 1,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """
    Aggregated stats for the last N months:
    total workouts, total volume, duration, workouts/week, top muscle groups.
    """
    return await analytics.get_summary(conn, user_id, months)


@router.get("/volume")
async def volume_progression(
    exercise_id: str,
    months: int = 6,
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Weekly volume progression for a single exercise."""
    return await analytics.get_volume_progression(conn, user_id, exercise_id, months)


@router.get("/personal-records")
async def personal_records(
    user_id: str = Depends(get_current_user),
    conn=Depends(get_db),
):
    """All personal records for the current user."""
    return await analytics.get_personal_records(conn, user_id)
