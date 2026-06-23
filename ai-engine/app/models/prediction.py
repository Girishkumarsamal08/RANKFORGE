from pydantic import BaseModel
from typing import Dict

class BranchDistribution(BaseModel):
    mean_score: float
    std_dev: float
    total_candidates: int

# Mock statistical values representing GATE score distributions for rank estimation
# These values are based on historical GATE trends (e.g. CS vs ME marks distributions)
DEFAULT_BRANCH_DISTRIBUTIONS: Dict[str, BranchDistribution] = {
    "CS": BranchDistribution(mean_score=28.5, std_dev=12.2, total_candidates=100000),
    "ME": BranchDistribution(mean_score=33.2, std_dev=14.5, total_candidates=120000),
    "EE": BranchDistribution(mean_score=30.1, std_dev=13.0, total_candidates=95000),
    "CE": BranchDistribution(mean_score=31.4, std_dev=13.8, total_candidates=110000),
    "EC": BranchDistribution(mean_score=26.8, std_dev=11.5, total_candidates=85000)
}
