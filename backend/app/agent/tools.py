from typing import Any, Callable

from app.services.analysis_service import AnalysisService
from app.services.outlier_service import OutlierService
from app.services.statistics_service import StatisticsService
from app.services.chart_service import ChartService

class ToolRegistry:
    def __init__(self):
        self.analysis_service = AnalysisService()
        self.statistics_service = StatisticsService()
        self.outlier_service = OutlierService()
        self.chart_service = ChartService()

        self.tools = {
            "profile_dataset": self.profile_dataset,
            "inspect_column": self.inspect_column,
            "execute_sql": self.execute_sql,
            "calculate_statistics": self.calculate_statistics,
            "detect_outliers": self.detect_outliers,
            "create_chart": self.create_chart,
        }

    def execute(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        file_path: str,
    ) -> dict[str, Any]:
        tool = self.tools.get(tool_name)

        if not tool:
            raise ValueError(
                f"Unknown analysis tool: {tool_name}"
            )

        return tool(
            file_path=file_path,
            **arguments,
        )

    def profile_dataset(
        self,
        file_path: str,
    ):
        return self.analysis_service.profile_dataset(
            file_path
        )

    def inspect_column(
        self,
        file_path: str,
        column: str,
    ):
        return self.analysis_service.inspect_column(
            file_path,
            column,
        )

    def execute_sql(
        self,
        file_path: str,
        sql: str,
    ):
        return self.analysis_service.execute_sql(
            file_path,
            sql,
        )

    def calculate_statistics(
        self,
        file_path: str,
        column: str,
    ):
        return self.statistics_service.calculate(
            file_path,
            column,
        )

    def detect_outliers(
        self,
        file_path: str,
        column: str,
    ):
        return self.outlier_service.detect(
            file_path,
            column,
        )
        
    def create_chart(
        self,
        file_path: str,
        chart_type: str,
        title: str,
        x_axis: str,
        y_axis: str,
        data: list[dict[str, Any]],
    ):
        return self.chart_service.create_chart(
            chart_type=chart_type,
            title=title,
            x_axis=x_axis,
            y_axis=y_axis,
            data=data,
        )