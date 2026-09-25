import json
import re
from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.database_models import Dataset, DatasetProfile
from app.schemas.semantic_schema import (
    ColumnMatch,
    SemanticSchema,
)
from app.services.llm_service import LLMService


class SemanticSchemaService:
    def __init__(self):
        self.llm_service = LLMService()

    def generate_schema(
        self,
        db: Session,
        dataset: Dataset,
    ) -> SemanticSchema:
        dataset_profile = db.scalar(
            select(DatasetProfile).where(
                DatasetProfile.dataset_id == dataset.id
            )
        )

        if not dataset_profile:
            raise ValueError("Dataset profile does not exist.")

        profile = json.loads(dataset_profile.profile_json)

        semantic_schema = self.llm_service.generate_semantic_schema(
            profile["columns"]
        )

        profile["semantic_schema"] = semantic_schema.model_dump()

        dataset_profile.profile_json = json.dumps(
            profile,
            default=str,
        )

        db.commit()

        return semantic_schema

    def get_schema(
        self,
        db: Session,
        dataset: Dataset,
    ) -> SemanticSchema:
        dataset_profile = db.scalar(
            select(DatasetProfile).where(
                DatasetProfile.dataset_id == dataset.id
            )
        )

        if not dataset_profile:
            raise ValueError("Dataset profile does not exist.")

        profile = json.loads(dataset_profile.profile_json)

        semantic_schema_data = profile.get("semantic_schema")

        if not semantic_schema_data:
            return self.generate_schema(db, dataset)

        return SemanticSchema.model_validate(
            semantic_schema_data
        )

    

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(
            r"[a-zA-Z0-9_]+",
            text.lower(),
        )

    def match_columns(
        self,
        db: Session,
        dataset: Dataset,
        question: str,
    ) -> list[ColumnMatch]:
        semantic_schema = self.get_schema(db, dataset)

        question_tokens = self._tokenize(question)

        stop_words = {
            "by",
            "for",
            "the",
            "a",
            "an",
            "of",
            "in",
            "on",
            "to",
            "from",
            "with",
            "and",
            "or",
            "show",
            "give",
            "what",
            "which",
            "how",
            "many",
            "much",
            "total",
            "average",
            "avg",
            "count",
            "sum",
            "maximum",
            "minimum",
            "max",
            "min",
        }

        meaningful_tokens = [
            token
            for token in question_tokens
            if token not in stop_words
        ]

        matches: list[tuple[float, ColumnMatch]] = []

        for column in semantic_schema.columns:
            candidates = [
                column.name,
                *column.aliases,
            ]

            best_score = 0.0
            best_term = None

            for candidate in candidates:
                candidate_tokens = self._tokenize(candidate)

                score = self._match_score(
                    meaningful_tokens,
                    candidate_tokens,
                )

                if score > best_score:
                    best_score = score
                    best_term = candidate

            if best_term and best_score >= 0.75:
                matches.append(
                    (
                        best_score,
                        ColumnMatch(
                            column_name=column.name,
                            matched_term=best_term,
                            reason=(
                                f"Question term '{best_term}' "
                                f"matches column '{column.name}'."
                            ),
                        ),
                    )
                )

        matches.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        return [
            match
            for _, match in matches
        ]


    def _match_score(
        self,
        question_tokens: list[str],
        candidate_tokens: list[str],
    ) -> float:
        if not question_tokens or not candidate_tokens:
            return 0.0

        # Exact phrase match.
        question_text = " ".join(question_tokens)
        candidate_text = " ".join(candidate_tokens)

        if question_text == candidate_text:
            return 1.0

        # Single-word candidate:
        # "sales" -> Revenue
        # "product" -> Product
        if len(candidate_tokens) == 1:
            candidate = candidate_tokens[0]

            for question_token in question_tokens:
                if question_token == candidate:
                    return 1.0

            # Only use fuzzy matching for reasonably long words.
            best_fuzzy = 0.0

            for question_token in question_tokens:
                if len(question_token) >= 4 and len(candidate) >= 4:
                    score = SequenceMatcher(
                        None,
                        question_token,
                        candidate,
                    ).ratio()

                    best_fuzzy = max(best_fuzzy, score)

            return best_fuzzy

        # Multi-word candidate:
        #
        # "sales region"
        # "product category"
        #
        # Do NOT consider a single shared word enough.
        if len(candidate_tokens) > 1:

            # Require at least two matching tokens.
            exact_overlap = set(question_tokens).intersection(
                candidate_tokens
            )

            if len(exact_overlap) >= 2:
                return len(exact_overlap) / len(candidate_tokens)

            return 0.0

        return 0.0