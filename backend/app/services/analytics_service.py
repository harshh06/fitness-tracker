"""
Analytics service — SQL aggregation queries for workout stats.
"""

from datetime import datetime, timezone, timedelta


async def get_summary(conn, user_id: str, months: int = 1):
    """
    Summary stats for the last N months:
      - total_workouts, total_volume (weight × reps), total_duration_mins
      - estimated_calories_burned (MET-based)
      - workouts_per_week breakdown
      - top muscle groups by set count
    """
    since = datetime.now(timezone.utc) - timedelta(days=months * 30)

    # ── Core stats ────────────────────────────────────────────
    stats = await conn.fetchrow(
        """
        SELECT
            COUNT(*)                           AS total_workouts,
            COALESCE(SUM(w.duration_mins), 0)  AS total_duration_mins
        FROM workouts w
        WHERE w.user_id = $1
          AND w.is_deleted = false
          AND w.started_at >= $2
        """,
        user_id, since,
    )

    # ── Total volume (weight × reps across all sets) ──────────
    volume = await conn.fetchval(
        """
        SELECT COALESCE(SUM(es.weight_lbs * es.reps), 0)
        FROM exercise_sets es
        JOIN workout_exercises we ON es.workout_exercise_id = we.id
        JOIN workouts w           ON we.workout_id = w.id
        WHERE w.user_id = $1
          AND w.is_deleted = false
          AND w.started_at >= $2
          AND es.weight_lbs IS NOT NULL
          AND es.reps IS NOT NULL
        """,
        user_id, since,
    )

    # ── Estimated calories burned (MET-based) ─────────────────
    # MET values: cardio=7.0, strength=3.5, flexibility/yoga/rehab=2.5
    # Formula: calories = MET × weight_kg × 3.5 / 200 × duration_minutes
    user_weight_kg = await conn.fetchval(
        "SELECT weight_kg FROM profiles WHERE user_id = $1",
        user_id,
    )
    weight_kg = float(user_weight_kg) if user_weight_kg else 70.0  # fallback

    calorie_rows = await conn.fetch(
        """
        SELECT
            el.category,
            COALESCE(SUM(es.duration_seconds), 0) AS total_duration_sec,
            w.duration_mins AS workout_duration_mins
        FROM exercise_sets es
        JOIN workout_exercises we ON es.workout_exercise_id = we.id
        JOIN workouts w           ON we.workout_id = w.id
        JOIN exercise_library el  ON we.exercise_id = el.id
        WHERE w.user_id = $1
          AND w.is_deleted = false
          AND w.started_at >= $2
        GROUP BY el.category, w.duration_mins
        """,
        user_id, since,
    )

    # MET mapping by category
    met_map = {
        "cardio": 7.0,
        "strength": 3.5,
        "flexibility": 2.5,
        "yoga": 2.5,
        "rehab": 2.0,
    }

    estimated_calories = 0.0
    for row in calorie_rows:
        category = row["category"] or "strength"
        met = met_map.get(category, 3.5)
        # For cardio: use set-level duration_seconds if available
        # For strength: use workout-level duration_mins as proxy
        duration_sec = row["total_duration_sec"]
        workout_mins = row["workout_duration_mins"] or 0
        if duration_sec and duration_sec > 0:
            duration_mins = duration_sec / 60.0
        else:
            duration_mins = float(workout_mins)
        # MET formula: cal/min = MET × weight_kg × 3.5 / 200
        estimated_calories += met * weight_kg * 3.5 / 200 * duration_mins

    # ── Workouts per week ─────────────────────────────────────
    weekly_rows = await conn.fetch(
        """
        SELECT
            date_trunc('week', w.started_at)::date AS week,
            COUNT(*)                               AS count
        FROM workouts w
        WHERE w.user_id = $1
          AND w.is_deleted = false
          AND w.started_at >= $2
        GROUP BY week
        ORDER BY week
        """,
        user_id, since,
    )

    # ── Top muscle groups ─────────────────────────────────────
    muscle_rows = await conn.fetch(
        """
        SELECT
            em.muscle_group,
            COUNT(es.id) AS total_sets
        FROM exercise_sets es
        JOIN workout_exercises we ON es.workout_exercise_id = we.id
        JOIN workouts w           ON we.workout_id = w.id
        JOIN exercise_muscles em  ON we.exercise_id = em.exercise_id
        WHERE w.user_id = $1
          AND w.is_deleted = false
          AND w.started_at >= $2
          AND em.role = 'primary'
        GROUP BY em.muscle_group
        ORDER BY total_sets DESC
        LIMIT 10
        """,
        user_id, since,
    )

    return {
        "months": months,
        "total_workouts": stats["total_workouts"],
        "total_volume_lbs": float(volume),
        "total_duration_mins": stats["total_duration_mins"],
        "estimated_calories_burned": round(estimated_calories),
        "workouts_per_week": [
            {"week": str(r["week"]), "count": r["count"]}
            for r in weekly_rows
        ],
        "top_muscle_groups": [
            {"muscle_group": r["muscle_group"], "total_sets": r["total_sets"]}
            for r in muscle_rows
        ],
    }


async def get_volume_progression(conn, user_id: str, exercise_id: str, months: int = 6):
    """
    Weekly total volume (weight × reps) for a single exercise over N months.
    Used for plotting progression charts.
    """
    since = datetime.now(timezone.utc) - timedelta(days=months * 30)

    rows = await conn.fetch(
        """
        SELECT
            date_trunc('week', w.started_at)::date  AS week,
            SUM(es.weight_lbs * es.reps)             AS volume,
            MAX(es.weight_lbs)                       AS max_weight,
            SUM(es.reps)                             AS total_reps
        FROM exercise_sets es
        JOIN workout_exercises we ON es.workout_exercise_id = we.id
        JOIN workouts w           ON we.workout_id = w.id
        WHERE w.user_id = $1
          AND we.exercise_id = $2
          AND w.is_deleted = false
          AND w.started_at >= $3
          AND es.weight_lbs IS NOT NULL
          AND es.reps IS NOT NULL
        GROUP BY week
        ORDER BY week
        """,
        user_id, exercise_id, since,
    )

    return {
        "exercise_id": exercise_id,
        "months": months,
        "weeks": [
            {
                "week": str(r["week"]),
                "volume": float(r["volume"]),
                "max_weight": float(r["max_weight"]),
                "total_reps": int(r["total_reps"]),
            }
            for r in rows
        ],
    }


async def get_personal_records(conn, user_id: str):
    """
    All personal records for the user, with exercise names.
    """
    rows = await conn.fetch(
        """
        SELECT
            pr.*,
            el.name AS exercise_name
        FROM personal_records pr
        JOIN exercise_library el ON pr.exercise_id = el.id
        WHERE pr.user_id = $1
        ORDER BY pr.achieved_at DESC
        """,
        user_id,
    )

    return [dict(r) for r in rows]
