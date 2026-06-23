import math
from app.models.prediction import DEFAULT_BRANCH_DISTRIBUTIONS, BranchDistribution
from app.schemas.prediction import RankPredictionInput, RankPredictionOutput

class RankPredictionService:
    @staticmethod
    def predict_rank(data: RankPredictionInput) -> RankPredictionOutput:
        # Standardize branch input
        branch_key = data.branch.upper()
        if branch_key not in DEFAULT_BRANCH_DISTRIBUTIONS:
            branch_key = "CS" # Fallback

        dist: BranchDistribution = DEFAULT_BRANCH_DISTRIBUTIONS[branch_key]
        
        # Adjust score slightly based on attempts/study hours for micro-simulation
        adjusted_score = data.score
        if data.study_hours_per_week and data.study_hours_per_week > 20:
            adjusted_score = min(100.0, adjusted_score + 1.5)
        
        # Calculate Z-score
        z_score = (adjusted_score - dist.mean_score) / dist.std_dev
        
        # Calculate percentile using Error Function (CDF of standard normal distribution)
        # erf(z / sqrt(2)) represents probability within range
        percentile = 0.5 * (1 + math.erf(z_score / math.sqrt(2))) * 100.0
        percentile = max(0.1, min(99.99, percentile)) # bounds
        
        # Estimate Rank (Rank = Total Candidates * (1 - Percentile / 100))
        estimated_rank_base = dist.total_candidates * (1.0 - (percentile / 100.0))
        estimated_rank_base = max(1.0, estimated_rank_base)
        
        # Category adjustments (shifting rank bounds based on historical reservation ranges)
        multiplier = 1.0
        cat = data.category.upper()
        if "OBC" in cat:
            multiplier = 0.85
        elif "SC" in cat:
            multiplier = 0.60
        elif "ST" in cat:
            multiplier = 0.50
        elif "EWS" in cat:
            multiplier = 0.90
            
        rank_mid = int(estimated_rank_base * multiplier)
        rank_mid = max(1, rank_mid)
        
        # Create a range around the mid-point for variance representation
        range_var = max(5, int(rank_mid * 0.15)) # 15% variance
        rank_min = max(1, rank_mid - range_var)
        rank_max = min(dist.total_candidates, rank_mid + range_var)
        
        # Confidence Score
        confidence = 0.85
        if data.score > 85:
            confidence = 0.95
        elif data.score < 25:
            confidence = 0.70
            
        # Message construction
        if rank_mid <= 500:
            msg = f"Exceptional! Your performance puts you in the top tier of {branch_key} candidates. Keep solving premium quality numericals!"
        elif rank_mid <= 2000:
            msg = f"Strong score. You have high potential to secure a top IIT or premium PSU. Focus on weak topics to break into the Top 500."
        elif rank_mid <= 5000:
            msg = f"Decent standing. You qualify for many top-tier NITs and newer IITs. Reinforce core concepts to improve further."
        else:
            msg = f"Keep pushing! Target high-yield GATE concepts and practice full-length mocks to boost your speed and accuracy."

        return RankPredictionOutput(
            estimated_rank_min=rank_min,
            estimated_rank_max=rank_max,
            percentile=round(percentile, 2),
            confidence_score=confidence,
            message=msg
        )
