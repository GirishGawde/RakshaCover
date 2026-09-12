"""FastAPI entrypoint for RakshaCover Module B."""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from clustering import ClusterStore, load_seed_reports
from graph_builder import build_graph
from models import GraphResponse, MatchRequest, MatchResponse, Report


app = FastAPI(title="RakshaCover Cluster Intelligence", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

store = ClusterStore()
store.seed(load_seed_reports())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "module": "cluster"}


@app.post("/cluster/match", response_model=MatchResponse)
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


@app.get("/cluster/graph", response_model=GraphResponse)
def graph(edge_threshold: float = Query(default=0.28, ge=0, le=1)) -> GraphResponse:
    return build_graph(store.clusters, edge_threshold=edge_threshold)
