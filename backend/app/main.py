
from app.dependencies import get_db
from fastapi import Depends
from contextlib import asynccontextmanager
from app import dependencies
from app.config import settings
from app.routers import auth
from fastapi import FastAPI
import asyncpg

@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await asyncpg.create_pool(dsn = settings.database_url)
    dependencies.pool = pool
    yield
    await dependencies.pool.close()

app = FastAPI(lifespan=lifespan)

app.include_router(auth.router, tags=["Auth"])

@app.get("/")
async def home():
    return {"welcome"}

@app.get("/health")
async def health(conn=Depends(get_db)):
    result = await conn.fetchval("SELECT 1")
    return {"db connected": result == 1}
