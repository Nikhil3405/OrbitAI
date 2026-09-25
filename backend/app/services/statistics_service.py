from pathlib import Path
from typing import Any

import duckdb


class StatisticsService:
    def calculate(
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

            quoted = self._quote_identifier(column)

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
                    COUNT({quoted}),
                    MIN({quoted}),
                    MAX({quoted}),
                    AVG({quoted}),
                    MEDIAN({quoted})
                FROM dataset
                """
            ).fetchone()

            return {
                "column": column,
                "count": result[0],
                "min": result[1],
                "max": result[2],
                "mean": result[3],
                "median": result[4],
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