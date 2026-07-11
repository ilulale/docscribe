import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.models.patient import Patient
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


async def test_create_patient(client, auth_headers):
    resp = await client.post("/api/patients", json={"name": "Rahul Sharma"}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Rahul Sharma"
    assert "id" in data
    assert "doctor_id" in data


async def test_create_patient_unauthenticated(client):
    resp = await client.post("/api/patients", json={"name": "Rahul Sharma"})
    assert resp.status_code == 403


async def test_list_patients(client, auth_headers):
    await client.post("/api/patients", json={"name": "Patient A"}, headers=auth_headers)
    await client.post("/api/patients", json={"name": "Patient B"}, headers=auth_headers)

    resp = await client.get("/api/patients", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_list_patients_search(client, auth_headers):
    await client.post("/api/patients", json={"name": "Rahul Sharma"}, headers=auth_headers)
    await client.post("/api/patients", json={"name": "Priya Patel"}, headers=auth_headers)

    resp = await client.get("/api/patients?search=Rahul", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "Rahul Sharma"


async def test_list_patients_pagination(client, auth_headers):
    for i in range(5):
        await client.post("/api/patients", json={"name": f"Patient {i}"}, headers=auth_headers)

    resp = await client.get("/api/patients?page=1&page_size=2", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_get_patient(client, auth_headers):
    create_resp = await client.post("/api/patients", json={"name": "Rahul"}, headers=auth_headers)
    patient_id = create_resp.json()["id"]

    resp = await client.get(f"/api/patients/{patient_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Rahul"


async def test_get_patient_not_found(client, auth_headers):
    resp = await client.get("/api/patients/9999", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_patient_cross_doctor隔离(client):
    async with async_session_factory() as db:
        d1 = Doctor(name="Dr. One", email="d1@test.com", hashed_password=hash_password("pass"))
        d2 = Doctor(name="Dr. Two", email="d2@test.com", hashed_password=hash_password("pass"))
        db.add_all([d1, d2])
        await db.commit()
        await db.refresh(d1)
        await db.refresh(d2)

        p = Patient(name="Shared Name", doctor_id=d1.id)
        db.add(p)
        await db.commit()
        await db.refresh(p)
        patient_id = p.id

    token_d2 = create_access_token(d2.id)
    resp = await client.get(f"/api/patients/{patient_id}", headers={"Authorization": f"Bearer {token_d2}"})
    assert resp.status_code == 404


async def test_search_patients(client, auth_headers):
    await client.post("/api/patients", json={"name": "Rahul Sharma"}, headers=auth_headers)
    await client.post("/api/patients", json={"name": "Rahul Kumar"}, headers=auth_headers)
    await client.post("/api/patients", json={"name": "Priya Patel"}, headers=auth_headers)

    resp = await client.post("/api/patients/search", json={"name": "Rahul"}, headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_get_patient_sessions(client, auth_headers):
    create_resp = await client.post("/api/patients", json={"name": "Rahul"}, headers=auth_headers)
    patient_id = create_resp.json()["id"]

    resp = await client.get(f"/api/patients/{patient_id}/sessions", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
