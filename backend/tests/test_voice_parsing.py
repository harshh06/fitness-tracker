import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_header():
    # Use a dummy UUID to satisfy mock authentication
    return {"Authorization": "Bearer 182fc7b6-4dc2-4a34-b8e3-8e7db0def4e1"}

def test_parse_voice_command_missing_api_key(client, auth_header):
    # Temporarily remove API key if present
    with patch.object(settings, "gemini_api_key", None):
        res = client.post(
            "/voice/parse",
            json={"transcript": "bench press 3 sets of 10 reps"},
            headers=auth_header
        )
        assert res.status_code == 500
        assert "GEMINI_API_KEY is not configured" in res.json()["detail"]

@patch("httpx.AsyncClient.post")
def test_parse_voice_command_success(mock_post, client, auth_header):
    from unittest.mock import MagicMock
    # Ensure API key is mock-configured
    with patch.object(settings, "gemini_api_key", "mock_key"):
        # Setup mock HTTP response for Gemini
        mock_response = MagicMock()
        mock_response.status_code = 200
        
        # This JSON structure mimics the one returned by Gemini under structured output
        mock_response.json = MagicMock(return_value={
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": '[{"exercise_name": "Bench Press", "category": "strength", "sets": [{"weight": 40, "unit": "kg", "reps": 4, "duration_seconds": null}]}]'
                            }
                        ]
                    }
                }
            ]
        })
        mock_post.return_value = mock_response

        res = client.post(
            "/voice/parse",
            json={"transcript": "bench press 40 kg 4 reps"},
            headers=auth_header
        )
        
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["exercise_name"] == "Bench Press"
        assert data[0]["category"] == "strength"
        assert len(data[0]["sets"]) == 1
        assert data[0]["sets"][0]["weight"] == 40
        assert data[0]["sets"][0]["unit"] == "kg"
        assert data[0]["sets"][0]["reps"] == 4
        assert data[0]["sets"][0]["duration_seconds"] is None
