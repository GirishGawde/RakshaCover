"""Stable API models shared by the Module B routes and its callers."""

from typing import Any

from pydantic import BaseModel, Field


class Report(BaseModel):
    """A report fingerprint accepted from Module C or the frontend."""

    report_id: str = Field(min_length=1)
    description: str = ""
    payment_handle: str | None = None
    amount: float | None = Field(default=None, ge=0)
    channel_sequence: list[str] = Field(default_factory=list)
    fraud_type: str | None = None


class MatchRequest(Report):
    """Request body for POST /cluster/match."""

    similarity_threshold: float | None = Field(default=None, ge=0, le=1)


class MatchResponse(BaseModel):
    report_id: str
    cluster_id: str
    created: bool
    similarity: float
    matched_report_ids: list[str]
    cluster_confidence: float


class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    report_count: int = 1
    confidence: float = 1.0
    fraud_types: list[str] = Field(default_factory=list)


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float
    shared_signals: list[str] = Field(default_factory=list)


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    metadata: dict[str, Any]
