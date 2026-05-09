from app.auth import create_refresh_token
from jose import JWTError, ExpiredSignatureError
from app.auth import decode_token
from app.auth import create_access_token, verify_password
import asyncpg
from app.auth import hash_password
from fastapi import Depends
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr, Field
from app.dependencies import get_db

router = APIRouter()

class UserAuth(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class TokenRefresh(BaseModel):
    refresh_token: str

@router.post("/auth/signup")
async def signup(user: UserAuth, conn=Depends(get_db)):
    hashed_passord = hash_password(user.password)
    query = """
        INSERT INTO users (email, password_hash) 
        VALUES($1, $2)
        RETURNING id;
    """
    try:
        user_id = await conn.fetchval(query, user.email, hashed_passord)
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
            )

@router.post("/auth/login")
async def login(user: UserAuth, conn=Depends(get_db)):
    query = """
        SELECT id, password_hash from users
        WHERE email=$1
    """

    row = await conn.fetchrow(query, user.email)
    if row is None:
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password"
        )
    
    if not verify_password(user.password, row['password_hash']):
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(row['id'])
    refresh_token = create_refresh_token(row['id'])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/auth/refresh")
def refresh(token_data: TokenRefresh):
    try:
        user_id = decode_token(token_data.refresh_token)
        return {
            "access_token": create_access_token(user_id),
            "token_type": "bearer"
        }
    
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )

    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"JWT decoding error: {e}"
        )



