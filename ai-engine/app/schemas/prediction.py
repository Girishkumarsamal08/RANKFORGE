from pydantic import BaseModel, Field
from typing import List, Optional

# --- Rank Prediction Schemas ---

class RankPredictionInput(BaseModel):
    score: float = Field(..., ge=0, le=100, description="GATE Out of 100 normalized/extrapolated score")
    branch: str = Field(..., description="GATE Branch (e.g. CS, ME, EE, CE, EC)")
    category: str = Field("General", description="User reservation category (General, OBC-NCL, SC, ST, EWS)")
    attempts_count: Optional[int] = Field(1, ge=1)
    study_hours_per_week: Optional[float] = Field(None, ge=0)

class RankPredictionOutput(BaseModel):
    estimated_rank_min: int = Field(..., description="Lower bound of estimated AIR")
    estimated_rank_max: int = Field(..., description="Upper bound of estimated AIR")
    percentile: float = Field(..., description="Estimated percentile")
    confidence_score: float = Field(..., description="Confidence rating of the estimate (0.0 to 1.0)")
    message: str = Field(..., description="Descriptive feedback message")


# --- Weak Topics Schemas ---

class UserAnswerInput(BaseModel):
    subject: str = Field(..., description="Main subject name")
    topic: str = Field(..., description="Sub-topic name")
    is_correct: bool = Field(..., description="Whether the answer was correct")
    time_spent_seconds: int = Field(..., ge=0, description="Time spent on the question in seconds")

class WeakTopicsInput(BaseModel):
    branch: str = Field(..., description="GATE Branch")
    answers: List[UserAnswerInput] = Field(..., description="History of answers submitted by the user")

class TopicAnalysis(BaseModel):
    subject: str
    topic: str
    accuracy: float = Field(..., description="Accuracy rate (0.0 to 1.0)")
    average_time_seconds: float = Field(..., description="Average time spent in seconds")
    recommendation_priority: str = Field(..., description="Priority (HIGH, MEDIUM, LOW)")

class WeakTopicsOutput(BaseModel):
    weak_topics: List[TopicAnalysis] = Field(..., description="List of analyzed topics needing attention")
    recommendations: List[str] = Field(..., description="Actionable AI learning recommendations")
