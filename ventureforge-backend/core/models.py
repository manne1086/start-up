from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class ProjectRecord:
    thread_id: str
    user_id: str
    idea: str
    status: str
    created_at: datetime
    updated_at: datetime
    payload: dict[str, Any]

