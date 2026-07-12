import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.services.auth import hash_password

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
async def sample_doctor():
    async with async_session_factory() as db:
        doctor = Doctor(
            name="Dr. Test",
            email="test@example.com",
            hashed_password=hash_password("password123"),
        )
        db.add(doctor)
        await db.commit()
        await db.refresh(doctor)
        return doctor


async def test_register_success(client):
    response = await client.post("/api/auth/register", json={
        "name": "Dr. New",
        "email": "new@example.com",
        "password": "secret123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["name"] == "Dr. New"
    assert "id" in data


async def test_register_duplicate_email(client, sample_doctor):
    response = await client.post("/api/auth/register", json={
        "name": "Dr. Duplicate",
        "email": "test@example.com",
        "password": "secret123",
    })
    assert response.status_code == 409


async def test_login_success(client, sample_doctor):
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client, sample_doctor):
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


async def test_login_nonexistent_user(client):
    response = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password",
    })
    assert response.status_code == 401


async def test_me_with_valid_token(client, sample_doctor):
    login_resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = login_resp.json()["access_token"]

    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


async def test_me_without_token(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 403  # HTTPBearer returns 403 when no credentials


async def test_me_with_invalid_token(client):
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
    assert response.status_code == 401


async def test_refresh_success(client, sample_doctor):
    login_resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


async def test_refresh_with_access_token_fails(client, sample_doctor):
    login_resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    access_token = login_resp.json()["access_token"]

    response = await client.post("/api/auth/refresh", json={
        "refresh_token": access_token,
    })
    assert response.status_code == 401
