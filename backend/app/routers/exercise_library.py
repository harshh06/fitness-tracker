from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.dependencies import get_db, get_current_user
from app.models.schemas import (
    ExerciseCreate,
    ExerciseResponse,
)

router = APIRouter(prefix="/exercises")

@router.get("/search")
async def search_exercises(
    q: str = "", 
    muscle_group: str = "", 
    equipment: str = "", 
    user_id: str = Depends(get_current_user), 
    conn = Depends(get_db)
):
    query = """
        SELECT DISTINCT el.* 
        FROM exercise_library el
        LEFT JOIN exercise_muscles em ON el.id = em.exercise_id
        WHERE (el.created_by = $1 OR el.is_system = true)
    """

    query_params = [user_id]
    param_index = 2

    if muscle_group:
        query += f" AND em.muscle_group = ${param_index}"
        param_index += 1
        query_params.append(muscle_group)

    if equipment:
        query += f" AND el.equipment = ${param_index}"
        param_index += 1
        query_params.append(equipment)

    if q:
        query += f" AND to_tsvector('english', el.name) @@ plainto_tsquery('english', ${param_index})"
        param_index += 1
        query_params.append(q)

    res = await conn.fetch(query, *query_params)
    return [dict(row) for row in res]


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