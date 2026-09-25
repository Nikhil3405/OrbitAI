from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    question: str = Field(min_length=1)


class ToolCall(BaseModel):
    tool: str
    arguments: dict[str, Any] = {}


class ToolResult(BaseModel):
    tool: str
    success: bool
    data: Any
    error: Optional[str] = None


class AnalysisResponse(BaseModel):
    session_id: int
    answer: str
    evidence: list[dict[str, Any]] = []
    actions: list[dict[str, Any]] = []
    charts: list[dict[str, Any]] = []