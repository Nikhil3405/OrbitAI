from datetime import datetime
from pathlib import Path

import polars as pl

from app.services.dataset_reader import DatasetReader


class CleaningEngine:

    DATE_FORMATS = [
        # ISO
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%Y-%m-%d %H:%M",
        "%Y/%m/%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S%.f",

        # Month-first
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%m/%d/%Y %H:%M",
        "%m-%d-%Y %H:%M",
        "%m/%d/%Y %H:%M:%S",
        "%m-%d-%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S%.f",
        "%m-%d-%Y %H:%M:%S%.f",

        # Day-first
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d/%m/%Y %H:%M",
        "%d-%m-%Y %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
        "%d/%m/%Y %H:%M:%S%.f",
        "%d-%m-%Y %H:%M:%S%.f",
    ]

    def clean(
        self,
        input_path: str,
        output_path: str,
        operations: list[dict],
    ) -> dict:

        input_file = Path(input_path)
        output_file = Path(output_path)

        if not input_file.exists():
            raise FileNotFoundError(
                "Original dataset not found."
            )

        df = DatasetReader.read(
            input_file
        ).with_row_index("_original_row")

        rows_before = df.height
        removed_rows = []
        operation_impacts = []
        outlier_reports = []

        for operation in operations:

            operation_name = operation.get("operation")
            rows_before_operation = df.height

            # Calculate outlier information before applying
            # the operation. Outliers are now only detected,
            # never removed.
            outlier_report = None

            if operation_name == "handle_outliers":
                outlier_report = self._calculate_outlier_impact(
                    df,
                    operation.get("column"),
                    operation.get("strategy"),
                )

            df, operation_removed_rows = self._apply_operation(
                df,
                operation,
            )

            rows_after_operation = df.height

            # Safety guard:
            # Never allow one operation to accidentally
            # remove the entire dataset.
            if (
                rows_before_operation > 0
                and df.height == 0
            ):
                raise ValueError(
                    f"Cleaning operation '{operation_name}' "
                    "would remove all rows. "
                    "The operation was stopped to protect "
                    "the original dataset."
                )

            removed_rows.extend(
                operation_removed_rows
            )

            impact = {
                "operation": operation_name,
                "column": operation.get("column"),
                "strategy": operation.get("strategy"),
                "rows_before": rows_before_operation,
                "rows_after": rows_after_operation,
                "rows_removed": (
                    rows_before_operation
                    - rows_after_operation
                ),
            }

            if operation_name == "fill_missing":
                impact["values_modified"] = (
                    self._count_missing_values(
                        df_before=None,
                        df_after=df,
                        column=operation.get("column"),
                    )
                )

            if outlier_report:
                impact["outliers_detected"] = (
                    outlier_report["outliers_detected"]
                )
                impact["lower_bound"] = (
                    outlier_report["lower_bound"]
                )
                impact["upper_bound"] = (
                    outlier_report["upper_bound"]
                )

                outlier_reports.append(
                    {
                        "column": operation.get("column"),
                        "strategy": operation.get("strategy"),
                        **outlier_report,
                    }
                )

            operation_impacts.append(impact)

        df = df.drop("_original_row")

        output_file.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        df.write_parquet(output_file)

        return {
            "rows_before": rows_before,
            "rows_after": df.height,
            "columns": df.width,
            "output_path": str(output_file),
            "removed_rows": removed_rows,
            "operation_impacts": operation_impacts,
            "outlier_reports": outlier_reports,
        }

    # ---------------------------------------------------------
    # Operation dispatcher
    # ---------------------------------------------------------

    def _apply_operation(
        self,
        df: pl.DataFrame,
        operation: dict,
    ) -> tuple[pl.DataFrame, list[dict]]:

        operation_name = operation["operation"]
        column = operation.get("column")
        strategy = operation.get("strategy")

        if column and column not in df.columns:
            raise ValueError(
                f"Column '{column}' does not exist."
            )

        if operation_name == "fill_missing":
            return (
                self._fill_missing(
                    df,
                    column,
                    strategy,
                ),
                [],
            )

        if operation_name == "remove_duplicates":
            return self._remove_duplicates(df)

        if operation_name == "normalize_categories":
            return (
                self._normalize_categories(
                    df,
                    column,
                    strategy,
                ),
                [],
            )

        if operation_name == "convert_type":
            return (
                self._convert_type(
                    df,
                    column,
                    strategy,
                ),
                [],
            )

        if operation_name == "remove_invalid_dates":
            return self._remove_invalid_dates(
                df,
                column,
            )

        if operation_name == "handle_outliers":
            return self._handle_outliers(
                df,
                column,
                strategy,
            )

        raise ValueError(
            f"Unsupported cleaning operation: "
            f"{operation_name}"
        )

    # ---------------------------------------------------------
    # Missing values
    # ---------------------------------------------------------

    def _fill_missing(
        self,
        df: pl.DataFrame,
        column: str | None,
        strategy: str | None,
    ) -> pl.DataFrame:

        if not column:
            raise ValueError(
                "fill_missing requires a column."
            )

        if strategy == "median":
            value = df[column].median()

        elif strategy == "mean":
            value = df[column].mean()

        elif strategy == "mode":
            mode = df[column].mode()
            value = mode[0] if len(mode) else None

        else:
            raise ValueError(
                f"Unsupported fill strategy: {strategy}"
            )

        if value is None:
            return df

        return df.with_columns(
            pl.col(column).fill_null(value)
        )

    def _count_missing_values(
        self,
        df_before,
        df_after,
        column,
    ):
        """
        Kept as a small compatibility helper.

        Exact missing-value impact is calculated in preview(),
        where the original dataframe is available.
        """
        return 0

    # ---------------------------------------------------------
    # Duplicate rows
    # ---------------------------------------------------------

    def _remove_duplicates(
        self,
        df: pl.DataFrame,
    ) -> tuple[pl.DataFrame, list[dict]]:

        data_columns = [
            column
            for column in df.columns
            if column != "_original_row"
        ]

        duplicate_groups = (
            df.group_by(
                data_columns,
                maintain_order=True,
            )
            .agg(
                pl.col("_original_row").alias(
                    "_row_ids"
                )
            )
            .filter(
                pl.col("_row_ids").list.len() > 1
            )
        )

        removed_row_ids = []

        for row in duplicate_groups.to_dicts():
            row_ids = row["_row_ids"]

            # Keep first occurrence.
            removed_row_ids.extend(
                row_ids[1:]
            )

        duplicate_df = df.filter(
            pl.col("_original_row").is_in(
                removed_row_ids
            )
        )

        removed_rows = [
            {
                "original_row": row["_original_row"],
                "operation": "remove_duplicates",
                "reason": "Duplicate row.",
                "row_data": {
                    key: value
                    for key, value in row.items()
                    if key != "_original_row"
                },
            }
            for row in duplicate_df.to_dicts()
        ]

        cleaned_df = df.filter(
            ~pl.col("_original_row").is_in(
                removed_row_ids
            )
        )

        return cleaned_df, removed_rows

    # ---------------------------------------------------------
    # Category normalization
    # ---------------------------------------------------------

    def _normalize_categories(
        self,
        df: pl.DataFrame,
        column: str | None,
        strategy: str | None,
    ) -> pl.DataFrame:

        if not column:
            raise ValueError(
                "normalize_categories requires a column."
            )

        if strategy != "trim_lowercase":
            raise ValueError(
                f"Unsupported normalization strategy: "
                f"{strategy}"
            )

        return df.with_columns(
            pl.col(column)
            .cast(pl.String)
            .str.strip_chars()
            .str.to_lowercase()
        )

    # ---------------------------------------------------------
    # Type conversion
    # ---------------------------------------------------------

    def _convert_type(
        self,
        df: pl.DataFrame,
        column: str | None,
        strategy: str | None,
    ) -> pl.DataFrame:

        if not column:
            raise ValueError(
                "convert_type requires a column."
            )

        type_map = {
            "integer": pl.Int64,
            "float": pl.Float64,
            "string": pl.String,
            "date": pl.Date,
            "datetime": pl.Datetime,
        }

        target_type = type_map.get(
            (strategy or "").lower()
        )

        if target_type is None:
            raise ValueError(
                f"Unsupported conversion type: {strategy}"
            )

        return df.with_columns(
            pl.col(column).cast(
                target_type,
                strict=False,
            )
        )

    # ---------------------------------------------------------
    # Invalid date detection
    # ---------------------------------------------------------

    def _remove_invalid_dates(
        self,
        df: pl.DataFrame,
        column: str | None,
    ) -> tuple[pl.DataFrame, list[dict]]:

        if not column or column not in df.columns:
            raise ValueError(
                f"Column '{column}' not found "
                f"for invalid date removal."
            )

        removed_rows = []

        if df[column].dtype in (
            pl.Date,
            pl.Datetime,
        ):
            invalid_mask = df[column].is_null()

        else:
            values = (
                df[column]
                .cast(pl.String)
                .str.strip_chars()
            )

            selected_formats = (
                self._infer_date_formats(values)
            )

            if not selected_formats:
                selected_formats = self.DATE_FORMATS

            parsed_expressions = []

            for date_format in selected_formats:
                parsed_expressions.append(
                    values.str.strptime(
                        pl.Date,
                        format=date_format,
                        strict=False,
                    )
                )

            parsed_date = pl.coalesce(
                parsed_expressions
            )

            invalid_mask = (
                df[column].is_not_null()
                & values.ne("")
                & parsed_date.is_null()
            )

        invalid_rows = df.filter(
            invalid_mask
        )

        for row in invalid_rows.iter_rows(
            named=True
        ):
            original_row = row.pop(
                "_original_row"
            )

            removed_rows.append(
                {
                    "original_row": original_row,
                    "operation": "remove_invalid_dates",
                    "reason": (
                        f"Invalid date in column "
                        f"'{column}'"
                    ),
                    "row_data": row,
                }
            )

        cleaned_df = df.filter(
            ~invalid_mask
        )

        return cleaned_df, removed_rows

    # ---------------------------------------------------------
    # Date format inference
    # ---------------------------------------------------------

    def _infer_date_formats(
        self,
        values: pl.Series,
    ) -> list[str]:

        sample = (
            values
            .drop_nulls()
            .unique()
            .head(5000)
            .to_list()
        )

        if not sample:
            return []

        scores = {
            date_format: 0
            for date_format in self.DATE_FORMATS
        }

        for value in sample:

            value = str(value).strip()

            if not value:
                continue

            for date_format in self.DATE_FORMATS:

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

        threshold = max(
            1,
            int(max_score * 0.80),
        )

        selected_formats = [
            date_format
            for date_format, score in scores.items()
            if score >= threshold
        ]

        return selected_formats

    # ---------------------------------------------------------
    # Outliers
    # ---------------------------------------------------------

    def _handle_outliers(
        self,
        df: pl.DataFrame,
        column: str | None,
        strategy: str | None,
    ) -> tuple[pl.DataFrame, list[dict]]:

        if not column:
            raise ValueError(
                "handle_outliers requires a column."
            )

        if strategy != "iqr":
            raise ValueError(
                f"Unsupported outlier strategy: "
                f"{strategy}"
            )

        # IMPORTANT:
        # Outliers are detected but NOT removed.
        #
        # A movie with an unusually high budget,
        # revenue, or opening weekend may be a legitimate
        # observation rather than bad data.

        self._calculate_outlier_impact(
            df,
            column,
            strategy,
        )

        return df, []

    def _calculate_outlier_impact(
        self,
        df: pl.DataFrame,
        column: str | None,
        strategy: str | None,
    ) -> dict:

        if not column:
            raise ValueError(
                "handle_outliers requires a column."
            )

        if strategy != "iqr":
            raise ValueError(
                f"Unsupported outlier strategy: "
                f"{strategy}"
            )

        if column not in df.columns:
            raise ValueError(
                f"Column '{column}' does not exist."
            )

        series = df[column]

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        if q1 is None or q3 is None:
            return {
                "outliers_detected": 0,
                "lower_bound": None,
                "upper_bound": None,
            }

        iqr = q3 - q1

        if iqr == 0:
            return {
                "outliers_detected": 0,
                "lower_bound": q1,
                "upper_bound": q3,
            }

        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        outlier_mask = (
            series.is_not_null()
            & (
                (series < lower)
                | (series > upper)
            )
        )

        outlier_count = df.filter(
            outlier_mask
        ).height

        return {
            "outliers_detected": outlier_count,
            "lower_bound": lower,
            "upper_bound": upper,
        }

    # ---------------------------------------------------------
    # Preview
    # ---------------------------------------------------------

    def preview(
        self,
        input_path: str,
        operations: list[dict],
    ) -> dict:
        """
        Preview the effect of a cleaning plan without
        writing or modifying the dataset.

        Important:
        Outlier operations detect outliers but do not
        remove rows.
        """

        input_file = Path(input_path)

        if not input_file.exists():
            raise FileNotFoundError(
                "Original dataset not found."
            )

        df = DatasetReader.read(
            input_file
        ).with_row_index("_original_row")

        total_rows = df.height

        operation_impacts = []

        total_values_filled = 0
        total_values_modified = 0
        total_outliers_detected = 0

        for operation in operations:

            operation_name = operation.get(
                "operation"
            )

            column = operation.get("column")

            rows_before = df.height

            missing_before = 0

            if (
                operation_name == "fill_missing"
                and column
                and column in df.columns
            ):
                missing_before = df[column].null_count()

            outlier_report = None

            if operation_name == "handle_outliers":
                outlier_report = (
                    self._calculate_outlier_impact(
                        df,
                        column,
                        operation.get("strategy"),
                    )
                )

            df, removed_rows = self._apply_operation(
                df,
                operation,
            )

            rows_after = df.height

            impact = {
                "operation": operation_name,
                "column": column,
                "strategy": operation.get(
                    "strategy"
                ),
                "rows_before": rows_before,
                "rows_after": rows_after,
                "rows_removed": (
                    rows_before - rows_after
                ),
            }

            if operation_name == "fill_missing":
                values_filled = max(
                    0,
                    missing_before
                    - df[column].null_count(),
                )

                impact["values_filled"] = (
                    values_filled
                )

                total_values_filled += (
                    values_filled
                )

            if outlier_report:
                impact[
                    "outliers_detected"
                ] = outlier_report[
                    "outliers_detected"
                ]

                impact[
                    "lower_bound"
                ] = outlier_report[
                    "lower_bound"
                ]

                impact[
                    "upper_bound"
                ] = outlier_report[
                    "upper_bound"
                ]

                total_outliers_detected += (
                    outlier_report[
                        "outliers_detected"
                    ]
                )

            operation_impacts.append(
                impact
            )

        rows_remaining = df.height

        return {
            "total_rows": total_rows,
            "rows_to_remove": (
                total_rows - rows_remaining
            ),
            "rows_remaining": rows_remaining,

            "values_filled": (
                total_values_filled
            ),

            "outliers_detected": (
                total_outliers_detected
            ),

            "operation_impacts": (
                operation_impacts
            ),
        }