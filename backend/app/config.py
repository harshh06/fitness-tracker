from pydantic_settings import BaseSettings, SettingsConfigDict

class Setting(BaseSettings) :
    database_url: str
    jwt_secret: str

    model_config = SettingsConfigDict(env_file='../.env')

settings = Setting()
