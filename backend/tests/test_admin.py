from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.models.invoice import Invoice, InvoiceStatus
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
async def admin():
    async with async_session_factory() as db:
        a = Doctor(
            name="Admin User",
            email="admin@example.com",
            hashed_password=hash_password("admin123"),
            is_admin=True,
        )
        db.add(a)
        await db.commit()
        await db.refresh(a)
        return a


@pytest.fixture
async def regular_doctor():
    async with async_session_factory() as db:
        d = Doctor(
            name="Dr. Regular",
            email="regular@example.com",
            hashed_password=hash_password("pass123"),
            is_admin=False,
        )
        db.add(d)
        await db.commit()
        await db.refresh(d)
        return d


@pytest.fixture
def admin_headers(admin):
    token = create_access_token(admin.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def regular_headers(regular_doctor):
    token = create_access_token(regular_doctor.id)
    return {"Authorization": f"Bearer {token}"}


async def test_non_admin_rejected(client, regular_headers):
    resp = await client.get("/api/admin/doctors", headers=regular_headers)
    assert resp.status_code == 403
    assert "admin" in resp.json()["detail"].lower()


async def test_unauthenticated_rejected(client):
    resp = await client.get("/api/admin/doctors")
    assert resp.status_code == 403


# Doctor management


async def test_list_doctors(client, admin_headers, admin, regular_doctor):
    resp = await client.get("/api/admin/doctors", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    emails = {d["email"] for d in data}
    assert "admin@example.com" in emails
    assert "regular@example.com" in emails


async def test_create_doctor(client, admin_headers):
    resp = await client.post(
        "/api/admin/doctors",
        json={"name": "New Doctor", "email": "new@doc.com", "password": "pass123"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "New Doctor"
    assert data["email"] == "new@doc.com"
    assert data["is_active"] is True
    assert data["is_admin"] is False
    assert "hashed_password" not in data


async def test_create_doctor_duplicate_email(client, admin_headers):
    await client.post(
        "/api/admin/doctors",
        json={"name": "Doc One", "email": "dupe@test.com", "password": "pass"},
        headers=admin_headers,
    )
    resp = await client.post(
        "/api/admin/doctors",
        json={"name": "Doc Two", "email": "dupe@test.com", "password": "pass"},
        headers=admin_headers,
    )
    assert resp.status_code == 409


async def test_toggle_doctor_active(client, admin_headers, regular_doctor):
    resp = await client.patch(
        f"/api/admin/doctors/{regular_doctor.id}/active",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    resp = await client.patch(
        f"/api/admin/doctors/{regular_doctor.id}/active",
        json={"is_active": True},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True


async def test_toggle_doctor_not_found(client, admin_headers):
    resp = await client.patch(
        "/api/admin/doctors/9999/active",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 404


# Invoice management


async def test_list_invoices(client, admin_headers, admin):
    async with async_session_factory() as db:
        inv = Invoice(doctor_id=admin.id, amount=500.00, currency="INR")
        db.add(inv)
        await db.commit()

    resp = await client.get("/api/admin/invoices", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["amount"] == 500.0


async def test_create_invoice(client, admin_headers, regular_doctor):
    resp = await client.post(
        "/api/admin/invoices",
        json={"doctor_id": regular_doctor.id, "amount": 1000.00},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["doctor_id"] == regular_doctor.id
    assert data["amount"] == 1000.0
    assert data["currency"] == "INR"
    assert data["status"] == "pending"


async def test_create_invoice_doctor_not_found(client, admin_headers):
    resp = await client.post(
        "/api/admin/invoices",
        json={"doctor_id": 9999, "amount": 100.00},
        headers=admin_headers,
    )
    assert resp.status_code == 404


async def test_update_invoice_status(client, admin_headers, admin):
    async with async_session_factory() as db:
        inv = Invoice(doctor_id=admin.id, amount=200.00)
        db.add(inv)
        await db.commit()
        await db.refresh(inv)
        inv_id = inv.id

    resp = await client.patch(
        f"/api/admin/invoices/{inv_id}",
        json={"status": "paid"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "paid"


async def test_update_invoice_not_found(client, admin_headers):
    resp = await client.patch(
        "/api/admin/invoices/9999",
        json={"status": "paid"},
        headers=admin_headers,
    )
    assert resp.status_code == 404


# Stats


async def test_get_stats(client, admin_headers, admin, regular_doctor):
    async with async_session_factory() as db:
        s1 = Session(doctor_id=admin.id, patient_id=1, status=SessionStatus.completed)
        s2 = Session(doctor_id=regular_doctor.id, patient_id=1, status=SessionStatus.completed)
        db.add_all([s1, s2])
        await db.commit()

    resp = await client.get("/api/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_doctors"] == 2
    assert data["total_sessions"] == 2
    assert data["sessions_today"] >= 0


# Credits


async def test_get_credits(client, admin_headers, admin, regular_doctor):
    async with async_session_factory() as db:
        for _ in range(3):
            db.add(Session(doctor_id=admin.id, patient_id=1, status=SessionStatus.completed))
        db.add(Session(doctor_id=regular_doctor.id, patient_id=1, status=SessionStatus.completed))
        await db.commit()

    resp = await client.get("/api/admin/credits", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["doctors"]
    assert len(data) == 2

    admin_usage = next(d for d in data if d["doctor_id"] == admin.id)
    assert admin_usage["total_sessions"] == 3

    regular_usage = next(d for d in data if d["doctor_id"] == regular_doctor.id)
    assert regular_usage["total_sessions"] == 1
