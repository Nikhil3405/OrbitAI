from pydantic import BaseModel, Field


class SemanticColumn(BaseModel):
    name: str = Field(description="Exact column name from the dataset")
    description: str = Field(description="Short semantic description of the column")
    aliases: list[str] = Field(
        description="Natural-language terms users may use for this column"
    )


class SemanticSchema(BaseModel):
    columns: list[SemanticColumn]


class ColumnMatch(BaseModel):
    column_name: str
    matched_term: str
    reason: str