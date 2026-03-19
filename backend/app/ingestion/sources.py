from __future__ import annotations

from abc import ABC, abstractmethod


class SourceConnector(ABC):
    connector_id: str
    source_type: str

    @abstractmethod
    def build_source_ref(self, task_id: str, external_id: str) -> str:
        raise NotImplementedError


class ManualUploadConnector(SourceConnector):
    connector_id = "manual_upload"
    source_type = "manual_upload"

    def build_source_ref(self, task_id: str, external_id: str) -> str:
        return f"{self.connector_id}:{task_id}:{external_id}"
