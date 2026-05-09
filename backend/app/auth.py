from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, expires_delta: timedelta = timedelta(hours=24)) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> str:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    return payload["sub"]  # returns user_id

def create_refresh_token(user_id: str, expires_delta: timedelta = timedelta(hours=24*7)) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
