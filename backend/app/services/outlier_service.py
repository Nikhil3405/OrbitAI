from pathlib import Path
from typing import Any

import duckdb


class OutlierService:
    def detect(
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

            quoted = self._quote_identifier(column)

            bounds = connection.execute(
                f"""
                SELECT
                    quantile_cont(
                        {quoted},
                        0.25
                    ),
                    quantile_cont(
                        {quoted},
                        0.75
                    )
                FROM dataset
                WHERE {quoted} IS NOT NULL
                """
            ).fetchone()

            q1, q3 = bounds

            if q1 is None or q3 is None:
                return {
                    "column": column,
                    "outliers": 0,
                }

            iqr = q3 - q1

            if iqr == 0:
                return {
                    "column": column,
                    "method": "IQR",
                    "q1": q1,
                    "q3": q3,
                    "lower_bound": q1,
                    "upper_bound": q3,
                    "outlier_count": 0,
                }

            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr

            count = connection.execute(
                f"""
                SELECT COUNT(*)
                FROM dataset
                WHERE {quoted} < ?
                OR {quoted} > ?
                """,
                [lower, upper],
            ).fetchone()[0]

            return {
                "column": column,
                "method": "IQR",
                "q1": q1,
                "q3": q3,
                "lower_bound": lower,
                "upper_bound": upper,
                "outlier_count": count,
            }

        finally:
            connection.close()
            
    @staticmethod
    def _quote_identifier(
        identifier: str,
    ) -> str:
        escaped = identifier.replace(
            '"',
            '""',
        )

        return f'"{escaped}"'
    
    @staticmethod
    def _register_dataset(
        connection,
        path: Path,
    ) -> None:

        escaped_path = str(
            path.resolve()
        ).replace("'", "''")

        if path.suffix.lower() == ".csv":
            source = f"""
                read_csv_auto(
                    '{escaped_path}',
                    HEADER = TRUE
                )
            """

        elif path.suffix.lower() == ".parquet":
            source = f"""
                read_parquet(
                    '{escaped_path}'
                )
            """

        else:
            raise ValueError(
                f"Unsupported dataset format: {path.suffix}"
            )

        connection.execute(
            f"""
            CREATE OR REPLACE VIEW dataset AS
            SELECT *
            FROM {source}
            """
        )