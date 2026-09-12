"""In-memory incremental clustering for the demo and API process."""

from dataclasses import dataclass, field
from itertools import count
import json
from pathlib import Path

from feature_extraction import report_similarity
from models import Report


DEFAULT_SIMILARITY_THRESHOLD = 0.42


@dataclass
class Cluster:
    cluster_id: str
    reports: list[Report] = field(default_factory=list)

    @property
    def confidence(self) -> float:
        return round(min(0.98, 0.48 + 0.1 * (len(self.reports) - 1)), 3)


class ClusterStore:
    def __init__(self, similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD):
        self.similarity_threshold = similarity_threshold
        self._clusters: dict[str, Cluster] = {}
        self._sequence = count(1)

    @property
    def clusters(self) -> list[Cluster]:
        return list(self._clusters.values())

    def add(self, report: Report, threshold: float | None = None) -> tuple[Cluster, float, bool]:
        effective_threshold = self.similarity_threshold if threshold is None else threshold
        best_cluster: Cluster | None = None
        best_similarity = 0.0
        for cluster in self._clusters.values():
            similarity = max(
                (report_similarity(report, existing) for existing in cluster.reports),
                default=0.0,
            )
            if similarity > best_similarity:
                best_cluster, best_similarity = cluster, similarity

        if best_cluster is None or best_similarity < effective_threshold:
            cluster = Cluster(f"cluster-{next(self._sequence):03d}", [report])
            self._clusters[cluster.cluster_id] = cluster
            return cluster, 0.0, True

        best_cluster.reports.append(report)
        return best_cluster, best_similarity, False

    def find_cluster(self, cluster_id: str) -> Cluster | None:
        return self._clusters.get(cluster_id)

    def seed(self, reports: list[Report]) -> None:
        """Load known demo reports without exposing seed-specific API behavior."""
        for report in reports:
            self.add(report)


def load_seed_reports(path: Path | None = None) -> list[Report]:
    seed_path = path or Path(__file__).parent / "data" / "seed_reports.json"
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    return [Report.model_validate(item) for item in payload]
