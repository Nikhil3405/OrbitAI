from typing import Any, Literal

from pydantic import BaseModel, Field


class ChartSpec(BaseModel):
    type: Literal[
        "bar",
        "line",
        "pie",
        "area",
    ]

    title: str
    x_axis: str
    y_axis: str
    data: list[dict[str, Any]] = Field(default_factory=list)