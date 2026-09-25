from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    CLERK_SECRET_KEY: str

    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )
    CLERK_AUTHORIZED_PARTIES: str = "https://orbit-ai-topaz-three.vercel.app"
    CLERK_JWT_KEY: str
    AUTH_REQUIRED: bool = True
    DEV_USER_ID: str = "dev_user"
    
    GROQ_API_KEY: str
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    
    NEON_S3_ENDPOINT: str
    NEON_S3_REGION: str
    NEON_S3_BUCKET: str = "orbitai-files"
    NEON_S3_ACCESS_KEY_ID: str
    NEON_S3_SECRET_ACCESS_KEY: str
        


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
