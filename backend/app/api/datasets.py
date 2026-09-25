from pathlib import Path
import traceback
from uuid import uuid4
from typing import Annotated
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.services.storage_service import StorageService

from app.auth.clerk import CurrentUser
from app.core.config import settings
from app.core.database import get_db
from app.models.database_models import Dataset, DatasetProfile
from app.schemas.dataset import DatasetResponse
from app.services.profiling_service import ProfilingService
from app.services.dataset_service import DatasetService
from app.services.semantic_schema_service import (
    SemanticSchemaService,
)
from pydantic import BaseModel
from app.services.cleaning_service import CleaningService
from app.schemas.cleaning import CleaningPlan

from app.models.database_models import (
    Dataset,
    DatasetProfile,
    CleaningPlan as CleaningPlanModel,
)

from app.models.database_models import (
    AnalysisMessage,
    AnalysisRun,
    AnalysisSession,
)
from app.schemas.analysis import AnalysisRequest
from app.services.agent_service import AgentService


SUPPORTED_EXTENSIONS = {".csv", ".xlsx"}

class ColumnMatchRequest(BaseModel):
    question: str

router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"],
)


BASE_UPLOAD_DIR = Path("uploads/original")
BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_dataset(
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
):
    # 1. Validate filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A filename is required.",
        )

    # 2. Validate extension
    extension = Path(file.filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and XLSX files are supported.",
        )

    # 3. Read file
    content = await file.read()

    # 4. Validate file size
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File is too large. Maximum allowed size is "
                f"{settings.MAX_UPLOAD_SIZE_MB} MB."
            ),
        )

    # 5. Validate non-empty file
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # 6. Generate safe unique filename
    original_name = Path(file.filename).stem
    safe_name = "".join(
        character if character.isalnum() or character in ("-", "_")
        else "_"
        for character in original_name
    )

    unique_filename = f"{safe_name}_{uuid4().hex}{extension}"

    storage_folder = uuid4().hex

    object_key = (
        f"users/{current_user_id}/"
        f"datasets/{storage_folder}/"
        f"original/{unique_filename}"
    )

    StorageService().upload_bytes(
        content=content,
        object_key=object_key,
        content_type=file.content_type,
    )

    dataset = Dataset(
        clerk_user_id=current_user_id,
        name=file.filename,
        original_file_path=object_key,
        file_size=len(content),
        status="uploaded",
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)


    try:
        DatasetService().profile_dataset(db, dataset)
    except Exception as exc:
        print("========== PROFILING ERROR ==========")
        print(str(exc))
        traceback.print_exc()
        print("=====================================")

        dataset.status = "profiling_failed"
        db.commit()

    return dataset



@router.get(
    "",
    response_model=list[DatasetResponse],
)
def get_datasets(
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    query = (
        select(Dataset)
        .where(Dataset.clerk_user_id == current_user_id)
        .order_by(Dataset.created_at.desc())
    )

    return db.scalars(query).all()

@router.get("/{dataset_id}/profile")
def get_dataset_profile(
    dataset_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    dataset = db.scalar(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.clerk_user_id == current_user_id,
        )
    )

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    dataset_profile = db.scalar(
        select(DatasetProfile).where(
            DatasetProfile.dataset_id == dataset.id
        )
    )

    if not dataset_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset profile not available.",
        )

    return json.loads(dataset_profile.profile_json)

@router.get("/{dataset_id}/semantic-schema")
def get_semantic_schema(
    dataset_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
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

    try:
        semantic_schema = SemanticSchemaService().get_schema(
            db,
            dataset,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as exc:
        print("========== SEMANTIC SCHEMA ERROR ==========")
        print(str(exc))
        traceback.print_exc()
        print("===========================================")

        raise HTTPException(
            status_code=500,
            detail="Failed to load semantic schema.",
        )

    return semantic_schema

@router.post("/{dataset_id}/semantic-match")
def semantic_match(
    dataset_id: int,
    request: ColumnMatchRequest,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
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

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:
        matches = SemanticSchemaService().match_columns(
            db,
            dataset,
            request.question,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to match semantic columns.",
        )

    return {
        "question": request.question,
        "matches": matches,
    }
    
@router.post("/{dataset_id}/cleaning-plan")
def generate_cleaning_plan(
    dataset_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
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

    try:
        plan = CleaningService().generate_cleaning_plan(
            db,
            dataset,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate cleaning plan.",
        )

    return {
            "id": plan.id,
            "dataset_id": plan.dataset_id,
            "status": plan.status,
            "plan": json.loads(plan.plan_json),
        }

@router.get("/{dataset_id}/cleaning-status")
def get_cleaning_status(
    dataset_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
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

    cleaning_plan = db.scalar(
        select(CleaningPlanModel)
        .where(CleaningPlanModel.dataset_id == dataset.id)
        .order_by(CleaningPlanModel.id.desc())
    )

    if not cleaning_plan:
        return {
            "dataset_id": dataset.id,
            "status": "not_started",
            "plan_id": None,
            "plan": None,
            "cleaning_completed": bool(dataset.cleaned_file_path),
        }

    return {
        "dataset_id": dataset.id,
        "status": cleaning_plan.status,
        "plan_id": cleaning_plan.id,
        "plan": json.loads(cleaning_plan.plan_json),
        "cleaning_completed": bool(dataset.cleaned_file_path),
    }
    
    
    
@router.post("/{dataset_id}/analyze")
def analyze_dataset(
    dataset_id: int,
    request: AnalysisRequest,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
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

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    session = AnalysisSession(
        dataset_id=dataset.id,
        clerk_user_id=current_user_id,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    user_message = AnalysisMessage(
        session_id=session.id,
        role="user",
        content=request.question,
    )

    db.add(user_message)

    analysis_run = AnalysisRun(
        session_id=session.id,
        status="running",
    )

    db.add(analysis_run)
    db.commit()

    try:
        semantic_schema = SemanticSchemaService().get_schema(
            db,
            dataset,
        )
        # result = AgentService().analyze(
        #     file_path=(
        #         dataset.cleaned_file_path
        #         or dataset.original_file_path
        #     ),
        #     question=request.question,
        # )
        
        result = AgentService().analyze(
            file_path=(
                dataset.cleaned_file_path
                or dataset.original_file_path
            ),
            question=request.question,
            semantic_schema=semantic_schema.model_dump(),
        )

        analysis_run.answer = result["answer"]

        analysis_run.evidence_json = json.dumps(
            result.get("evidence", []),
            default=str,
        )

        analysis_run.actions_json = json.dumps(
            result.get("actions", []),
            default=str,
        )

        analysis_run.charts_json = json.dumps(
            result.get("charts", []),
            default=str,
        )

        analysis_run.status = "completed"

        assistant_message = AnalysisMessage(
            session_id=session.id,
            role="assistant",
            content=result["answer"],
        )

        db.add(assistant_message)
        db.commit()

        return {
            "analysis_id": analysis_run.id,
            "session_id": session.id,
            "answer": result["answer"],
            "evidence": result.get("evidence", []),
            "actions": result.get("actions", []),
            "charts": result.get("charts", []),
        }

    except Exception as error:
        analysis_run.status = "failed"
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Analysis failed.",
        )
        
@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
def get_dataset(
    dataset_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.clerk_user_id == current_user_id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    return dataset

@router.get(
    "/{dataset_id}/quality",
)
def get_dataset_quality(
    dataset_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.clerk_user_id == current_user_id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    if not dataset.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset profile not found.",
        )

    profile = json.loads(dataset.profile.profile_json)

    quality_issues = profile.get("quality_issues", [])

    summary = {
        "missing_values": 0,
        "duplicate_rows": profile.get("duplicates", 0),
        "invalid_dates": 0,
        "categorical_inconsistencies": 0,
        "potential_duplicate_ids": 0,
    }

    for issue in quality_issues:
        issue_type = issue.get("type")
        count = issue.get("count", 0)

        if issue_type == "missing_values":
            summary["missing_values"] += count

        elif issue_type == "invalid_dates":
            summary["invalid_dates"] += count

        elif issue_type == "categorical_inconsistency":
            summary["categorical_inconsistencies"] += len(
                issue.get("examples", [])
            )

        elif issue_type == "potential_duplicate_id":
            summary["potential_duplicate_ids"] += count

    overall_status = (
        "good"
        if not quality_issues
        else "issues_found"
    )

    return {
        "rows": profile.get("rows", 0),
        "overall_status": overall_status,
        "summary": summary,
        "issues": quality_issues,
    }