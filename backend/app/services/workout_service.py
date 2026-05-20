from fastapi import HTTPException


async def verify_workout_ownership(conn, workout_id: str, user_id: str):
    """Verify that the workout belongs to the user. Returns the workout row or raises."""
    workout = await conn.fetchrow(
        "SELECT * FROM workouts WHERE id = $1 AND is_deleted = false",
        workout_id
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    if str(workout["user_id"]) != str(user_id):
        raise HTTPException(status_code=403, detail="Not your workout")
    return workout


async def verify_workout_exercise(conn, workout_id: str, workout_exercise_id: str):
    """Verify that the workout_exercise belongs to the workout."""
    row = await conn.fetchrow(
        "SELECT * FROM workout_exercises WHERE id = $1 AND workout_id = $2",
        workout_exercise_id, workout_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Exercise not found in this workout")
    return row


# ── Workout CRUD ──────────────────────────────────────────────

async def create_workout(conn, user_id: str, title=None, workout_type=None):
    row = await conn.fetchrow(
        """INSERT INTO workouts (user_id, title, workout_type)
           VALUES ($1, $2, $3) RETURNING *""",
        user_id, title, workout_type
    )
    result = dict(row)
    result["exercises"] = []
    return result


async def list_workouts(conn, user_id: str, limit: int = 20, offset: int = 0):
    rows = await conn.fetch(
        """SELECT * FROM workouts
           WHERE user_id = $1 AND is_deleted = false
           ORDER BY started_at DESC
           LIMIT $2 OFFSET $3""",
        user_id, limit, offset
    )
    return [dict(r) for r in rows]


async def get_workout_with_details(conn, workout_id: str, user_id: str):
    """Full workout with nested exercises and sets."""
    workout = await verify_workout_ownership(conn, workout_id, user_id)
    workout_dict = dict(workout)

    # Fetch exercises with names
    exercises = await conn.fetch(
        """SELECT we.*, el.name AS exercise_name
           FROM workout_exercises we
           JOIN exercise_library el ON we.exercise_id = el.id
           WHERE we.workout_id = $1
           ORDER BY we.sort_order""",
        workout_id
    )

    # Fetch all sets in one query
    exercise_ids = [row["id"] for row in exercises]
    sets_by_exercise = {}

    if exercise_ids:
        all_sets = await conn.fetch(
            """SELECT * FROM exercise_sets
               WHERE workout_exercise_id = ANY($1::uuid[])
               ORDER BY set_number""",
            exercise_ids
        )
        for s in all_sets:
            we_id = s["workout_exercise_id"]
            sets_by_exercise.setdefault(we_id, []).append(dict(s))

    # Assemble nested response
    workout_dict["exercises"] = []
    for ex in exercises:
        ex_dict = dict(ex)
        ex_dict["sets"] = sets_by_exercise.get(ex["id"], [])
        workout_dict["exercises"].append(ex_dict)

    return workout_dict


async def update_workout(conn, workout_id: str, data: dict):
    updates = {k: v for k, v in data.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = []
    values = []
    for i, (key, value) in enumerate(updates.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)

    values.append(workout_id)
    query = f"""
        UPDATE workouts SET {', '.join(set_clauses)}
        WHERE id = ${len(values)} RETURNING *
    """
    row = await conn.fetchrow(query, *values)
    return dict(row)


async def complete_workout(conn, workout_id: str):
    row = await conn.fetchrow(
        "UPDATE workouts SET completed_at = now() WHERE id = $1 RETURNING *",
        workout_id
    )
    return dict(row)


async def soft_delete_workout(conn, workout_id: str):
    await conn.execute(
        "UPDATE workouts SET is_deleted = true WHERE id = $1",
        workout_id
    )


# ── Workout Exercises ─────────────────────────────────────────

async def add_exercise_to_workout(conn, workout_id: str, exercise_id, sort_order, notes=None, rest_seconds=90):
    row = await conn.fetchrow(
        """INSERT INTO workout_exercises (workout_id, exercise_id, sort_order, notes, rest_seconds)
           VALUES ($1, $2, $3, $4, $5) RETURNING *""",
        workout_id, exercise_id, sort_order, notes, rest_seconds
    )
    result = dict(row)

    # Include exercise name for convenience
    exercise = await conn.fetchrow(
        "SELECT name FROM exercise_library WHERE id = $1", exercise_id
    )
    result["exercise_name"] = exercise["name"] if exercise else None
    result["sets"] = []
    return result


async def remove_exercise_from_workout(conn, workout_exercise_id: str):
    result = await conn.execute(
        "DELETE FROM workout_exercises WHERE id = $1",
        workout_exercise_id
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Exercise not found")


# ── Sets ──────────────────────────────────────────────────────

async def add_set(conn, workout_exercise_id, data: dict):
    data["workout_exercise_id"] = workout_exercise_id

    keys = list(data.keys())
    placeholders = [f"${i}" for i in range(1, len(keys) + 1)]
    values = [data[k] for k in keys]

    query = f"""
        INSERT INTO exercise_sets ({', '.join(keys)})
        VALUES ({', '.join(placeholders)})
        RETURNING *
    """
    row = await conn.fetchrow(query, *values)
    return dict(row)


async def update_set(conn, set_id: str, data: dict):
    updates = {k: v for k, v in data.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = []
    values = []
    for i, (key, value) in enumerate(updates.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)

    values.append(set_id)
    query = f"""
        UPDATE exercise_sets SET {', '.join(set_clauses)}
        WHERE id = ${len(values)} RETURNING *
    """
    row = await conn.fetchrow(query, *values)
    if not row:
        raise HTTPException(status_code=404, detail="Set not found")
    return dict(row)


async def delete_set(conn, set_id: str):
    result = await conn.execute(
        "DELETE FROM exercise_sets WHERE id = $1", set_id
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Set not found")
