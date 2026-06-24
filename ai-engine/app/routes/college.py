from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.college_advisor import CollegeAdvisorService

router = APIRouter()

class CollegeAdvisorInput(BaseModel):
    score: float = Field(..., ge=0, description="GATE User test score")
    branch: str = Field(..., description="GATE Branch (e.g. CS, ME, EE, CE, EC)")
    query: str = Field(..., description="User query message")

class CollegeAdvisorOutput(BaseModel):
    recommendation: str = Field(..., description="AI Markdown response for college advisor recommendations")

@router.post("/college/recommend", response_model=CollegeAdvisorOutput)
async def get_college_recommendations(payload: CollegeAdvisorInput):
    try:
        recommendation_text = CollegeAdvisorService.get_recommendations(
            score=payload.score,
            branch=payload.branch,
            query=payload.query
        )
        return CollegeAdvisorOutput(recommendation=recommendation_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"College advisor failed: {str(e)}")
