from app.core.database import Base, engine
from app.models.database_models import (
    AnalysisMessage,
    AnalysisRun,
    AnalysisSession,
    CleaningOperation,
    CleaningPlan,
    Dataset,
    DatasetProfile,
    CleaningRemovedRow,
)


def main():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    main()