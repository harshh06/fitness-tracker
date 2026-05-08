
from typing import Optional
import asyncpg

pool: Optional[asyncpg.Pool] = None

async def get_db() :
  async with pool.acquire() as conn:
    yield conn
 