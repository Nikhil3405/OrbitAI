import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser
from app.core.database import get_db
from app.models.database_models import (
    CleaningPlan as CleaningPlanModel,
    Dataset,
    CleaningRemovedRow,
)
from app.services.storage_service import StorageService
from fastapi.responses import FileResponse
from pathlib import Path

import polars as pl
from fastapi.responses import StreamingResponse
from io import BytesIO

from app.schemas.cleaning import (
    CleaningPlan as CleaningPlanSchema,
    CleaningApprovalRequest,
)
from app.services.cleaning_service import CleaningService


router = APIRouter(
    prefix="/api/cleaning",
    tags=["cleaning"],
)

@router.post("/{plan_id}/approve")
def approve_cleaning_plan(
    plan_id: int,
    request: CleaningApprovalRequest,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    plan = db.scalar(
        select(CleaningPlanModel)
        .join(
            Dataset,
            CleaningPlanModel.dataset_id
            == Dataset.id,
        )
        .where(
            CleaningPlanModel.id == plan_id,
            Dataset.clerk_user_id == current_user_id,
        )
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Cleaning plan not found.",
        )

    if plan.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "This cleaning plan is no longer awaiting "
                "approval."
            ),
        )

    if not request.approved:
        plan.status = "rejected"
        db.commit()

        return {
            "message": (
                "Cleaning plan rejected. "
                "No changes were made to the dataset."
            ),
            "plan_id": plan.id,
            "status": "rejected",
        }

    plan.status = "approved"
    db.commit()

    return {
        "message": (
            "Cleaning plan approved. "
            "The dataset is ready for cleaning."
        ),
        "plan_id": plan.id,
        "status": "approved",
    }

@router.post("/{plan_id}/execute")
def execute_cleaning_plan(
    plan_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    plan = db.scalar(
        select(CleaningPlanModel)
        .join(
            Dataset,
            CleaningPlanModel.dataset_id
            == Dataset.id,
        )
        .where(
            CleaningPlanModel.id == plan_id,
            Dataset.clerk_user_id
            == current_user_id,
        )
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Cleaning plan not found.",
        )

    dataset = db.scalar(
        select(Dataset).where(
            Dataset.id == plan.dataset_id,
            Dataset.clerk_user_id
            == current_user_id,
        )
    )

    try:
        result = CleaningService().execute_approved_plan(
            db,
            plan_id,
            dataset,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        print("CLEANING ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    return {
        "message": "Cleaning completed successfully.",
        "plan_id": plan_id,
        "dataset_id": dataset.id,
        "result": result,
    }
    
@router.get("/{dataset_id}/removed-rows")
def get_removed_rows(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = None,
):
    dataset = db.scalar(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.clerk_user_id == current_user,
        )
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    rows = db.scalars(
        select(CleaningRemovedRow)
        .where(
            CleaningRemovedRow.dataset_id == dataset_id
        )
        .order_by(
            CleaningRemovedRow.original_row
        )
    ).all()

    return {
        "dataset_id": dataset_id,
        "cleaning_completed": bool(dataset.cleaned_file_path),
        "count": len(rows),
        "rows": [
            {
                "id": row.id,
                "original_row": row.original_row,
                "operation": row.operation,
                "reason": row.reason,
                "row_data": json.loads(row.row_data),
                "created_at": row.created_at,
            }
            for row in rows
        ],
    }
    
    
@router.get("/{dataset_id}/download")
def download_cleaned_dataset(
    dataset_id: int,
    format: str = "csv",
    current_user_id: CurrentUser = None,
    db: Session = Depends(get_db),
):
    dataset = db.scalar(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.clerk_user_id == current_user_id,
        )
    )

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    if not dataset.cleaned_file_path:
        raise HTTPException(
            status_code=404,
            detail="A cleaned dataset is not available yet.",
        )

    if format != "csv":
        raise HTTPException(
            status_code=400,
            detail="Only CSV download is supported.",
        )

    try:
        storage_service = StorageService()

        with storage_service.temporary_file(
            dataset.cleaned_file_path,
            suffix=".parquet",
        ) as local_path:

            df = pl.read_parquet(local_path)

            buffer = BytesIO()
            df.write_csv(buffer)
            buffer.seek(0)

            base_name = Path(dataset.name).stem

            return StreamingResponse(
                buffer,
                media_type="text/csv",
                headers={
                    "Content-Disposition": (
                        f'attachment; filename="{base_name}_cleaned.csv"'
                    )
                },
            )

    except Exception as error:
        print(
            "CLEANED DATASET DOWNLOAD ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to download cleaned dataset.",
        )