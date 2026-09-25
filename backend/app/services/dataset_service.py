import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.database_models import Dataset, DatasetProfile
from app.services.profiling_service import ProfilingService
from app.services.storage_service import StorageService


class DatasetService:

    def __init__(self):
        self.profiling_service = ProfilingService()
        self.storage_service = StorageService()

    def profile_dataset(
        self,
        db: Session,
        dataset: Dataset,
    ) -> dict:

        suffix = Path(
            dataset.original_file_path
        ).suffix

        with self.storage_service.temporary_file(
            dataset.original_file_path,
            suffix=suffix,
        ) as local_path:

            profile = self.profiling_service.profile_dataset(
                local_path
            )

        dataset.row_count = profile["rows"]
        dataset.column_count = profile["column_count"]
        dataset.status = "profiled"

        existing_profile = db.scalar(
            select(DatasetProfile).where(
                DatasetProfile.dataset_id == dataset.id
            )
        )

        profile_json = json.dumps(
            profile,
            default=str,
        )

        if existing_profile:
            existing_profile.profile_json = profile_json

        else:
            dataset_profile = DatasetProfile(
                dataset_id=dataset.id,
                profile_json=profile_json,
            )

            db.add(dataset_profile)

        db.commit()

        return profile