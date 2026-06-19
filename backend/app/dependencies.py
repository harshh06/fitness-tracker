
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError, JWTClaimsError
from app.config import settings
import asyncpg
import httpx
import logging
import html
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

pool: asyncpg.Pool | None = None

async def get_db():
  if pool is None:
      raise RuntimeError("Database connection pool is not initialized")
  async with pool.acquire() as conn:
    yield conn


security = HTTPBearer()

_jwks_cache = None

async def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        if not settings.next_public_supabase_url:
            raise HTTPException(
                status_code=500,
                detail="NEXT_PUBLIC_SUPABASE_URL is not configured in backend settings"
            )
        url = f"{settings.next_public_supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn = Depends(get_db)
) -> str:
    token = credentials.credentials
    try:
        # Get token header to inspect signing algorithm (alg) and key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        kid = unverified_header.get("kid")

        if not alg:
            raise HTTPException(status_code=401, detail="Invalid token: missing alg header")

        if alg == "HS256":
            # Symmetric key verification
            if not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=500,
                    detail="SUPABASE_JWT_SECRET is not configured in backend .env file"
                )
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": True},
                audience="authenticated"
            )
        elif alg in ("ES256", "RS256"):
            # Asymmetric key verification via JWKS
            if not kid:
                raise HTTPException(status_code=401, detail="Invalid token: missing kid header")
            jwks = await get_jwks()
            key = None
            for k in jwks.get("keys", []):
                if k.get("kid") == kid:
                    key = k
                    break
            if not key:
                raise HTTPException(status_code=401, detail="Matching public key not found in JWKS")

            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
                options={"verify_aud": True},
                audience="authenticated"
            )
        else:
            raise HTTPException(status_code=401, detail=f"Unsupported signing algorithm: {alg}")

        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing sub")
        if not email:
            email = f"{user_id}@placeholder.supabase.co"

        # Sync user to local database if not exists
        user_exists = await conn.fetchval("SELECT 1 FROM users WHERE id = $1", user_id)
        if not user_exists:
            await conn.execute(
                "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, '')",
                user_id, email
            )
            # Sync display name from JWT user_metadata if available
            metadata = payload.get("user_metadata", {}) or {}
            display_name = metadata.get("display_name") or metadata.get("full_name") or metadata.get("name")
            if display_name:
                # Sanitize name to prevent Stored XSS
                sanitized_name = html.escape(str(display_name))[:100]
                await conn.execute(
                    "UPDATE profiles SET display_name = $1 WHERE user_id = $2",
                    sanitized_name, user_id
                )
        return user_id

    except HTTPException:
        # Re-raise explicit HTTPExceptions we threw ourselves
        raise
    except ExpiredSignatureError as e:
        logger.warning(f"JWT Verification failed: Token has expired. Details: {e}")
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTClaimsError as e:
        logger.warning(f"JWT Verification failed: Invalid claims. Details: {e}")
        raise HTTPException(status_code=401, detail="Invalid token claims")
    except JWTError as e:
        logger.warning(f"JWT Verification failed: Invalid signature or format. Details: {e}")
        raise HTTPException(status_code=401, detail="Invalid token signature or format")
    except httpx.HTTPError as e:
        logger.error(f"JWKS retrieval failed: Network or HTTP error. Details: {e}")
        raise HTTPException(status_code=502, detail="Failed to verify token against identity provider")
    except Exception as e:
        logger.error(f"Unexpected authentication error: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Authentication failed due to an unexpected error")