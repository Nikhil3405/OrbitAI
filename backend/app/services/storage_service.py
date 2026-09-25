from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Iterator

import boto3

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.NEON_S3_ENDPOINT,
            region_name=settings.NEON_S3_REGION,
            aws_access_key_id=settings.NEON_S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.NEON_S3_SECRET_ACCESS_KEY,
        )

        self.bucket = settings.NEON_S3_BUCKET

    def upload_bytes(
        self,
        content: bytes,
        object_key: str,
        content_type: str | None = None,
    ) -> str:
        extra_args = {}

        if content_type:
            extra_args["ContentType"] = content_type

        self.client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=content,
            **extra_args,
        )

        return object_key

    def upload_file(
        self,
        local_path: str,
        object_key: str,
        content_type: str | None = None,
    ) -> str:
        extra_args = {}

        if content_type:
            extra_args["ContentType"] = content_type

        self.client.upload_file(
            local_path,
            self.bucket,
            object_key,
            ExtraArgs=extra_args,
        )

        return object_key

    def download_file(
        self,
        object_key: str,
        local_path: str,
    ) -> str:
        self.client.download_file(
            self.bucket,
            object_key,
            local_path,
        )

        return local_path

    def delete(self, object_key: str) -> None:
        self.client.delete_object(
            Bucket=self.bucket,
            Key=object_key,
        )

    @contextmanager
    def temporary_file(
        self,
        object_key: str,
        suffix: str = "",
    ) -> Iterator[str]:
        """
        Download an object from Neon Object Storage into a temporary
        local file and automatically delete it after use.
        """

        temporary_file = NamedTemporaryFile(
            suffix=suffix,
            delete=False,
        )

        local_path = temporary_file.name
        temporary_file.close()

        try:
            self.download_file(
                object_key=object_key,
                local_path=local_path,
            )

            yield local_path

        finally:
            path = Path(local_path)

            if path.exists():
                try:
                    path.unlink()
                except OSError:
                    pass