import pytest
from app.main import app
from app.dependencies import get_current_user, get_db, security
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import uuid

# ── Mock Auth Router ──────────────────────────────────────────

mock_router = APIRouter()

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

@mock_router.post("/auth/signup")
async def signup(user: UserAuth, conn=Depends(get_db)):
    user_id = str(uuid.uuid4())
    # Create user in local test DB
    await conn.execute(
        "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, '')",
        user_id, user.email
    )
    return {
        "access_token": user_id,
        "refresh_token": user_id,
        "token_type": "bearer"
    }

@mock_router.post("/auth/login")
async def login(user: UserAuth, conn=Depends(get_db)):
    row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", user.email)
    if not row:
        user_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, '')",
            user_id, user.email
        )
        token = user_id
    else:
        token = str(row["id"])
    return {
        "access_token": token,
        "refresh_token": token,
        "token_type": "bearer"
    }

@mock_router.post("/auth/refresh")
def refresh(token_data: TokenRefresh):
    return {
        "access_token": token_data.refresh_token,
        "token_type": "bearer"
    }

# Register mock auth router in testing environment
app.include_router(mock_router, tags=["MockAuth"])

# ── Mock Authentication Dependency Override ──────────────────

async def mock_get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn = Depends(get_db)
) -> str:
    token = credentials.credentials
    # Ensure the token is treated as a valid UUID user ID in tests
    try:
        uuid.UUID(token)
        user_exists = await conn.fetchval("SELECT 1 FROM users WHERE id = $1", token)
        if not user_exists:
            await conn.execute(
                "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, '')",
                token, f"mock_{token}@example.com"
            )
        return token
    except ValueError:
        # Fallback for mock strings or direct mock values
        return token

# Override dependency
app.dependency_overrides[get_current_user] = mock_get_current_user

# ── Setup & Teardown: Clean up test users before and after test session ────

@pytest.fixture(scope="session", autouse=True)
def cleanup_database_after_tests():
    import psycopg2
    from app.config import settings

    def clean():
        try:
            conn = psycopg2.connect(settings.database_url)
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM users WHERE email LIKE '%@example.com' OR email = 'mock@example.com';"
                )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"\nDatabase cleanup failed: {e}")

    # 1. Clean BEFORE tests start (removes any leftovers from previously aborted runs)
    clean()

    yield

    # 2. Clean AFTER all tests finish
    clean()

