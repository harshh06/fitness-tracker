import httpx
import logging
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.config import settings
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice")

class VoiceParseRequest(BaseModel):
    transcript: str

class ParsedSet(BaseModel):
    weight: Optional[float] = None
    unit: Optional[str] = None
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None

class ParsedExercise(BaseModel):
    exercise_name: str
    category: str
    sets: List[ParsedSet]

@router.post("/parse", response_model=List[ParsedExercise])
async def parse_voice_command(
    data: VoiceParseRequest,
    user_id: str = Depends(get_current_user)
):
    """Parse a voice command transcript into structured exercises using Gemini 2.5 Flash."""
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the backend"
        )

    # Enforce structured output via Gemini Response Schema
    schema = {
        "type": "ARRAY",
        "description": "List of parsed exercises from the voice command.",
        "items": {
            "type": "OBJECT",
            "properties": {
                "exercise_name": {
                    "type": "STRING",
                    "description": "Name of the exercise, e.g. 'Bench Press', 'Bicep Curl', 'Treadmill'"
                },
                "category": {
                    "type": "STRING",
                    "enum": ["strength", "cardio", "flexibility", "rehab"],
                    "description": "The category of the exercise."
                },
                "sets": {
                    "type": "ARRAY",
                    "description": "All sets spoken for this exercise.",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "weight": {
                                "type": "NUMBER",
                                "description": "The weight value. Null if not specified or for cardio exercises."
                            },
                            "unit": {
                                "type": "STRING",
                                "enum": ["kg", "lbs"],
                                "description": "The unit of weight. Null if not specified."
                            },
                            "reps": {
                                "type": "INTEGER",
                                "description": "The number of repetitions. Null for cardio exercises."
                            },
                            "duration_seconds": {
                                "type": "INTEGER",
                                "description": "The duration of the set in seconds. Null for strength exercises."
                            }
                        }
                    }
                }
            },
            "required": ["exercise_name", "category", "sets"]
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    
    prompt = (
        "You are an expert fitness logging assistant. Parse the following transcription "
        "of a user speaking about their workout. Extract all exercises, sets, weights, reps, "
        "units, and durations accurately. "
        "For each exercise, normalize the name to a standard singular form (e.g. use 'Squat' "
        "instead of 'squats', 'Bicep Curl' instead of 'bicep curls', 'Treadmill Running' "
        "instead of 'running on treadmill').\n"
        f"Transcription: \"{data.transcript}\""
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            result = resp.json()
            
            # Extract text containing JSON from Gemini response
            candidates = result.get("candidates", [])
            if not candidates:
                raise HTTPException(status_code=500, detail="Gemini API returned no candidates")
                
            text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not text_content:
                raise HTTPException(status_code=500, detail="Gemini API returned empty text content")
                
            parsed_data = json.loads(text_content)
            return parsed_data
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Gemini API error (HTTP {e.response.status_code}): {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to communicate with AI parsing service")
    except httpx.RequestError as e:
        logger.error(f"Network error communicating with Gemini API: {e}")
        raise HTTPException(status_code=502, detail="AI parsing service is unreachable")
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error(f"Failed to parse Gemini response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse structured AI response")
