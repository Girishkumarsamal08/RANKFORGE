from fastapi import APIRouter, HTTPException
from app.schemas.prediction import RankPredictionInput, RankPredictionOutput
from app.services.rank_prediction import RankPredictionService

router = APIRouter()

@router.post("/rank/predict", response_model=RankPredictionOutput)
async def predict_rank_endpoint(payload: RankPredictionInput):
    try:
        result = RankPredictionService.predict_rank(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rank prediction failure: {str(e)}")
