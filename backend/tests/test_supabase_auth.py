import pytest
import time
import uuid
import httpx
import asyncpg
from jose import jwt, jwk
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.dependencies import get_current_user
from app.config import settings

@pytest.fixture
async def conn():
    connection = await asyncpg.connect(settings.database_url)
    # Start a transaction to avoid test data pollution
    tx = connection.transaction()
    await tx.start()
    yield connection
    # Roll back all changes made in the test
    await tx.rollback()
    await connection.close()

# Helper function to generate RSA keys
def generate_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem_private_key = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    jose_key = jwk.construct(pem_private_key, algorithm='RS256')
    return pem_private_key, jose_key

# ── 1. Symmetric HS256 Token Validation & Sanitization Tests ────

@pytest.mark.anyio
async def test_get_current_user_valid_hs256(conn):
    user_uuid = str(uuid.uuid4())
    payload = {
        "sub": user_uuid,
        "email": "hs256-test@example.com",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "user_metadata": {
            "display_name": "Test User <script>alert('xss')</script>"
        }
    }
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    # Execute dependency
    user_id = await get_current_user(credentials=credentials, conn=conn)
    assert user_id == user_uuid
    
    # Verify user row exists
    user_row = await conn.fetchrow("SELECT id, email FROM users WHERE id = $1", user_uuid)
    assert user_row is not None
    assert user_row["email"] == "hs256-test@example.com"
    
    # Verify display_name is escaped/sanitized to prevent Stored XSS
    profile_row = await conn.fetchrow("SELECT display_name FROM profiles WHERE user_id = $1", user_uuid)
    assert profile_row is not None
    assert profile_row["display_name"] == "Test User &lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"

# ── 2. Asymmetric RS256/JWKS Token Validation Tests ────────────

@pytest.mark.anyio
async def test_get_current_user_valid_rs256(conn, monkeypatch):
    pem_private, jose_key = generate_rsa_keypair()
    public_jwk = jose_key.public_key().to_dict()
    public_jwk['kid'] = 'mock-key-id-rs256'
    public_jwk['alg'] = 'RS256'
    
    mock_jwks = {"keys": [public_jwk]}
    
    async def mock_get_jwks():
        return mock_jwks
        
    monkeypatch.setattr("app.dependencies.get_jwks", mock_get_jwks)
    
    user_uuid = str(uuid.uuid4())
    payload = {
        "sub": user_uuid,
        "email": "rs256-test@example.com",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "user_metadata": {
            "display_name": "RS256 User"
        }
    }
    
    # Sign token with RSA private key
    token = jwt.encode(payload, pem_private, algorithm="RS256", headers={"kid": "mock-key-id-rs256"})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    # Execute dependency
    user_id = await get_current_user(credentials=credentials, conn=conn)
    assert user_id == user_uuid
    
    # Verify profile display_name
    profile_row = await conn.fetchrow("SELECT display_name FROM profiles WHERE user_id = $1", user_uuid)
    assert profile_row is not None
    assert profile_row["display_name"] == "RS256 User"

# ── 3. Expired & Invalid Token Tests ────────────────────────────

@pytest.mark.anyio
async def test_get_current_user_expired(conn):
    payload = {
        "sub": str(uuid.uuid4()),
        "email": "expired@example.com",
        "aud": "authenticated",
        "exp": int(time.time()) - 3600
    }
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, conn=conn)
        
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Token has expired"

@pytest.mark.anyio
async def test_get_current_user_invalid_signature(conn):
    payload = {
        "sub": str(uuid.uuid4()),
        "email": "badsig@example.com",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600
    }
    # Sign with a different, incorrect key
    token = jwt.encode(payload, "incorrect_secret_key_12345678901234567890", algorithm="HS256")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, conn=conn)
        
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token signature or format"

@pytest.mark.anyio
async def test_get_current_user_invalid_claims(conn):
    payload = {
        "sub": str(uuid.uuid4()),
        "email": "badaud@example.com",
        "aud": "invalid-audience-claim",
        "exp": int(time.time()) + 3600
    }
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, conn=conn)
        
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token claims"

# ── 4. Network/JWKS Provider Failure Tests ──────────────────────

@pytest.mark.anyio
async def test_get_current_user_jwks_network_failure(conn, monkeypatch):
    async def mock_get_jwks_fail():
        # Raise HTTPStatusError to simulate network/Supabase outages
        request = httpx.Request("GET", "http://supabase.co")
        response = httpx.Response(502, request=request)
        raise httpx.HTTPStatusError("Bad Gateway", request=request, response=response)
        
    monkeypatch.setattr("app.dependencies.get_jwks", mock_get_jwks_fail)
    
    payload = {
        "sub": str(uuid.uuid4()),
        "email": "rs256-test@example.com",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600
    }
    
    # Encode with RSA token to force JWKS fetch
    pem_private, jose_key = generate_rsa_keypair()
    token = jwt.encode(payload, pem_private, algorithm="RS256", headers={"kid": "mock-key-id-rs256"})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, conn=conn)
        
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Failed to verify token against identity provider"


@pytest.mark.anyio
async def test_get_current_user_legacy_migration(conn):
    # 1. Seed a legacy user in the database
    legacy_user_uuid = str(uuid.uuid4())
    legacy_email = "legacy-test-migration@example.com"
    await conn.execute(
        "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'legacy_hash')",
        legacy_user_uuid, legacy_email
    )
    # The on_user_created trigger automatically inserts a profile. Let's verify and update it.
    profile_exists = await conn.fetchval("SELECT 1 FROM profiles WHERE user_id = $1", legacy_user_uuid)
    assert profile_exists is not None
    
    await conn.execute(
        """
        UPDATE profiles SET
            display_name = 'Legacy User Display Name',
            date_of_birth = '1995-01-01',
            gender = 'male',
            height_cm = 180.0,
            weight_kg = 75.0,
            fitness_level = 'intermediate',
            avatar_url = 'http://example.com/avatar.png',
            unit_preference = 'kg'
        WHERE user_id = $1
        """,
        legacy_user_uuid
    )
    
    # Let's seed health conditions, workouts, body measurements, templates, and summaries
    await conn.execute(
        "INSERT INTO health_conditions (user_id, condition_name, body_area, severity, notes) VALUES ($1, 'Back Pain', 'lower back', 'mild', 'Be careful')",
        legacy_user_uuid
    )
    # Workouts
    workout_id = str(uuid.uuid4())
    await conn.execute(
        "INSERT INTO workouts (id, user_id, title, duration_mins) VALUES ($1, $2, 'Legacy Workout', 45)",
        workout_id, legacy_user_uuid
    )
    # Body measurements
    await conn.execute(
        "INSERT INTO body_measurements (user_id, measured_at, weight_kg) VALUES ($1, '2026-06-19', 75.0)",
        legacy_user_uuid
    )
    # Workout templates
    await conn.execute(
        "INSERT INTO workout_templates (user_id, name, workout_type) VALUES ($1, 'Legacy Template', 'strength')",
        legacy_user_uuid
    )
    # Personal records (requires an exercise in library)
    exercise_id = str(uuid.uuid4())
    await conn.execute(
        "INSERT INTO exercise_library (id, name, category, equipment, difficulty, is_system) VALUES ($1, 'Legacy Exercise', 'strength', 'dumbbell', 'beginner', true)",
        exercise_id
    )
    await conn.execute(
        "INSERT INTO personal_records (user_id, exercise_id, record_type, value, achieved_at) VALUES ($1, $2, 'max_weight', 40.0, '2026-06-19')",
        legacy_user_uuid, exercise_id
    )
    # Coach conversation
    await conn.execute(
        "INSERT INTO coach_conversations (user_id, title) VALUES ($1, 'Legacy Talk')",
        legacy_user_uuid
    )
    # Monthly summaries
    await conn.execute(
        "INSERT INTO monthly_summaries (user_id, month, stats) VALUES ($1, '2026-06-01', '{}')",
        legacy_user_uuid
    )

    # 2. Simulate login with a new Supabase ID and the legacy email
    new_user_uuid = str(uuid.uuid4())
    payload = {
        "sub": new_user_uuid,
        "email": legacy_email,
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "user_metadata": {
            "display_name": "Supabase New Name"
        }
    }
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    # 3. Call get_current_user
    user_id = await get_current_user(credentials=credentials, conn=conn)
    assert user_id == new_user_uuid
    
    # 4. Verify database assertions
    # Verify legacy user record is gone
    legacy_user_exists = await conn.fetchval("SELECT 1 FROM users WHERE id = $1", legacy_user_uuid)
    assert not legacy_user_exists
    
    # Verify new user record exists
    new_user_row = await conn.fetchrow("SELECT id, email FROM users WHERE id = $1", new_user_uuid)
    assert new_user_row is not None
    assert new_user_row["email"] == legacy_email
    
    # Verify new profile exists and contains legacy data (migrated profile details)
    new_profile = await conn.fetchrow("SELECT * FROM profiles WHERE user_id = $1", new_user_uuid)
    assert new_profile is not None
    assert new_profile["display_name"] == "Legacy User Display Name"
    assert new_profile["email"] == legacy_email
    assert new_profile["gender"] == "male"
    assert new_profile["height_cm"] == 180.0
    assert new_profile["weight_kg"] == 75.0
    assert new_profile["fitness_level"] == "intermediate"
    assert new_profile["avatar_url"] == "http://example.com/avatar.png"
    assert new_profile["unit_preference"] == "kg"
    
    # Verify health conditions migrated
    health_row = await conn.fetchrow("SELECT user_id, condition_name FROM health_conditions WHERE user_id = $1", new_user_uuid)
    assert health_row is not None
    
    # Verify workouts migrated
    workout_row = await conn.fetchrow("SELECT user_id, title FROM workouts WHERE user_id = $1", new_user_uuid)
    assert workout_row is not None
    assert workout_row["title"] == "Legacy Workout"
    
    # Verify body measurements migrated
    bm_row = await conn.fetchrow("SELECT user_id, weight_kg FROM body_measurements WHERE user_id = $1", new_user_uuid)
    assert bm_row is not None
    assert bm_row["weight_kg"] == 75.0
    
    # Verify templates migrated
    template_row = await conn.fetchrow("SELECT user_id, name FROM workout_templates WHERE user_id = $1", new_user_uuid)
    assert template_row is not None
    assert template_row["name"] == "Legacy Template"
    
    # Verify personal records migrated
    pr_row = await conn.fetchrow("SELECT user_id, record_type, value FROM personal_records WHERE user_id = $1", new_user_uuid)
    assert pr_row is not None
    assert pr_row["value"] == 40.0
    
    # Verify coach conversations migrated
    cc_row = await conn.fetchrow("SELECT user_id, title FROM coach_conversations WHERE user_id = $1", new_user_uuid)
    assert cc_row is not None
    assert cc_row["title"] == "Legacy Talk"
    
    # Verify monthly summaries migrated
    ms_row = await conn.fetchrow("SELECT user_id, month FROM monthly_summaries WHERE user_id = $1", new_user_uuid)
    assert ms_row is not None

