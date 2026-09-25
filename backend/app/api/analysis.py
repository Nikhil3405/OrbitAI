import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser
from app.core.database import get_db
from app.models.database_models import (
    AnalysisRun,
    AnalysisSession,
)

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"],
)


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: int,
    current_user_id: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    analysis_run = db.scalar(
        select(AnalysisRun)
        .join(
            AnalysisSession,
            AnalysisRun.session_id
            == AnalysisSession.id,
        )
        .where(
            AnalysisRun.id == analysis_id,
            AnalysisSession.clerk_user_id
            == current_user_id,
        )
    )

    if not analysis_run:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    return {
        "id": analysis_run.id,
        "session_id": analysis_run.session_id,
        "status": analysis_run.status,
        "answer": analysis_run.answer,
        "evidence": (
            json.loads(
                analysis_run.evidence_json
            )
            if analysis_run.evidence_json
            else []
        ),
        "actions": (
            json.loads(
                analysis_run.actions_json
            )
            if analysis_run.actions_json
            else []
        ),
        "charts": (
            json.loads(
                analysis_run.charts_json
            )
            if analysis_run.charts_json
            else []
        ),
        "created_at": analysis_run.created_at,
    }