from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-engine",
        "message": "FastAPI rank prediction and weak topics prediction service is running."
    }
