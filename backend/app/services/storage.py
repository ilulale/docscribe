from datetime import datetime, timedelta, timezone

from minio import Minio
from minio.error import S3Error

from app.config import settings

_status_progress = {
    "pending": "Waiting for audio upload",
    "transcribing": "Transcribing audio to text",
    "generating_soap": "Generating SOAP note from transcript",
    "completed": "Processing complete",
    "failed": "Processing failed",
}


def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


def ensure_bucket(client: Minio) -> None:
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)


def generate_presigned_upload_url(session_id: int, content_type: str = "audio/mpeg") -> tuple[str, str]:
    client = get_minio_client()
    ensure_bucket(client)

    object_name = f"sessions/{session_id}/audio.mp3"
    upload_url = client.presigned_put_object(
        settings.minio_bucket,
        object_name,
        expires=timedelta(hours=1),
    )
    return upload_url, object_name


def get_status_progress(status: str) -> str | None:
    return _status_progress.get(status)
