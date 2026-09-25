from pathlib import Path

from app.agent.agent import DataAnalysisAgent
from app.services.storage_service import StorageService


class AgentService:

    def __init__(self):
        self.agent = DataAnalysisAgent()
        self.storage_service = StorageService()

    def analyze(
        self,
        file_path: str,
        question: str,
        semantic_schema: dict | None = None,
    ) -> dict:

        suffix = Path(file_path).suffix

        with self.storage_service.temporary_file(
            file_path,
            suffix=suffix,
        ) as local_path:

            return self.agent.run(
                file_path=local_path,
                question=question,
                semantic_schema=semantic_schema,
            )