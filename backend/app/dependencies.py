
from jose import JWTError
from app.auth import decode_token
import asyncpg
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pool: asyncpg.Pool | None = None

async def get_db():
  if pool is None:
      raise RuntimeError("Database connection pool is not initialized")
  async with pool.acquire() as conn:
    yield conn


security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        user_id = decode_token(credentials.credentials)
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")