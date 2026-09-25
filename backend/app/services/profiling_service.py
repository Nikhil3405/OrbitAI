from datetime import datetime
from pathlib import Path

import duckdb

from app.services.dataset_reader import DatasetReader

class ProfilingService:

    def profile_dataset(self, file_path: str) -> dict:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError("Dataset file not found.")

        connection = duckdb.connect()

        try:
            table = self._create_table(connection, path)

            rows = self._get_row_count(connection, table)
            columns = self._get_column_info(connection, table)

            profile = {
                "rows": rows,
                "column_count": len(columns),
                "columns": [],
                "duplicates": self._get_duplicate_count(
                    connection,
                    table,
                ),
                "quality_issues": [],
            }

            for column in columns:
                column_name = column["name"]
                column_type = column["type"]

                column_profile = {
                    "name": column_name,
                    "type": column_type,
                    "missing": self._get_missing_info(
                        connection,
                        table,
                        column_name,
                        rows,
                    ),
                    "unique_count": self._get_unique_count(
                        connection,
                        table,
                        column_name,
                    ),
                }

                if self._is_numeric_type(column_type):
                    column_profile["statistics"] = (
                        self._get_numeric_statistics(
                            connection,
                            table,
                            column_name,
                        )
                    )

                profile["columns"].append(column_profile)

            profile["quality_issues"] = self._detect_quality_issues(
                connection,
                table,
                profile,
            )

            return profile

        finally:
            connection.close()

    def _create_table(self, connection, path: str) -> str:
        path = Path(path)

        table_name = "dataset"
        extension = path.suffix.lower()

        if extension in {".csv", ".xlsx"}:
            dataframe = DatasetReader.read(path)

            connection.register("source_dataset", dataframe)

            connection.execute(
                f"""
                CREATE OR REPLACE TABLE {table_name} AS
                SELECT * FROM source_dataset
                """
            )

            connection.unregister("source_dataset")

        elif extension == ".parquet":
            escaped_path = str(path).replace("'", "''")

            connection.execute(
                f"""
                CREATE OR REPLACE TABLE {table_name} AS
                SELECT * FROM read_parquet('{escaped_path}')
                """
            )

        else:
            raise ValueError(
                f"Unsupported dataset format: {extension}"
            )

        return table_name

    def _get_row_count(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
    ) -> int:
        result = connection.execute(
            f"SELECT COUNT(*) FROM {table}"
        ).fetchone()

        return result[0]

    def _get_column_info(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
    ) -> list[dict]:
        rows = connection.execute(
            f"DESCRIBE {table}"
        ).fetchall()

        return [
            {
                "name": row[0],
                "type": row[1],
            }
            for row in rows
        ]

    def _get_missing_info(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
        column: str,
        row_count: int,
    ) -> dict:
        quoted_column = self._quote_identifier(column)

        result = connection.execute(
            f"""
            SELECT COUNT(*)
            FROM {table}
            WHERE {quoted_column} IS NULL
               OR TRIM(CAST({quoted_column} AS VARCHAR)) = ''
            """
        ).fetchone()

        missing_count = result[0]

        percentage = (
            (missing_count / row_count) * 100
            if row_count > 0
            else 0
        )

        return {
            "count": missing_count,
            "percentage": round(percentage, 2),
        }

    def _get_unique_count(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
        column: str,
    ) -> int:
        quoted_column = self._quote_identifier(column)

        result = connection.execute(
            f"""
            SELECT COUNT(DISTINCT {quoted_column})
            FROM {table}
            """
        ).fetchone()

        return result[0]

    # def _get_duplicate_count(self, connection, table: str) -> int:
    #     result = connection.execute(
    #         f"""
    #         SELECT COUNT(*) - COUNT(DISTINCT row_hash)
    #         FROM (
    #             SELECT hash(
    #                 *COLUMNS(*)
    #             ) AS row_hash
    #             FROM {table}
    #         )
    #         """
    #     ).fetchone()

    #     return int(result[0] or 0)
    
    def _get_duplicate_count(
        self,
        connection,
        table: str,
    ) -> int:
        total_rows = connection.execute(
            f"SELECT COUNT(*) FROM {table}"
        ).fetchone()[0]

        unique_rows = connection.execute(
            f"""
            SELECT COUNT(*)
            FROM (
                SELECT *
                FROM {table}
                GROUP BY ALL
            )
            """
        ).fetchone()[0]

        return int(total_rows - unique_rows)

    def _get_numeric_statistics(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
        column: str,
    ) -> dict:
        quoted_column = self._quote_identifier(column)

        result = connection.execute(
            f"""
            SELECT
                MIN({quoted_column}),
                MAX({quoted_column}),
                AVG({quoted_column}),
                MEDIAN({quoted_column})
            FROM {table}
            WHERE {quoted_column} IS NOT NULL
            """
        ).fetchone()

        return {
            "min": self._clean_number(result[0]),
            "max": self._clean_number(result[1]),
            "mean": self._clean_number(result[2]),
            "median": self._clean_number(result[3]),
        }

    def _detect_quality_issues(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
        profile: dict,
    ) -> list[dict]:
        issues = []

        for column in profile["columns"]:
            column_name = column["name"]
            column_type = column["type"]

            missing = column["missing"]

            if missing["count"] > 0:
                issues.append(
                    {
                        "type": "missing_values",
                        "column": column_name,
                        "count": missing["count"],
                        "percentage": missing["percentage"],
                        "severity": self._missing_severity(
                            missing["percentage"]
                        ),
                    }
                )

            if self._is_string_type(column_type):
                category_issue = self._detect_category_inconsistency(
                    connection,
                    table,
                    column_name,
                )

                if category_issue:
                    issues.append(category_issue)

            if self._is_numeric_type(column_type):
                outlier_issue = self._detect_outliers(
                    connection,
                    table,
                    column_name,
                )

                if outlier_issue:
                    issues.append(outlier_issue)

            if self._looks_like_date_column(column_name):
                date_issue = self._detect_invalid_dates(
                    connection,
                    table,
                    column_name,
                )

                if date_issue:
                    issues.append(date_issue)

        if profile["duplicates"] > 0:
            issues.append(
                {
                    "type": "duplicate_rows",
                    "column": None,
                    "count": profile["duplicates"],
                    "severity": "medium",
                }
            )

        issues.extend(
            self._detect_duplicate_ids(
                connection,
                table,
            )
        )

        return issues

    def _detect_category_inconsistency(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
        column: str,
    ) -> dict | None:
        quoted_column = self._quote_identifier(column)

        result = connection.execute(
            f"""
            SELECT
                LOWER(TRIM(CAST({quoted_column} AS VARCHAR))) AS normalized,
                COUNT(DISTINCT CAST({quoted_column} AS VARCHAR)) AS variants
            FROM {table}
            WHERE {quoted_column} IS NOT NULL
            GROUP BY normalized
            HAVING COUNT(DISTINCT CAST({quoted_column} AS VARCHAR)) > 1
            LIMIT 10
            """
        ).fetchall()

        if not result:
            return None

        variants = []

        for normalized_value, _ in result:
            values = connection.execute(
                f"""
                SELECT DISTINCT CAST({quoted_column} AS VARCHAR)
                FROM {table}
                WHERE LOWER(TRIM(CAST({quoted_column} AS VARCHAR))) = ?
                """,
                [normalized_value],
            ).fetchall()

            variants.append(
                {
                    "normalized": normalized_value,
                    "values": [row[0] for row in values],
                }
            )

        return {
            "type": "categorical_inconsistency",
            "column": column,
            "examples": variants,
            "severity": "low",
        }

    def _detect_outliers(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
        column: str,
    ) -> dict | None:
        quoted_column = self._quote_identifier(column)

        result = connection.execute(
            f"""
            SELECT
                quantile_cont({quoted_column}, 0.25),
                quantile_cont({quoted_column}, 0.75)
            FROM {table}
            WHERE {quoted_column} IS NOT NULL
            """
        ).fetchone()

        q1, q3 = result

        if q1 is None or q3 is None:
            return None

        iqr = q3 - q1

        if iqr == 0:
            return None

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        result = connection.execute(
            f"""
            SELECT COUNT(*)
            FROM {table}
            WHERE {quoted_column} < ?
               OR {quoted_column} > ?
            """,
            [lower_bound, upper_bound],
        ).fetchone()

        outlier_count = result[0]

        if outlier_count == 0:
            return None

        return {
            "type": "potential_outliers",
            "column": column,
            "count": outlier_count,
            "method": "IQR",
            "lower_bound": self._clean_number(lower_bound),
            "upper_bound": self._clean_number(upper_bound),
            "severity": "medium",
        }

    def _detect_invalid_dates(
        self,
        connection,
        table: str,
        column: str,
    ) -> dict | None:

        quoted_column = self._quote_identifier(column)

        # Get non-empty values from the column.
        values = connection.execute(
            f"""
            SELECT DISTINCT CAST({quoted_column} AS VARCHAR)
            FROM {table}
            WHERE {quoted_column} IS NOT NULL
            AND TRIM(CAST({quoted_column} AS VARCHAR)) != ''
            """
        ).fetchall()

        date_values = [
            str(row[0]).strip()
            for row in values
            if row[0] is not None
        ]

        if not date_values:
            return None

        # Determine which date formats are actually used
        # by this dataset.
        detected_formats = self._infer_date_formats(
            date_values
        )

        # If no supported date format can be detected,
        # report the column as invalid rather than assuming
        # every value is valid.
        if not detected_formats:
            return {
                "type": "invalid_dates",
                "column": column,
                "count": len(date_values),
                "severity": "medium",
                "detected_formats": [],
            }

        invalid_values = []

        for value in date_values:

            if not self._is_valid_date(
                value,
                detected_formats,
            ):
                invalid_values.append(value)

        invalid_count = len(invalid_values)

        if invalid_count == 0:
            return None

        return {
            "type": "invalid_dates",
            "column": column,
            "count": invalid_count,
            "severity": "medium",
            "detected_formats": detected_formats,
            "examples": invalid_values[:5],
        }
        
    @staticmethod
    def _infer_date_formats(
        values: list[str],
    ) -> list[str]:

        date_formats = [
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%m-%d-%Y",
            "%m/%d/%Y",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M:%S%.f",
            "%d-%m-%Y %H:%M:%S",
            "%d/%m/%Y %H:%M:%S",
            "%m-%d-%Y %H:%M:%S",
            "%m/%d/%Y %H:%M:%S",
        ]

        scores = {
            date_format: 0
            for date_format in date_formats
        }

        # Limit inference to a reasonable sample.
        sample = values[:5000]

        for value in sample:

            for date_format in date_formats:

                try:
                    datetime.strptime(
                        value,
                        date_format,
                    )

                    scores[date_format] += 1

                except ValueError:
                    continue

        max_score = max(
            scores.values(),
            default=0,
        )

        if max_score == 0:
            return []

        # Keep formats that successfully parse
        # at least 80% of the best matching values.
        threshold = max(
            1,
            int(max_score * 0.80),
        )

        return [
            date_format
            for date_format, score in scores.items()
            if score >= threshold
        ]


    @staticmethod
    def _is_valid_date(
        value: str,
        formats: list[str],
    ) -> bool:

        for date_format in formats:

            try:
                datetime.strptime(
                    value,
                    date_format,
                )
                return True

            except ValueError:
                continue

        return False

    def _detect_duplicate_ids(
        self,
        connection: duckdb.DuckDBPyConnection,
        table: str,
    ) -> list[dict]:
        issues = []

        columns = self._get_column_info(
            connection,
            table,
        )

        for column in columns:
            name = column["name"]

            if not self._looks_like_id_column(name):
                continue

            quoted_column = self._quote_identifier(name)

            result = connection.execute(
                f"""
                SELECT COUNT(*)
                FROM (
                    SELECT {quoted_column}
                    FROM {table}
                    WHERE {quoted_column} IS NOT NULL
                    GROUP BY {quoted_column}
                    HAVING COUNT(*) > 1
                )
                """
            ).fetchone()

            duplicate_ids = result[0]

            if duplicate_ids > 0:
                issues.append(
                    {
                        "type": "potential_duplicate_id",
                        "column": name,
                        "count": duplicate_ids,
                        "severity": "high",
                    }
                )

        return issues

    @staticmethod
    def _is_numeric_type(column_type: str) -> bool:
        numeric_types = (
            "INTEGER",
            "BIGINT",
            "SMALLINT",
            "TINYINT",
            "HUGEINT",
            "DOUBLE",
            "FLOAT",
            "DECIMAL",
            "REAL",
        )

        return any(
            numeric_type in column_type.upper()
            for numeric_type in numeric_types
        )

    @staticmethod
    def _is_string_type(column_type: str) -> bool:
        return "VARCHAR" in column_type.upper()

    @staticmethod
    def _looks_like_date_column(column_name: str) -> bool:
        name = column_name.lower()

        keywords = (
            "date",
            "time",
            "timestamp",
            "created",
            "updated",
            "dob",
        )

        return any(
            keyword in name
            for keyword in keywords
        )

    @staticmethod
    def _looks_like_id_column(column_name: str) -> bool:
        name = column_name.lower()

        return (
            name == "id"
            or name.endswith("_id")
            or name.endswith("id")
            or "identifier" in name
        )

    @staticmethod
    def _missing_severity(percentage: float) -> str:
        if percentage >= 30:
            return "high"

        if percentage >= 5:
            return "medium"

        return "low"

    @staticmethod
    def _clean_number(value):
        if value is None:
            return None

        if isinstance(value, float):
            return round(value, 4)

        return value

    @staticmethod
    def _quote_identifier(identifier: str) -> str:
        escaped = identifier.replace('"', '""')
        return f'"{escaped}"'