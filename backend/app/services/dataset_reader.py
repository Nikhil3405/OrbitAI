from pathlib import Path

import polars as pl


SUPPORTED_EXTENSIONS = {".csv", ".xlsx"}


class DatasetReader:

    @staticmethod
    def read(path: str | Path) -> pl.DataFrame:
        file_path = Path(path)

        if not file_path.exists():
            raise FileNotFoundError("Dataset file not found.")

        extension = file_path.suffix.lower()

        if extension == ".csv":
            return DatasetReader._read_csv(file_path)

        if extension == ".xlsx":
            return pl.read_excel(file_path)

        raise ValueError(
            "Unsupported file format. Supported formats: CSV, XLSX."
        )

    @staticmethod
    def _read_csv(path: Path) -> pl.DataFrame:
        encodings = [
            "utf8",
            "utf8-lossy",
            "windows-1252",
            "iso-8859-1",
        ]

        last_error = None

        for encoding in encodings:
            try:
                return pl.read_csv(
                    path,
                    encoding=encoding,
                )
            except Exception as error:
                last_error = error

        raise ValueError(
            f"Unable to read CSV file. Unsupported or invalid encoding: {path.name}"
        ) from last_error

    @staticmethod
    def is_supported(path: str | Path) -> bool:
        return Path(path).suffix.lower() in SUPPORTED_EXTENSIONS