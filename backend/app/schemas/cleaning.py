from typing import Optional

from pydantic import BaseModel, Field


class CleaningOperationPlan(BaseModel):
    operation: str = Field(
        description=(
            "Cleaning operation: fill_missing, remove_duplicates, "
            "normalize_categories, convert_type, remove_invalid_dates, "
            "or handle_outliers"
        )
    )
    column: Optional[str] = None
    strategy: Optional[str] = None
    reason: str


class CleaningPlan(BaseModel):
    operations: list[CleaningOperationPlan]
    
class CleaningPlanResponse(BaseModel):
    id: int
    dataset_id: int
    status: str
    plan: CleaningPlan

    model_config = {
        "from_attributes": True
    }
    

class CleaningApprovalRequest(BaseModel):
    approved: bool