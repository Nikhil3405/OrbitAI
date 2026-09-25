from typing import Any

from app.schemas.chart import ChartSpec


class ChartService:
    ALLOWED_TYPES = {
        "bar",
        "line",
        "pie",
        "area",
    }

    def create_chart(
        self,
        chart_type: str,
        title: str,
        x_axis: str,
        y_axis: str,
        data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if chart_type not in self.ALLOWED_TYPES:
            raise ValueError(
                f"Unsupported chart type: {chart_type}"
            )

        if not data:
            raise ValueError(
                "Cannot create a chart from empty data."
            )

        chart = ChartSpec(
            type=chart_type,
            title=title,
            x_axis=x_axis,
            y_axis=y_axis,
            data=data,
        )

        return chart.model_dump()