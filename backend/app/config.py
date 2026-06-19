from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Setting(BaseSettings) :
    database_url: str
    jwt_secret: str
    supabase_jwt_secret: Optional[str] = None
    next_public_supabase_url: Optional[str] = None
    allowed_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file='../.env', env_file_encoding='utf-8', extra='ignore')

settings = Setting()

