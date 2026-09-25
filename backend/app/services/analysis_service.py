from pathlib import Path
from typing import Any

from app.core.constants import MAX_RESULT_ROWS
from app.services.dataset_reader import DatasetReader

import duckdb


class AnalysisService:
    def execute_sql(
        self,
        file_path: str,
        sql: str,
    ) -> dict[str, Any]:
        self._validate_sql(sql)

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                "Dataset file not found."
            )

        connection = duckdb.connect()

        try:
            self._register_dataset(
                connection,
                path,
            )

            limited_sql = f"""
            SELECT *
            FROM (
                {sql.rstrip(";")}
            )
            LIMIT {MAX_RESULT_ROWS}
            """

            result = connection.execute(limited_sql)

            columns = [
                description[0]
                for description in result.description
            ]

            rows = result.fetchall()

            return {
                "columns": columns,
                "rows": [
                    list(row)
                    for row in rows
                ],
                "row_count": len(rows),
                "truncated": len(rows) >= MAX_RESULT_ROWS,
            }

        finally:
            connection.close()

    def profile_dataset(
        self,
        file_path: str,
    ) -> dict[str, Any]:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                "Dataset file not found."
            )

        connection = duckdb.connect()

        try:
            self._register_dataset(
                connection,
                path,
            )

            result = connection.execute(
                """
                SELECT
                    COUNT(*) AS row_count,
                    COUNT(*) OVER () AS total_rows
                FROM dataset
                LIMIT 1
                """
            ).fetchone()

            columns = connection.execute(
                "DESCRIBE dataset"
            ).fetchall()

            return {
                "row_count": result[0] if result else 0,
                "columns": [
                    {
                        "name": row[0],
                        "type": row[1],
                    }
                    for row in columns
                ],
            }

        finally:
            connection.close()

    def inspect_column(
        self,
        file_path: str,
        column: str,
    ) -> dict[str, Any]:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                "Dataset file not found."
            )

        connection = duckdb.connect()

        try:
            self._register_dataset(
                connection,
                path,
            )

            quoted_column = self._quote_identifier(
                column
            )

            columns = connection.execute(
                "DESCRIBE dataset"
            ).fetchall()

            valid_columns = {
                row[0]
                for row in columns
            }

            if column not in valid_columns:
                raise ValueError(
                    f"Column '{column}' does not exist."
                )

            result = connection.execute(
                f"""
                SELECT
                    COUNT(*) AS total,
                    COUNT({quoted_column}) AS non_null,
                    COUNT(DISTINCT {quoted_column})
                        AS unique_values
                FROM dataset
                """
            ).fetchone()

            samples = connection.execute(
                f"""
                SELECT {quoted_column}
                FROM dataset
                WHERE {quoted_column} IS NOT NULL
                LIMIT 10
                """
            ).fetchall()

            return {
                "column": column,
                "total_rows": result[0],
                "non_null": result[1],
                "unique_values": result[2],
                "sample_values": [
                    row[0]
                    for row in samples
                ],
            }

        finally:
            connection.close()

    @staticmethod
    def _register_dataset(
        connection,
        path: Path,
    ) -> None:
        escaped_path = str(
            path.resolve()
        ).replace("'", "''")

        extension = path.suffix.lower()

        if extension == ".csv":
            source = f"""
                read_csv_auto(
                    '{escaped_path}',
                    HEADER = TRUE
                )
            """

            connection.execute(
                f"""
                CREATE OR REPLACE VIEW dataset AS
                SELECT *
                FROM {source}
                """
            )

            connection.execute(
                f"""
                CREATE OR REPLACE VIEW data AS
                SELECT *
                FROM {source}
                """
            )

        elif extension == ".parquet":
            source = f"""
                read_parquet(
                    '{escaped_path}'
                )
            """

            connection.execute(
                f"""
                CREATE OR REPLACE VIEW dataset AS
                SELECT *
                FROM {source}
                """
            )

            connection.execute(
                f"""
                CREATE OR REPLACE VIEW data AS
                SELECT *
                FROM {source}
                """
            )

        elif extension in {".xlsx", ".xls"}:
            dataframe = DatasetReader.read(path)

            connection.register(
                "excel_dataset",
                dataframe,
            )

            connection.execute(
                """
                CREATE OR REPLACE VIEW dataset AS
                SELECT *
                FROM excel_dataset
                """
            )

            connection.execute(
                """
                CREATE OR REPLACE VIEW data AS
                SELECT *
                FROM excel_dataset
                """
            )

            connection.unregister("excel_dataset")

        else:
            raise ValueError(
                f"Unsupported dataset format: {path.suffix}"
            )

    @staticmethod
    def _validate_sql(sql: str) -> None:
        sql = sql.strip()

        if not sql:
            raise ValueError("SQL query cannot be empty.")

        normalized = sql.lower()

        # Only one SQL statement is allowed.
        if ";" in sql.rstrip(";"):
            raise ValueError(
                "Only one SQL statement is allowed."
            )

        # Only read-only queries are allowed.
        if not (
            normalized.startswith("select ")
            or normalized.startswith("select\n")
            or normalized.startswith("with ")
            or normalized.startswith("with\n")
        ):
            raise ValueError(
                "Only read-only SELECT queries are allowed."
            )

        forbidden_keywords = [
            "insert",
            "update",
            "delete",
            "drop",
            "alter",
            "create",
            "replace",
            "truncate",
            "merge",
            "copy",
            "attach",
            "install",
            "load",
        ]

        tokens = (
            normalized
            .replace("(", " ")
            .replace(")", " ")
            .replace(",", " ")
            .split()
        )

        for keyword in forbidden_keywords:
            if keyword in tokens:
                raise ValueError(
                    f"Forbidden SQL operation: {keyword}"
                )