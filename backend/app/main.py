
from app.dependencies import get_db
from fastapi import Depends
from contextlib import asynccontextmanager
from app import dependencies
from app.config import settings
from app.routers import auth, profile, exercise_library, workouts, analytics
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg

@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await asyncpg.create_pool(dsn = settings.database_url)
    dependencies.pool = pool
    yield
    await dependencies.pool.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Auth"])
app.include_router(profile.router, tags=["Profile"])
app.include_router(exercise_library.router, tags=["Exercises"])
app.include_router(workouts.router, tags=["Workouts"])
app.include_router(analytics.router, tags=["Analytics"])

@app.get("/")
async def home():
    return {"welcome"}

@app.get("/health")
async def health(conn=Depends(get_db)):
    result = await conn.fetchval("SELECT 1")
    return {"db connected": result == 1}
