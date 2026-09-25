import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.database_models import (
    CleaningOperation,
    CleaningPlan,
    CleaningRemovedRow,
    Dataset,
    DatasetProfile,
)
from app.schemas.cleaning import CleaningPlan as CleaningPlanSchema
from app.services.cleaning_engine import CleaningEngine
from app.services.llm_service import LLMService
from app.services.profiling_service import ProfilingService
from app.services.storage_service import StorageService


ALLOWED_OPERATIONS = {
    "fill_missing",
    "remove_duplicates",
    "normalize_categories",
    "convert_type",
    "remove_invalid_dates",
    "handle_outliers",
}


class CleaningService:
    def __init__(self):
        self.llm_service = LLMService()
        self.cleaning_engine = CleaningEngine()
        self.profiling_service = ProfilingService()
        self.storage_service = StorageService()

    def generate_cleaning_plan(
        self,
        db: Session,
        dataset: Dataset,
    ) -> CleaningPlan:

        if dataset.cleaned_file_path:
            raise ValueError(
                "This dataset has already been cleaned."
            )

        active_plan = db.scalar(
            select(CleaningPlan)
            .where(
                CleaningPlan.dataset_id == dataset.id,
                CleaningPlan.status.in_(
                    ["pending", "approved"]
                ),
            )
            .order_by(
                CleaningPlan.id.desc()
            )
        )

        if active_plan:
            raise ValueError(
                "This dataset already has an active cleaning plan."
            )

        dataset_profile = db.scalar(
            select(DatasetProfile)
            .where(
                DatasetProfile.dataset_id == dataset.id
            )
        )

        if not dataset_profile:
            raise ValueError(
                "Dataset profile does not exist."
            )

        profile = json.loads(
            dataset_profile.profile_json
        )

        plan = self.llm_service.generate_cleaning_plan(
            profile
        )

        self._validate_plan(
            profile,
            plan,
        )

        plan_data = plan.model_dump()

        suffix = Path(
            dataset.original_file_path
        ).suffix

        with self.storage_service.temporary_file(
            dataset.original_file_path,
            suffix=suffix,
        ) as local_path:

            impact = self.cleaning_engine.preview(
                input_path=local_path,
                operations=plan_data.get(
                    "operations",
                    [],
                ),
            )

        plan_data["impact"] = impact

        cleaning_plan = CleaningPlan(
            dataset_id=dataset.id,
            plan_json=json.dumps(
                plan_data,
                default=str,
            ),
            status="pending",
        )

        db.add(cleaning_plan)
        db.commit()
        db.refresh(cleaning_plan)

        return cleaning_plan

    def _validate_plan(
        self,
        profile: dict,
        plan: CleaningPlanSchema,
    ) -> None:

        valid_columns = {
            column["name"]
            for column in profile["columns"]
        }

        for operation in plan.operations:

            if operation.operation not in ALLOWED_OPERATIONS:
                raise ValueError(
                    f"Unsupported cleaning operation: "
                    f"{operation.operation}"
                )

            if operation.column:
                if operation.column not in valid_columns:
                    raise ValueError(
                        f"Unknown column in cleaning plan: "
                        f"{operation.column}"
                    )

    def execute_approved_plan(
        self,
        db: Session,
        plan_id: int,
        dataset: Dataset,
    ) -> dict:

        if dataset.cleaned_file_path:
            raise ValueError(
                "This dataset has already been cleaned."
            )

        cleaning_plan = db.scalar(
            select(CleaningPlan)
            .where(
                CleaningPlan.id == plan_id,
                CleaningPlan.dataset_id == dataset.id,
            )
        )

        if not cleaning_plan:
            raise ValueError(
                "Cleaning plan not found."
            )

        if cleaning_plan.status != "approved":
            raise ValueError(
                "Only an approved cleaning plan can be executed."
            )

        plan = CleaningPlanSchema.model_validate(
            json.loads(
                cleaning_plan.plan_json
            )
        )

        profile = self._get_profile(
            db,
            dataset,
        )

        self._validate_plan(
            profile,
            plan,
        )

        operations = [
            operation.model_dump()
            for operation in plan.operations
        ]

        original_suffix = Path(
            dataset.original_file_path
        ).suffix

        # ---------------------------------------------------------
        # Reuse the SAME dataset storage folder as the original file.
        #
        # Original:
        # users/{user}/datasets/{storage_id}/original/file.csv
        #
        # Cleaned:
        # users/{user}/datasets/{storage_id}/cleaned/file_cleaned.parquet
        # ---------------------------------------------------------
        original_object_path = Path(
            dataset.original_file_path
        )

        dataset_storage_prefix = (
            original_object_path.parent.parent.as_posix()
        )

        cleaned_object_key = (
            f"{dataset_storage_prefix}/"
            f"cleaned/"
            f"{Path(dataset.name).stem}_"
            f"cleaned_{uuid4().hex[:8]}.parquet"
        )

        output_file = NamedTemporaryFile(
            suffix=".parquet",
            delete=False,
        )

        output_path = Path(
            output_file.name
        )

        output_file.close()

        cleaned_uploaded = False

        try:

            # -----------------------------------------------------
            # Download original from Neon temporarily
            # -----------------------------------------------------
            with self.storage_service.temporary_file(
                dataset.original_file_path,
                suffix=original_suffix,
            ) as original_local_path:

                # -------------------------------------------------
                # Perform deterministic cleaning locally
                # -------------------------------------------------
                result = self.cleaning_engine.clean(
                    input_path=original_local_path,
                    output_path=str(output_path),
                    operations=operations,
                )

            # -----------------------------------------------------
            # Profile cleaned Parquet before uploading it
            # -----------------------------------------------------
            self._profile_cleaned_dataset(
                db,
                dataset,
                str(output_path),
            )

            # -----------------------------------------------------
            # Upload cleaned dataset to SAME Neon dataset folder
            # -----------------------------------------------------
            self.storage_service.upload_file(
                local_path=str(output_path),
                object_key=cleaned_object_key,
                content_type="application/octet-stream",
            )

            cleaned_uploaded = True

            dataset.cleaned_file_path = cleaned_object_key
            dataset.status = "cleaned"

            result["output_path"] = cleaned_object_key

            # -----------------------------------------------------
            # Store removed rows audit
            # -----------------------------------------------------
            for removed_row in result.get(
                "removed_rows",
                [],
            ):

                db.add(
                    CleaningRemovedRow(
                        dataset_id=dataset.id,
                        cleaning_plan_id=cleaning_plan.id,
                        operation=removed_row[
                            "operation"
                        ],
                        reason=removed_row[
                            "reason"
                        ],
                        original_row=removed_row[
                            "original_row"
                        ],
                        row_data=json.dumps(
                            removed_row[
                                "row_data"
                            ],
                            default=str,
                        ),
                    )
                )

            # -----------------------------------------------------
            # Store cleaning operations
            # -----------------------------------------------------
            for operation in plan.operations:

                db.add(
                    CleaningOperation(
                        dataset_id=dataset.id,
                        operation=operation.operation,
                        column=operation.column,
                        strategy=operation.strategy,
                        reason=operation.reason,
                        status="completed",
                    )
                )

            cleaning_plan.status = "executed"

            db.commit()

            return result

        except Exception:

            # If the cleaned object was already uploaded but
            # something failed afterward, remove it from storage.
            if cleaned_uploaded:
                try:
                    self.storage_service.delete(
                        cleaned_object_key
                    )
                except Exception:
                    pass

            dataset.cleaned_file_path = None
            dataset.status = "failed"

            cleaning_plan.status = "failed"

            db.commit()

            raise

        finally:

            if output_path.exists():
                try:
                    output_path.unlink()
                except OSError:
                    pass

    def _get_profile(
        self,
        db: Session,
        dataset: Dataset,
    ) -> dict:

        dataset_profile = db.scalar(
            select(DatasetProfile)
            .where(
                DatasetProfile.dataset_id == dataset.id
            )
        )

        if not dataset_profile:
            raise ValueError(
                "Dataset profile does not exist."
            )

        return json.loads(
            dataset_profile.profile_json
        )

    def _profile_cleaned_dataset(
        self,
        db: Session,
        dataset: Dataset,
        cleaned_file_path: str,
    ) -> dict:

        cleaned_profile = (
            self.profiling_service.profile_dataset(
                cleaned_file_path
            )
        )

        dataset.row_count = cleaned_profile[
            "rows"
        ]

        dataset.column_count = cleaned_profile[
            "column_count"
        ]

        dataset_profile = db.scalar(
            select(DatasetProfile)
            .where(
                DatasetProfile.dataset_id == dataset.id
            )
        )

        if not dataset_profile:
            raise ValueError(
                "Dataset profile does not exist."
            )

        existing_profile = json.loads(
            dataset_profile.profile_json
        )

        semantic_schema = existing_profile.get(
            "semantic_schema"
        )

        if semantic_schema:
            cleaned_profile[
                "semantic_schema"
            ] = semantic_schema

        dataset_profile.profile_json = json.dumps(
            cleaned_profile,
            default=str,
        )

        return cleaned_profile