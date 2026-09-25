from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DatasetResponse(BaseModel):
    id: int
    name: str
    file_size: int
    row_count: Optional[int]
    column_count: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }