from pydantic import ConfigDict
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class HealthConditionBase(BaseModel):
    condition_name: str
    body_area: str
    severity : Optional[str] = None    
    notes: Optional[str] = None
    diagnosed_date: Optional[date] = None
    is_active: Optional[bool] = None

class HealthConditionCreate(HealthConditionBase):
    pass

class HealthConditionUpdate(BaseModel):
    condition_name: Optional[str] = None    
    body_area: Optional[str] = None    
    severity : Optional[str] = None    
    notes: Optional[str] = None
    diagnosed_date: Optional[date] = None
    is_active: Optional[bool] = None


class HealthConditionResponse(HealthConditionBase):
    id: UUID
    user_id: UUID
    model_config = ConfigDict(from_attributes=True)


# Profile Schemas

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None    
    email : Optional[str] = None    
    date_of_birth: Optional[date] = None    
    gender : Optional[str] = None    
    height_cm : Optional[int] = None    
    weight_kg : Optional[int] = None    
    fitness_level : Optional[str] = None    
    avatar_url : Optional[str] = None    

class ProfileResponse(ProfileUpdate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    health_conditions: List[HealthConditionResponse] = [] 

