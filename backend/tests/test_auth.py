import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

# Create a client fixture that uses the context manager
# This is required so FastAPI runs the lifespan event (connecting to the database)
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_signup_success(client):
    # Use a random email to avoid conflicts with existing database records
    random_email = f"test_{uuid.uuid4()}@example.com"
    payload = {"email": random_email, "password": "strongpassword123"}
    
    response = client.post("/auth/signup", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_signup_duplicate_email(client):
    random_email = f"test_{uuid.uuid4()}@example.com"
    payload = {"email": random_email, "password": "strongpassword123"}
    
    # First signup should succeed
    res1 = client.post("/auth/signup", json=payload)
    assert res1.status_code == 200

    # Second signup with same email should fail
    res2 = client.post("/auth/signup", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

def test_signup_validation_errors(client):
    # Invalid email and a password that is too short (< 8 chars)
    payload = {"email": "not-an-email", "password": "short"}
    
    response = client.post("/auth/signup", json=payload)
    # Should be caught by Pydantic Validation before hitting the DB
    assert response.status_code == 422

def test_login_success(client):
    random_email = f"test_{uuid.uuid4()}@example.com"
    payload = {"email": random_email, "password": "strongpassword123"}
    
    # Create the user first
    client.post("/auth/signup", json=payload)

    # Login with the exact same credentials
    response = client.post("/auth/login", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_login_invalid_password(client):
    random_email = f"test_{uuid.uuid4()}@example.com"
    payload = {"email": random_email, "password": "strongpassword123"}
    client.post("/auth/signup", json=payload)

    # Try to login with the wrong password
    bad_payload = {"email": random_email, "password": "wrongpassword123"}
    response = client.post("/auth/login", json=bad_payload)
    
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_nonexistent_user(client):
    random_email = f"fake_user_{uuid.uuid4()}@example.com"
    payload = {"email": random_email, "password": "strongpassword123"}
    
    # User does not exist, should fail identically to wrong password
    response = client.post("/auth/login", json=payload)
    
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_refresh_token_success(client):
    random_email = f"test_{uuid.uuid4()}@example.com"
    payload = {"email": random_email, "password": "strongpassword123"}
    
    signup_res = client.post("/auth/signup", json=payload)
    refresh_token = signup_res.json()["refresh_token"]

    # Use refresh token to get a new access token
    response = client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_refresh_invalid_token(client):
    response = client.post(
        "/auth/refresh",
        json={"refresh_token": "an_invalid_fake_token"}
    )
    
    # Python-jose will fail to decode this
    assert response.status_code == 401
