from datetime import datetime, timedelta, timezone
from io import BytesIO

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


def _externalize_url(url: str) -> str:
    return url.replace(f"://{settings.minio_endpoint}", "://localhost:9000")


def upload_audio(session_id: int, data: bytes, content_type: str = "audio/webm") -> str:
    client = get_minio_client()
    ensure_bucket(client)

    object_name = f"sessions/{session_id}/audio.mp3"
    from io import BytesIO
    client.put_object(
        settings.minio_bucket,
        object_name,
        BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return object_name


def generate_presigned_upload_url(session_id: int, content_type: str = "audio/mpeg") -> tuple[str, str]:
    client = get_minio_client()
    ensure_bucket(client)

    object_name = f"sessions/{session_id}/audio.mp3"
    upload_url = client.presigned_put_object(
        settings.minio_bucket,
        object_name,
        expires=timedelta(hours=1),
    )
    return _externalize_url(upload_url), object_name


def generate_presigned_download_url(object_name: str) -> str:
    client = get_minio_client()
    url = client.presigned_get_object(
        settings.minio_bucket,
        object_name,
        expires=timedelta(hours=1),
    )
    return _externalize_url(url)


def download_audio(object_name: str) -> bytes:
    client = get_minio_client()
    response = client.get_object(settings.minio_bucket, object_name)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def get_status_progress(status: str) -> str | None:
    return _status_progress.get(status)


def upload_logo(doctor_id: int, filename: str, data: bytes) -> str:
    client = get_minio_client()
    ensure_bucket(client)

    ext = filename.rsplit(".", 1)[-1] if "." in filename else "png"
    object_name = f"letterheads/{doctor_id}/logo.{ext}"

    client.put_object(
        settings.minio_bucket,
        object_name,
        BytesIO(data),
        length=len(data),
        content_type=f"image/{ext}",
    )
    return object_name


def delete_logo(logo_path: str) -> bool:
    client = get_minio_client()
    try:
        client.remove_object(settings.minio_bucket, logo_path)
        return True
    except S3Error:
        return False
