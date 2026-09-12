from fastapi import APIRouter, Query
from cluster.clustering import ClusterStore, load_seed_reports
from cluster.graph_builder import build_graph
from cluster.models import GraphResponse, MatchRequest, MatchResponse, Report

router = APIRouter()

store = ClusterStore()
store.seed(load_seed_reports())

@router.post("/cluster/match", response_model=MatchResponse)
def match_report(request: MatchRequest) -> MatchResponse:
    cluster, similarity, created = store.add(
        Report(**request.model_dump(exclude={"similarity_threshold"})),
        threshold=request.similarity_threshold,
    )
    return MatchResponse(
        report_id=request.report_id,
        cluster_id=cluster.cluster_id,
        created=created,
        similarity=round(similarity, 3),
        matched_report_ids=[report.report_id for report in cluster.reports],
        cluster_confidence=cluster.confidence,
    )

@router.get("/cluster/graph", response_model=GraphResponse)
def graph(edge_threshold: float = Query(default=0.28, ge=0, le=1)) -> GraphResponse:
    return build_graph(store.clusters, edge_threshold=edge_threshold)
