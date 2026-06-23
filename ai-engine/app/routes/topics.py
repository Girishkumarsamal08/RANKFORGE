from fastapi import APIRouter, HTTPException
from app.schemas.prediction import WeakTopicsInput, WeakTopicsOutput
from app.services.weak_topics import WeakTopicsService

router = APIRouter()

@router.post("/weak-topics", response_model=WeakTopicsOutput)
async def analyze_weak_topics_endpoint(payload: WeakTopicsInput):
    try:
        result = WeakTopicsService.analyze_weak_topics(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weak topics analysis failure: {str(e)}")
