from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.session import Session, SessionStatus
from app.services.auth import create_access_token, hash_password

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(TEST_DB_URL)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db():
    async with async_session_factory() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def doctor():
    async with async_session_factory() as db:
        d = Doctor(name="Dr. Test", email="test@example.com", hashed_password=hash_password("pass123"))
        db.add(d)
        await db.commit()
        await db.refresh(d)
        return d


@pytest.fixture
async def patient(doctor):
    async with async_session_factory() as db:
        p = Patient(name="Rahul Sharma", doctor_id=doctor.id)
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p


@pytest.fixture
def auth_headers(doctor):
    token = create_access_token(doctor.id)
    return {"Authorization": f"Bearer {token}"}


async def test_create_session(client, auth_headers, patient):
    resp = await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["patient_id"] == patient.id
    assert data["status"] == "pending"


async def test_create_session_invalid_patient(client, auth_headers):
    resp = await client.post("/api/sessions", json={"patient_id": 9999}, headers=auth_headers)
    assert resp.status_code == 404


async def test_upload_audio(client, auth_headers, patient):
    create_resp = await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)
    session_id = create_resp.json()["id"]

    with patch("app.api.sessions.generate_presigned_upload_url") as mock_url:
        mock_url.return_value = ("http://minio/presigned-url", "sessions/1/audio.mp3")
        resp = await client.post(f"/api/sessions/{session_id}/audio", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "upload_url" in data
        assert data["session_id"] == session_id


async def test_upload_audio_not_found(client, auth_headers):
    resp = await client.post("/api/sessions/9999/audio", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_session_status(client, auth_headers, patient):
    create_resp = await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)
    session_id = create_resp.json()["id"]

    resp = await client.get(f"/api/sessions/{session_id}/status", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "pending"
    assert "estimated_progress" in data


async def test_get_session_status_not_found(client, auth_headers):
    resp = await client.get("/api/sessions/9999/status", headers=auth_headers)
    assert resp.status_code == 404


async def test_retry_session(client, auth_headers, patient, doctor):
    async with async_session_factory() as db:
        session = Session(
            doctor_id=doctor.id,
            patient_id=patient.id,
            audio_path="sessions/1/audio.mp3",
            status=SessionStatus.failed,
            error_message="Something went wrong",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        session_id = session.id

    resp = await client.post(f"/api/sessions/{session_id}/retry", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"
    assert resp.json()["error_message"] is None


async def test_retry_non_failed_session(client, auth_headers, patient):
    create_resp = await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)
    session_id = create_resp.json()["id"]

    resp = await client.post(f"/api/sessions/{session_id}/retry", headers=auth_headers)
    assert resp.status_code == 400


async def test_list_sessions(client, auth_headers, patient):
    await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)
    await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)

    resp = await client.get("/api/sessions", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_list_sessions_filter_status(client, auth_headers, patient):
    await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)

    resp = await client.get("/api/sessions?status=pending", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get("/api/sessions?status=completed", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0


async def test_get_session_detail(client, auth_headers, patient):
    create_resp = await client.post("/api/sessions", json={"patient_id": patient.id}, headers=auth_headers)
    session_id = create_resp.json()["id"]

    resp = await client.get(f"/api/sessions/{session_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["patient_name"] == "Rahul Sharma"
    assert data["note_transcript"] is None


async def test_get_session_not_found(client, auth_headers):
    resp = await client.get("/api/sessions/9999", headers=auth_headers)
    assert resp.status_code == 404


async def test_sessions_doctor_scoped(client, patient):
    async with async_session_factory() as db:
        d2 = Doctor(name="Dr. Two", email="d2@test.com", hashed_password=hash_password("pass"))
        db.add(d2)
        await db.commit()
        await db.refresh(d2)

    token_d2 = create_access_token(d2.id)
    resp = await client.get("/api/sessions", headers={"Authorization": f"Bearer {token_d2}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 0
