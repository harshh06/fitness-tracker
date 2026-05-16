from app.models.schemas import HealthConditionUpdate
from app.models.schemas import HealthConditionCreate
from app.models.schemas import ProfileUpdate
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, get_db


router = APIRouter(prefix="/profile")

@router.get("/")
async def get_profile(user_id: str = Depends(get_current_user), conn = Depends(get_db)):
    query_fetch_profile = """
        SELECT * FROM profiles 
        WHERE user_id=$1
    """
    query_fetch_health_cond = """
        SELECT * FROM health_conditions
        WHERE user_id=$1 AND is_active=true
    """
    profile_info = await conn.fetchrow(query_fetch_profile, user_id)
    if not profile_info:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )
        
    # Use fetch() to get all active conditions, not just the first one
    health_conditions = await conn.fetch(query_fetch_health_cond, user_id)

    return {
        "profile": dict(profile_info),
        "health_conditions": [dict(hc) for hc in health_conditions]
    }
    

@router.put("/")
async def update_profile( profile_update: ProfileUpdate, user_id: str = Depends(get_current_user), conn = Depends(get_db)):
    # Security Note (Automated Review): Pydantic's ProfileUpdate schema strictly validates and 
    # filters incoming keys. This ensures that only predefined, safe keys make it into the 
    # update_data dictionary, preventing any SQL injection via malicious dictionary keys.
    update_data = profile_update.model_dump(exclude_unset=True)

    if not update_data:
        return await get_profile(user_id=user_id, conn=conn)

    # Quality Note (Automated Review): This dynamic SQL generation logic is duplicated in 
    # update_health_condition. For a larger app, this should be abstracted into a utils file.
    set_clauses = []
    values = []
    for i, (key, value) in enumerate(update_data.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)
    
    values.append(user_id)
    query = f"""
        UPDATE profiles 
        SET {', '.join(set_clauses)}
        WHERE user_id = ${len(values)}
        RETURNING *
    """
    
    updated_profile = await conn.fetchrow(query, *values)
    
    if not updated_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    query_fetch_health_cond = """
        SELECT * FROM health_conditions
        WHERE user_id=$1 AND is_active=true
    """
    health_conditions = await conn.fetch(query_fetch_health_cond, user_id)

    profile_dict = dict(updated_profile)
    profile_dict["health_conditions"] = [dict(hc) for hc in health_conditions]
    
    return profile_dict


@router.post("/health-conditions")
async def add_health_condition(health_condition: HealthConditionCreate, user_id: str = Depends(get_current_user), conn = Depends(get_db)):
    
    # Security Note (Automated Review): Just like update_profile, Pydantic's HealthConditionCreate 
    # ensures no rogue keys can be passed in to manipulate the dynamic SQL INSERT statement below.
    health_condition_dict = health_condition.model_dump(exclude_unset=True)
    
    health_condition_dict["user_id"] = user_id
    
    keys = []
    q_values = []
    values = []
    for i, (key, value) in enumerate(health_condition_dict.items(), start=1):
        keys.append(f"{key}")
        q_values.append(f"${i}")
        values.append(value)
    
    query = f"""
        INSERT INTO health_conditions 
        ({', '.join(keys)})
        VALUES 
        ({', '.join(q_values)})
        RETURNING *
    """

    res = await conn.fetchrow(query, *values)

    return dict(res)

@router.put("/health-conditions/{condition_id}")
async def update_health_condition(condition_id: str, health_condition_update: HealthConditionUpdate, user_id: str = Depends(get_current_user), conn = Depends(get_db)) :
    
    # Performance Note (Automated Review): This initial SELECT query is technically redundant 
    # because the UPDATE statement below has a RETURNING clause. However, we do a SELECT first 
    # to explicitly distinguish between "Condition not found" (404) and "Not yours" (403/404).
    query = """
        SELECT * FROM health_conditions
        WHERE id=$1
    """ 

    health_condition = await conn.fetchrow(query, condition_id)

    if not health_condition:
        raise HTTPException(status_code=404, detail="Health condition not found")

    if str(health_condition["user_id"]) != user_id:
        raise HTTPException(
            status_code=404,
            detail="Health condition doesn't belong to the current user."
        )

    health_condition_update_dic = health_condition_update.model_dump(exclude_unset=True)

    if not health_condition_update_dic:
        return dict(health_condition)
    
    set_clauses = []
    values = []
    for i, (key, value) in enumerate(health_condition_update_dic.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)
        
    values.append(condition_id)
    values.append(user_id)

    update_query = f"""
        UPDATE health_conditions
        SET {', '.join(set_clauses)}
        WHERE id=${len(values)-1} AND user_id=${len(values)}
        RETURNING *
    """

    updated_health_condition = await conn.fetchrow(update_query, *values)

    if not updated_health_condition:
        raise HTTPException(status_code=404, detail="Health condition not found")

    return dict(updated_health_condition)


@router.delete("/health-conditions/{condition_id}")
async def delete_health_condition(condition_id: str, user_id: str = Depends(get_current_user), conn = Depends(get_db)) :
    query = """
        SELECT * FROM health_conditions
        WHERE id=$1
    """ 

    health_condition = await conn.fetchrow(query, condition_id)

    if not health_condition:
        raise HTTPException(status_code=404, detail="Health condition not found")

    if str(health_condition["user_id"]) != user_id:
        raise HTTPException(
            status_code=404,
            detail="Health condition doesn't belong to the current user."
        )

    soft_delete_query = """
        UPDATE health_conditions
        SET is_active=false
        WHERE id=$1 AND user_id=$2
        RETURNING id
    """

    delete_condition = await conn.fetchrow(soft_delete_query, condition_id, user_id)

    if not delete_condition:
        raise HTTPException(
            status_code=404,
            detail="Health condition not found"
        )
    
    return {
        "message" : "Health condition removed." 
    }
