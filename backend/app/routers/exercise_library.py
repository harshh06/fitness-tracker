from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.dependencies import get_db, get_current_user
from app.models.schemas import (
    ExerciseCreate,
    ExerciseResponse,
)

router = APIRouter(prefix="/exercises")

@router.get("")
@router.get("/search")
async def list_exercises(
    q: str = "", 
    user_id: str = Depends(get_current_user), 
    conn = Depends(get_db)
):
    query = """
        SELECT el.*, COALESCE(json_agg(em.muscle_group) FILTER (WHERE em.muscle_group IS NOT NULL), '[]') as muscles
        FROM exercise_library el
        LEFT JOIN exercise_muscles em ON el.id = em.exercise_id
        WHERE (el.created_by = $1 OR el.is_system = true)
        GROUP BY el.id
        ORDER BY el.name ASC
    """
    res = await conn.fetch(query, user_id)
    exercises = []
    for row in res:
        d = dict(row)
        if isinstance(d["muscles"], str):
            import json
            d["muscles"] = json.loads(d["muscles"])
        exercises.append(d)

    if q:
        q_lower = q.lower()
        exercises = [
            e for e in exercises 
            if q_lower in e["name"].lower() or (e["category"] and q_lower in e["category"].lower())
        ]

    return exercises


@router.post("")
async def create_exercise(
    exercise: ExerciseCreate, 
    user_id: str = Depends(get_current_user), 
    conn = Depends(get_db)
):
    exercise_dict = exercise.model_dump(exclude_unset=True)
    muscles = exercise_dict.pop("muscles", [])

    exercise_dict["created_by"] = user_id
    exercise_dict["is_system"] = False

    keys = []
    q_values = []
    values = []
    for i, (key, value) in enumerate(exercise_dict.items(), start=1):
        keys.append(key)
        q_values.append(f"${i}")
        values.append(value)

    insert_query = f"""
        INSERT INTO exercise_library ({', '.join(keys)})
        VALUES ({', '.join(q_values)})
        RETURNING *
    """

    async with conn.transaction():
        new_exercise = await conn.fetchrow(insert_query, *values)
        new_exercise_dict = dict(new_exercise)
        new_exercise_dict["exercise_muscles"] = []
        new_exercise_dict["exercise_contraindications"] = []

        if muscles:
            for muscle in muscles:
                muscle_query = """
                    INSERT INTO exercise_muscles (exercise_id, muscle_group, role)
                    VALUES ($1, $2, $3)
                    RETURNING *
                """
                new_muscle = await conn.fetchrow(
                    muscle_query, 
                    new_exercise_dict["id"], 
                    muscle["muscle_group"], 
                    muscle.get("role")
                )
                new_exercise_dict["exercise_muscles"].append(dict(new_muscle))

    return new_exercise_dict


@router.get("/{exercise_id}")
async def get_exercise(
    exercise_id: str, 
    user_id: str = Depends(get_current_user), 
    conn = Depends(get_db)
):
    query = """
        SELECT * FROM exercise_library 
        WHERE id = $1 AND (created_by = $2 OR is_system = true)
    """
    exercise = await conn.fetchrow(query, exercise_id, user_id)

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    exercise_dict = dict(exercise)

    muscles_query = "SELECT * FROM exercise_muscles WHERE exercise_id = $1"
    muscles = await conn.fetch(muscles_query, exercise_id)
    exercise_dict["exercise_muscles"] = [dict(m) for m in muscles]

    contraindications_query = "SELECT * FROM exercise_contraindications WHERE exercise_id = $1"
    contraindications = await conn.fetch(contraindications_query, exercise_id)
    exercise_dict["exercise_contraindications"] = [dict(c) for c in contraindications]

    return exercise_dict