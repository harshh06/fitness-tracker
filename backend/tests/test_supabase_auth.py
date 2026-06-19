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
