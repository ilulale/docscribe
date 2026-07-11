from unittest.mock import patch, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.models.letterhead import DoctorLetterhead
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
def auth_headers(doctor):
    token = create_access_token(doctor.id)
    return {"Authorization": f"Bearer {token}"}


async def test_get_letterhead_not_found(client, auth_headers):
    resp = await client.get("/api/letterhead", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_letterhead(client, auth_headers, doctor):
    async with async_session_factory() as db:
        lh = DoctorLetterhead(
            doctor_id=doctor.id,
            clinic_name="City Clinic",
            phone="1234567890",
        )
        db.add(lh)
        await db.commit()

    resp = await client.get("/api/letterhead", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["clinic_name"] == "City Clinic"
    assert data["phone"] == "1234567890"
    assert data["logo_path"] is None


async def test_upsert_letterhead_create(client, auth_headers):
    resp = await client.post(
        "/api/letterhead",
        json={"clinic_name": "New Clinic", "address": "123 Main St"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["clinic_name"] == "New Clinic"
    assert data["address"] == "123 Main St"


async def test_upsert_letterhead_update(client, auth_headers):
    await client.post(
        "/api/letterhead",
        json={"clinic_name": "Old Name"},
        headers=auth_headers,
    )

    resp = await client.post(
        "/api/letterhead",
        json={"clinic_name": "New Name", "phone": "5551234"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["clinic_name"] == "New Name"
    assert data["phone"] == "5551234"


async def test_upsert_letterhead_partial(client, auth_headers):
    await client.post(
        "/api/letterhead",
        json={"clinic_name": "Clinic", "address": "123 St"},
        headers=auth_headers,
    )

    resp = await client.post(
        "/api/letterhead",
        json={"phone": "999"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["clinic_name"] == "Clinic"
    assert data["address"] == "123 St"
    assert data["phone"] == "999"


async def test_upload_logo(client, auth_headers, doctor):
    await client.post(
        "/api/letterhead",
        json={"clinic_name": "Clinic"},
        headers=auth_headers,
    )

    with patch("app.api.letterhead.upload_logo") as mock_upload:
        mock_upload.return_value = "letterheads/1/logo.png"
        resp = await client.post(
            "/api/letterhead/logo",
            files={"file": ("logo.png", b"fake png data", "image/png")},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["logo_path"] == "letterheads/1/logo.png"
        mock_upload.assert_called_once()


async def test_upload_logo_invalid_type(client, auth_headers):
    await client.post(
        "/api/letterhead",
        json={"clinic_name": "Clinic"},
        headers=auth_headers,
    )

    resp = await client.post(
        "/api/letterhead/logo",
        files={"file": ("doc.pdf", b"fake pdf data", "application/pdf")},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "image" in resp.json()["detail"].lower()


async def test_upload_logo_replaces_existing(client, auth_headers, doctor):
    await client.post(
        "/api/letterhead",
        json={"clinic_name": "Clinic"},
        headers=auth_headers,
    )

    with (
        patch("app.api.letterhead.upload_logo") as mock_upload,
        patch("app.api.letterhead.delete_logo") as mock_delete,
    ):
        mock_upload.return_value = "letterheads/1/logo.png"
        await client.post(
            "/api/letterhead/logo",
            files={"file": ("logo.png", b"first", "image/png")},
            headers=auth_headers,
        )

        mock_upload.return_value = "letterheads/1/logo2.png"
        resp = await client.post(
            "/api/letterhead/logo",
            files={"file": ("logo2.png", b"second", "image/png")},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["logo_path"] == "letterheads/1/logo2.png"
        mock_delete.assert_called_once_with("letterheads/1/logo.png")


async def test_delete_logo(client, auth_headers, doctor):
    async with async_session_factory() as db:
        lh = DoctorLetterhead(
            doctor_id=doctor.id,
            logo_path="letterheads/1/logo.png",
        )
        db.add(lh)
        await db.commit()

    with patch("app.api.letterhead.delete_logo") as mock_delete:
        mock_delete.return_value = True
        resp = await client.delete("/api/letterhead/logo", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["logo_path"] is None
        mock_delete.assert_called_once_with("letterheads/1/logo.png")


async def test_delete_logo_no_logo(client, auth_headers, doctor):
    async with async_session_factory() as db:
        lh = DoctorLetterhead(doctor_id=doctor.id)
        db.add(lh)
        await db.commit()

    resp = await client.delete("/api/letterhead/logo", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["logo_path"] is None


async def test_delete_logo_not_found(client, auth_headers):
    resp = await client.delete("/api/letterhead/logo", headers=auth_headers)
    assert resp.status_code == 404


async def test_letterhead_cross_doctor隔离(client, doctor):
    async with async_session_factory() as db:
        d2 = Doctor(name="Dr. Two", email="d2@test.com", hashed_password=hash_password("pass"))
        db.add(d2)
        await db.commit()
        await db.refresh(d2)

    token_d2 = create_access_token(d2.id)
    resp = await client.get(
        "/api/letterhead",
        headers={"Authorization": f"Bearer {token_d2}"},
    )
    assert resp.status_code == 404


async def test_all_fields(client, auth_headers):
    resp = await client.post(
        "/api/letterhead",
        json={
            "clinic_name": "City Clinic",
            "doctor_qualifications": "MBBS, MD",
            "address": "123 Medical Lane",
            "phone": "1234567890",
            "email": "doc@clinic.com",
            "website": "https://clinic.com",
            "registration_numbers": "MED-1234",
            "opd_hours": "Mon-Sat 9AM-5PM",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["clinic_name"] == "City Clinic"
    assert data["doctor_qualifications"] == "MBBS, MD"
    assert data["address"] == "123 Medical Lane"
    assert data["phone"] == "1234567890"
    assert data["email"] == "doc@clinic.com"
    assert data["website"] == "https://clinic.com"
    assert data["registration_numbers"] == "MED-1234"
    assert data["opd_hours"] == "Mon-Sat 9AM-5PM"
