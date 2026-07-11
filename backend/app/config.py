from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://docscribe:docscribe@localhost:5432/docscribe"
    database_url_sync: str = "postgresql://docscribe:docscribe@localhost:5432/docscribe"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "docscribe"
    minio_secure: bool = False

    redis_url: str = "redis://localhost:6379/0"

    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-3.1-flash-lite"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60 * 24  # 24 hours

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:80"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
