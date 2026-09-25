from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)

    clerk_user_id: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    original_file_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    cleaned_file_path: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    file_size: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    row_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    column_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="uploaded",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    profile: Mapped[Optional["DatasetProfile"]] = relationship(
        back_populates="dataset",
        cascade="all, delete-orphan",
        uselist=False,
    )

    cleaning_operations: Mapped[list["CleaningOperation"]] = relationship(
        back_populates="dataset",
        cascade="all, delete-orphan",
    )


class DatasetProfile(Base):
    __tablename__ = "dataset_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    profile_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    dataset: Mapped["Dataset"] = relationship(
        back_populates="profile",
    )


class CleaningOperation(Base):
    __tablename__ = "cleaning_operations"

    id: Mapped[int] = mapped_column(primary_key=True)

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
    )

    operation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    column: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    strategy: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="proposed",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    dataset: Mapped["Dataset"] = relationship(
        back_populates="cleaning_operations",
    )


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
    )

    clerk_user_id: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class AnalysisMessage(Base):
    __tablename__ = "analysis_messages"

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("analysis_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    session_id: Mapped[int] = mapped_column(
        ForeignKey("analysis_sessions.id"),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="running",
    )

    answer: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    actions_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    charts_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    
class CleaningPlan(Base):
    __tablename__ = "cleaning_plans"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id"),
        nullable=False,
    )

    plan_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    
class CleaningRemovedRow(Base):
    __tablename__ = "cleaning_removed_rows"

    id = Column(Integer, primary_key=True, index=True)

    dataset_id = Column(
        Integer,
        ForeignKey("datasets.id"),
        nullable=False,
        index=True,
    )

    cleaning_plan_id = Column(
        Integer,
        ForeignKey("cleaning_plans.id"),
        nullable=False,
        index=True,
    )

    operation = Column(
        String,
        nullable=False,
    )

    reason = Column(
        Text,
        nullable=False,
    )

    original_row = Column(
        Integer,
        nullable=False,
    )

    row_data = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )